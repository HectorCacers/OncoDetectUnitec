const mongoose = require('mongoose');

// ─── Schema: Evaluation ───────────────────────────────────────────────────────
const evaluationSchema = new mongoose.Schema({
  patientId:        { type: String, required: true, index: true },
  patientName:      { type: String, required: true },
  patientDob:       { type: String },
  patientAge:       { type: Number },
  patientDepto:     { type: String },
  patientMunicipio: { type: String },
  userMode:         { type: String, enum: ['medico', 'cuidador'], default: 'medico' },
  symptoms:         [String],
  results:          { type: mongoose.Schema.Types.Mixed },
  evaluationDate:   { type: Date, default: Date.now },
  createdAt:        { type: Date, default: Date.now },
});

const Evaluation = mongoose.model('Evaluation', evaluationSchema);

module.exports = Evaluation;
