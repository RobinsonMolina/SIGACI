const express = require('express');
const router = express.Router();
const asignaturaController = require('../controllers/asignaturaController');

router.post('/', asignaturaController.crearAsignatura);
router.get('/', asignaturaController.obtenerTodas);
router.get('/semestre', asignaturaController.obtenerPorSemestre);
router.get('/:id/prerequisitos', asignaturaController.obtenerConPrerequisitos);
router.get('/:asignaturaId/estudiantes', asignaturaController.obtenerEstudiantesPorAsignatura);

router.post('/aprobar', asignaturaController.agregarAsignaturaAprobada);// Me toca quitarla
router.post('/inscribir', asignaturaController.agregarAsignaturaActual);

router.put('/:id', asignaturaController.actualizarAsignatura);
 router.post('/prerrequisitos/reemplazar', asignaturaController.reemplazarPrerrequisitos);
module.exports = router;