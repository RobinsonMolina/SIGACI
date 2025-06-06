const mongoose = require('mongoose');

const asignaturaSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  numeroCredito: { type: Number, required: true },
  semestre: { type: Number, required: true },
  
  cuposDisponibles: { type: Number, default: 0, min: 0 },
  inscritos: { type: Number, default: 0, min: 0 },
  docente: { type: String, ref: 'Docente' },
  periodo: { type: String, ref: 'PeriodoAcademico' },
  estudiantes: [{ type: String, ref: 'Estudiante' }],
  activo: { type: Boolean, default: true }
});

asignaturaSchema.pre('save', function(next) {
  if (this.inscritos > this.cuposDisponibles) {
    const error = new Error('El número de inscritos no puede superar los cupos disponibles');
    return next(error);
  }
  next();
});

asignaturaSchema.methods.tieneCuposDisponibles = function() {
  return this.inscritos < this.cuposDisponibles;
};

asignaturaSchema.methods.inscribirEstudiante = function(estudianteId) {
  if (!this.tieneCuposDisponibles()) {
    throw new Error('No hay cupos disponibles');
  }
  
  if (!this.estudiantes.includes(estudianteId)) {
    this.estudiantes.push(estudianteId);
    this.inscritos = this.estudiantes.length;
  }
};

asignaturaSchema.methods.darDeBajaEstudiante = function(estudianteId) {
  this.estudiantes = this.estudiantes.filter(id => id !== estudianteId);
  this.inscritos = this.estudiantes.length;
};

module.exports = mongoose.model('Asignatura', asignaturaSchema, "asignaturas");