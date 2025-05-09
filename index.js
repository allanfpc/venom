const venom = require('venom-bot');
const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const uploadDir = path.join(__dirname, 'uploads');  // Diretório de uploads temporários

app.use(express.json());

venom
  .create({
    session: 'loja',
    multidevice: true,
    headless: 'new',
    browserArgs: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--headless=new'
    ],
    sessionPath: '/tmp/venom_sessions', // <-- importante: sessão temporária
    browserPathExecutable: '/usr/bin/google-chrome-stable' // garante que pegue o Chrome instalado no Docker
  })
  .then((client) => start(client))
  .catch((erro) => {
    console.log(erro);
  });

function start(client) {

  app.post('/send-message', async (req, res) => {
   const { phone, message } = req.body;

   if (!phone || !message) {
     return res.status(400).json({ error: 'phone and message are required' });
   }

   try {
     const fullPhone = phone.endsWith('@c.us') ? phone : `${phone}@c.us`;
     const response = await client.sendText(fullPhone, message);
     res.status(200).json({ success: true, response });
   } catch (err) {
     console.error('Error sending message:', err);
     res.status(500).json({ success: false, error: err.message });
   }
  });

  // Rota para enviar arquivos (PDF/Base64)
app.post('/send-file', async (req, res) => {
  const {phone, caption, fileBase64, filename } = req.body;
  if (!phone || !fileBase64 || !filename) {
    return res.status(400).json({ error: 'phone, fileBase64 e filename são obrigatórios' });
  }

  try {
    // Decodifica a base64 para binário
    const buffer = Buffer.from(fileBase64, 'base64');

    // Cria o caminho temporário para salvar o arquivo
    const filePath = path.join(uploadDir, filename);

    // Escreve o arquivo temporário
    fs.writeFileSync(filePath, buffer);

    // Envia o arquivo para o WhatsApp
    await client.sendFile(`${phone}@c.us`, filePath, filename, caption);

    // Remove o arquivo temporário após o envio
    fs.unlinkSync(filePath);

    res.status(200).json({ success: true, message: 'Arquivo enviado com sucesso!' });
  } catch (err) {
    console.error('Erro ao enviar o arquivo para o número:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});
  // Inicia o servidor
  app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
  });
}
