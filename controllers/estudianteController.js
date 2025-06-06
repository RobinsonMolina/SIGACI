const Estudiante = require('../models/Estudiante');
const Asignatura = require('../models/Asignatura');
const Nota = require('../models/Nota');
const Inscripcion = require('../models/Inscripcion');
const PeriodoAcademico = require('../models/PeriodoAcademico');

exports.cambiarPeriodo = async (req, res) => {
  try {
    const { nuevoPeriodoId } = req.body;
    
    const nuevoPeriodo = await PeriodoAcademico.findOne({ id: nuevoPeriodoId });
    if (!nuevoPeriodo) {
      return res.status(404).json({ error: 'Período académico no encontrado' });
    }
    
    const estudiantes = await Estudiante.find();
    
    let estudiantesActualizados = 0;
    
    for (const estudiante of estudiantes) {      
      const nuevoSemestre = Math.min(estudiante.semestreActual + 1, 10);
      
      await Estudiante.findOneAndUpdate(
        { id: estudiante.id },
        { 
          semestreActual: nuevoSemestre
        }
      );
      
      estudiantesActualizados++;
    }
    
    await PeriodoAcademico.updateMany({}, { activo: false });
    await PeriodoAcademico.findOneAndUpdate(
      { id: nuevoPeriodoId },
      { activo: true }
    );
    
    res.json({
      mensaje: 'Cambio de período realizado correctamente',
      estudiantesActualizados,
      nuevoPeriodo: nuevoPeriodo.nombrePeriodo
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al cambiar período', detalle: err.message });
  }
};

exports.crearEstudiante = async (req, res) => {
  try {
    const {
      id, nombre, apellido, fechaNacimiento, numeroDocumento, 
      celular, direccion
    } = req.body;

    const periodoActivo = await PeriodoAcademico.findOne({ activo: true });
    const periodoIngreso = periodoActivo ? periodoActivo.nombrePeriodo : 'Sin período activo';

    await Estudiante.create({
      id, 
      nombre, 
      apellido, 
      periodoIngreso,
      fechaNacimiento, 
      numeroDocumento, 
      celular, 
      direccion, 
      semestreActual: 1,
      asignaturasActuales: [],
      asignaturasAprobadas: []
    });

    res.json({ mensaje: 'Estudiante inscrito correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar estudiante', detalle: err.message });
  }
};

exports.obtenerEstudiantes = async (req, res) => {
  try {
    const estudiantes = await Estudiante.find();
    res.json(estudiantes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener los estudiantes', detalle: err.message });
  }
};

exports.obtenerPorSemestre = async (req, res) => {
  const estudiantes = await Estudiante.find();
  const agrupados = {};
  estudiantes.forEach(e => {
    const semestreStr = `Semestre ${e.semestreActual}`;
    if (!agrupados[semestreStr]) agrupados[semestreStr] = [];
    agrupados[semestreStr].push(e);
  });
  res.json(agrupados);
};

exports.eliminarEstudiante = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el estudiante existe
    const estudiante = await Estudiante.findOne({ id });
    if (!estudiante) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    // 1. Eliminar al estudiante de todas las asignaturas donde esté inscrito
    if (estudiante.asignaturasActuales && estudiante.asignaturasActuales.length > 0) {
      await Asignatura.updateMany(
        { id: { $in: estudiante.asignaturasActuales } },
        { $pull: { estudiantes: estudiante.id }, $inc: { inscritos: -1 } }
      );
    }

    // 2. Eliminar todas las inscripciones del estudiante
    await Inscripcion.deleteMany({ estudiante: estudiante.id });

    // 3. Eliminar todas las notas del estudiante
    const inscripcionesEliminadas = await Inscripcion.find({ estudiante: estudiante.id });
    const idsInscripciones = inscripcionesEliminadas.map(insc => insc.id);
    
    if (idsInscripciones.length > 0) {
      await Nota.deleteMany({ idInscripcion: { $in: idsInscripciones } });
    }

    // 4. Finalmente eliminar al estudiante
    await Estudiante.deleteOne({ id });

    res.json({ 
      mensaje: 'Estudiante eliminado correctamente',
      estudianteEliminado: {
        id: estudiante.id,
        nombre: `${estudiante.nombre} ${estudiante.apellido}`
      },
      asignaturasAfectadas: estudiante.asignaturasActuales ? estudiante.asignaturasActuales.length : 0,
      notasEliminadas: idsInscripciones.length
    });

  } catch (err) {
    console.error('Error al eliminar estudiante:', err);
    res.status(500).json({ 
      error: 'Error al eliminar estudiante', 
      detalle: err.message 
    });
  }
};

exports.obtenerAsignaturasEstudiante = async (req, res) => {
  try {
    const { estudianteId } = req.params;
    
    const estudiante = await Estudiante.findOne({ id: estudianteId });
    if (!estudiante) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    
    const todasAsignaturas = await Asignatura.find();
    
    const asignaturasPorSemestre = {};
    todasAsignaturas.forEach(asignatura => {
      const semKey = `Semestre ${asignatura.semestre}`;
      if (!asignaturasPorSemestre[semKey]) {
        asignaturasPorSemestre[semKey] = [];
      }
      
      let estado = "Sin cursar";
      if (estudiante.asignaturasAprobadas.includes(asignatura.id)) {
        estado = "Aprobada";
      } else if (estudiante.asignaturasActuales.includes(asignatura.id)) {
        estado = "Cursando";
      }
      
      asignaturasPorSemestre[semKey].push({
        ...asignatura.toObject(),
        estado
      });
    });
    
    res.json({
      estudiante: {
        id: estudiante.id,
        nombre: `${estudiante.nombre} ${estudiante.apellido}`,
        semestre: estudiante.semestreActual
      },
      asignaturas: asignaturasPorSemestre
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener asignaturas del estudiante', detalle: err.message });
  }
};

exports.agregarAsignaturaAprobada = async (req, res) => {
  try {
    const { numeroDocumento, codigoAsignatura } = req.body;

    const estudiante = await Estudiante.findOne({ numeroDocumento });

    if (!estudiante) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    estudiante.asignaturasActuales = estudiante.asignaturasActuales.filter(
      asig => asig !== codigoAsignatura
    );
    
    if (!estudiante.asignaturasAprobadas.includes(codigoAsignatura)) {
      estudiante.asignaturasAprobadas.push(codigoAsignatura);
    }
    
    await estudiante.save();

    res.json({ mensaje: 'Asignatura marcada como aprobada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al aprobar la asignatura', detalle: err.message });
  }
};

exports.actualizarEstudiante = async (req, res) => {
  try {
    const {
      id, nombre, apellido, periodoIngreso, fechaNacimiento, numeroDocumento, 
      celular, correo, direccion, semestreActual
    } = req.body;

    const estudiante = await Estudiante.findOne({ id });
    
    if (!estudiante) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    
    estudiante.nombre = nombre;
    estudiante.apellido = apellido;
    estudiante.periodoIngreso = periodoIngreso;
    estudiante.fechaNacimiento = fechaNacimiento;
    estudiante.numeroDocumento = numeroDocumento;
    estudiante.celular = celular;
    estudiante.correo = correo;
    estudiante.direccion = direccion;
    estudiante.semestreActual = semestreActual;
    
    await estudiante.save();
    
    res.json({ mensaje: 'Estudiante actualizado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar estudiante', detalle: err.message });
  }
};

exports.obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const estudiante = await Estudiante.findOne({ id });
    
    if (!estudiante) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    
    res.json(estudiante);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener datos del estudiante', detalle: err.message });
  }
};

exports.obtenerEstudiantesConNombresAsignaturas = async (req, res) => {
  try {
    const estudiantes = await Estudiante.find();
    
    // Obtener todas las asignaturas para hacer el mapeo de ID a nombre
    const asignaturas = await Asignatura.find();
    
    // Crear un mapa para convertir IDs a nombres de asignaturas
    const asignaturaMap = {};
    asignaturas.forEach(asignatura => {
      asignaturaMap[asignatura.id] = asignatura.nombre;
    });
    
    // Transformar los datos de los estudiantes para incluir nombres de asignaturas
    const estudiantesConNombresAsignaturas = estudiantes.map(estudiante => {
      return {
        ...estudiante.toObject(),
        asignaturasActuales: (estudiante.asignaturasActuales || []).map(id => ({
          id: id,
          nombre: asignaturaMap[id] || id // Si no encuentra el nombre, usa el ID
        })),
        asignaturasAprobadas: (estudiante.asignaturasAprobadas || []).map(id => ({
          id: id,
          nombre: asignaturaMap[id] || id // Si no encuentra el nombre, usa el ID
        }))
      };
    });
    
    res.json(estudiantesConNombresAsignaturas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener los estudiantes', detalle: err.message });
  }
};