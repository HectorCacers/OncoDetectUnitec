# OncoDetect Backend V5

API REST para el Sistema de Tamizaje Oncológico Pediátrico OncoDetect.  
**UNITEC | San Pedro Sula, Honduras | 2026**

---

## Estructura de carpetas

```
oncodetect-backend/
├── src/
│   ├── config/
│   │   └── db.js               # Conexión MongoDB Atlas
│   ├── engine/
│   │   └── engine.js           # Motor de reglas AGG-01/02/03
│   ├── middleware/
│   │   └── auth.js             # Verificación JWT (authRequired)
│   ├── models/
│   │   └── Evaluation.js       # Schema Mongoose de evaluaciones
│   └── routes/
│       ├── auth.routes.js      # POST /auth/login, GET /auth/verify, POST /auth/verify-admin
│       ├── evaluate.routes.js  # POST /evaluate
│       ├── evaluations.routes.js # GET|POST|DELETE /evaluations/*
│       └── report.routes.js    # POST /send-report
├── data/
│   └── oncodetect_matrix_v1.json  # Matriz clínica de síntomas y cánceres
├── server.js                   # Entry point — solo setup y app.listen
├── package.json
└── .env                        # Variables de entorno (no subir a Git)
```

## Estándares aplicados

| Estándar | Fuente |
|---|---|
| Estructura por componentes (1.1) | Node.js Best Practices — Goldbergyoni |
| 3-tier layering: routes / engine / data-access (1.2) | Node.js Best Practices — Goldbergyoni |
| Entry point explícito por módulo (3.9) | Node.js Best Practices — Goldbergyoni |
| Manejo de errores centralizado con async/await (2.1, 2.4) | Node.js Best Practices — Goldbergyoni |
| Separación de concerns — modelo, middleware, rutas | React Design Principles (Composition) |
| Schema validation en Mongoose | MongoDB Best Practices |
| Índice en patientId para queries frecuentes | MongoDB Best Practices |

## Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | /health | No | Estado del servidor y DB |
| POST | /auth/login | No | Login médico → JWT |
| GET | /auth/verify | JWT | Verificar token |
| POST | /auth/verify-admin | JWT | Verificar contraseña admin |
| POST | /evaluate | No | Evaluar síntomas |
| POST | /send-report | No | Enviar reporte por email |
| POST | /evaluations/save | JWT | Guardar evaluación |
| GET | /evaluations/recent | JWT | Últimas 20 evaluaciones |
| GET | /evaluations/search | JWT | Buscar por nombre o identidad |
| GET | /evaluations/patient/:id | JWT | Historial de un paciente |
| DELETE | /evaluations/:id | JWT | Eliminar evaluación |
| DELETE | /evaluations/bulk/delete | JWT | Eliminar múltiples |

## Instalación

```bash
cd oncodetect-backend
npm install
# Crear .env con: MONGODB_URI, JWT_SECRET, DOCTOR_USERNAME,
#                 DOCTOR_PASSWORD_HASH, ADMIN_PASSWORD_HASH, RESEND_API_KEY
node server.js
```

Documentación Swagger disponible en: `http://localhost:3001/api-docs`
