'use client';
import { Box, Stack, Heading } from "@chakra-ui/react";
import WalletConnection from "./components/WalletConnection";

export default function Home() {
  return (
    <Box minH="100vh" bg="gray.50" py={8}>
      <Stack gap={8} maxW="7xl" mx="auto" px={4}>
        <Box textAlign="center">
          <Heading size="2xl" color="blue.600" mb={2}>
            🌊 App Netuno
          </Heading>
          <Heading size="md" color="gray.600" fontWeight="normal">
            Dashboard DeFi para Liquidity Providers no Solana
          </Heading>
          <Box mt={4} p={4} bg="blue.50" borderRadius="lg" border="1px solid" borderColor="blue.200">
            <Stack gap={2} textAlign="left">
              <Heading size="sm" color="blue.800">
                ✨ Recursos do App Netuno:
              </Heading>
              <Box color="blue.700" fontSize="sm">
                <p>📊 <strong>Dashboard Completo:</strong> Visualize todas suas posições LP em tempo real</p>
                <p>🔍 <strong>Análise Detalhada:</strong> Métricas de performance, fees coletadas e histórico</p>
                <p>⚙️ <strong>Gerenciamento Avançado:</strong> Descubra novos pools e otimize investimentos</p>
                <p>🏊‍♂️ <strong>Multi-Protocolo:</strong> Suporte para Raydium, Orca, Meteora e mais</p>
              </Box>
            </Stack>
          </Box>
        </Box>
        
        <WalletConnection />
      </Stack>
    </Box>
  );
}
