// Teste simples para verificar se conseguimos iniciar o Next.js
const { exec } = require('child_process');

console.log('Tentando iniciar Next.js de forma simples...');

const nextProcess = exec('npx next dev --port 3000', {
  cwd: '/mnt/c/Users/caue9/NETUNO-APP/netuno-frontend'
});

nextProcess.stdout.on('data', (data) => {
  console.log('STDOUT:', data.toString());
});

nextProcess.stderr.on('data', (data) => {
  console.log('STDERR:', data.toString());
});

nextProcess.on('error', (error) => {
  console.log('ERROR:', error.message);
});

// Matar processo após 30 segundos
setTimeout(() => {
  console.log('Matando processo Next.js...');
  nextProcess.kill();
}, 30000);