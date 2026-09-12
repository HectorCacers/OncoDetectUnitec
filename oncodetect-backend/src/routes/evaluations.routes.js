const express      = require('express');
const authRequired = require('../middleware/auth');
const Evaluation   = require('../models/Evaluation');
const { evaluationToFhirBundle, buildBulkBundle } = require('../utils/fhirTransform');

const router = express.Router();

// ─── POST /evaluations/save ───────────────────────────────────────────────────
/**
 * @swagger
 * /evaluations/save:
 *   post:
 *     summary: Guardar evaluación de un paciente
 *     description: 🔒 **Requiere JWT**. Guarda una evaluación vinculada al número de identidad del paciente.
 *     tags: [Historial]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patientId, patientName]
 *             properties:
 *               patientId:
 *                 type: string
 *                 example: "0801-2015-00123"
 *               patientName:
 *                 type: string
 *                 example: "Juan Pérez"
 *               patientDob:
 *                 type: string
 *                 example: "2018-03-15"
 *               patientAge:
 *                 type: number
 *                 example: 7
 *               patientDepto:
 *                 type: string
 *                 example: "Cortés"
 *               patientMunicipio:
 *                 type: string
 *                 example: "San Pedro Sula"
 *               userMode:
 *                 type: string
 *                 example: "medico"
 *               symptoms:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["SYM001", "SYM004"]
 *               results:
 *                 type: object
 *     responses:
 *       200:
 *         description: Evaluación guardada
 *         content:
 *           application/json:
 *             example:
 *               ok: true
 *               id: "64a1b2c3d4e5f6a7b8c9d0e1"
 *       401:
 *         description: Token requerido
 */
router.post('/save', authRequired, async (req, res) => {
  try {
    const { patientId, patientName, patientDob, patientAge,
            patientDepto, patientMunicipio, userMode, symptoms, results } = req.body;
    if (!patientId)   return res.status(400).json({ error: 'patientId (número de identidad) es requerido.' });
    if (!patientName) return res.status(400).json({ error: 'patientName es requerido.' });

    const evaluation = new Evaluation({
      patientId: patientId.trim(), patientName: patientName.trim(),
      patientDob, patientAge, patientDepto, patientMunicipio, userMode, symptoms, results,
    });
    await evaluation.save();
    console.log(`[/evaluations/save] Guardado — paciente: ${patientId}`);
    res.json({ ok: true, id: evaluation._id });
  } catch (err) {
    console.error('[/evaluations/save] Error:', err.message);
    res.status(500).json({ error: 'Error al guardar la evaluación.' });
  }
});

// ─── GET /evaluations/recent ──────────────────────────────────────────────────
/**
 * @swagger
 * /evaluations/recent:
 *   get:
 *     summary: Últimas 20 evaluaciones
 *     description: 🔒 **Requiere JWT**. Retorna las últimas 20 evaluaciones registradas.
 *     tags: [Historial]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de evaluaciones recientes
 *       401:
 *         description: Token requerido
 */
router.get('/recent', authRequired, async (req, res) => {
  try {
    const evaluations = await Evaluation.find()
      .sort({ evaluationDate: -1 }).limit(20)
      .select('patientId patientName patientAge evaluationDate userMode results').lean();
    res.json({ ok: true, count: evaluations.length, evaluations });
  } catch (err) {
    console.error('[/evaluations/recent] Error:', err.message);
    res.status(500).json({ error: 'Error al obtener evaluaciones recientes.' });
  }
});

// ─── GET /evaluations/search ──────────────────────────────────────────────────
/**
 * @swagger
 * /evaluations/search:
 *   get:
 *     summary: Buscar evaluaciones por nombre o identidad
 *     description: 🔒 **Requiere JWT**. Búsqueda por nombre (parcial) o número de identidad.
 *     tags: [Historial]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre del paciente o número de identidad (mínimo 2 caracteres)
 *         example: "Juan"
 *     responses:
 *       200:
 *         description: Resultados de búsqueda
 *       400:
 *         description: Término de búsqueda muy corto
 *       404:
 *         description: No se encontraron evaluaciones
 *       401:
 *         description: Token requerido
 */
router.get('/search', authRequired, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2)
      return res.status(400).json({ error: 'Ingresa al menos 2 caracteres.' });
    const term = q.trim();
    const isId = /^[\d\-]+$/.test(term);
    const query = isId
      ? { patientId: { $regex: term.replace(/-/g,''), $options: 'i' } }
      : { patientName: { $regex: term, $options: 'i' } };
    const evaluations = await Evaluation.find(query).sort({ evaluationDate: -1 }).limit(50).lean();
    if (evaluations.length === 0)
      return res.status(404).json({ error: 'No se encontraron evaluaciones.' });
    res.json({ ok: true, count: evaluations.length, evaluations });
  } catch (err) {
    console.error('[/evaluations/search] Error:', err.message);
    res.status(500).json({ error: 'Error al buscar.' });
  }
});

// ─── GET /evaluations/patient/:patientId ──────────────────────────────────────
/**
 * @swagger
 * /evaluations/patient/{patientId}:
 *   get:
 *     summary: Obtener historial de un paciente
 *     description: 🔒 **Requiere JWT**. Devuelve todas las evaluaciones de un paciente por número de identidad.
 *     tags: [Historial]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         example: "0801-2015-00123"
 *     responses:
 *       200:
 *         description: Lista de evaluaciones del paciente
 *       404:
 *         description: No se encontraron evaluaciones
 *       401:
 *         description: Token requerido
 */
router.get('/patient/:patientId', authRequired, async (req, res) => {
  try {
    const { patientId } = req.params;
    const evaluations = await Evaluation.find({ patientId: patientId.trim() })
      .sort({ evaluationDate: -1 }).lean();
    if (evaluations.length === 0)
      return res.status(404).json({ error: 'No se encontraron evaluaciones para este paciente.' });
    res.json({ ok: true, patientId, count: evaluations.length, evaluations });
  } catch (err) {
    console.error('[/evaluations/patient] Error:', err.message);
    res.status(500).json({ error: 'Error al buscar evaluaciones.' });
  }
});

// ─── DELETE /evaluations/bulk/delete ─────────────────────────────────────────
/**
 * @swagger
 * /evaluations/bulk/delete:
 *   delete:
 *     summary: Eliminar múltiples evaluaciones
 *     description: 🔒 **Requiere JWT**. Elimina varias evaluaciones por array de IDs.
 *     tags: [Historial]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids]
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["64a1b2c3d4e5f6a7b8c9d0e1", "64a1b2c3d4e5f6a7b8c9d0e2"]
 *     responses:
 *       200:
 *         description: Evaluaciones eliminadas
 *         content:
 *           application/json:
 *             example:
 *               ok: true
 *               deleted: 2
 *       400:
 *         description: Array de IDs vacío o inválido
 *       401:
 *         description: Token requerido
 */
router.delete('/bulk/delete', authRequired, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ error: 'ids debe ser un array no vacío.' });
    const result = await Evaluation.deleteMany({ _id: { $in: ids } });
    res.json({ ok: true, deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar evaluaciones.' });
  }
});

// ─── DELETE /evaluations/:id ──────────────────────────────────────────────────
/**
 * @swagger
 * /evaluations/{id}:
 *   delete:
 *     summary: Eliminar una evaluación
 *     description: 🔒 **Requiere JWT**. Elimina una evaluación por su ID de MongoDB.
 *     tags: [Historial]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "64a1b2c3d4e5f6a7b8c9d0e1"
 *     responses:
 *       200:
 *         description: Evaluación eliminada
 *       401:
 *         description: Token requerido
 */
router.delete('/:id', authRequired, async (req, res) => {
  try {
    await Evaluation.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar la evaluación.' });
  }
});

// ─── GET /evaluations/fhir/bulk ───────────────────────────────────────────────
/**
 * @swagger
 * /evaluations/fhir/bulk:
 *   get:
 *     summary: Exportar TODAS las evaluaciones filtradas en FHIR R4 (masivo)
 *     description: 🔒 **Requiere JWT**. Genera un Bundle FHIR R4 de tipo "collection" (solo modo
 *       médico) que contiene un Bundle por cada evaluación encontrada. Acepta un query param
 *       opcional `q` (nombre o identidad, igual que /evaluations/search) para filtrar; si no se
 *       pasa, exporta todas las evaluaciones registradas de modo médico. NO modifica los datos.
 *     tags: [Historial]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: false
 *         schema:
 *           type: string
 *         description: Nombre del paciente o número de identidad (mínimo 2 caracteres). Vacío = todas las evaluaciones.
 *         example: "Juan"
 *     responses:
 *       200:
 *         description: Bundle FHIR R4 de tipo collection con un Bundle por evaluación
 *         content:
 *           application/fhir+json:
 *             example:
 *               resourceType: "Bundle"
 *               id: "bundle-bulk-1690000000000"
 *               type: "collection"
 *               total: 2
 *       404:
 *         description: No se encontraron evaluaciones para exportar
 *       401:
 *         description: Token requerido
 */
router.get('/fhir/bulk', authRequired, async (req, res) => {
  try {
    const { q } = req.query;
    const query = { userMode: 'medico' };

    // Filtro opcional por nombre o identidad (mismo criterio que /evaluations/search)
    if (q && q.trim().length >= 2) {
      const term = q.trim();
      const isId = /^[\d\-]+$/.test(term);
      if (isId) {
        query.patientId = { $regex: term.replace(/-/g, ''), $options: 'i' };
      } else {
        query.patientName = { $regex: term, $options: 'i' };
      }
    }

    const evaluations = await Evaluation.find(query).sort({ evaluationDate: -1 }).lean();
    if (evaluations.length === 0)
      return res.status(404).json({ error: 'No se encontraron evaluaciones para exportar.' });

    const bundle = buildBulkBundle(evaluations, req.doctor && req.doctor.username);
    console.log(`[/evaluations/fhir/bulk] ${evaluations.length} evaluación(es) → Bundle FHIR masivo`);
    res.set('Content-Type', 'application/fhir+json');
    res.json(bundle);
  } catch (err) {
    console.error('[/evaluations/fhir/bulk] Error:', err.message);
    res.status(500).json({ error: 'Error al generar la exportación FHIR masiva.' });
  }
});

// ─── GET /evaluations/:id/fhir ────────────────────────────────────────────────
/**
 * @swagger
 * /evaluations/{id}/fhir:
 *   get:
 *     summary: Exportar evaluación en formato HL7 FHIR R4
 *     description: 🔒 **Requiere JWT**. Lee una evaluación guardada en MongoDB y la transforma a un
 *       Bundle FHIR R4 de tipo "collection" (Patient, Practitioner, Observation por síntoma y
 *       QuestionnaireResponse). NO modifica los datos guardados.
 *     tags: [Historial]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "64a1b2c3d4e5f6a7b8c9d0e1"
 *     responses:
 *       200:
 *         description: Bundle FHIR R4
 *         content:
 *           application/fhir+json:
 *             example:
 *               resourceType: "Bundle"
 *               id: "bundle-64a1b2c3d4e5f6a7b8c9d0e1"
 *               type: "collection"
 *       404:
 *         description: Evaluación no encontrada
 *       401:
 *         description: Token requerido
 */
router.get('/:id/fhir', authRequired, async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id).lean();
    if (!evaluation)
      return res.status(404).json({ error: 'Evaluación no encontrada.' });

    const bundle = evaluationToFhirBundle(evaluation, req.doctor && req.doctor.username);
    console.log(`[/evaluations/${req.params.id}/fhir] Bundle FHIR generado — paciente: ${evaluation.patientId}`);
    res.set('Content-Type', 'application/fhir+json');
    res.json(bundle);
  } catch (err) {
    console.error('[/evaluations/:id/fhir] Error:', err.message);
    res.status(500).json({ error: 'Error al generar la exportación FHIR.' });
  }
});

module.exports = router;
