const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// =====================
// MIDDLEWARE
// =====================
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// =====================
// STATIC
// =====================
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

// =====================
// FUNDOS PADRÃO
// =====================
function criarFundosPadrao() {
  const fundos = db.getBackgrounds();

  if (fundos.length > 0) return;

  const padrao = [
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
  ];

  db.saveBackgrounds(padrao);
}

// =====================
// LOGIN
// =====================
app.post('/login', (req, res) => {
  const settings = db.getSettings();
  const { email, password } = req.body;

  if (email === settings.email && password === settings.masterPassword) {
    return res.json({ ok: true });
  }

  res.status(401).json({ ok: false, message: 'Login inválido' });
});

// =====================
// APPS
// =====================
app.get('/apps', (req, res) => {
  try {
    res.json(db.getApps());
  } catch (e) {
    console.log(e);
    res.status(500).json({ ok: false });
  }
});

app.post('/apps', (req, res) => {
  try {
    const apps = db.getApps();

    const novo = {
      id: uid(),
      name: req.body.name || 'APP',
      package: req.body.package || '',
      apk: req.body.apk || '',
      icon: req.body.icon || '',
      autoInstall: req.body.autoInstall || false,
      createdAt: new Date().toISOString()
    };

    apps.push(novo);
    db.saveApps(apps);

    res.json({ ok: true });
  } catch (e) {
    console.log(e);
    res.status(500).json({ ok: false });
  }
});

app.post('/upload/apk', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false });
    }

    const url = fileUrl(req, req.file.filename);

    res.json({ ok: true, url });
  } catch (e) {
    console.log(e);
    res.status(500).json({ ok: false });
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
    res.status(500).json({ ok: false });
  }
});

app.post('/backgrounds', upload.single('imagem'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false });
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

    res.json({ ok: true });
  } catch (e) {
    console.log(e);
    res.status(500).json({ ok: false });
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
    res.status(500).json({ ok: false });
  }
});

app.post('/layouts', (req, res) => {
  try {
    const layouts = db.getLayouts();

    const novo = {
      id: uid(),
      name: req.body.name,
      logo: req.body.logo,
      background: req.body.background,
      createdAt: new Date().toISOString()
    };

    layouts.push(novo);
    db.saveLayouts(layouts);

    res.json({ ok: true });
  } catch (e) {
    console.log(e);
    res.status(500).json({ ok: false });
  }
});

// =====================
// START
// =====================
app.listen(PORT, () => {
  criarFundosPadrao();
  console.log('Rodando na porta:', PORT);
});