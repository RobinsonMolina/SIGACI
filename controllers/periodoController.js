const PeriodoAcademico = require('../models/PeriodoAcademico');

exports.crearPeriodo = async (req, res) => {
  try {
    const { id, nombrePeriodo, fechaInicio, fechaFin, activo } = req.body;
    
    if (activo) {
      await PeriodoAcademico.updateMany({}, { activo: false });
    }
    
    const nuevoPeriodo = await PeriodoAcademico.create({
      id, nombrePeriodo, fechaInicio, fechaFin, activo
    });

    res.json({ 
      mensaje: 'Período académico creado correctamente',
      periodo: nuevoPeriodo
    });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      res.status(400).json({ error: 'Ya existe un período con ese ID' });
    } else {
      res.status(500).json({ error: 'Error al crear período', detalle: err.message });
    }
  }
};

exports.obtenerTodos = async (req, res) => {
  try {
    const periodos = await PeriodoAcademico.find().sort({ fechaInicio: -1 });
    res.json(periodos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener períodos', detalle: err.message });
  }
};

exports.activarPeriodo = async (req, res) => {
  try {
    const { id } = req.params;
    
    await PeriodoAcademico.updateMany({}, { activo: false });
    
    const periodo = await PeriodoAcademico.findOneAndUpdate(
      { id },
      { activo: true },
      { new: true }
    );
    
    if (!periodo) {
      return res.status(404).json({ error: 'Período no encontrado' });
    }
    
    res.json({ 
      mensaje: 'Período activado correctamente',
      periodo
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al activar período', detalle: err.message });
  }
};

exports.actualizarPeriodo = async (req, res) => {
  try {
    const { id, nombrePeriodo, fechaInicio, fechaFin, activo } = req.body;
    
    if (activo) {
      await PeriodoAcademico.updateMany({}, { activo: false });
    }
    
    const periodo = await PeriodoAcademico.findOneAndUpdate(
      { id },
      { nombrePeriodo, fechaInicio, fechaFin, activo },
      { new: true }
    );
    
    if (!periodo) {
      return res.status(404).json({ error: 'Período no encontrado' });
    }
    
    res.json({ 
      mensaje: 'Período actualizado correctamente',
      periodo
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar período', detalle: err.message });
  }
};