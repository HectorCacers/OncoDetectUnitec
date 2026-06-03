const express = require('express');
const { Resend } = require('resend');

const router = express.Router();


// ─── POST /send-report ────────────────────────────────────────────────────────
/**
 * @swagger
 * /send-report:
 *   post:
 *     summary: Enviar reporte por correo
 *     description: Endpoint **público**. Envía el reporte HTML de una evaluación al correo indicado.
 *     tags: [Evaluación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recipientEmail, reportHtml]
 *             properties:
 *               recipientEmail:
 *                 type: string
 *                 example: "medico@hospital.hn"
 *               patientName:
 *                 type: string
 *                 example: "Juan Pérez"
 *               patientAge:
 *                 type: number
 *                 example: 7
 *               userMode:
 *                 type: string
 *                 example: "medico"
 *               evaluationDate:
 *                 type: string
 *                 example: "2026-06-01"
 *               reportHtml:
 *                 type: string
 *                 example: "<h1>Reporte OncoDetect</h1>..."
 *     responses:
 *       200:
 *         description: Correo enviado correctamente
 *       400:
 *         description: Faltan campos requeridos
 *       500:
 *         description: Error al enviar el correo
 */
router.post('/', async (req, res) => {
  const { recipientEmail, patientName, patientAge, userMode, evaluationDate, reportHtml } = req.body;
  if (!recipientEmail) return res.status(400).json({ error: 'recipientEmail es requerido.' });
  if (!reportHtml)     return res.status(400).json({ error: 'reportHtml es requerido.' });
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from:    'OncoDetect <onboarding@resend.dev>',
      to:      [recipientEmail],
      subject: `OncoDetect — Reporte de ${patientName || 'Paciente'} (${evaluationDate || ''})`,
      html:    reportHtml,
    });
    if (error) {
      console.error('[/send-report] Resend error:', error);
      return res.status(500).json({ error: 'Error al enviar el correo.', detail: error.message });
    }
    console.log(`[/send-report] Correo enviado a ${recipientEmail}`);
    res.json({ ok: true, message: `Reporte enviado a ${recipientEmail}` });
  } catch (err) {
    console.error('[/send-report] Error:', err.message);
    res.status(500).json({ error: 'Error al enviar el correo.', detail: err.message });
  }
});

module.exports = router;
