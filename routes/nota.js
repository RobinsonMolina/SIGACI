const express = require('express');
const router = express.Router();
const notaController = require('../controllers/notaController');

router.get('/asignaturas', notaController.obtenerAsignaturasActivas);
router.get('/asignatura/:asignaturaId/estudiantes', notaController.obtenerEstudiantesPorAsignatura);
router.get('/estudiante/:estudianteId/promedio-acumulado', notaController.obtenerDetallePromedioAcumulado);
router.post('/', notaController.registrarNota);
router.put('/', notaController.actualizarNota);
router.get('/', notaController.obtenerTodasLasNotas);
router.get('/estudiante/:estudianteId', notaController.obtenerNotasEstudiante);
router.get('/promedios', notaController.obtenerPromediosEstudiantes);

module.exports = router;