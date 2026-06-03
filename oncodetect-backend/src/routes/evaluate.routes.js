const express    = require('express');
const { evaluate } = require('../engine/engine');

const router = express.Router();

// ─── POST /evaluate ───────────────────────────────────────────────────────────
/**
 * @swagger
 * /evaluate:
 *   post:
 *     summary: Evaluar síntomas de un paciente
 *     description: |
 *       Endpoint **público** (no requiere login). Recibe un array de códigos de síntomas
 *       y la edad del paciente, y retorna los niveles de sospecha para cada tipo de cáncer.
 *     tags: [Evaluación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [symptoms, patient_age]
 *             properties:
 *               symptoms:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["SYM001", "SYM004", "SYM012"]
 *               patient_age:
 *                 type: number
 *                 example: 7
 *     responses:
 *       200:
 *         description: Resultados de evaluación por tipo de cáncer
 *         content:
 *           application/json:
 *             example:
 *               results:
 *                 - cancerId: "LLA"
 *                   cancerName: "Leucemia Linfoblástica Aguda"
 *                   suspicionLevel: 3
 *                   levelLabel: "Sospecha Alta"
 *                   recommendedAction: "Referir a oncología pediátrica"
 *                   matchedCount: 3
 *                   totalScore: 18
 *       400:
 *         description: Parámetros inválidos
 */
router.post('/', (req, res) => {
  try {
    const { symptoms, patient_age } = req.body;
    if (!symptoms || !Array.isArray(symptoms))
      return res.status(400).json({ error: 'symptoms debe ser un array de strings.' });
    if (patient_age === undefined || patient_age === null)
      return res.status(400).json({ error: 'patient_age es requerido.' });

    const engineResult = evaluate(symptoms, Number(patient_age));
    const mapped = engineResult.results.map(r => ({
      cancerId:             r.cancer_id,
      cancerName:           r.cancer_name,
      suspicionLevel:       r.suspicion_level,
      levelLabel:           r.level_label,
      recommendedAction:    r.recommended_action,
      matchedCount:         r.matched_symptoms_count,
      totalScore:           r.total_weight,
      uniqueDiscriminators: r.unique_discriminators ?? 0,
      aggregationRules:     r.aggregation_rules || [],
      matchedSymptoms:      r.matched_symptoms,
    }));
    res.json({ results: mapped });
  } catch (err) {
    console.error('[/evaluate] Error:', err.message);
    res.status(500).json({ error: 'Error interno al evaluar síntomas.' });
  }
});

module.exports = router;
