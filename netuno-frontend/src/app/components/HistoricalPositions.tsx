'use client';
import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Heading, 
  Spinner, 
  Stack, 
  Text,
  Alert,
  SimpleGrid
} from '@chakra-ui/react';

interface History {
  id?: string;
  protocol: string;
  mint: string;
  closeDate?: string;
  initialValue?: number;
  finalValue?: number;
  totalFees?: number;
}

const HistoricalPositions: React.FC<{ address: string }> = ({ address }) => {
  const [history, setHistory] = useState<History[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    setError(null);
    fetch(`/lp-history?address=${address}`)
      .then(res => res.json())
      .then(data => {
        setHistory(data.history || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Erro ao buscar histórico de posições.');
        setLoading(false);
      });
  }, [address]);

  return (
    <Box p={4} borderWidth={1} borderRadius="md" boxShadow="md" maxW="3xl" mx="auto" mt={8}>
      <Stack gap={4}>
        <Heading size="md">Histórico de Posições Fechadas</Heading>
        {loading && <Spinner />}
        {error && <Alert status="error">{error}</Alert>}
        {!loading && !error && (
          history.length > 0 ? (
            <Stack gap={3}>
              {history.map((snap, idx) => (
                <Box key={snap.id || idx} p={4} borderWidth={1} borderRadius="md" bg="gray.50">
                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={2}>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Protocolo</Text>
                      <Text fontWeight="medium">{snap.protocol}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Mint</Text>
                      <Text fontWeight="medium">{snap.mint.slice(0, 4)}...{snap.mint.slice(-4)}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Data Fechamento</Text>
                      <Text fontWeight="medium">{snap.closeDate ? new Date(snap.closeDate).toLocaleString() : '-'}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Valor Inicial</Text>
                      <Text fontWeight="medium">{snap.initialValue != null ? snap.initialValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '-'}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Valor Final</Text>
                      <Text fontWeight="medium">{snap.finalValue != null ? snap.finalValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '-'}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Fees</Text>
                      <Text fontWeight="medium">{snap.totalFees != null ? snap.totalFees.toLocaleString('en-US', { style: 'currency', currency: 'USD', signDisplay: 'always' }) : '-'}</Text>
                    </Box>
                  </SimpleGrid>
                </Box>
              ))}
            </Stack>
          ) : (
            <Text>Nenhuma posição fechada encontrada.</Text>
          )
        )}
      </Stack>
    </Box>
  );
};

export default HistoricalPositions; 