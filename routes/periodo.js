const express = require('express');
const router = express.Router();
const periodoController = require('../controllers/periodoController');

router.post('/', periodoController.crearPeriodo);
router.get('/', periodoController.obtenerTodos);
router.put('/activar/:id', periodoController.activarPeriodo);
router.put('/', periodoController.actualizarPeriodo);

module.exports = router;