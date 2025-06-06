const express = require('express');
const router = express.Router();
const docenteController = require('../controllers/docenteController');

router.get('/', docenteController.obtenerTodos);
router.get('/:id', docenteController.obtenerPorId);
router.post('/', docenteController.crearDocente);
router.put('/', docenteController.actualizarDocente);
router.delete('/:id', docenteController.eliminarDocente);

module.exports = router;