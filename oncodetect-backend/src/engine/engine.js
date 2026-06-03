const fs   = require('fs');
const path = require('path');

// Cargar la matriz desde el JSON
const matrixPath = path.join(__dirname, '../../data', 'oncodetect_matrix_v1.json');
const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf-8'));

/**
 * Función principal del motor de reglas OncoDetect
 * @param {string[]} selectedSymptoms - Array de códigos de síntomas seleccionados por el usuario
 * @param {number} patientAge - Edad del paciente en años
 * @returns {object} Resultados de sospecha por cáncer
 */
function evaluate(selectedSymptoms, patientAge) {
  const results = [];

  for (const cancer of matrix.cancers) {
    let totalWeight = 0;
    let matchedSymptoms = [];
    const triggeredRules = [];

    // ── Paso 1: registrar síntomas presentes ────────────────────────────────
    for (const symptom of cancer.symptoms) {
      if (selectedSymptoms.includes(symptom.code)) {
        matchedSymptoms.push(symptom);
        totalWeight += symptom.weight;
      }
    }

    // Saltar si no hay ninguna coincidencia
    if (matchedSymptoms.length === 0) continue;

    // ── Paso 2: separar discriminadores y síntomas regulares ────────────────
    const discriminators = matchedSymptoms.filter(s => s.discriminator_unique);
    const regulars       = matchedSymptoms.filter(s => !s.discriminator_unique);

    // ── Paso 3: calcular nivel base SOLO con síntomas regulares (no discriminadores) ──
    let maxLevel = regulars.length > 0
      ? Math.max(...regulars.map(s => s.suspicion_level))
      : 0;

    // ── Paso 4: reglas de agregación sobre síntomas regulares ───────────────
    const level2count = regulars.filter(s => s.suspicion_level === 2).length;
    const level3count = regulars.filter(s => s.suspicion_level === 3).length;

    // AGG-01: 3 o más síntomas regulares de nivel 2 → sube a nivel 3
    if (level2count >= 3 && maxLevel < 3) {
      maxLevel = 3;
      triggeredRules.push('AGG-01');
    }

    // AGG-02: 2 o más síntomas regulares de nivel 3 → sube a nivel 4
    if (level3count >= 2 && maxLevel < 4) {
      maxLevel = 4;
      triggeredRules.push('AGG-02');
    }

    // ── Paso 5: AGG-03 — discriminadores únicos elevan al nivel del síntoma ─
    for (const disc of discriminators) {
      if (disc.suspicion_level > maxLevel) {
        maxLevel = disc.suspicion_level;
      }
      triggeredRules.push('AGG-03');
    }

    // ── Paso 6: si solo hay discriminadores (ningún síntoma regular) usar su nivel ─
    if (regulars.length === 0 && discriminators.length > 0) {
      maxLevel = Math.max(...discriminators.map(s => s.suspicion_level));
    }

    // Obtener etiqueta y acción del nivel final
    const levelInfo = matrix.metadata.suspicion_levels[String(maxLevel)];

    // Deduplicar reglas (AGG-03 puede aparecer varias veces si hay varios discriminadores)
    const uniqueRules = [...new Set(triggeredRules)];

    results.push({
      cancer_id: cancer.id,
      cancer_name: cancer.name,
      suspicion_level: maxLevel,
      level_label: levelInfo.label,
      recommended_action: levelInfo.action,
      matched_symptoms_count: matchedSymptoms.length,
      total_weight: totalWeight,
      unique_discriminators: discriminators.length,
      aggregation_rules: uniqueRules,
      matched_symptoms: matchedSymptoms.map(s => ({
        code: s.code,
        label: s.label,
        level: s.suspicion_level,
        discriminator_unique: s.discriminator_unique
      }))
    });
  }

  // Ordenar resultados de mayor a menor nivel de sospecha
  results.sort((a, b) => b.suspicion_level - a.suspicion_level || b.total_weight - a.total_weight);

  return {
    evaluated_symptoms: selectedSymptoms,
    patient_age: patientAge,
    results: results,
    disclaimer: matrix.metadata.disclaimer
  };
}

module.exports = { evaluate };
