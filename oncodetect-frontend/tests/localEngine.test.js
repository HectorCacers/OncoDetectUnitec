import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { evaluateLocally } from "../src/utils/localEngine.js";
import { SYMPTOMS_BY_CANCER } from "../src/data/clinicalData.js";

const require = createRequire(import.meta.url);
const { evaluate: evaluateWithBackend } = require(
  "../../oncodetect-backend/src/engine/engine.js"
);

const mapBackendResults = (rawResults) =>
  rawResults.map((result) => ({
    cancerId: result.cancer_id,
    cancerName: result.cancer_name,
    suspicionLevel: result.suspicion_level,
    levelLabel: result.level_label,
    recommendedAction: result.recommended_action,
    matchedCount: result.matched_symptoms_count,
    totalScore: result.total_weight,
    uniqueDiscriminators: result.unique_discriminators ?? 0,
    aggregationRules: result.aggregation_rules || [],
    matchedSymptoms: result.matched_symptoms,
  }));

const assertMatchesBackend = (symptoms) => {
  const expected = mapBackendResults(evaluateWithBackend(symptoms, 7).results);
  assert.deepStrictEqual(evaluateLocally(symptoms), expected);
};

const allSymptoms = Object.values(SYMPTOMS_BY_CANCER).flat().map(({ code }) => code);
const backendMatrix = JSON.parse(
  readFileSync(
    new URL(
      "../../oncodetect-backend/data/oncodetect_matrix_v1.json",
      import.meta.url
    ),
    "utf8"
  )
);
const backendSymptomCodes = backendMatrix.cancers.flatMap((cancer) =>
  cancer.symptoms.map(({ code }) => code)
);

test("la PWA contiene todos los síntomas de la matriz del backend", () => {
  assert.deepEqual(
    [...allSymptoms].sort(),
    [...backendSymptomCodes].sort()
  );
});

for (const code of allSymptoms) {
  test(`paridad con backend para ${code}`, () => {
    assertMatchesBackend([code]);
  });
}

test("paridad con backend al evaluar todos los síntomas", () => {
  assertMatchesBackend(allSymptoms);
});

test("paridad con backend en reglas de agregación", () => {
  assertMatchesBackend([
    "LLA-S01",
    "LLA-S02",
    "LLA-S06",
    "LLA-S03",
    "LLA-S04",
    "LLA-S05",
    "LLA-S07",
  ]);
});

test("ignora códigos desconocidos y duplica síntomas seleccionados", () => {
  assertMatchesBackend(["LLA-S01", "LLA-S01", "CODIGO_INEXISTENTE"]);
});

test("rechaza una entrada que no sea un array", () => {
  assert.throws(() => evaluateLocally(null), TypeError);
});
