const express = require('express');
const cors = require('cors');

console.log('🚀 Iniciando servidor mínimo...');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor mínimo rodando na porta ${PORT}`);
});