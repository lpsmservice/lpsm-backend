app.post('/upload/apk', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, message: 'Nenhum APK enviado' });
    }

    const url = `${req.protocol}://${req.get('host')}/downloads/uploads/${req.file.filename}`;

    res.json({
      ok: true,
      url
    });

  } catch (e) {
    console.log(e);
    res.status(500).json({ ok: false, message: 'Erro ao enviar APK' });
  }
});