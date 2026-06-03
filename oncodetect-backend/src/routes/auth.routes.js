const express    = require('express');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const authRequired = require('../middleware/auth');

const router = express.Router();

// ─── POST /auth/login ─────────────────────────────────────────────────────────
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión como médico
 *     description: Retorna un token JWT válido por 8 horas. Úsalo en el botón Authorize 🔒
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: "doctor"
 *               password:
 *                 type: string
 *                 example: "tu_contraseña"
 *     responses:
 *       200:
 *         description: Login exitoso — copia el token y úsalo en Authorize
 *         content:
 *           application/json:
 *             example:
 *               ok: true
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               username: "doctor"
 *       401:
 *         description: Credenciales incorrectas
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const validUser = username === process.env.DOCTOR_USERNAME;
    if (!validUser) return res.status(401).json({ error: 'Credenciales incorrectas.' });

    const validPass = await bcrypt.compare(password, process.env.DOCTOR_PASSWORD_HASH);
    if (!validPass) return res.status(401).json({ error: 'Credenciales incorrectas.' });

    const token = jwt.sign(
      { username, role: 'medico' },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ ok: true, token, username });
  } catch (err) {
    console.error('[/auth/login] Error:', err.message);
    res.status(500).json({ error: 'Error interno.' });
  }
});

// ─── GET /auth/verify ─────────────────────────────────────────────────────────
/**
 * @swagger
 * /auth/verify:
 *   get:
 *     summary: Verificar token JWT
 *     description: Comprueba si el token actual sigue siendo válido.
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token válido
 *         content:
 *           application/json:
 *             example:
 *               ok: true
 *               username: "doctor"
 *       401:
 *         description: Token inválido o expirado
 */
router.get('/verify', authRequired, (req, res) => {
  res.json({ ok: true, username: req.doctor.username });
});

// ─── POST /auth/verify-admin ──────────────────────────────────────────────────
/**
 * @swagger
 * /auth/verify-admin:
 *   post:
 *     summary: Verificar contraseña de administrador
 *     description: 🔒 **Requiere JWT**. Habilita el modo de borrado de evaluaciones.
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *                 example: "contraseña_admin"
 *     responses:
 *       200:
 *         description: Contraseña correcta
 *       401:
 *         description: Contraseña incorrecta o token inválido
 */
router.post('/verify-admin', authRequired, async (req, res) => {
  try {
    const { password } = req.body;
    const valid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
    if (!valid) return res.status(401).json({ error: 'Contraseña admin incorrecta.' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error interno.' });
  }
});

module.exports = router;
