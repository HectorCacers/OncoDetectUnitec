const RULE_DESC = {
  "AGG-01": "AGG-01: 3 o más síntomas de nivel 2 del mismo cáncer → nivel elevado a 3.",
  "AGG-02": "AGG-02: 2 o más síntomas de nivel 3 del mismo cáncer → nivel elevado a 4.",
  "AGG-03": "AGG-03: Síntoma discriminador único activo → nivel activado directamente.",
};

export const explainAggRules = (rules) => {
  if (!rules || rules.length === 0) return "Ninguna regla de agregación fue activada.";
  return rules.map((r) => RULE_DESC[r] || r).join(" ");
};
