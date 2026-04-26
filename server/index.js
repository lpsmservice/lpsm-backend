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

// =====================
// PASTAS
// =====================
app.use('/painel', express.static(path.join(__dirname, '..', 'painel')));
app.use('/downloads', express.static(path.join(__dirname, 'public')));

// =====================
// UPLOAD CONFIG
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
// FUNÇÃO ID
// =====================
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

// =====================
// CRIAR FUNDOS PADRÃO (1x)
// =====================
function criarFundosPadrao() {
  const fundos = db.getBackgrounds();

  if (fundos.length) return;

  const padrao = [
    {
      id: uid(),
      nome: 'Fundo Azul',
      imagem: 'https://picsum.photos/800/400?1'
    },
    {
      id: uid(),
      nome: 'Fundo Tech',
      imagem: 'https://picsum.photos/800/400?2'
    },
    {
      id: uid(),
      nome: 'Fundo Claro',
      imagem: 'https://picsum.photos/800/400?3'
    }
  ];

  db.saveBackgrounds(padrao);
  console.log('Fundos padrão criados');
}

// =====================
// ROTAS FUNDOS
// =====================

// LISTAR FUNDOS
app.get('/backgrounds', (req, res) => {
  try {
    const fundos = db.getBackgrounds();
    res.json(fundos);
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao buscar fundos' });
  }
});

// ADICIONAR FUNDO
app.post('/backgrounds', upload.single('imagem'), (req, res) => {
  try {
    const fundos = db.getBackgrounds();

    const novo = {
      id: uid(),
      nome: req.body.nome || 'Sem nome',
      imagem: `/downloads/uploads/${req.file.filename}`
    };

    fundos.push(novo);
    db.saveBackgrounds(fundos);

    res.json({ ok: true, fundo: novo });

  } catch (e) {
    console.log(e);
    res.status(500).json({ erro: 'Erro ao salvar fundo' });
  }
});

// =====================
// LOGIN (mantido)
// =====================
app.post('/login', (req, res) => {
  const settings = db.getSettings();
  const { email, password } = req.body;

  if (email === settings.email && password === settings.masterPassword) {
    return res.json({ ok: true });
  }

  res.status(401).json({ ok: false });
});

// =====================
// INICIAR
// =====================
app.listen(PORT, () => {
  console.log('Servidor rodando na porta', PORT);

  criarFundosPadrao(); // 👈 cria automático
});