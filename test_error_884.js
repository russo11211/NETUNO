// Teste específico para reproduzir e resolver o erro na linha 884
const fetch = require('node-fetch');

// Reproduzir as funções exatamente como estão no código
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

async function testLine884() {
  console.log('Teste específico para erro linha 884...\n');
  
  try {
    // Buscar dados reais da API
    const response = await fetch('http://localhost:4000/lp-positions?address=ANoP4oDmG3pNCrTkS49bjCbbMK5mxAwdST8wBLKD5wsa');
    const data = await response.json();
    
    console.log(`Testando com ${data.lpPositions.length} posições...\n`);
    
    const showUSD = true;
    const solPrice = 219.5;
    
    // Simular exatamente o que acontece no map() das posições
    data.lpPositions.map((position, index) => {
      console.log(`Posição ${index + 1}: ${position.positionData?.poolName}`);
      
      try {
        // Teste 1: Value section (principal suspeito)
        console.log('  Testando Value section...');
        const valueUSD = position.valueUSD || position.positionData?.valueUSD;
        const valueSOL = position.positionData?.valueSOL;
        
        let result1;
        if (showUSD) {
          result1 = safeToFixed(valueUSD, 4, '$', '');
        } else {
          let solValue = 0;
          if (valueSOL && typeof valueSOL === 'number') {
            solValue = valueSOL;
          } else {
            const safeUSD = safeNumber(valueUSD, 0);
            solValue = safeUSD / solPrice;
          }
          result1 = safeToFixed(solValue, 6, '', ' SOL');
        }
        console.log(`    Value: ${result1}`);
        
        // Teste 2: Collected Fee
        console.log('  Testando Collected Fee...');
        const result2 = showUSD 
          ? safeToFixed(position.positionData?.collectedFeeUSD, 4, '$', '')
          : safeToFixed(position.positionData?.collectedFeeSOL, 6, '', ' SOL');
        console.log(`    Collected Fee: ${result2}`);
        
        // Teste 3: Uncollected Fee
        console.log('  Testando Uncollected Fee...');
        const result3 = showUSD 
          ? safeToFixed(position.positionData?.uncolFeeUSD, 4, '$', '')
          : safeToFixed(position.positionData?.uncolFeeSOL, 6, '', ' SOL');
        console.log(`    Uncollected Fee: ${result3}`);
        
        // Teste 4: uPnL (suspeito principal)
        console.log('  Testando uPnL...');
        const value = showUSD 
          ? position.positionData?.upnlValueUSD 
          : position.positionData?.upnlValueSOL;
        const num = safeNumber(value, 0);
        const sign = num >= 0 ? '+' : '';
        const absValue = Math.abs(num);
        
        const result4 = showUSD 
          ? `${sign}${safeToFixed(absValue, 4, '$', '')}`
          : `${sign}${safeToFixed(absValue, 6, '', ' SOL')}`;
        console.log(`    uPnL: ${result4}`);
        
        // Teste 5: APY
        console.log('  Testando APY...');
        const apy = position.positionData?.apy || position.pool?.apy;
        const result5 = apy ? safeToFixed(apy, 2, '', '%') : '-';
        console.log(`    APY: ${result5}`);
        
        // Teste 6: Color calculation
        console.log('  Testando Color calculation...');
        const apyForColor = safeNumber(position.positionData?.apy || position.pool?.apy, 0);
        const color = apyForColor > 5 ? '#10b981' : '#6b7280';
        console.log(`    Color: ${color} (APY: ${apyForColor})`);
        
        console.log('    ✅ Posição processada sem erro');
        
      } catch (error) {
        console.log(`    ❌ ERRO na posição ${index + 1}: ${error.message}`);
        console.log(`    Stack: ${error.stack}`);
      }
      
      console.log('');
    });
    
    console.log('✅ Teste linha 884 completado!');
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
  }
}

testLine884();