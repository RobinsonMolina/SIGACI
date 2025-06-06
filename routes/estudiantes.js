const express = require('express');
const router = express.Router();
const controller = require('../controllers/estudianteController');

router.post('/', controller.crearEstudiante);
router.get('/porSemestre', controller.obtenerPorSemestre);
router.get('/con-nombres-asignaturas', controller.obtenerEstudiantesConNombresAsignaturas);
router.get('/:estudianteId/asignaturas', controller.obtenerAsignaturasEstudiante);
router.get('/:id', controller.obtenerPorId);
router.put('/actualizar', controller.actualizarEstudiante);
router.delete('/:id', controller.eliminarEstudiante);
router.get('/', controller.obtenerEstudiantes);

module.exports = router;