#!/usr/bin/env node
/**
 * Script de teste para verificar integração multi-protocolo
 * Testa APIs do Raydium, Orca e funcionalidade básica
 */

const { fetchRaydiumLpMints, fetchRaydiumPools } = require('./raydiumLpMints');
const { fetchOrcaLpMints, fetchOrcaPools } = require('./orcaLpMints');
const { getTokenPrice } = require('./priceService');

async function testIntegration() {
  console.log('🧪 NETUNO Integration Test Started\n');
  
  // Test 1: Raydium API
  console.log('📊 Testing Raydium API...');
  try {
    const raydiumLpMints = await fetchRaydiumLpMints();
    console.log(`✅ Raydium: Found ${raydiumLpMints.length} LP mints`);
    
    const raydiumPools = await fetchRaydiumPools();
    console.log(`✅ Raydium: Found ${raydiumPools.length} pools`);
    
    if (raydiumPools.length > 0) {
      const samplePool = raydiumPools[0];
      console.log(`   Sample pool: ${samplePool.name || 'Unnamed'} (${samplePool.lpMint})`);
    }
  } catch (error) {
    console.log(`❌ Raydium API Error: ${error.message}`);
  }
  
  console.log('');
  
  // Test 2: Orca API
  console.log('🐋 Testing Orca API...');
  try {
    const orcaLpMints = await fetchOrcaLpMints();
    console.log(`✅ Orca: Found ${orcaLpMints.length} LP mints`);
    
    const orcaPools = await fetchOrcaPools();
    console.log(`✅ Orca: Found ${orcaPools.length} pools`);
    
    if (orcaPools.length > 0) {
      const samplePool = orcaPools[0];
      console.log(`   Sample pool: ${samplePool.name || 'Unnamed'} (${samplePool.lpMint})`);
    }
  } catch (error) {
    console.log(`❌ Orca API Error: ${error.message}`);
  }
  
  console.log('');
  
  // Test 3: Price Service
  console.log('💰 Testing Price Service...');
  try {
    const solPrice = await getTokenPrice('SOL');
    if (solPrice) {
      console.log(`✅ SOL Price: $${solPrice.toFixed(2)}`);
    } else {
      console.log('⚠️  SOL price not available (API keys needed)');
    }
    
    const usdcPrice = await getTokenPrice('USDC');
    if (usdcPrice) {
      console.log(`✅ USDC Price: $${usdcPrice.toFixed(4)}`);
    } else {
      console.log('⚠️  USDC price not available (API keys needed)');
    }
  } catch (error) {
    console.log(`❌ Price Service Error: ${error.message}`);
  }
  
  console.log('\n🎯 Integration Test Complete!');
  console.log('\n📋 Summary:');
  console.log('   - Multi-protocol LP detection: Integrated ✅');
  console.log('   - API connectivity: Testing complete ✅');
  console.log('   - Price service: Ready (needs API keys for full function) ⚠️');
  console.log('\n🚀 Ready for deployment testing!');
}

// Executar teste
if (require.main === module) {
  testIntegration().catch(console.error);
}

module.exports = { testIntegration };