const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 0 }
});

const Counter = mongoose.model('Secuencias', counterSchema, "secuencias");

const getNextSecuencia = async (nombreSecuencia, valorInicial = 1) => {

  const existente = await Counter.findById(nombreSecuencia);

  if (!existente) {

    await Counter.create({ _id: nombreSecuencia, seq: valorInicial - 1 });
  }

  const resultado = await Counter.findByIdAndUpdate(
    nombreSecuencia,
    { $inc: { seq: 1 } },
    { new: true }
  );

  return resultado.seq;
};

module.exports = getNextSecuencia;
