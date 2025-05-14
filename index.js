const QRCode = require('qrcode');
const venom = require('venom-bot');
const express = require('express');
const fs = require('fs');
const path = require('path');

const sessionName = 'loja';
const app = express();
app.use(express.json());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Diretório para arquivos estáticos (como o QR Code)
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
app.use(express.static(publicDir));

let clientGlobal = null;

const PORT = process.env.PORT || 3000;

venom
  .create({
    session: sessionName,
    catchQR: (base64Qrimg, asciiQR, attempts, urlCode) => {

        console.log(`[QR] Tentativa ${attempts}. Salvando QR...`);

        const qrPath = path.join(publicDir, 'qrcode.png');

        QRCode.toFile(qrPath, urlCode, {
          errorCorrectionLevel: 'H',
          width: 300,
        }, (err) => {
          if (err) {
            console.error('Erro ao salvar QR code:', err);
          } else {
            console.log('✅ QR code salvo em /qrcode.png');
            console.log('🌐 Acesse http://localhost:' + PORT + '/qr para escanear');
            console.log('⚠️ O QR expira em cerca de 60 segundos. Reinicie o script se precisar de um novo.');
          }
        });
    },
    multidevice: true,
    headless: 'new',
    disableSpins: true,
    disableWelcome: true,
    updatesLog: false,
    autoClose: 0,
    folderNameToken: 'tokens',
    browserArgs: ['--headless=new'],
    browserPathExecutable: '/usr/bin/google-chrome-stable',
  })
  .then((client) => {
    clientGlobal = client;
    console.log('✅ Venom iniciado com sucesso');
  });

// Rotas
app.get('/test', (req, res) => {
  return res.status(200).json({ success: true });
});

app.get('/qr', (req, res) => {
  const filePath = path.join(publicDir, 'qrcode.png');
  if (fs.existsSync(filePath)) {
    res.send(`
      <html>
        <head><title>QR Code</title></head>
        <body style="text-align:center; font-family:sans-serif;">
          <h1>Escaneie o QR Code</h1>
          <img src="/qrcode.png" style="width:300px; height:300px;" />
          <p>Abra o WhatsApp no celular, vá em "Dispositivos conectados" e escaneie o QR Code.</p>
        </body>
      </html>
    `);
  } else {
    res.send('<h2>QR Code ainda não gerado. Aguarde ou reinicie a sessão.</h2>');
  }
});

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

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
