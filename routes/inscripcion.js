const express = require('express');
const router = express.Router();
const inscripcionController = require('../controllers/inscripcionController');

router.post('/', inscripcionController.inscribirEstudiante);
router.get('/', inscripcionController.obtenerInscripciones);
router.get('/estudiante/:estudianteId', inscripcionController.obtenerInscripcionesPorEstudiante);

module.exports = router;