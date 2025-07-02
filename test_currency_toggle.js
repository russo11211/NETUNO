// Teste para verificar funcionalidade do toggle USD/SOL
const fetch = require('node-fetch');

async function testCurrencyToggle() {
  console.log('Testando funcionalidade do toggle USD/SOL...\n');
  
  try {
    // 1. Buscar dados das posições
    const response = await fetch('http://localhost:4000/lp-positions?address=ANoP4oDmG3pNCrTkS49bjCbbMK5mxAwdST8wBLKD5wsa');
    const data = await response.json();
    
    console.log(`Total de posições encontradas: ${data.lpPositions.length}\n`);
    
    // 2. Simular exibição em USD
    console.log('=== EXIBIÇÃO EM USD ===');
    data.lpPositions.forEach((position, i) => {
      console.log(`${i + 1}. ${position.positionData.poolName}`);
      console.log(`   Token A: ${position.positionData.tokenASymbol || 'N/A'}`);
      console.log(`   Token B: ${position.positionData.tokenBSymbol || 'N/A'}`);
      console.log(`   Valor: $${Number(position.positionData.valueUSD).toFixed(4)}`);
      console.log(`   Fees coletadas: $${Number(position.positionData.collectedFeeUSD || 0).toFixed(4)}`);
      console.log(`   Fees não coletadas: $${Number(position.positionData.uncolFeeUSD || 0).toFixed(4)}`);
      console.log(`   uPnL: $${Number(position.positionData.upnlValueUSD || 0).toFixed(4)}`);
      console.log('');
    });
    
    // 3. Simular exibição em SOL
    console.log('=== EXIBIÇÃO EM SOL ===');
    data.lpPositions.forEach((position, i) => {
      console.log(`${i + 1}. ${position.positionData.poolName}`);
      console.log(`   Token A: ${position.positionData.tokenASymbol || 'N/A'}`);
      console.log(`   Token B: ${position.positionData.tokenBSymbol || 'N/A'}`);
      console.log(`   Valor: ${Number(position.positionData.valueSOL).toFixed(6)} SOL`);
      console.log(`   Fees coletadas: ${Number(position.positionData.collectedFeeSOL || 0).toFixed(6)} SOL`);
      console.log(`   Fees não coletadas: ${Number(position.positionData.uncolFeeSOL || 0).toFixed(6)} SOL`);
      console.log(`   uPnL: ${Number(position.positionData.upnlValueSOL || 0).toFixed(6)} SOL`);
      console.log('');
    });
    
    // 4. Verificar se valores estão sendo calculados corretamente
    console.log('=== VERIFICAÇÃO DE CONSISTÊNCIA ===');
    const solPrice = 219.5; // Preço usado no backend
    
    data.lpPositions.forEach((position, i) => {
      const valueUSD = Number(position.positionData.valueUSD);
      const valueSOL = Number(position.positionData.valueSOL);
      const calculatedSOL = valueUSD / solPrice;
      
      console.log(`${i + 1}. ${position.positionData.poolName}`);
      console.log(`   USD: $${valueUSD.toFixed(4)}`);
      console.log(`   SOL real: ${valueSOL.toFixed(6)} SOL`);
      console.log(`   SOL calculado: ${calculatedSOL.toFixed(6)} SOL`);
      console.log(`   Diferença: ${Math.abs(valueSOL - calculatedSOL).toFixed(6)} SOL`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Erro no teste:', error.message);
  }
}

testCurrencyToggle();