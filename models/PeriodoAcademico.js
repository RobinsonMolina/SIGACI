const mongoose = require('mongoose');

const periodoAcademicoSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  nombrePeriodo: { type: String, required: true }, 
  fechaInicio: { type: Date, required: true },
  fechaFin: { type: Date, required: true },
  activo: { type: Boolean, default: true }
});

module.exports = mongoose.model('PeriodoAcademico', periodoAcademicoSchema, "periodos");