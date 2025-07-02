const fetch = require('node-fetch');

// Fonte oficial da lista de pools Orca (contém LP mints)
const ORCA_POOLS_URL = 'https://api.orca.so/v1/pools';

// LP mints conhecidos do Orca como fallback
const KNOWN_ORCA_LP_MINTS = [
  '2uVjAuRXavpM6h1scGQaxqb6HVaNRn6T2X7HHXTabz25', // SOL/USDC
  'EGZ7tiLeH62TPV1gL8WwbXGzEPa9zmcpVnnkPKKnrE2U', // ETH/SOL
  'APDFRM3HMr8CAGXwKHiu2f5ePSpaiEJhaURwhsRrUUt9', // mSOL/SOL
  'ApjZWNGRLiTbPq7HNFjHUVhC9jgJ69LrHdKdR4jxdmQH', // stSOL/SOL
];

/**
 * Busca a lista de LP mint addresses do Orca
 * @returns {Promise<string[]>}
 */
async function fetchOrcaLpMints() {
  try {
    const res = await fetch(ORCA_POOLS_URL, { timeout: 10000 });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.pools) {
      return Object.values(data.pools).map(pool => pool.lpMint);
    }
    throw new Error('Invalid response format');
  } catch (error) {
    console.warn('Orca API error, using fallback:', error.message);
    return KNOWN_ORCA_LP_MINTS;
  }
}

/**
 * Busca todos os pools Orca com dados completos
 * @returns {Promise<Array>}
 */
async function fetchOrcaPools() {
  try {
    const res = await fetch(ORCA_POOLS_URL, { timeout: 10000 });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.pools) {
      return Object.values(data.pools);
    }
    throw new Error('Invalid response format');
  } catch (error) {
    console.warn('Orca API error, using fallback pools:', error.message);
    return KNOWN_ORCA_LP_MINTS.map(mint => ({
      lpMint: mint,
      name: `Orca Pool ${mint.slice(0, 8)}`,
      tokenAMint: 'So11111111111111111111111111111111111111112', // SOL
      tokenBMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    }));
  }
}

module.exports = { fetchOrcaLpMints, fetchOrcaPools }; 