const Inscripcion = require('../models/Inscripcion');
const Estudiante = require('../models/Estudiante');
const Asignatura = require('../models/Asignatura');
const Prerequisito = require('../models/Prerequisito');
const getNextSecuencia = require('../models/secuencias');

exports.inscribirEstudiante = async (req, res) => {
  try {
    const { estudianteId, asignaturaId } = req.body;

    if (!estudianteId || !asignaturaId) {
      return res.status(400).json({
        error: 'Faltan campos requeridos: estudianteId, asignaturaId'
      });
    }

    const estudiante = await Estudiante.findOne({ id: estudianteId });
    if (!estudiante) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    const asignatura = await Asignatura.findOne({ id: asignaturaId });
    if (!asignatura) {
      return res.status(404).json({ error: 'Asignatura no encontrada' });
    }

    const inscripcionExistente = await Inscripcion.findOne({
      estudiante: estudianteId,
      asignatura: asignaturaId
    });

    if (inscripcionExistente) {
      return res.status(400).json({ error: 'El estudiante ya está inscrito en esta asignatura' });
    }

    if (estudiante.asignaturasAprobadas.includes(asignaturaId)) {
      return res.status(400).json({ error: 'El estudiante ya aprobó esta asignatura' });
    }

    const prerequisitos = await Prerequisito.findOne({ asignaturaId: asignaturaId });
    
    if (prerequisitos && prerequisitos.requisitos && prerequisitos.requisitos.length > 0) {
      const prerequisitosNoCumplidos = prerequisitos.requisitos.filter(
        prereqId => !estudiante.asignaturasAprobadas.includes(prereqId)
      );

      if (prerequisitosNoCumplidos.length > 0) {
        const asignaturasPrerequisito = await Asignatura.find({ 
          id: { $in: prerequisitosNoCumplidos } 
        });
        
        const nombresPrerequisitos = asignaturasPrerequisito.map(asig => 
          `${asig.nombre} (${asig.id})`
        ).join(', ');
        
        return res.status(400).json({
          error: 'El estudiante no cumple con los prerrequisitos para inscribirse en esta asignatura',
          prerequisitosFaltantes: prerequisitosNoCumplidos,
          mensaje: `Debe aprobar primero las siguientes asignaturas: ${nombresPrerequisitos}`,
          detalles: {
            asignatura: `${asignatura.nombre} (${asignatura.id})`,
            estudiante: `${estudiante.nombre} ${estudiante.apellido}`,
            asignaturasAprobadas: estudiante.asignaturasAprobadas
          }
        });
      }
    }

    const nextSecuencia = await getNextSecuencia('inscripcion', 200000);
    const idFormateado = nextSecuencia.toString().padStart(6, '0');

    const nuevaInscripcion = await Inscripcion.create({
      id: idFormateado,
      estudiante: estudianteId,
      asignatura: asignaturaId
    });

    if (!estudiante.asignaturasActuales.includes(asignaturaId)) {
      estudiante.asignaturasActuales.push(asignaturaId);
      await estudiante.save();
    }

    res.json({
      mensaje: 'Inscripción realizada correctamente',
      inscripcion: nuevaInscripcion
    });

  } catch (err) {
    console.error('Error al inscribir estudiante:', err);
    res.status(500).json({ error: 'Error al realizar inscripción', detalle: err.message });
  }
};

exports.obtenerInscripciones = async (req, res) => {
  try {
    const inscripciones = await Inscripcion.find();
    res.json(inscripciones);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener inscripciones', detalle: err.message });
  }
};

exports.obtenerInscripcionesPorEstudiante = async (req, res) => {
  try {
    const { estudianteId } = req.params;
    
    const inscripciones = await Inscripcion.find({ estudiante: estudianteId })
      .populate('asignatura', 'nombre numeroCredito semestre docente periodoAcademico');
    
    res.json(inscripciones);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener inscripciones del estudiante', detalle: err.message });
  }
};

exports.cancelarInscripcion = async (req, res) => {
  try {
    const { inscripcionId } = req.params;
    
    const inscripcion = await Inscripcion.findOneAndDelete({ id: inscripcionId });
    
    if (!inscripcion) {
      return res.status(404).json({ error: 'Inscripción no encontrada' });
    }

    const estudiante = await Estudiante.findOne({ id: inscripcion.estudiante });
    if (estudiante) {
      estudiante.asignaturasActuales = estudiante.asignaturasActuales.filter(
        asigId => asigId !== inscripcion.asignatura
      );
      await estudiante.save();
    }
    
    res.json({ 
      mensaje: 'Inscripción cancelada correctamente',
      inscripcion
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al cancelar inscripción', detalle: err.message });
  }
};