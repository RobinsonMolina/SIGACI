require('dotenv').config();
const express = require('express');
const connectDB = require('./drivers/dataBases');
const session = require('express-session'); 
const path = require('path');
const app = express();

// 🔌 Conexión a MongoDB Atlass
connectDB();

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'sigaci_secret',
  resave: false,
  saveUninitialized: true
}));

app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.use('/api/asignaturas', require('./routes/asignaturas'));
app.use('/api/estudiantes', require('./routes/estudiantes'));
app.use('/api/docentes', require('./routes/docente'));
app.use('/api/periodos', require('./routes/periodo'));
app.use('/api/inscripciones', require('./routes/inscripcion'));
app.use('/api/notas', require('./routes/nota'));
app.use('/auth', require('./routes/auth'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT} en http://localhost:${PORT}`));
