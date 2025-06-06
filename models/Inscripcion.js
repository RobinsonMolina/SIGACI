const mongoose = require('mongoose');

const inscripcionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  estudiante: { type: String, required: true, ref: 'Estudiante' },
  asignatura: { type: String, required: true, ref: 'Asignatura' },
  fechaInscripcion: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Inscripcion', inscripcionSchema, "inscripciones");