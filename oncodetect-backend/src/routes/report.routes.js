const express   = require('express');
const nodemailer = require('nodemailer');

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});


// ─── POST /send-report ────────────────────────────────────────────────────────
/**
 * @swagger
 * /send-report:
 *   post:
 *     summary: Enviar reporte por correo
 *     description: Endpoint **público**. Envía el reporte HTML de una evaluación al(los) correo(s) indicado(s). Acepta uno o varios destinatarios separados por coma.
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
 *                 description: "Uno o varios correos separados por coma"
 *                 example: "medico@hospital.hn, admin@fhnc.hn"
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
  const recipientCount = recipientEmail.split(',').length;
  try {
    await transporter.sendMail({
      from:    `OncoDetect <${process.env.GMAIL_USER}>`,
      to:      recipientEmail,
      subject: `OncoDetect — Reporte de ${patientName || 'Paciente'} (${evaluationDate || ''})`,
      html:    reportHtml,
    });
    console.log(`[/send-report] Correo enviado a ${recipientCount} destinatario(s): ${recipientEmail}`);
    res.json({ ok: true, message: `Reporte enviado a ${recipientCount} destinatario(s)` });
  } catch (err) {
    console.error('[/send-report] Error:', err.message);
    res.status(500).json({ error: 'Error al enviar el correo.', detail: err.message });
  }
});

module.exports = router;
