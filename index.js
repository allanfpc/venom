const venom = require('venom-bot');
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const uploadDir = path.join(__dirname, 'uploads');
let clientGlobal = null; // cliente venom global

// Subir o servidor Express imediatamente
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// Inicializar o Venom de forma assíncrona
venom
  .create({
    session: 'loja',
    multidevice: true,
    headless: 'new',
    browserArgs: ['--no-sandbox','--disable-setuid-sandbox','--headless=new'],
    browserPathExecutable: '/usr/bin/google-chrome-stable',
    sessionTokenDir: '/tmp/tokens',
  })
  .then((client) => {
    clientGlobal = client;
    console.log('Venom iniciado com sucesso');
  })
  .catch((err) => {
    console.error('Erro ao iniciar o Venom:', err);
  });

// Endpoints (funcionam mesmo se Venom ainda estiver iniciando)
app.get('/test', async(req,res) => {
  return res.status(200).json({success: true})
})

app.post('/send-message', async (req, res) => {
  if (!clientGlobal) return res.status(503).json({ error: 'Venom ainda está iniciando' });

  const { phone, message } = req.body;
  if (!phone || !message) return res.status(400).json({ error: 'phone e message são obrigatórios' });

  try {
    const fullPhone = phone.endsWith('@c.us') ? phone : `${phone}@c.us`;
    const response = await clientGlobal.sendText(fullPhone, message);
    res.status(200).json({ success: true, response });
  } catch (err) {
    console.error('Erro ao enviar mensagem:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/send-file', async (req, res) => {
  if (!clientGlobal) return res.status(503).json({ error: 'Venom ainda está iniciando' });

  const { phone, caption, fileBase64, filename } = req.body;
  if (!phone || !fileBase64 || !filename)
    return res.status(400).json({ error: 'phone, fileBase64 e filename são obrigatórios' });

  try {
    const buffer = Buffer.from(fileBase64, 'base64');
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, buffer);
    await clientGlobal.sendFile(`${phone}@c.us`, filePath, filename, caption);
    fs.unlinkSync(filePath);

    res.status(200).json({ success: true, message: 'Arquivo enviado com sucesso!' });
  } catch (err) {
    console.error('Erro ao enviar arquivo:', err);
    res.status(500).json({ error: err.message });
  }
});
