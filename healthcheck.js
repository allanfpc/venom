const axios = require('axios');
const { exec } = require('child_process');

// === CONFIGURAÇÕES ===
const ENDPOINT_URL = 'http://ec2-3-141-4-115.us-east-2.compute.amazonaws.com:3000/send-message'; // seu endpoint POST
const TIMEOUT_MS = 5000; // tempo máximo de espera
const TEST_NUMBER = '000000000000'; // número fake para teste
const TEST_MESSAGE = 'healthcheck';
const PROCESS_NAME = 'venom-session';
let response;
// === FUNÇÃO PRINCIPAL ===
async function checkHealth() {
  try {
    const response = await axios.post(ENDPOINT_URL, {
      phone: TEST_NUMBER,
      message: TEST_MESSAGE
    }, {
      timeout: TIMEOUT_MS
    });

    if (response.status === 200) {
      console.log(`[✓] Venom OK: ${response.status}`);
    } else {
      console.warn(`[!] Resposta inesperada: ${response.status}`);
      restartProcess();
    }
  } catch (error) {
    console.error(`[✗] Erro detectado: ${error.message}`);
   
    if(error.response) {
     const {status, data} = error.response;
     if(status === 500 && typeof data == 'object' && Object.keys(data).length === 0) {
     return;
}
    }
    restartProcess();
  }
}

// === FUNÇÃO DE REINÍCIO ===
function restartProcess() {
  console.log(`[↻] Reiniciando processo "${PROCESS_NAME}" via PM2...`);
  exec(`pm2 restart ${PROCESS_NAME}`, (err, stdout, stderr) => {
    if (err) {
      console.error(`[!] Falha ao reiniciar: ${stderr}`);
    } else {
      console.log(`[✓] Processo reiniciado: ${stdout}`);
    }
  });
}

checkHealth();
