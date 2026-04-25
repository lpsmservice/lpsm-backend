const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
app.use(express.json());

// ===============================
// CONFIG UPLOAD
// ===============================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'server/public/uploads');
  },
  filename: function (req, file, cb) {
    const name = Date.now() + '-' + file.originalname;
    cb(null, name);
  }
});

const upload = multer({ storage });

// ===============================
// SERVIR ARQUIVOS ESTÁTICOS
// ===============================
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/painel', express.static(path.join(__dirname, '../panel')));

// ===============================
// ROTA GET FUNDOS
// ===============================
app.get('/fundos', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync('./database/backgrounds.json'));
    res.json(data);
  } catch (err) {
    res.json([]);
  }
});

// ===============================
// ROTA POST FUNDOS (UPLOAD)
// ===============================
app.post('/fundos', upload.single('image'), (req, res) => {
  const file = req.file;
  const { name } = req.body;

  if (!file) {
    return res.status(400).json({ erro: 'Sem imagem' });
  }

  const dataPath = './database/backgrounds.json';
  const data = JSON.parse(fs.readFileSync(dataPath));

  const novo = {
    id: Date.now(),
    name: name || 'Sem nome',
    image: `/uploads/${file.filename}`
  };

  data.push(novo);

  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

  res.json({ ok: true });
});

// ===============================
app.listen(10000, () => {
  console.log('Servidor rodando na porta 10000');
});