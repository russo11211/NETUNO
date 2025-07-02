const fetch = require('node-fetch');

// Fonte oficial da lista de pools Raydium (contém LP mints)
const RAYDIUM_POOLS_URL = 'https://api.raydium.io/v2/sdk/liquidity/mainnet.json';

/**
 * Busca a lista de LP mint addresses do Raydium
 * @returns {Promise<string[]>}
 */
async function fetchRaydiumLpMints() {
  const res = await fetch(RAYDIUM_POOLS_URL);
  if (!res.ok) throw new Error('Erro ao buscar pools Raydium');
  const data = await res.json();
  // data.pools é um array de objetos, cada um com .lpMint
  return data.pools.map(pool => pool.lpMint);
}

/**
 * Busca todos os pools Raydium com dados completos
 * @returns {Promise<Array>}
 */
async function fetchRaydiumPools() {
  const res = await fetch(RAYDIUM_POOLS_URL);
  if (!res.ok) throw new Error('Erro ao buscar pools Raydium');
  const data = await res.json();
  return data.pools;
}

module.exports = { fetchRaydiumLpMints, fetchRaydiumPools }; 