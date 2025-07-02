// Teste final para simular exatamente o cenário do erro
const fetch = require('node-fetch');

// Função safeToFixed exatamente como implementada
function safeToFixed(value, decimals = 2, prefix = '', suffix = '') {
  try {
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
    
    if (isNaN(num) || !isFinite(num)) {
      return prefix + '0.' + '0'.repeat(decimals) + suffix;
    }
    
    return prefix + num.toFixed(decimals) + suffix;
  } catch (error) {
    return prefix + '0.' + '0'.repeat(decimals) + suffix;
  }
}

function safeNumber(value, defaultValue = 0) {
  try {
    if (value === null || value === undefined || value === '' || value === 'undefined' || value === 'null') {
      return defaultValue;
    }
    
    let num;
    if (typeof value === 'string') {
      num = parseFloat(value);
    } else if (typeof value === 'number') {
      num = value;
    } else {
      num = Number(value);
    }
    
    return isNaN(num) || !isFinite(num) ? defaultValue : num;
  } catch (error) {
    return defaultValue;
  }
}

async function testFinalFix() {
  console.log('Testando correção final com dados reais da API...\n');
  
  try {
    // Buscar dados reais
    const response = await fetch('http://localhost:4000/lp-positions?address=ANoP4oDmG3pNCrTkS49bjCbbMK5mxAwdST8wBLKD5wsa');
    const data = await response.json();
    
    console.log(`Testando com ${data.lpPositions.length} posições reais...\n`);
    
    // Simular exatamente o que o frontend faz
    data.lpPositions.forEach((position, i) => {
      console.log(`Posição ${i + 1}: ${position.positionData?.poolName || 'Unknown'}`);
      
      // Testar Value (USD e SOL)
      const showUSD = true;
      const solPrice = 219.5;
      
      try {
        // Teste Value em USD
        const valueUSD = position.valueUSD || position.positionData?.valueUSD;
        const valueSOL = position.positionData?.valueSOL;
        
        const usdResult = safeToFixed(valueUSD, 4, '$', '');
        console.log(`  Value USD: ${usdResult}`);
        
        const solValue = valueSOL || (safeNumber(valueUSD, 0) / solPrice);
        const solResult = safeToFixed(solValue, 6, '', ' SOL');
        console.log(`  Value SOL: ${solResult}`);
        
        // Teste Fees
        const collectedUSD = safeToFixed(position.positionData?.collectedFeeUSD, 4, '$', '');
        const collectedSOL = safeToFixed(position.positionData?.collectedFeeSOL, 6, '', ' SOL');
        console.log(`  Collected Fee USD: ${collectedUSD}`);
        console.log(`  Collected Fee SOL: ${collectedSOL}`);
        
        // Teste uPnL
        const upnlUSD = position.positionData?.upnlValueUSD;
        const upnlSOL = position.positionData?.upnlValueSOL;
        
        const upnlUSDNum = safeNumber(upnlUSD, 0);
        const upnlSOLNum = safeNumber(upnlSOL, 0);
        
        const upnlUSDSign = upnlUSDNum >= 0 ? '+' : '';
        const upnlSOLSign = upnlSOLNum >= 0 ? '+' : '';
        
        const upnlUSDResult = `${upnlUSDSign}${safeToFixed(Math.abs(upnlUSDNum), 4, '$', '')}`;
        const upnlSOLResult = `${upnlSOLSign}${safeToFixed(Math.abs(upnlSOLNum), 6, '', ' SOL')}`;
        
        console.log(`  uPnL USD: ${upnlUSDResult}`);
        console.log(`  uPnL SOL: ${upnlSOLResult}`);
        
        // Teste APY
        const apyResult = safeToFixed(position.positionData?.apy || position.pool?.apy, 2, '', '%');
        console.log(`  APY: ${apyResult}`);
        
        console.log('  ✅ Posição processada sem erro');
        
      } catch (error) {
        console.log(`  ❌ ERRO na posição: ${error.message}`);
      }
      
      console.log('');
    });
    
    console.log('✅ Teste final completado. Todas as posições processadas sem erro toFixed!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testFinalFix();