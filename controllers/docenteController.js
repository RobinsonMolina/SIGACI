const Docente = require('../models/Docente');

exports.crearDocente = async (req, res) => {
  try {
    const { id, nombre, apellido, correo, telefono } = req.body;
    
    const nuevoDocente = await Docente.create({
      id, nombre, apellido, correo, telefono
    });

    res.json({ 
      mensaje: 'Docente creado correctamente',
      docente: nuevoDocente
    });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      res.status(400).json({ error: 'Ya existe un docente con ese ID o correo' });
    } else {
      res.status(500).json({ error: 'Error al crear docente', detalle: err.message });
    }
  }
};

exports.obtenerTodos = async (req, res) => {
  try {
    const docentes = await Docente.find();
    res.json(docentes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener docentes', detalle: err.message });
  }
};

exports.obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const docente = await Docente.findOne({ id });
    
    if (!docente) {
      return res.status(404).json({ error: 'Docente no encontrado' });
    }
    
    res.json(docente);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener docente', detalle: err.message });
  }
};

exports.actualizarDocente = async (req, res) => {
  try {
    const { id, nombre, apellido, correo, telefono } = req.body;
    
    const docente = await Docente.findOneAndUpdate(
      { id },
      { nombre, apellido, correo, telefono },
      { new: true }
    );
    
    if (!docente) {
      return res.status(404).json({ error: 'Docente no encontrado' });
    }
    
    res.json({ 
      mensaje: 'Docente actualizado correctamente',
      docente
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar docente', detalle: err.message });
  }
};

exports.eliminarDocente = async (req, res) => {
  try {
    const { id } = req.params;
    
    const docente = await Docente.findOneAndDelete({ id });
    
    if (!docente) {
      return res.status(404).json({ error: 'Docente no encontrado' });
    }
    
    res.json({ mensaje: 'Docente eliminado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar docente', detalle: err.message });
  }
};