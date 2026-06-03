require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const swaggerUi    = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const connectDB          = require('./src/config/db');
const authRoutes         = require('./src/routes/auth.routes');
const evaluateRoutes     = require('./src/routes/evaluate.routes');
const reportRoutes       = require('./src/routes/report.routes');
const evaluationsRoutes  = require('./src/routes/evaluations.routes');

// ─── Conexión base de datos ───────────────────────────────────────────────────
connectDB();

// ─── App Express ──────────────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ─── Swagger ──────────────────────────────────────────────────────────────────
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'OncoDetect API V5',
      version: '5.0.0',
      description: `
## OncoDetect — Sistema de Tamizaje Oncológico Pediátrico
**UNITEC | San Pedro Sula, Honduras | 2026**

Diseñado por: Luis Velásquez y Fernando Hernández

### Instrucciones de uso
1. Usa **POST /auth/login** para obtener un token JWT.
2. Haz clic en el botón **Authorize 🔒** (arriba a la derecha).
3. Escribe \`Bearer <tu_token>\` y confirma.
4. Ahora puedes probar los endpoints protegidos.
      `,
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Pega aquí el token obtenido de POST /auth/login',
        },
      },
    },
  },
  apis: ['./src/routes/*.routes.js'],
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'OncoDetect API Docs',
  customCss: `
    .topbar { background-color: #0b2545 !important; }
    .topbar-wrapper img { display: none; }
    .topbar-wrapper::before { content: '🔬 OncoDetect API V5'; color: white; font-size: 18px; font-weight: bold; }
  `,
}));

// ─── Rutas ────────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    status: 'ok',
    version: 'V5',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

app.use('/auth',         authRoutes);
app.use('/evaluate',     evaluateRoutes);
app.use('/send-report',  reportRoutes);
app.use('/evaluations',  evaluationsRoutes);

// ─── Iniciar servidor ─────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ OncoDetect API V5 corriendo en http://0.0.0.0:${PORT}`);
  console.log(`📋 Documentación Swagger: http://0.0.0.0:${PORT}/api-docs`);
  console.log(`📧 Resend configurado: ${process.env.RESEND_API_KEY ? 'API key cargada' : '⚠️ RESEND_API_KEY no configurada'}`);
  console.log(`🔐 Auth JWT activo`);
  console.log(`🗄️  MongoDB: ${process.env.MONGODB_URI ? 'URI cargada' : '⚠️ MONGODB_URI no configurada'}`);
});
