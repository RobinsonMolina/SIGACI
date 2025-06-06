const mongoose = require('mongoose');

const docenteSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  correo: { type: String, required: true, unique: true },
  telefono: { type: String, required: true },
  activo: { type: Boolean, default: true }
});

module.exports = mongoose.model('Docente', docenteSchema, "docentes");