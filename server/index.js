const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// permitir JSON
app.use(express.json());

// ================= ROTAS =================

// rota de teste
app.get("/", (req, res) => {
  res.send("Servidor LPSM rodando 🚀");
});

// painel
app.use("/painel", express.static(path.join(__dirname, "..", "painel")));

// downloads (APK)
app.use("/downloads", express.static(path.join(__dirname, "..", "public")));

// ================= START =================

app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor rodando na porta:", PORT);
});