const fs   = require('fs');
const path = require('path');

// ─── Sistema de codificación propio de OncoDetect ────────────────────────────
const CODE_SYSTEM = 'http://oncodetect.hn/fhir/codes';

// Cargar la matriz de síntomas para resolver etiquetas (labels) de los códigos.
// Se usa únicamente para enriquecer las Observaciones; no depende de los
// resultados guardados en MongoDB (solo LOS LEE para transformarlos).
let symptomIndex = new Map();
try {
  const matrix = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../data/oncodetect_matrix_v1.json'), 'utf-8')
  );
  for (const cancer of matrix.cancers) {
    for (const symptom of cancer.symptoms) {
      symptomIndex.set(symptom.code, symptom);
    }
  }
} catch (err) {
  console.error('[fhirTransform] No se pudo cargar la matriz de síntomas:', err.message);
}

const symptomLabel = (code) => {
  const s = symptomIndex.get(code);
  return s ? s.label : code;
};

const formatDate = (value) => {
  if (!value) return undefined;
  const iso = new Date(value).toISOString();
  return iso.slice(0, 10);
};

// Dividir "Nombre Apellido" en FHIR name (family + given + text).
const splitName = (fullName) => {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { text: '' };
  if (parts.length === 1) return { family: parts[0], given: [], text: parts[0] };
  const family = parts.pop();
  return { family, given: parts, text: parts.join(' ') + ' ' + family };
};

// ─── Patient ────────────────────────────────────────────────────────────────
function buildPatient(evaluation) {
  const name = splitName(evaluation.patientName);
  const patient = {
    resourceType: 'Patient',
    id: evaluation._id ? evaluation._id.toString() : undefined,
    name: [{ use: 'official', text: name.text, family: name.family, given: name.given }],
    identifier: [],
  };

  const dob = formatDate(evaluation.patientDob);
  if (dob) patient.birthDate = dob;
  if (evaluation.patientAge != null) {
    patient.extension = [{
      url: 'http://hl7.org/fhir/StructureDefinition/patient-age',
      valueAge: { value: evaluation.patientAge, unit: 'años', system: 'http://unitsofmeasure.org', code: 'a' },
    }];
  }

  // Identificador principal: número de identidad del paciente (si existe)
  if (evaluation.patientId) {
    patient.identifier.push({
      use: 'official',
      system: 'http://oncodetect.hn/fhir/identifiers/documento-identidad',
      value: evaluation.patientId,
      type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'NI', display: 'Número de Identidad' }] },
    });
  }

  const address = {};
  if (evaluation.patientDepto) {
    address.state = evaluation.patientDepto;
    address.use = 'home';
  }
  if (evaluation.patientMunicipio) {
    address.city = evaluation.patientMunicipio;
    if (!address.use) address.use = 'home';
  }
  if (Object.keys(address).length) patient.address = [address];

  return patient;
}

// ─── Practitioner ───────────────────────────────────────────────────────────
function buildPractitioner(evaluation, doctorUsername) {
  const id = evaluation._id ? evaluation._id.toString() : undefined;
  const name = splitName(doctorUsername || evaluation.doctorUsername || 'Médico');

  const practitioner = {
    resourceType: 'Practitioner',
    id: id ? `practitioner-${id}` : undefined,
    name: [{ use: 'official', text: name.text, family: name.family, given: name.given }],
  };

  if (doctorUsername || evaluation.doctorUsername) {
    practitioner.identifier = [{
      use: 'official',
      system: 'http://oncodetect.hn/fhir/identifiers/doctor-username',
      value: doctorUsername || evaluation.doctorUsername,
      type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'DN', display: 'Nombre de doctor' }] },
    }];
  }

  return practitioner;
}

// ─── Observation (una por síntoma) ──────────────────────────────────────────
function buildObservations(evaluation, resources) {
  const patientRef = { reference: `Patient/${resources.patient.id}` };
  const observations = (evaluation.symptoms || []).map((code, i) => {
    return {
      resourceType: 'Observation',
      id: resources.patient.id ? `observation-${resources.patient.id}-${i + 1}` : undefined,
      status: 'final',
      category: [{
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'exam', display: 'Exam' }],
      }],
      code: {
        coding: [{ system: CODE_SYSTEM, code, display: symptomLabel(code) }],
        text: symptomLabel(code),
      },
      subject: patientRef,
      effectiveDateTime: evaluation.evaluationDate
        ? new Date(evaluation.evaluationDate).toISOString()
        : new Date().toISOString(),
      valueBoolean: true,
      method: {
        coding: [{ system: CODE_SYSTEM, code: 'ONSYMP-PRESENTE', display: 'Síntoma presente según screening OncoDetect' }],
      },
    };
  });
  return observations;
}

// ─── QuestionnaireResponse ──────────────────────────────────────────────────
function buildQuestionnaireResponse(evaluation, resources) {
  const response = {
    resourceType: 'QuestionnaireResponse',
    id: resources.patient.id ? `questionnaire-response-${resources.patient.id}` : undefined,
    status: 'completed',
    questionnaire: 'http://oncodetect.hn/fhir/Questionnaire/evaluacion-sintomas',
    subject: { reference: `Patient/${resources.patient.id}` },
    authored: evaluation.evaluationDate
      ? new Date(evaluation.evaluationDate).toISOString()
      : new Date().toISOString(),
    item: [
      {
        linkId: 'patient-data',
        text: 'Datos del paciente',
        item: [
          { linkId: 'patient-name',   text: 'Nombre del paciente',   answer: [{ valueString: evaluation.patientName }] },
        ],
      },
      {
        linkId: 'sintomas-seleccionados',
        text: 'Síntomas seleccionados en la evaluación',
        answer: (evaluation.symptoms || []).map((code) => ({
          valueCoding: { system: CODE_SYSTEM, code, display: symptomLabel(code) },
        })),
      },
      {
        linkId: 'resultados',
        text: 'Resultados de tamizaje',
        answer: (evaluation.results || []).map((r) => ({
          valueString: `${r.cancerName || r.cancer_name} — Nivel ${r.suspicionLevel || r.suspicion_level} (score: ${r.totalScore || r.total_weight})`,
        })),
      },
    ],
  };
  return response;
}

// ─── Bundle (de tipo collection) ────────────────────────────────────────────
function buildBundle(evaluation, resources) {
  const entries = [];
  const push = (resource) => {
    entries.push({ fullUrl: `http://oncodetect.hn/fhir/${resource.resourceType}/${resource.id}`, resource });
  };

  push(resources.patient);
  push(resources.practitioner);
  for (const obs of resources.observations) push(obs);
  push(resources.questionnaireResponse);

  return {
    resourceType: 'Bundle',
    id: evaluation._id ? `bundle-${evaluation._id.toString()}` : undefined,
    type: 'collection',
    timestamp: new Date(evaluation.evaluationDate || Date.now()).toISOString(),
    total: entries.length,
    entry: entries,
  };
}

// ─── Orquestador ────────────────────────────────────────────────────────────
/**
 * Transforma una evaluación guardada de MongoDB al estándar FHIR R4.
 * @param {object} evaluation - Documento de Evaluation (Mongoose/MongoDB).
 * @param {string} [doctorUsername] - Username del médico autenticado (del JWT).
 * @returns {object} Bundle FHIR R4 de tipo "collection".
 */
function evaluationToFhirBundle(evaluation, doctorUsername) {
  const patient = buildPatient(evaluation);
  const practitioner = buildPractitioner(evaluation, doctorUsername);
  const observations = buildObservations(evaluation, { patient });
  const questionnaireResponse = buildQuestionnaireResponse(evaluation, { patient });
  const resources = { patient, practitioner, observations, questionnaireResponse };
  return buildBundle(evaluation, resources);
}

// ─── Bundle masivo (colección de Bundles individuales) ────────────────────────
/**
 * Agrupa varios Bundles FHIR (uno por evaluación) dentro de un único Bundle
 * FHIR R4 de tipo "collection". En FHIR un Bundle es un Resource, por lo que
 * anidar Bundles dentro de Bundle.entry[].resource es válido según la
 * especificación (a diferencia de un array JSON simple, que no es FHIR).
 * @param {object[]} evaluations - Evaluaciones de MongoDB ya transformables.
 * @param {string} [doctorUsername] - Username del médico autenticado (del JWT).
 * @returns {object} Bundle FHIR R4 de tipo "collection" que contiene los Bundles.
 */
function buildBulkBundle(evaluations, doctorUsername) {
  const innerBundles = evaluations
    .map((evaluation) => evaluationToFhirBundle(evaluation, doctorUsername))
    .filter((bundle) => bundle && bundle.id);

  const entries = innerBundles.map((bundle) => ({
    fullUrl: `http://oncodetect.hn/fhir/Bundle/${bundle.id}`,
    resource: bundle,
  }));

  return {
    resourceType: 'Bundle',
    id: `bundle-bulk-${Date.now()}`,
    type: 'collection',
    timestamp: new Date().toISOString(),
    total: entries.length,
    entry: entries,
  };
}

module.exports = {
  CODE_SYSTEM,
  evaluationToFhirBundle,
  buildBulkBundle,
  buildPatient,
  buildPractitioner,
  buildObservations,
  buildQuestionnaireResponse,
  buildBundle,
};
