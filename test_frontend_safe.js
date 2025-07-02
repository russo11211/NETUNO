// Teste para simular a função safeNumber e verificar se resolve o erro
function safeNumber(value, defaultValue = 0) {
  if (value === null || value === undefined || value === '') return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

// Simular dados problemáticos que podem causar o erro
const problematicData = [
  { valueUSD: null, valueSOL: undefined },
  { valueUSD: '', valueSOL: 'invalid' },
  { valueUSD: 'abc', valueSOL: NaN },
  { valueUSD: undefined, valueSOL: null },
  { valueUSD: 123.45, valueSOL: 0.5 }, // Dados válidos
];

console.log('Testando função safeNumber com dados problemáticos...\n');

problematicData.forEach((data, i) => {
  console.log(`Teste ${i + 1}:`);
  console.log(`  Input: valueUSD=${data.valueUSD}, valueSOL=${data.valueSOL}`);
  
  try {
    // Simular a lógica do componente
    let valueUSD = safeNumber(data.valueUSD, null);
    if (valueUSD === null) {
      valueUSD = safeNumber(data.valueSOL, null); // Fallback para SOL se disponível
    }
    
    const valueSOL = safeNumber(data.valueSOL, null);
    
    if (valueUSD === null || typeof valueUSD !== 'number') {
      console.log('  Result: "-" (valor inválido)');
    } else {
      console.log(`  USD: $${valueUSD.toFixed(4)}`);
      const solValue = (valueSOL !== null && typeof valueSOL === 'number') ? valueSOL : valueUSD / 219.5;
      console.log(`  SOL: ${solValue.toFixed(6)} SOL`);
    }
    
    // Testar fees
    const feeUSD = safeNumber(data.valueUSD, 0);
    const feeSOL = safeNumber(data.valueSOL, 0);
    
    console.log(`  Fee USD: $${(typeof feeUSD === 'number' ? feeUSD : 0).toFixed(4)}`);
    console.log(`  Fee SOL: ${(typeof feeSOL === 'number' ? feeSOL : 0).toFixed(6)} SOL`);
    
    console.log('  ✅ Teste passou sem erro');
    
  } catch (error) {
    console.log(`  ❌ Erro: ${error.message}`);
  }
  
  console.log('');
});

console.log('Todos os testes completados. Se não houve erros, a correção está funcionando.');