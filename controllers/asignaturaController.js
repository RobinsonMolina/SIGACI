const Asignatura = require('../models/Asignatura');
const Prerequisito = require('../models/Prerequisito');
const Estudiante = require('../models/Estudiante');
const Docente = require('../models/Docente');
const PeriodoAcademico = require('../models/PeriodoAcademico');

exports.crearAsignatura = async (req, res) => {
  try {
    const { 
      id, 
      nombre, 
      numeroCredito, 
      semestre, 
      prerequisitos,
      cuposDisponibles,
      docente,
      periodo,
      activo = true
    } = req.body;
    
    await Asignatura.create({ 
      id, 
      nombre, 
      numeroCredito, 
      semestre,
      cuposDisponibles,
      docente,
      periodo,
      activo
    });
    
    // Si hay prerequisitos, crear el registro de prerequisitos
    if (prerequisitos && prerequisitos.length > 0) {
      await Prerequisito.create({
        asignaturaId: id,
        requisitos: eliminarDuplicados(prerequisitos)
      });
    }
    
    res.json({ mensaje: 'Asignatura creada exitosamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear la asignatura', detalle: err.message });
  }
};

exports.actualizarAsignatura = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const asignatura = await Asignatura.findOne({ id });
    if (!asignatura) {
      return res.status(404).json({ error: 'Asignatura no encontrada' });
    }
    
    if (updateData.cuposDisponibles !== undefined && updateData.cuposDisponibles < asignatura.inscritos) {
      return res.status(400).json({ 
        error: 'Los cupos disponibles no pueden ser menores al número actual de inscritos',
        inscritosActuales: asignatura.inscritos,
        cuposPropuestos: updateData.cuposDisponibles
      });
    }
    
    if (updateData.docente) {
      const docente = await Docente.findOne({ id: updateData.docente });
      if (!docente) {
        return res.status(404).json({ error: 'Docente no encontrado' });
      }
    }
    
    if (updateData.periodo) {
      const periodo = await PeriodoAcademico.findOne({ id: updateData.periodo });
      if (!periodo) {
        return res.status(404).json({ error: 'Período académico no encontrado' });
      }
    }
    
    if (updateData.id && updateData.id !== id) {
      const asignaturaExistente = await Asignatura.findOne({ id: updateData.id });
      if (asignaturaExistente) {
        return res.status(400).json({ error: 'El nuevo ID ya está en uso por otra asignatura' });
      }
    }
    
    const camposActualizables = [
      'nombre', 
      'numeroCredito', 
      'semestre', 
      'cuposDisponibles', 
      'docente', 
      'periodo', 
      'activo'
    ];
    
    const actualizaciones = {};
    camposActualizables.forEach(campo => {
      if (updateData[campo] !== undefined) {
        actualizaciones[campo] = updateData[campo];
      }
    });
    
    if (Object.keys(actualizaciones).length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron campos válidos para actualizar' });
    }
    
    await Asignatura.updateOne({ id }, { $set: actualizaciones });
    
    if (updateData.id && updateData.id !== id) {
      // Actualizar referencias en prerequisitos
      await Prerequisito.updateMany(
        { asignaturaId: id },
        { $set: { asignaturaId: updateData.id } }
      );
      
      // Actualizar referencias en prerequisitos donde aparece como requisito
      await Prerequisito.updateMany(
        { requisitos: id },
        { $set: { "requisitos.$": updateData.id } }
      );
      
      // Actualizar referencias en estudiantes
      await Estudiante.updateMany(
        { asignaturasActuales: id },
        { $set: { "asignaturasActuales.$": updateData.id } }
      );
      
      await Estudiante.updateMany(
        { asignaturasAprobadas: id },
        { $set: { "asignaturasAprobadas.$": updateData.id } }
      );
    }
    
    // Manejar actualización de prerequisitos si se proporcionan
    if (updateData.prerequisitos !== undefined) {
      const asignaturaId = updateData.id || id;
      
      // Verificar que todas las asignaturas prerequisito existen
      if (updateData.prerequisitos.length > 0) {
        const asignaturasPrereq = await Asignatura.find({ 
          id: { $in: updateData.prerequisitos } 
        });
        
        if (asignaturasPrereq.length !== updateData.prerequisitos.length) {
          return res.status(400).json({ 
            error: 'Una o más asignaturas prerequisito no existen' 
          });
        }
      }
      
      // Actualiza o crear prerequisitos
      const prerequisitosLimpios = eliminarDuplicados(updateData.prerequisitos);
      
      if (prerequisitosLimpios.length > 0) {
        await Prerequisito.findOneAndUpdate(
          { asignaturaId },
          { requisitos: prerequisitosLimpios },
          { upsert: true, new: true }
        );
      } else {
        // Si no hay prerequisitos, eliminar el registro
        await Prerequisito.deleteOne({ asignaturaId });
      }
    }
    
    // Obtener la asignatura actualizada con sus prerequisitos
    const asignaturaActualizada = await Asignatura.findOne({ 
      id: updateData.id || id 
    });
    
    const prerequisitos = await Prerequisito.findOne({ 
      asignaturaId: updateData.id || id 
    });
    
    const resultado = {
      ...asignaturaActualizada.toObject(),
      prerequisitos: prerequisitos ? prerequisitos.requisitos : []
    };
    
    res.json({ 
      mensaje: 'Asignatura actualizada exitosamente',
      asignatura: resultado
    });
    
  } catch (err) {
    console.error('Error al actualizar asignatura:', err);
    res.status(500).json({ 
      error: 'Error al actualizar la asignatura', 
      detalle: err.message 
    });
  }
};

function eliminarDuplicados(array) {
  return [...new Set(array)];
}

exports.obtenerPorSemestre = async (req, res) => {
  try {
    const asignaturas = await Asignatura.find();
    const prerequisitos = await Prerequisito.find();
    
    // Crear un mapa de prerrequisitos por asignatura
    const prereqMap = {};
    prerequisitos.forEach(prereq => {
      prereqMap[prereq.asignaturaId] = prereq.requisitos || [];
    });
    
    const agrupadas = {};
    
    asignaturas.forEach(a => {
      const semestreStr = `Semestre ${a.semestre}`; 
      if (!agrupadas[semestreStr]) agrupadas[semestreStr] = [];
      
      // Agregar los prerrequisitos a la asignatura
      const asignaturaConPrereq = {
        ...a.toObject(),
        prerequisitos: prereqMap[a.id] || []
      };
      
      agrupadas[semestreStr].push(asignaturaConPrereq);
    });
    
    res.json(agrupadas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener asignaturas', detalle: err.message });
  }
};

exports.obtenerEstudiantesPorAsignatura = async (req, res) => {
  try {
    const asignaturaId = req.params.asignaturaId;
    
    const asignatura = await Asignatura.findOne({ id: asignaturaId });
    if (!asignatura) {
      return res.status(404).json({ mensaje: 'Asignatura no encontrada' });
    }
    
    const estudiantes = await Estudiante.find({ id: { $in: asignatura.estudiantes } });
    
    res.status(200).json(estudiantes);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener los estudiantes', error: error.message });
  }
};

exports.agregarAsignaturaAprobada = async (req, res) => {
  try {
    const { numeroDocumento, codigoAsignatura } = req.body;

    const estudiante = await Estudiante.findOne({ numeroDocumento });

    if (!estudiante) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    // Remover de asignaturas actuales
    estudiante.asignaturasActuales = estudiante.asignaturasActuales.filter(
      asig => asig !== codigoAsignatura
    );
    
    // Agregar a asignaturas aprobadas si no está ya
    if (!estudiante.asignaturasAprobadas.includes(codigoAsignatura)) {
      estudiante.asignaturasAprobadas.push(codigoAsignatura);
    }
    
    // También actualizar la asignatura para quitar al estudiante
    const asignatura = await Asignatura.findOne({ id: codigoAsignatura });
    if (asignatura) {
      asignatura.darDeBajaEstudiante(estudiante.id);
      await asignatura.save();
    }
    
    await estudiante.save();

    res.json({ mensaje: 'Asignatura marcada como aprobada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al aprobar la asignatura', detalle: err.message });
  }
};

exports.agregarAsignaturaActual = async (req, res) => {
  try {
    const { numeroDocumento, codigoAsignatura } = req.body;

    const estudiante = await Estudiante.findOne({ numeroDocumento });
    if (!estudiante) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    const asignatura = await Asignatura.findOne({ id: codigoAsignatura });
    if (!asignatura) {
      return res.status(404).json({ error: 'Asignatura no encontrada' });
    }

    if (!asignatura.activo) {
      return res.status(400).json({ error: 'La asignatura no está activa' });
    }

    if (estudiante.asignaturasAprobadas.includes(codigoAsignatura)) {
      return res.status(400).json({ error: 'El estudiante ya aprobó esta asignatura' });
    }

    if (estudiante.asignaturasActuales.includes(codigoAsignatura)) {
      return res.status(400).json({ error: 'El estudiante ya está inscrito en esta asignatura' });
    }

    if (!asignatura.tieneCuposDisponibles()) {
      return res.status(400).json({ error: 'No hay cupos disponibles en esta asignatura' });
    }

    const prerequisitos = await Prerequisito.findOne({ asignaturaId: codigoAsignatura });
    
    if (prerequisitos && prerequisitos.requisitos.length > 0) {
      const prerequisitosNoCumplidos = prerequisitos.requisitos.filter(
        prereq => !estudiante.asignaturasAprobadas.includes(prereq)
      );

      if (prerequisitosNoCumplidos.length > 0) {
        return res.status(400).json({
          error: 'El estudiante no ha aprobado los prerequisitos requeridos',
          prerequisitosFaltantes: prerequisitosNoCumplidos
        });
      }
    }

    // Inscribir estudiante
    estudiante.asignaturasActuales.push(codigoAsignatura);
    asignatura.inscribirEstudiante(estudiante.id);
    
    await estudiante.save();
    await asignatura.save();

    res.json({ mensaje: 'Asignatura agregada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al agregar asignatura actual', detalle: err.message });
  }
};

exports.obtenerTodas = async (req, res) => {
  try {
    console.log('Obteniendo todas las asignaturas...');
    const asignaturas = await Asignatura.find();
    console.log(`Se encontraron ${asignaturas.length} asignaturas`);
    res.json(asignaturas);
  } catch (err) {
    console.error('Error en obtenerTodas:', err);
    res.status(500).json({ error: 'Error al obtener asignaturas', detalle: err.message });
  }
};

exports.obtenerConPrerequisitos = async (req, res) => {
  try {
    const { id } = req.params;
    
    const asignatura = await Asignatura.findOne({ id });
    if (!asignatura) {
      return res.status(404).json({ error: 'Asignatura no encontrada' });
    }
    
    const prerequisitos = await Prerequisito.findOne({ asignaturaId: id });
    
    const resultado = {
      ...asignatura.toObject(),
      prerequisitos: prerequisitos ? prerequisitos.requisitos : []
    };
    
    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener asignatura', detalle: err.message });
  }
};

exports.reemplazarPrerrequisitos = async (req, res) => {
  try {
    const { asignaturaId, requisitos } = req.body;

    const asignatura = await Asignatura.findOne({ id: asignaturaId });
    if (!asignatura) {
      return res.status(404).json({ error: 'Asignatura no encontrada' });
    }

    const asignaturasPrereq = await Asignatura.find({ id: { $in: requisitos } });
    if (asignaturasPrereq.length !== requisitos.length) {
      return res.status(400).json({ error: 'Una o más asignaturas prerequisito no existen' });
    }

    let prerequisito = await Prerequisito.findOne({ asignaturaId });
    
    if (prerequisito) {
      prerequisito.requisitos = eliminarDuplicados(requisitos); 
      await prerequisito.save();
    } else {
      prerequisito = new Prerequisito({
        asignaturaId,
        requisitos: eliminarDuplicados(requisitos)
      });
      await prerequisito.save();
    }

    res.json({ 
      mensaje: 'Prerrequisitos reemplazados correctamente',
      prerequisitosFinales: prerequisito.requisitos 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al reemplazar prerrequisitos', detalle: err.message });
  }
};