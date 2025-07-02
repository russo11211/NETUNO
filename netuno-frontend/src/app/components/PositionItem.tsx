'use client';
import React, { useEffect, useState } from 'react';
import { Box, Text, Badge, Stack, Spinner } from '@chakra-ui/react';

interface Pool {
  name?: string;
  pool_name?: string;
  baseMint?: string;
  token_a_mint?: string;
  token_a?: string;
  quoteMint?: string;
  token_b_mint?: string;
  token_b?: string;
  baseReserve?: number | string;
  reserve_a?: number | string;
  reserve0?: number | string;
  quoteReserve?: number | string;
  reserve_b?: number | string;
  reserve1?: number | string;
  lpSupply?: number | string;
  lp_total_supply?: number | string;
  lp_supply?: number | string;
}

interface Position {
  mint: string;
  protocol: string;
  amount: string;
  pool?: Pool;
  valueUSD?: number;
}

interface PositionItemProps {
  position: Position;
  showUSD: boolean;
}

const PositionItem: React.FC<PositionItemProps> = ({ position, showUSD }) => {
  const { mint, protocol, amount, pool } = position;
  const poolName = pool?.name || pool?.pool_name || 'Pool';
  const tokenA = pool?.baseMint || pool?.token_a_mint || pool?.token_a || '';
  const tokenB = pool?.quoteMint || pool?.token_b_mint || pool?.token_b || '';
  const reserveA = pool?.baseReserve || pool?.reserve_a || pool?.reserve0 || 0;
  const reserveB = pool?.quoteReserve || pool?.reserve_b || pool?.reserve1 || 0;
  const totalLp = pool?.lpSupply || pool?.lp_total_supply || pool?.lp_supply || 0;

  const [priceA, setPriceA] = useState<number|null>(null);
  const [priceB, setPriceB] = useState<number|null>(null);
  const [priceSOL, setPriceSOL] = useState<number|null>(null);
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState<string>('—');

  // Busca preços dos tokens do pool
  useEffect(() => {
    let cancelled = false;
    async function fetchPrices() {
      setLoading(true);
      try {
        const [resA, resB, resSOL] = await Promise.all([
          fetch(`/price?symbol=${tokenA}`).then(r => r.json()),
          fetch(`/price?symbol=${tokenB}`).then(r => r.json()),
          fetch(`/price?symbol=SOL`).then(r => r.json()),
        ]);
        if (cancelled) return;
        setPriceA(resA.price || null);
        setPriceB(resB.price || null);
        setPriceSOL(resSOL.price || null);
      } catch {
        if (!cancelled) {
          setPriceA(null); setPriceB(null); setPriceSOL(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchPrices();
    return () => { cancelled = true; };
  }, [tokenA, tokenB]);

  // Calcula valor estimado da posição
  useEffect(() => {
    if (!priceA || !priceB || !amount || !totalLp) { setValue('—'); return; }
    const userLp = parseFloat(amount);
    const totalLpNum = parseFloat(String(totalLp));
    const reserveANum = parseFloat(String(reserveA));
    const reserveBNum = parseFloat(String(reserveB));
    if (!userLp || !totalLpNum || (!reserveANum && !reserveBNum)) { setValue('—'); return; }
    // Valor total do pool em USD
    const poolValueUSD = (reserveANum * priceA) + (reserveBNum * priceB);
    // Valor da posição do usuário em USD
    const userValueUSD = (userLp / totalLpNum) * poolValueUSD;
    if (showUSD) {
      setValue(userValueUSD.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }));
    } else if (priceSOL) {
      setValue((userValueUSD / priceSOL).toLocaleString('en-US', { maximumFractionDigits: 4 }) + ' SOL');
    } else {
      setValue('—');
    }
  }, [priceA, priceB, priceSOL, amount, totalLp, reserveA, reserveB, showUSD]);

  return (
    <Box borderWidth={1} borderRadius="md" p={4} boxShadow="sm" bg="white">
      <Stack direction="row" justify="space-between" w="100%">
        <Stack gap={1}>
          <Text fontWeight="bold">{poolName}</Text>
          <Stack direction="row" gap={2}>
            <Badge colorScheme="purple">{protocol}</Badge>
            <Badge>
              {mint && mint.length >= 8
                ? `${mint.slice(0, 4)}...${mint.slice(-4)}`
                : mint || '—'}
            </Badge>
          </Stack>
          <Text fontSize="sm" color="gray.600">Tokens: {tokenA} / {tokenB}</Text>
        </Stack>
        <Stack align="flex-end" gap={1}>
          <Text fontSize="lg" fontWeight="bold">{amount !== undefined && amount !== null ? amount : '—'}</Text>
          <Text fontSize="sm" color="gray.500">LP Tokens</Text>
          {loading ? <Spinner size="sm" /> : <Text fontSize="md" color="teal.600">{value !== undefined && value !== null ? value : '—'}</Text>}
        </Stack>
      </Stack>
    </Box>
  );
};

export default PositionItem; 