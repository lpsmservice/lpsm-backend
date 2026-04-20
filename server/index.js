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

// ✅ CORREÇÃO AQUI
app.use('/painel', express.static(path.join(__dirname, '..', 'painel')));

// downloads continua igual
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

// redirecionamento principal
app.get('/', (req, res) => {
  res.redirect('/painel/index.html');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('Servidor rodando na porta:', PORT);
});