const Nota = require('../models/Nota');
const Inscripcion = require('../models/Inscripcion');
const Estudiante = require('../models/Estudiante');
const Asignatura = require('../models/Asignatura');
const getNextSecuencia = require('../models/secuencias');


exports.obtenerAsignaturasActivas = async (req, res) => {
  try {
    const asignaturas = await Asignatura.find({ activo: true }).sort({ semestre: 1, nombre: 1 });
    
    const asignaturasConEstudiantes = [];
    
    for (const asignatura of asignaturas) {
      const estudiantesInscritos = await Estudiante.countDocuments({
        asignaturasActuales: asignatura.id
      });
      
      asignaturasConEstudiantes.push({
        id: asignatura.id,
        nombre: asignatura.nombre,
        semestre: asignatura.semestre,
        creditos: asignatura.numeroCredito,
        estudiantesInscritos
      });
    }
    
    res.json(asignaturasConEstudiantes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener asignaturas activas', detalle: err.message });
  }
};

exports.obtenerEstudiantesPorAsignatura = async (req, res) => {
  try {
    const { asignaturaId } = req.params;
    
    const asignatura = await Asignatura.findOne({ id: asignaturaId });
    if (!asignatura) {
      return res.status(404).json({ error: 'Asignatura no encontrada' });
    }
    
    const estudiantes = await Estudiante.find({
      asignaturasActuales: asignaturaId
    }).sort({ apellido: 1, nombre: 1 });
    
    const estudiantesConNotas = [];
    
    for (const estudiante of estudiantes) {
      let inscripcion = await Inscripcion.findOne({
        estudiante: estudiante.id,
        asignatura: asignaturaId
      });
      
      if (!inscripcion) {
        const nextSecuencia = await getNextSecuencia('inscripcion', 200000);
        const inscripcionId = nextSecuencia.toString().padStart(6, '0');
        
        inscripcion = await Inscripcion.create({
          id: inscripcionId,
          estudiante: estudiante.id,
          asignatura: asignaturaId,
          fechaInscripcion: new Date(),
          estado: 'Inscrito'
        });
      }
      
      const notaExistente = await Nota.findOne({ idInscripcion: inscripcion.id });
      
      estudiantesConNotas.push({
        estudianteId: estudiante.id,
        estudianteNombre: `${estudiante.nombre} ${estudiante.apellido}`,
        numeroDocumento: estudiante.numeroDocumento,
        semestre: estudiante.semestreActual,
        inscripcionId: inscripcion.id,
        tieneNota: !!notaExistente,
        notaId: notaExistente ? notaExistente.id : null,
        notaFinal: notaExistente ? notaExistente.notaFinal : null,
        observaciones: notaExistente ? notaExistente.observaciones : '',
        fechaRegistro: notaExistente ? notaExistente.fechaRegistro : null,
        aprobada: notaExistente ? notaExistente.aprobada : null,
        estadoInscripcion: inscripcion.estado
      });
    }
    
    const totalEstudiantes = estudiantesConNotas.length;
    const estudiantesConNota = estudiantesConNotas.filter(e => e.tieneNota).length;
    const estudiantesAprobados = estudiantesConNotas.filter(e => e.aprobada === true).length;
    const estudiantesReprobados = estudiantesConNotas.filter(e => e.aprobada === false).length;
    const promedioAsignatura = estudiantesConNota > 0 ? 
      (estudiantesConNotas
        .filter(e => e.notaFinal !== null)
        .reduce((sum, e) => sum + e.notaFinal, 0) / estudiantesConNota).toFixed(2) : 0;
    
    res.json({
      asignatura: {
        id: asignatura.id,
        nombre: asignatura.nombre,
        semestre: asignatura.semestre,
        creditos: asignatura.numeroCredito,
        docente: asignatura.docente,
        activo: asignatura.activo
      },
      estadisticas: {
        totalEstudiantes,
        estudiantesConNota,
        estudiantesSinNota: totalEstudiantes - estudiantesConNota,
        estudiantesAprobados,
        estudiantesReprobados,
        promedioAsignatura: parseFloat(promedioAsignatura),
        porcentajeAprobacion: estudiantesConNota > 0 ? 
          ((estudiantesAprobados / estudiantesConNota) * 100).toFixed(1) : 0
      },
      estudiantes: estudiantesConNotas
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener estudiantes de la asignatura', detalle: err.message });
  }
};

exports.registrarNota = async (req, res) => {
  try {
    const { inscripcionId, notaFinal, observaciones } = req.body;
    
    if (notaFinal < 0.0 || notaFinal > 5.0) {
      return res.status(400).json({ 
        error: 'La nota debe estar entre 0.0 y 5.0 (inclusive)',
        valorRecibido: notaFinal
      });
    }
    
    const inscripcion = await Inscripcion.findOne({ id: inscripcionId });
    if (!inscripcion) {
      return res.status(404).json({ 
        error: 'No se puede registrar nota: la inscripción no existe',
        inscripcionId: inscripcionId
      });
    }
    
    const notaExistente = await Nota.findOne({ idInscripcion: inscripcionId });
    if (notaExistente) {
      return res.status(400).json({ 
        error: 'Ya existe una nota registrada para esta inscripción',
        notaExistente: {
          id: notaExistente.id,
          nota: notaExistente.notaFinal,
          fecha: notaExistente.fechaRegistro
        }
      });
    }
    
    const nextSecuencia = await getNextSecuencia('nota', 100000);
    const idFormateado = nextSecuencia.toString().padStart(6, '0');

    const nuevaNota = await Nota.create({
      id: idFormateado,
      notaFinal,
      idInscripcion: inscripcionId,
      observaciones: observaciones || ''
    });
    
    const nuevoEstado = nuevaNota.aprobada ? 'Aprobado' : 'Reprobado';
    await Inscripcion.findOneAndUpdate(
      { id: inscripcionId },
      { estado: nuevoEstado }
    );
    
    // Actualizar asignaturas del estudiante si aprobó
    if (nuevaNota.aprobada) {
      const estudiante = await Estudiante.findOne({ id: inscripcion.estudiante });
      if (estudiante) {
        // Remover de asignaturas actuales
        estudiante.asignaturasActuales = estudiante.asignaturasActuales.filter(
          asig => asig !== inscripcion.asignatura
        );
        
        // Agregar a asignaturas aprobadas si no está ya
        if (!estudiante.asignaturasAprobadas.includes(inscripcion.asignatura)) {
          estudiante.asignaturasAprobadas.push(inscripcion.asignatura);
        }
        
        await estudiante.save();
      }
    }

    const promocion = await actualizarSemestre(inscripcion.estudiante);
    
    res.json({ 
      mensaje: 'Nota registrada correctamente',
      nota: nuevaNota,
      aprobada: nuevaNota.aprobada,
      estadoInscripcion: nuevoEstado,
      promocion: promocion
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar nota', detalle: err.message });
  }
};

exports.actualizarNota = async (req, res) => {
  try {
    const { notaId, notaFinal, observaciones } = req.body;
    
    if (notaFinal < 0.0 || notaFinal > 5.0) {
      return res.status(400).json({ 
        error: 'La nota debe estar entre 0.0 y 5.0 (inclusive)',
        valorRecibido: notaFinal
      });
    }
    
    const nota = await Nota.findOne({ id: notaId });
    if (!nota) {
      return res.status(404).json({ error: 'Nota no encontrada' });
    }
    
    const inscripcion = await Inscripcion.findOne({ id: nota.idInscripcion });
    if (!inscripcion) {
      return res.status(404).json({ error: 'Inscripción asociada no encontrada' });
    }
    
    const estadoAnterior = nota.aprobada;
    const notaAnterior = nota.notaFinal;
    
    nota.notaFinal = notaFinal;
    nota.observaciones = observaciones || '';
    await nota.save();

    const nuevoEstado = nota.aprobada ? 'Aprobado' : 'Reprobado';
    await Inscripcion.findOneAndUpdate(
      { id: nota.idInscripcion },
      { estado: nuevoEstado }
    );

    // Actualizar estado de asignaturas del estudiante si cambió el estado de aprobación
    if (estadoAnterior !== nota.aprobada && inscripcion) {
      const estudiante = await Estudiante.findOne({ id: inscripcion.estudiante });
      if (estudiante) {
        if (nota.aprobada) {
          // Cambió de reprobado a aprobado
          estudiante.asignaturasActuales = estudiante.asignaturasActuales.filter(
            asig => asig !== inscripcion.asignatura
          );
          if (!estudiante.asignaturasAprobadas.includes(inscripcion.asignatura)) {
            estudiante.asignaturasAprobadas.push(inscripcion.asignatura);
          }
        } else {
          // Cambió de aprobado a reprobado
          estudiante.asignaturasAprobadas = estudiante.asignaturasAprobadas.filter(
            asig => asig !== inscripcion.asignatura
          );
          if (!estudiante.asignaturasActuales.includes(inscripcion.asignatura)) {
            estudiante.asignaturasActuales.push(inscripcion.asignatura);
          }
        }
        await estudiante.save();
      }
    }

    const promocion = await actualizarSemestre(inscripcion.estudiante);
    
    res.json({ 
      mensaje: 'Nota actualizada correctamente',
      nota,
      cambioEstado: estadoAnterior !== nota.aprobada,
      estadoAnterior: estadoAnterior ? 'Aprobado' : 'Reprobado',
      estadoNuevo: nota.aprobada ? 'Aprobado' : 'Reprobado',
      notaAnterior,
      notaNueva: nota.notaFinal,
      promocion: promocion
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar nota', detalle: err.message });
  }
};

exports.obtenerTodasLasNotas = async (req, res) => {
  try {
    const notas = await Nota.find().sort({ fechaRegistro: -1 });
    
    const notasConDetalles = [];
    
    for (const nota of notas) {
      const inscripcion = await Inscripcion.findOne({ id: nota.idInscripcion });
      if (inscripcion) {
        const estudiante = await Estudiante.findOne({ id: inscripcion.estudiante });
        const asignatura = await Asignatura.findOne({ id: inscripcion.asignatura });
        
        notasConDetalles.push({
          id: nota.id,
          notaFinal: nota.notaFinal,
          aprobada: nota.aprobada,
          fechaRegistro: nota.fechaRegistro,
          observaciones: nota.observaciones,
          estudiante: estudiante ? {
            id: estudiante.id,
            nombre: `${estudiante.nombre} ${estudiante.apellido}`,
            numeroDocumento: estudiante.numeroDocumento
          } : null,
          asignatura: asignatura ? {
            id: asignatura.id,
            nombre: asignatura.nombre,
            semestre: asignatura.semestre
          } : null,
          inscripcionId: inscripcion.id
        });
      }
    }
    
    res.json(notasConDetalles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener notas', detalle: err.message });
  }
};

exports.obtenerNotasEstudiante = async (req, res) => {
  try {
    const { estudianteId } = req.params;
    
    const estudiante = await Estudiante.findOne({ id: estudianteId });
    if (!estudiante) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    
    const inscripciones = await Inscripcion.find({ estudiante: estudianteId });
    const notasEstudiante = [];
    
    for (const inscripcion of inscripciones) {
      const nota = await Nota.findOne({ idInscripcion: inscripcion.id });
      if (nota) {
        const asignatura = await Asignatura.findOne({ id: inscripcion.asignatura });
        
        notasEstudiante.push({
          id: nota.id,
          notaFinal: nota.notaFinal,
          aprobada: nota.aprobada,
          fechaRegistro: nota.fechaRegistro,
          observaciones: nota.observaciones,
          asignatura: asignatura ? {
            id: asignatura.id,
            nombre: asignatura.nombre,
            semestre: asignatura.semestre,
            creditos: asignatura.numeroCredito
          } : null,
          inscripcionId: inscripcion.id
        });
      }
    }
    
    const totalNotas = notasEstudiante.length;
    const notasAprobadas = notasEstudiante.filter(n => n.aprobada).length;
    const notasReprobadas = totalNotas - notasAprobadas;
    const promedio = totalNotas > 0 ? 
      (notasEstudiante.reduce((sum, n) => sum + n.notaFinal, 0) / totalNotas).toFixed(2) : 0;
    
    res.json({
      estudiante: {
        id: estudiante.id,
        nombre: `${estudiante.nombre} ${estudiante.apellido}`,
        numeroDocumento: estudiante.numeroDocumento,
        semestre: estudiante.semestreActual
      },
      estadisticas: {
        totalNotas,
        notasAprobadas,
        notasReprobadas,
        promedio: parseFloat(promedio),
        porcentajeAprobacion: totalNotas > 0 ? ((notasAprobadas / totalNotas) * 100).toFixed(1) : 0
      },
      notas: notasEstudiante.sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener notas del estudiante', detalle: err.message });
  }
};

exports.obtenerPromediosEstudiantes = async (req, res) => {
  try {
    const inscripciones = await Inscripcion.find({});
    const estudiantesConNotas = new Set();
    
    for (const inscripcion of inscripciones) {
      const nota = await Nota.findOne({ idInscripcion: inscripcion.id });
      if (nota) {
        estudiantesConNotas.add(inscripcion.estudiante);
      }
    }
    
    const estudiantesConPromedios = [];
    
    for (const estudianteId of estudiantesConNotas) {
      const estudiante = await Estudiante.findOne({ id: estudianteId });
      if (!estudiante) continue;
      
      const inscripcionesEstudiante = await Inscripcion.find({ 
        estudiante: estudianteId 
      }).sort({ fechaInscripcion: 1 });
      
      let totalCreditos = 0;
      let totalPuntosPonderado = 0;
      let totalAsignaturas = 0;
      
      const asignaturasAprobadas = [];
      
      for (const inscripcion of inscripcionesEstudiante) {
        const nota = await Nota.findOne({ idInscripcion: inscripcion.id });
        if (nota) {
          const asignatura = await Asignatura.findOne({ id: inscripcion.asignatura });
          if (asignatura) {
            totalAsignaturas++;
            totalCreditos += asignatura.numeroCredito;
            totalPuntosPonderado += (nota.notaFinal * asignatura.numeroCredito);
            
            if (nota.aprobada) {
              asignaturasAprobadas.push({
                nota: nota.notaFinal,
                creditos: asignatura.numeroCredito,
                fecha: inscripcion.fechaInscripcion
              });
            }
          }
        }
      }
      
      const promedioPonderado = totalCreditos > 0 ? 
        (totalPuntosPonderado / totalCreditos) : 0;
      
      // Calcular promedio acumulado por bloques de 15 créditos
      let promedioAcumulado = 0;
      let creditosAprobados = 0;
      
      if (asignaturasAprobadas.length > 0) {
        creditosAprobados = asignaturasAprobadas.reduce((sum, asig) => sum + asig.creditos, 0);
        
        if (creditosAprobados >= 15) {
          // Calcular promedios por bloques de 15 créditos
          const promediosBloques = [];
          let creditosAcumulados = 0;
          let puntosAcumulados = 0;

          for (const asignatura of asignaturasAprobadas) {
            creditosAcumulados += asignatura.creditos;
            puntosAcumulados += (asignatura.nota * asignatura.creditos);

            // Cada vez que se completan 15 créditos (o múltiplos de 15)
            if (creditosAcumulados >= 15) {
              const cantidadBloques = Math.floor(creditosAcumulados / 15);
              
              // Solo calcular si hemos completado un nuevo bloque de 15 créditos
              if (promediosBloques.length < cantidadBloques) {
                const promedioBloque = puntosAcumulados / creditosAcumulados;
                promediosBloques.push(promedioBloque);
              }
            }
          }

          // El promedio acumulado final es el promedio de todos los promedios de bloques
          if (promediosBloques.length > 0) {
            promedioAcumulado = promediosBloques.reduce((sum, prom) => sum + prom, 0) / promediosBloques.length;
          }
        }
      }
      
      estudiantesConPromedios.push({
        id: estudiante.id,
        nombre: `${estudiante.nombre} ${estudiante.apellido}`,
        numeroDocumento: estudiante.numeroDocumento,
        semestre: estudiante.semestreActual,
        promedioPonderado: parseFloat(promedioPonderado.toFixed(2)),
        promedioAcumulado: parseFloat(promedioAcumulado.toFixed(2)),
        totalCreditos: totalCreditos,
        creditosAprobados: creditosAprobados,
        totalAsignaturas: totalAsignaturas
      });
    }
    
    // Ordenar por promedio ponderado descendente
    estudiantesConPromedios.sort((a, b) => b.promedioPonderado - a.promedioPonderado);
    
    res.json(estudiantesConPromedios);
    
  } catch (error) {
    console.error('Error al obtener promedios de estudiantes:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor al obtener promedios de estudiantes',
      details: error.message 
    });
  }
};

exports.obtenerDetallePromedioAcumulado = async (req, res) => {
  try {
    const { estudianteId } = req.params;
    
    const estudiante = await Estudiante.findOne({ id: estudianteId });
    if (!estudiante) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    const resultadoAcumulado = await calcularPromedioAcumuladoPorBloques(estudianteId);
    const promedioPonderado = await calcularPromedioPonderado(estudianteId);

    res.json({
      estudiante: {
        id: estudiante.id,
        nombre: `${estudiante.nombre} ${estudiante.apellido}`,
        numeroDocumento: estudiante.numeroDocumento,
        semestre: estudiante.semestreActual
      },
      promedioPonderado: parseFloat(promedioPonderado.toFixed(2)),
      promedioAcumulado: resultadoAcumulado.promedio,
      detallesCalculoAcumulado: {
        totalCreditos: resultadoAcumulado.totalCreditos,
        totalBloques: resultadoAcumulado.totalBloques,
        bloques: resultadoAcumulado.detalles,
        explicacion: "El promedio acumulado se calcula como el promedio de los promedios de cada bloque de 15 créditos completado"
      }
    });

  } catch (error) {
    console.error('Error al obtener detalle de promedio acumulado:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

async function actualizarSemestre(estudianteId) {
  try {
    const estudiante = await Estudiante.findOne({ id: estudianteId });
    if (!estudiante) {
      return { promocion: false, mensaje: 'Estudiante no encontrado' };
    }
    
    const inscripciones = await Inscripcion.find({ estudiante: estudianteId });
    let creditosAprobados = 0;
    
    for (const inscripcion of inscripciones) {
      const nota = await Nota.findOne({ idInscripcion: inscripcion.id });
      if (nota && nota.aprobada) {
        const asignatura = await Asignatura.findOne({ id: inscripcion.asignatura });
        if (asignatura) {
          creditosAprobados += asignatura.numeroCredito;
        }
      }
    }
    
    // Calcular el semestre que debería tener basado en créditos aprobados
    const semestreCalculado = Math.floor(creditosAprobados / 15) + 1;
    
    // Verificar si necesita promoción
    if (semestreCalculado > estudiante.semestreActual) {
      estudiante.semestreActual = semestreCalculado;
      await estudiante.save();
      
      return {
        promocion: true,
        mensaje: `Promoción automática: avanzó al semestre ${semestreCalculado}`,
        semestreAnterior: estudiante.semestreActual - (semestreCalculado - estudiante.semestreActual),
        semestreNuevo: semestreCalculado,
        creditosAprobados: creditosAprobados
      };
    }
    
    return {
      promocion: false,
      mensaje: 'Sin promoción de semestre',
      semestreActual: estudiante.semestreActual,
      creditosAprobados: creditosAprobados,
      creditosParaProximoSemestre: (estudiante.semestreActual * 15) - creditosAprobados
    };
    
  } catch (error) {
    console.error('Error al verificar promoción:', error);
    return { promocion: false, mensaje: 'Error al verificar promoción' };
  }
}