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
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/painel', express.static(path.join(__dirname, '..', 'painel')));
app.use('/downloads', express.static(path.join(__dirname, 'public')));

const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname || '');
    const base = Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    cb(null, `${base}${ext}`);
  }
});

const upload = multer({ storage });

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function generateCode(size = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < size; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function addHours(date, hours) {
  const d = new Date(date);
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

function addYears(date, years) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString();
}

function parseBooleanLike(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (['sim', 'true', '1', 'yes'].includes(v)) return true;
    if (['não', 'nao', 'false', '0', 'no'].includes(v)) return false;
  }
  return fallback;
}

function safeIsoDate(value, fallback = null) {
  if (!value) return fallback;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toISOString();
}

function normalizeApp(appItem = {}) {
  return {
    id: appItem.id || uid(),
    name: appItem.name || 'APP SEM NOME',
    package: appItem.package || '',
    apk: appItem.apk || '',
    icon: appItem.icon || '',
    version: appItem.version || '',
    active: appItem.active !== false,
    createdAt: appItem.createdAt || new Date().toISOString()
  };
}

function normalizeLayout(layout = {}) {
  return {
    id: layout.id || uid(),
    name: layout.name || 'Novo layout',
    background: layout.background || '',
    logo: layout.logo || '',
    logoPosition: layout.logoPosition || 'left',
    buttonsLocked: !!layout.buttonsLocked,
    unlockPassword: layout.unlockPassword || '',
    showAppsButton: layout.showAppsButton !== false,
    iconSize: layout.iconSize || 'default',
    clockSize: layout.clockSize || 'default',
    expireSize: layout.expireSize || 'default',
    bannerPosition: layout.bannerPosition || 'left',
    datePosition: layout.datePosition || 'left',
    bannerInterval: Number(layout.bannerInterval || 5),
    autoUpdate: !!layout.autoUpdate,
    apps: Array.isArray(layout.apps) ? layout.apps : [],
    links: Array.isArray(layout.links) ? layout.links : [],
    banners: Array.isArray(layout.banners) ? layout.banners : [],
    theme: layout.theme || null,
    createdAt: layout.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function normalizeDevice(device = {}) {
  return {
    id: device.id || uid(),
    code: device.code || generateCode(),
    active: !!device.active,
    layout: device.layout || null,
    name: device.name || 'Sem nome',
    status: device.status || 'pending',
    createdAt: device.createdAt || new Date().toISOString(),
    creditsAnnual: Number(device.creditsAnnual || 0),
    creditsTwoYears: Number(device.creditsTwoYears || 0),
    expiresAt: device.expiresAt || null,
    resellerId: device.resellerId || null,
    resellerName: device.resellerName || '',
    lastSeen: device.lastSeen || null,
    phone: device.phone || '',
    notes: device.notes || '',
    planName: device.planName || '',
    blockOnExpire: !!device.blockOnExpire,
    forceBlockWrongTime: device.forceBlockWrongTime !== false
  };
}

function normalizeReseller(reseller = {}) {
  return {
    id: reseller.id || uid(),
    name: reseller.name || '',
    login: reseller.login || '',
    password: reseller.password || '123456',
    annualCredits: Number(reseller.annualCredits || 0),
    twoYearsCredits: Number(reseller.twoYearsCredits || 0),
    createdAt: reseller.createdAt || new Date().toISOString()
  };
}

function getDashboardStats() {
  const devices = db.getDevices();
  const layouts = db.getLayouts();
  const apps = db.getApps();
  const resellers = db.getResellers();

  return {
    totalDevices: devices.length,
    activeDevices: devices.filter(d => d.active).length,
    pendingDevices: devices.filter(d => !d.active).length,
    totalLayouts: layouts.length,
    totalApps: apps.length,
    totalResellers: resellers.length,
    annualCreditsInUse: devices.reduce((acc, d) => acc + Number(d.creditsAnnual || 0), 0),
    twoYearsCreditsInUse: devices.reduce((acc, d) => acc + Number(d.creditsTwoYears || 0), 0)
  };
}

app.get('/', (req, res) => {
  res.redirect('/painel/index.html');
});

app.post('/login', (req, res) => {
  try {
    const settings = db.getSettings();
    const { email, password } = req.body || {};

    if (email === settings.email && password === settings.masterPassword) {
      return res.json({
        ok: true,
        user: {
          email: settings.email,
          companyName: settings.companyName || 'LPSM BOX'
        }
      });
    }

    return res.status(401).json({
      ok: false,
      message: 'Login ou senha inválidos'
    });
  } catch (error) {
    console.error('POST /login', error);
    return res.status(500).json({
      ok: false,
      message: 'Erro ao fazer login'
    });
  }
});

app.post('/upload/apk', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, message: 'Arquivo não enviado' });
    }

    return res.json({
      ok: true,
      url: `/downloads/uploads/${req.file.filename}`
    });
  } catch (error) {
    console.error('POST /upload/apk', error);
    return res.status(500).json({ ok: false, message: 'Erro no upload do APK' });
  }
});

app.post('/upload/image', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, message: 'Arquivo não enviado' });
    }

    return res.json({
      ok: true,
      url: `/downloads/uploads/${req.file.filename}`
    });
  } catch (error) {
    console.error('POST /upload/image', error);
    return res.status(500).json({ ok: false, message: 'Erro no upload da imagem' });
  }
});

app.get('/dashboard', (req, res) => {
  try {
    const settings = db.getSettings();
    const stats = getDashboardStats();
    res.json({
      ok: true,
      ...stats,
      settings
    });
  } catch (error) {
    console.error('GET /dashboard', error);
    res.status(500).json({ ok: false, message: 'Erro ao carregar dashboard' });
  }
});

app.get('/settings', (req, res) => {
  try {
    res.json(db.getSettings());
  } catch (error) {
    console.error('GET /settings', error);
    res.status(500).json({ ok: false, message: 'Erro ao carregar configurações' });
  }
});

app.put('/settings', (req, res) => {
  try {
    const current = db.getSettings();
    const next = { ...current, ...req.body };
    db.saveSettings(next);
    res.json({ ok: true, settings: next });
  } catch (error) {
    console.error('PUT /settings', error);
    res.status(500).json({ ok: false, message: 'Erro ao salvar configurações' });
  }
});

app.get('/apps', (req, res) => {
  try {
    res.json(db.getApps());
  } catch (error) {
    console.error('GET /apps', error);
    res.status(500).json({ ok: false, message: 'Erro ao carregar apps' });
  }
});

app.post('/apps', (req, res) => {
  try {
    const apps = db.getApps();
    const appItem = normalizeApp(req.body);
    apps.push(appItem);
    db.saveApps(apps);
    res.json({ ok: true, app: appItem });
  } catch (error) {
    console.error('POST /apps', error);
    res.status(500).json({ ok: false, message: 'Erro ao salvar app' });
  }
});

app.put('/apps/:id', (req, res) => {
  try {
    const apps = db.getApps();
    const index = apps.findIndex(a => a.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ ok: false, message: 'App não encontrado' });
    }

    apps[index] = normalizeApp({
      ...apps[index],
      ...req.body,
      id: apps[index].id,
      createdAt: apps[index].createdAt
    });

    db.saveApps(apps);
    return res.json({ ok: true, app: apps[index] });
  } catch (error) {
    console.error('PUT /apps/:id', error);
    return res.status(500).json({ ok: false, message: 'Erro ao atualizar app' });
  }
});

app.delete('/apps/:id', (req, res) => {
  try {
    const apps = db.getApps().filter(a => a.id !== req.params.id);
    db.saveApps(apps);

    const layouts = db.getLayouts().map(layout => ({
      ...layout,
      apps: Array.isArray(layout.apps) ? layout.apps.filter(appId => appId !== req.params.id) : []
    }));
    db.saveLayouts(layouts);

    res.json({ ok: true });
  } catch (error) {
    console.error('DELETE /apps/:id', error);
    res.status(500).json({ ok: false, message: 'Erro ao excluir app' });
  }
});

app.get('/layouts', (req, res) => {
  try {
    const apps = db.getApps();
    const layouts = db.getLayouts().map(layout => {
      const appObjects = Array.isArray(layout.apps)
        ? layout.apps.map(id => apps.find(appItem => appItem.id === id)).filter(Boolean)
        : [];

      return {
        ...layout,
        appObjects
      };
    });

    res.json(layouts);
  } catch (error) {
    console.error('GET /layouts', error);
    res.status(500).json({ ok: false, message: 'Erro ao carregar layouts' });
  }
});

app.post('/layouts', (req, res) => {
  try {
    const layouts = db.getLayouts();
    const layout = normalizeLayout(req.body);
    layouts.push(layout);
    db.saveLayouts(layouts);
    res.json({ ok: true, layout });
  } catch (error) {
    console.error('POST /layouts', error);
    res.status(500).json({ ok: false, message: 'Erro ao salvar layout' });
  }
});

app.put('/layouts/:id', (req, res) => {
  try {
    const layouts = db.getLayouts();
    const index = layouts.findIndex(l => l.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ ok: false, message: 'Layout não encontrado' });
    }

    layouts[index] = normalizeLayout({
      ...layouts[index],
      ...req.body,
      id: layouts[index].id,
      createdAt: layouts[index].createdAt
    });

    db.saveLayouts(layouts);
    return res.json({ ok: true, layout: layouts[index] });
  } catch (error) {
    console.error('PUT /layouts/:id', error);
    return res.status(500).json({ ok: false, message: 'Erro ao atualizar layout' });
  }
});

app.delete('/layouts/:id', (req, res) => {
  try {
    const layouts = db.getLayouts().filter(l => l.id !== req.params.id);
    db.saveLayouts(layouts);

    const devices = db.getDevices().map(device => {
      if (device.layout === req.params.id) {
        return { ...device, layout: null };
      }
      return device;
    });
    db.saveDevices(devices);

    res.json({ ok: true });
  } catch (error) {
    console.error('DELETE /layouts/:id', error);
    res.status(500).json({ ok: false, message: 'Erro ao excluir layout' });
  }
});

app.get('/devices', (req, res) => {
  try {
    const layouts = db.getLayouts();
    const now = Date.now();

    const devices = db.getDevices().map(device => {
      const expiresAt = device.expiresAt ? new Date(device.expiresAt).getTime() : null;
      const lastSeen = device.lastSeen ? new Date(device.lastSeen).getTime() : null;

      let displayStatus = 'pending';

      if (device.active && expiresAt && expiresAt < now) {
        displayStatus = 'expired';
      } else if (device.active && lastSeen && now - lastSeen >= 3 * 24 * 60 * 60 * 1000) {
        displayStatus = 'inactive3d';
      } else if (device.active) {
        displayStatus = 'online';
      }

      return {
        ...device,
        layoutObject: device.layout ? layouts.find(l => l.id === device.layout) || null : null,
        layoutName: device.layout ? (layouts.find(l => l.id === device.layout)?.name || '') : '',
        displayStatus
      };
    });

    res.json(devices);
  } catch (error) {
    console.error('GET /devices', error);
    res.status(500).json({ ok: false, message: 'Erro ao carregar dispositivos' });
  }
});

app.post('/devices', (req, res) => {
  try {
    const devices = db.getDevices();
    const device = normalizeDevice({
      ...req.body,
      code: req.body.code || generateCode()
    });
    devices.push(device);
    db.saveDevices(devices);
    res.json({ ok: true, device });
  } catch (error) {
    console.error('POST /devices', error);
    res.status(500).json({ ok: false, message: 'Erro ao salvar dispositivo' });
  }
});

app.put('/devices/:id', (req, res) => {
  try {
    const devices = db.getDevices();
    const index = devices.findIndex(d => d.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ ok: false, message: 'Dispositivo não encontrado' });
    }

    devices[index] = normalizeDevice({
      ...devices[index],
      ...req.body,
      id: devices[index].id,
      code: devices[index].code,
      createdAt: devices[index].createdAt
    });

    db.saveDevices(devices);
    return res.json({ ok: true, device: devices[index] });
  } catch (error) {
    console.error('PUT /devices/:id', error);
    return res.status(500).json({ ok: false, message: 'Erro ao atualizar dispositivo' });
  }
});

app.delete('/devices/:id', (req, res) => {
  try {
    const devices = db.getDevices().filter(d => d.id !== req.params.id);
    db.saveDevices(devices);
    res.json({ ok: true });
  } catch (error) {
    console.error('DELETE /devices/:id', error);
    res.status(500).json({ ok: false, message: 'Erro ao excluir dispositivo' });
  }
});

app.post('/devices/:id/complete-activation', (req, res) => {
  try {
    const devices = db.getDevices();
    const layouts = db.getLayouts();
    const index = devices.findIndex(d => d.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ ok: false, message: 'Dispositivo não encontrado' });
    }

    const current = devices[index];
    const body = req.body || {};

    const selectedLayoutId =
      body.layoutId ||
      current.layout ||
      (layouts.length ? layouts[0].id : null);

    if (!selectedLayoutId) {
      return res.status(400).json({
        ok: false,
        message: 'Nenhum layout foi selecionado'
      });
    }

    const selectedLayout = layouts.find(l => l.id === selectedLayoutId);
    if (!selectedLayout) {
      return res.status(400).json({
        ok: false,
        message: 'Layout informado não existe'
      });
    }

    const explicitExpire = safeIsoDate(body.expiresAt, null);
    const nextExpiresAt = explicitExpire || addHours(new Date(), 24);

    const updated = normalizeDevice({
      ...current,
      id: current.id,
      code: current.code,
      createdAt: current.createdAt,
      name: body.name || current.name,
      phone: body.phone || '',
      notes: body.notes || '',
      planName: body.planName || '',
      layout: selectedLayoutId,
      active: true,
      status: 'active',
      expiresAt: nextExpiresAt,
      blockOnExpire: parseBooleanLike(body.blockOnExpire, false),
      forceBlockWrongTime: parseBooleanLike(body.forceBlockWrongTime, true),
      lastSeen: new Date().toISOString(),
      creditsAnnual: Number(current.creditsAnnual || 0),
      creditsTwoYears: Number(current.creditsTwoYears || 0)
    });

    devices[index] = updated;
    db.saveDevices(devices);

    return res.json({
      ok: true,
      message: 'Dispositivo ativado com sucesso',
      device: updated
    });
  } catch (error) {
    console.error('POST /devices/:id/complete-activation', error);
    return res.status(500).json({
      ok: false,
      message: `Erro ao concluir ativação do dispositivo: ${error.message}`
    });
  }
});

app.get('/resellers', (req, res) => {
  try {
    res.json(db.getResellers());
  } catch (error) {
    console.error('GET /resellers', error);
    res.status(500).json({ ok: false, message: 'Erro ao carregar revendas' });
  }
});

app.post('/resellers', (req, res) => {
  try {
    const resellers = db.getResellers();
    const reseller = normalizeReseller(req.body);
    resellers.push(reseller);
    db.saveResellers(resellers);
    res.json({ ok: true, reseller });
  } catch (error) {
    console.error('POST /resellers', error);
    res.status(500).json({ ok: false, message: 'Erro ao salvar revenda' });
  }
});

app.put('/resellers/:id', (req, res) => {
  try {
    const resellers = db.getResellers();
    const index = resellers.findIndex(r => r.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ ok: false, message: 'Revenda não encontrada' });
    }

    resellers[index] = normalizeReseller({
      ...resellers[index],
      ...req.body,
      id: resellers[index].id,
      createdAt: resellers[index].createdAt
    });

    db.saveResellers(resellers);
    return res.json({ ok: true, reseller: resellers[index] });
  } catch (error) {
    console.error('PUT /resellers/:id', error);
    return res.status(500).json({ ok: false, message: 'Erro ao atualizar revenda' });
  }
});

app.delete('/resellers/:id', (req, res) => {
  try {
    const resellers = db.getResellers().filter(r => r.id !== req.params.id);
    db.saveResellers(resellers);
    res.json({ ok: true });
  } catch (error) {
    console.error('DELETE /resellers/:id', error);
    res.status(500).json({ ok: false, message: 'Erro ao excluir revenda' });
  }
});

app.get('/launcher/device/:code', (req, res) => {
  try {
    const devices = db.getDevices();
    const code = String(req.params.code || '').trim().toUpperCase();
    const checkOnly = String(req.query.checkOnly || '') === '1';

    let device = devices.find(d => String(d.code || '').trim().toUpperCase() === code);

    if (!device) {
      if (checkOnly) {
        return res.status(404).json({
          ok: false,
          message: 'Código não registrado'
        });
      }

      device = normalizeDevice({
        code,
        active: false,
        status: 'pending'
      });

      devices.push(device);
      db.saveDevices(devices);
    } else {
      if (!checkOnly) {
        device.lastSeen = new Date().toISOString();
        db.saveDevices(devices);
      }
    }

    const layouts = db.getLayouts();
    const apps = db.getApps();
    const settings = db.getSettings();

    const layout = device.layout ? layouts.find(l => l.id === device.layout) : null;

    const layoutApps = layout && Array.isArray(layout.apps)
      ? layout.apps.map(appId => apps.find(a => a.id === appId)).filter(Boolean)
      : [];

    res.json({
      ok: true,
      device,
      settings,
      layout: layout
        ? {
            ...layout,
            appObjects: layoutApps
          }
        : null
    });
  } catch (error) {
    console.error('GET /launcher/device/:code', error);
    res.status(500).json({ ok: false, message: 'Erro ao carregar launcher do aparelho' });
  }
});

app.get('/launcher/download', (req, res) => {
  res.json({
    ok: true,
    url: '/downloads/lpsm-launcher.apk'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('Servidor rodando na porta:', PORT);
});