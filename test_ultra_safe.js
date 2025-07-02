// Teste ultra-robusto para garantir que safeToFixed nunca falha
function safeToFixed(value, decimals = 2, prefix = '', suffix = '') {
  try {
    // Múltiplas camadas de validação
    if (value === null || value === undefined || value === '' || value === 'undefined' || value === 'null') {
      return prefix + '0.' + '0'.repeat(decimals) + suffix;
    }
    
    let num;
    if (typeof value === 'string') {
      num = parseFloat(value);
    } else if (typeof value === 'number') {
      num = value;
    } else {
      num = Number(value);
    }
    
    // Verificar se é um número válido
    if (isNaN(num) || !isFinite(num)) {
      return prefix + '0.' + '0'.repeat(decimals) + suffix;
    }
    
    // Garantir que toFixed não vai falhar
    return prefix + num.toFixed(decimals) + suffix;
  } catch (error) {
    // Fallback extremo em caso de qualquer erro
    return prefix + '0.' + '0'.repeat(decimals) + suffix;
  }
}

// Testar com todos os tipos de valores problemáticos
const testValues = [
  null,
  undefined,
  '',
  'null',
  'undefined',
  'abc',
  NaN,
  Infinity,
  -Infinity,
  {},
  [],
  function() {},
  Symbol('test'),
  true,
  false,
  '123.45',
  123.45,
  0,
  -123.45,
  '0.000001',
  1e-10,
  1e10
];

console.log('Testando safeToFixed com valores extremos...\n');

testValues.forEach((value, i) => {
  console.log(`Teste ${i + 1}: ${typeof value === 'string' ? `"${value}"` : value}`);
  
  try {
    const result1 = safeToFixed(value, 4, '$', '');
    const result2 = safeToFixed(value, 6, '', ' SOL');
    const result3 = safeToFixed(value, 2, '', '%');
    
    console.log(`  USD: ${result1}`);
    console.log(`  SOL: ${result2}`);
    console.log(`  APY: ${result3}`);
    console.log('  ✅ Passou sem erro');
  } catch (error) {
    console.log(`  ❌ ERRO: ${error.message}`);
  }
  console.log('');
});

console.log('Teste completo. Se não houve erros, a função está ultra-robusta.');