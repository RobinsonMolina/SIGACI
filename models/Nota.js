const mongoose = require('mongoose');

const notaSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  notaFinal: { 
    type: Number, 
    required: true,
    min: 0.0,
    max: 5.0
  },
  aprobada: { type: Boolean, default: false }, 
  idInscripcion: { type: String, required: true, ref: 'Inscripcion' },
  fechaRegistro: { type: Date, default: Date.now },
  observaciones: { type: String }
}, {
  timestamps: true
});

// Middleware para determinar automáticamente si está aprobada
notaSchema.pre('save', function(next) {
  this.aprobada = this.notaFinal >= 3.0;
  next();
});

module.exports = mongoose.model('Nota', notaSchema, "notas");