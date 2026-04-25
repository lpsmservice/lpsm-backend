const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// =====================
// CONFIG UPLOAD
// =====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'public/uploads'));
  },
  filename: (req, file, cb) => {
    const nome = Date.now() + '-' + file.originalname;
    cb(null, nome);
  }
});

const upload = multer({ storage });

// =====================
// DATABASE
// =====================
const dbPath = path.join(__dirname, '../database/backgrounds.json');

function readDB() {
  if (!fs.existsSync(dbPath)) return [];
  return JSON.parse(fs.readFileSync(dbPath));
}

function saveDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// =====================
// ROTAS
// =====================

// LISTAR FUNDOS
app.get('/backgrounds', (req, res) => {
  const data = readDB();
  res.json(data);
});

// ADICIONAR FUNDO
app.post('/backgrounds', upload.single('imagem'), (req, res) => {
  const { nome } = req.body;

  if (!req.file) {
    return res.status(400).json({ erro: 'Imagem obrigatória' });
  }

  const novo = {
    id: Date.now(),
    nome,
    imagem: '/uploads/' + req.file.filename
  };

  const data = readDB();
  data.push(novo);
  saveDB(data);

  res.json({ ok: true });
});

// =====================
app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});