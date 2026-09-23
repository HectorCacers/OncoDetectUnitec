import matrix from "../data/oncodetect_matrix_v1.json";

// Motor de reglas local — réplica exacta de oncodetect-backend/src/engine/engine.js
// + del mapeo de src/routes/evaluate.routes.js. Permite evaluar sin conexión y
// genera el MISMO formato de resultados que POST /evaluate.
export function evaluateLocally(selectedSymptoms) {
  const results = [];

  for (const cancer of matrix.cancers) {
    let totalWeight = 0;
    const matchedSymptoms = [];
    const triggeredRules = [];

    for (const symptom of cancer.symptoms) {
      if (selectedSymptoms.includes(symptom.code)) {
        matchedSymptoms.push(symptom);
        totalWeight += symptom.weight;
      }
    }

    if (matchedSymptoms.length === 0) continue;

    const discriminators = matchedSymptoms.filter((s) => s.discriminator_unique);
    const regulars       = matchedSymptoms.filter((s) => !s.discriminator_unique);

    let maxLevel = regulars.length > 0
      ? Math.max(...regulars.map((s) => s.suspicion_level))
      : 0;

    const level2count = regulars.filter((s) => s.suspicion_level === 2).length;
    const level3count = regulars.filter((s) => s.suspicion_level === 3).length;

    if (level2count >= 3 && maxLevel < 3) {
      maxLevel = 3;
      triggeredRules.push("AGG-01");
    }

    if (level3count >= 2 && maxLevel < 4) {
      maxLevel = 4;
      triggeredRules.push("AGG-02");
    }

    for (const disc of discriminators) {
      if (disc.suspicion_level > maxLevel) {
        maxLevel = disc.suspicion_level;
      }
      triggeredRules.push("AGG-03");
    }

    if (regulars.length === 0 && discriminators.length > 0) {
      maxLevel = Math.max(...discriminators.map((s) => s.suspicion_level));
    }

    const levelInfo  = matrix.metadata.suspicion_levels[String(maxLevel)];
    const uniqueRules = [...new Set(triggeredRules)];

    results.push({
      cancerId:             cancer.id,
      cancerName:           cancer.name,
      suspicionLevel:       maxLevel,
      levelLabel:           levelInfo?.label,
      recommendedAction:    levelInfo?.action,
      matchedCount:         matchedSymptoms.length,
      totalScore:           totalWeight,
      uniqueDiscriminators: discriminators.length,
      aggregationRules:     uniqueRules,
      matchedSymptoms:      matchedSymptoms.map((s) => ({
        code: s.code,
        label: s.label,
        level: s.suspicion_level,
        discriminator_unique: s.discriminator_unique,
      })),
    });
  }

  results.sort((a, b) => b.suspicionLevel - a.suspicionLevel || b.totalScore - a.totalScore);
  return results;
}
