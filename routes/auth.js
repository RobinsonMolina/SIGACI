const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
  const { usuario, contrasena } = req.body;
  if (usuario === 'admin' && contrasena === '1234') {
    req.session.user = usuario;
    res.redirect('/dashboard.html');
  } else {
    res.status(401).json({ error: 'Credenciales inválidas' });
  }
});

module.exports = router;