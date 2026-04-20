const express = require('express');
const db = require('./database');

const router = express.Router();

// LOGIN
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  const settings = db.getSettings();

  if (email === settings.email && password === settings.masterPassword) {
    return res.json({ ok: true });
  }

  res.status(401).json({ ok: false, message: 'Login inválido' });
});

module.exports = router;