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
// UPLOAD
// =====================
const uploadDir = path.join(__dirname, 'public', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.random().toString(36).substring(2, 8);
    cb(null, name + ext);
  }
});

const upload = multer({ storage });

// =====================
// APPS
// =====================
app.get('/apps', (req, res) => {
  res.json(db.getApps());
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
    name: req.body.name || 'Layout',
    background: req.body.background || '',
    apps: [],
    mainApps: [],
    secondaryApps: [],
    createdAt: new Date().toISOString()
  };

  layouts.push(novo);
  db.saveLayouts(layouts);

  res.json({ ok: true, layout: novo });
});


// ⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐
// 🔥 ESSA É A PARTE QUE FALTAVA 🔥
// SALVAR APPS NO LAYOUT
// ⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐
app.put('/layouts/:id/apps', (req, res) => {
  try {
    const layouts = db.getLayouts();

    const index = layouts.findIndex(l => l.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ ok: false, message: 'Layout não encontrado' });
    }

    layouts[index] = {
      ...layouts[index],
      apps: req.body.apps || [],
      mainApps: req.body.mainApps || [],
      secondaryApps: req.body.secondaryApps || []
    };

    db.saveLayouts(layouts);

    res.json({ ok: true });

  } catch (e) {
    console.log(e);
    res.status(500).json({ ok: false, message: 'Erro ao salvar apps no layout' });
  }
});


// =====================
// DEVICE (launcher usa isso)
// =====================
app.get('/launcher/device/:code', (req, res) => {
  const devices = db.getDevices();
  const code = String(req.params.code || '').toUpperCase();

  let device = devices.find(d => d.code === code);

  if (!device) {
    device = {
      id: uid(),
      code,
      active: false,
      createdAt: new Date().toISOString()
    };

    devices.push(device);
    db.saveDevices(devices);
  }

  // 🔥 BUSCA LAYOUT COMPLETO
  const layouts = db.getLayouts();
  const layout = layouts.find(l => l.id === device.layoutId);

  res.json({
    ok: true,
    device,
    layout: layout || null
  });
});


// =====================
// ATIVAR DISPOSITIVO
// =====================
app.post('/devices/:id/complete-activation', (req, res) => {
  const devices = db.getDevices();

  const index = devices.findIndex(d => d.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ ok: false });
  }

  devices[index] = {
    ...devices[index],
    active: true,
    name: req.body.name,
    phone: req.body.phone,
    planName: req.body.planName,
    expiresAt: req.body.expiresAt,
    layoutId: req.body.layoutId
  };

  db.saveDevices(devices);

  res.json({ ok: true });
});


// =====================
app.listen(PORT, () => {
  console.log('Servidor rodando:', PORT);
});