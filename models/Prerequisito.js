const mongoose = require('mongoose');

const prerequisitoSchema = new mongoose.Schema({
  asignaturaId: { type: String, required: true, unique: true, ref: 'Asignatura' },
  requisitos: [{ type: String, required: true }] 
});

const Prerequisito = mongoose.model('Prerequisito', prerequisitoSchema, "prerequisitos");

module.exports = Prerequisito;