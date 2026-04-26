const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/painel', express.static(path.join(__dirname, '..', 'painel')));
app.use('/downloads', express.static(path.join(__dirname, 'public')));

// =====================
// HELPERS
// =====================
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function fileUrl(req, filename) {
  return `${req.protocol}://${req.get('host')}/downloads/uploads/${filename}`;
}

// =====================
// DEVICES DATABASE (simples)
// =====================
function getDevices() {
  try {
    return db.getDevices();
  } catch {
    return [];
  }
}

function saveDevices(data) {
  db.saveDevices(data);
}

// =====================
// VALIDAR DEVICE
// =====================
app.get('/launcher/device/:code', (req, res) => {
  const code = req.params.code;

  const devices = getDevices();

  let device = devices.find(d => d.code === code);

  // se não existir, cria automático
  if (!device) {
    device = {
      id: uid(),
      code,
      active: false,
      createdAt: new Date().toISOString()
    };

    devices.push(device);
    saveDevices(devices);
  }

  res.json({
    ok: true,
    device
  });
});

// =====================
// ATIVAR DEVICE
// =====================
app.post('/devices/:id/complete-activation', (req, res) => {
  try {
    const devices = getDevices();

    const index = devices.findIndex(d => d.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ ok: false, message: 'Dispositivo não encontrado' });
    }

    devices[index] = {
      ...devices[index],
      active: true,
      client: {
        name: req.body.name,
        phone: req.body.phone,
        notes: req.body.notes,
        plan: req.body.planName,
        expiresAt: req.body.expiresAt
      },
      layoutId: req.body.layoutId
    };

    saveDevices(devices);

    res.json({
      ok: true,
      device: devices[index]
    });

  } catch (e) {
    console.log(e);
    res.status(500).json({ ok: false });
  }
});

// =====================
// LAYOUTS
// =====================
app.get('/layouts', (req, res) => {
  res.json(db.getLayouts());
});

app.post('/layouts', (req, res) => {
  const layouts = db.getLayouts();

  const novo = {
    id: uid(),
    name: req.body.name,
    background: req.body.background,
    createdAt: new Date().toISOString()
  };

  layouts.push(novo);
  db.saveLayouts(layouts);

  res.json({ ok: true });
});

// =====================
// START
// =====================
app.listen(PORT, () => {
  console.log('Servidor rodando:', PORT);
});