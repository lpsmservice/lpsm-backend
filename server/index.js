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
// HELPERS
// =====================
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function fileUrl(req, filename) {
  return `${req.protocol}://${req.get('host')}/downloads/uploads/${filename}`;
}

function normalizeCode(code) {
  return String(code || '').trim().toUpperCase();
}

function getDevicesSafe() {
  try {
    return db.getDevices();
  } catch {
    return [];
  }
}

function saveDevicesSafe(data) {
  db.saveDevices(Array.isArray(data) ? data : []);
}

function criarFundosPadrao() {
  try {
    const fundos = db.getBackgrounds();

    if (Array.isArray(fundos) && fundos.length > 0) return;

    db.saveBackgrounds([
      {
        id: uid(),
        nome: 'Fundo Azul',
        imagem: 'https://picsum.photos/800/400?1',
        createdAt: new Date().toISOString()
      },
      {
        id: uid(),
        nome: 'Fundo Tech',
        imagem: 'https://picsum.photos/800/400?2',
        createdAt: new Date().toISOString()
      },
      {
        id: uid(),
        nome: 'Fundo Claro',
        imagem: 'https://picsum.photos/800/400?3',
        createdAt: new Date().toISOString()
      }
    ]);
  } catch (e) {
    console.log('Erro ao criar fundos padrão:', e);
  }
}

// =====================
// LOGIN
// =====================
app.post('/login', (req, res) => {
  try {
    const settings = db.getSettings();
    const { email, password } = req.body;

    if (email === settings.email && password === settings.masterPassword) {
      return res.json({ ok: true });
    }

    res.status(401).json({ ok: false, message: 'Login inválido' });
  } catch (e) {
    res.status(500).json({ ok: false, message: 'Erro no login' });
  }
});

// =====================
// APPS
// =====================
app.get('/apps', (req, res) => {
  try {
    res.json(db.getApps());
  } catch (e) {
    console.log(e);
    res.status(500).json({ ok: false, message: 'Erro ao carregar aplicativos' });
  }
});

app.post('/apps', (req, res) => {
  try {
    const apps = db.getApps();

    const novo = {
      id: uid(),
      name: req.body.name || 'APP SEM NOME',
      package: req.body.package || '',
      version: req.body.version || '',
      apk: req.body.apk || '',
      icon: req.body.icon || '',
      active: req.body.active !== false,
      autoInstall: req.body.autoInstall || false,
      createdAt: new Date().toISOString()
    };

    apps.push(novo);
    db.saveApps(apps);

    res.json({ ok: true, app: novo });
  } catch (e) {
    console.log(e);
    res.status(500).json({ ok: false, message: 'Erro ao salvar aplicativo' });
  }
});

app.delete('/apps/:id', (req, res) => {
  try {
    const apps = db.getApps();
    const filtrados = apps.filter(appItem => appItem.id !== req.params.id);
    db.saveApps(filtrados);

    res.json({ ok: true });
  } catch (e) {
    console.log(e);
    res.status(500).json({ ok: false, message: 'Erro ao excluir aplicativo' });
  }
});

app.post('/upload/apk', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, message: 'Nenhum APK enviado' });
    }

    res.json({
      ok: true,
      url: fileUrl(req, req.file.filename)
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ ok: false, message: 'Erro ao enviar APK' });
  }
});

// =====================
// FUNDOS
// =====================
app.get('/backgrounds', (req, res) => {
  try {
    criarFundosPadrao();
    res.json(db.getBackgrounds());
  } catch (e) {
    console.log(e);
    res.status(500).json({ ok: false, message: 'Erro ao carregar fundos' });
  }
});

app.post('/backgrounds', upload.single('imagem'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, message: 'Nenhuma imagem enviada' });
    }

    const fundos = db.getBackgrounds();

    const novo = {
      id: uid(),
      nome: req.body.nome || 'Sem nome',
      imagem: fileUrl(req, req.file.filename),
      createdAt: new Date().toISOString()
    };

    fundos.push(novo);
    db.saveBackgrounds(fundos);

    res.json({ ok: true, fundo: novo });
  } catch (e) {
    console.log(e);
    res.status(500).json({ ok: false, message: 'Erro ao salvar fundo' });
  }
});

// =====================
// LAYOUTS
// =====================
app.get('/layouts', (req, res) => {
  try {
    res.json(db.getLayouts());
  } catch (e) {
    console.log(e);
    res.status(500).json({ ok: false, message: 'Erro ao carregar layouts' });
  }
});

app.post('/layouts', (req, res) => {
  try {
    const layouts = db.getLayouts();

    const novo = {
      id: uid(),
      name: req.body.name || 'Layout sem nome',
      logo: req.body.logo || '',
      background: req.body.background || '',
      backgroundId: req.body.backgroundId || '',
      logoPosition: req.body.logoPosition || 'left',
      buttonsLocked: req.body.buttonsLocked || false,
      unlockPassword: req.body.unlockPassword || '',
      showAppsButton: req.body.showAppsButton ?? true,
      iconSize: req.body.iconSize || 'default',
      clockSize: req.body.clockSize || 'default',
      expireSize: req.body.expireSize || 'default',
      bannerPosition: req.body.bannerPosition || 'left',
      datePosition: req.body.datePosition || 'left',
      bannerInterval: req.body.bannerInterval || 5,
      autoUpdate: req.body.autoUpdate || false,
      banners: req.body.banners || [],
      apps: req.body.apps || [],
      links: req.body.links || [],
      createdAt: new Date().toISOString()
    };

    layouts.push(novo);
    db.saveLayouts(layouts);

    res.json({ ok: true, layout: novo });
  } catch (e) {
    console.log(e);
    res.status(500).json({ ok: false, message: 'Erro ao salvar layout' });
  }
});

// =====================
// DEVICES
// =====================
app.get('/devices', (req, res) => {
  try {
    res.json(getDevicesSafe());
  } catch (e) {
    console.log(e);
    res.status(500).json({ ok: false, message: 'Erro ao carregar dispositivos' });
  }
});

app.get('/launcher/device/:code', (req, res) => {
  try {
    const code = normalizeCode(req.params.code);
    const devices = getDevicesSafe();

    let device = devices.find(d => normalizeCode(d.code) === code);

    if (!device) {
      device = {
        id: uid(),
        code,
        active: false,
        registered: false,
        createdAt: new Date().toISOString()
      };

      devices.push(device);
      saveDevicesSafe(devices);

      return res.json({
        ok: true,
        registered: false,
        active: false,
        activated: false,
        message: 'Dispositivo não registrado',
        device
      });
    }

    const isActive = device.active === true || device.activated === true;

    res.json({
      ok: true,
      registered: true,
      active: isActive,
      activated: isActive,
      message: isActive ? 'Dispositivo ativado' : 'Dispositivo aguardando ativação',
      device,
      client: device.client || null,
      layoutId: device.layoutId || '',
      expiresAt: device.expiresAt || device.client?.expiresAt || null
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ ok: false, message: 'Erro ao verificar dispositivo' });
  }
});

app.post('/devices/:id/complete-activation', (req, res) => {
  try {
    const devices = getDevicesSafe();
    const index = devices.findIndex(d => d.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ ok: false, message: 'Dispositivo não encontrado' });
    }

    devices[index] = {
      ...devices[index],
      registered: true,
      active: true,
      activated: true,
      name: req.body.name || devices[index].name || '',
      phone: req.body.phone || '',
      notes: req.body.notes || '',
      planName: req.body.planName || '',
      expiresAt: req.body.expiresAt || null,
      blockOnExpire: req.body.blockOnExpire || 'NÃO',
      forceBlockWrongTime: req.body.forceBlockWrongTime || 'SIM',
      layoutId: req.body.layoutId || '',
      type: req.body.type || 'annual',
      activatedAt: new Date().toISOString(),
      client: {
        name: req.body.name || '',
        phone: req.body.phone || '',
        notes: req.body.notes || '',
        plan: req.body.planName || '',
        expiresAt: req.body.expiresAt || null
      }
    };

    saveDevicesSafe(devices);

    res.json({
      ok: true,
      registered: true,
      active: true,
      activated: true,
      device: devices[index]
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ ok: false, message: 'Erro ao ativar dispositivo' });
  }
});

app.delete('/devices/:id', (req, res) => {
  try {
    const devices = getDevicesSafe();
    const filtrados = devices.filter(device => device.id !== req.params.id);

    saveDevicesSafe(filtrados);
    res.json({ ok: true });
  } catch (e) {
    console.log(e);
    res.status(500).json({ ok: false, message: 'Erro ao excluir dispositivo' });
  }
});

// =====================
// START
// =====================
app.listen(PORT, () => {
  criarFundosPadrao();
  console.log('Servidor rodando:', PORT);
});