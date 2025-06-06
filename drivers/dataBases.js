require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = () => {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Conexión a MongoDB exitosa'))
    .catch(err => console.error('Error conectando a MongoDB:', err));
};

module.exports = connectDB;







