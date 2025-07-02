"use client";
import React, { useMemo, useState } from 'react';
import { Button, Box, Text, Stack } from '@chakra-ui/react';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import {
  WalletModalProvider,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl, PublicKey } from '@solana/web3.js';
import WalletAddressInput from './WalletAddressInput';

interface WalletConnectionProps {
  onAddressSubmit?: (address: string) => void;
}

const WalletConnection: React.FC<WalletConnectionProps> = ({ onAddressSubmit }) => {
  // Estado do endereço de carteira Solana (pronto para ser elevado ou integrado a outros fluxos)
  const [manualAddress, setManualAddress] = useState('');
  // Estado de erro para feedback imediato ao usuário
  const [addressError, setAddressError] = useState<string | null>(null);
  // Estado do endereço submetido (pode ser usado para integração com backend ou automações)
  const [submittedAddress, setSubmittedAddress] = useState('');
  const [manualMode, setManualMode] = useState(false);

  // Configuração dos wallets
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  const endpoint = useMemo(() => clusterApiUrl('mainnet-beta'), []);

  const validateSolanaAddress = (address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  };

  // Novo: validação em tempo real
  const isValid = manualAddress.length > 0 && validateSolanaAddress(manualAddress);

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualAddress(e.target.value);
    if (e.target.value.length === 0) {
      setAddressError(null);
    } else if (!validateSolanaAddress(e.target.value)) {
      setAddressError('Endereço Solana inválido. Por favor, insira um endereço válido.');
    } else {
      setAddressError(null);
    }
  };

  // Callback para integração futura (ex: enviar endereço para backend, atualizar contexto global, etc)
  const handleAddressSubmit = (address: string) => {
    setSubmittedAddress(address);
    if (onAddressSubmit) onAddressSubmit(address);
    
    // Navigate to the app page with the wallet address
    window.location.href = `/app?address=${encodeURIComponent(address)}`;
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setAddressError('Endereço Solana inválido. Por favor, insira um endereço válido.');
      return;
    }
    setAddressError(null);
    handleAddressSubmit(manualAddress);
  };

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Box p={6} borderWidth={1} borderRadius="lg" boxShadow="lg" maxW="md" mx="auto" bg="white">
            <Stack gap={4}>
              <Text fontSize="xl" fontWeight="bold" color="gray.800" textAlign="center">
                Conectar Carteira Solana
              </Text>
              <WalletMultiButton />
              <Button onClick={() => setManualMode((v) => !v)} variant="outline" colorScheme="teal">
                {manualMode ? 'Usar Carteira' : 'Inserir Endereço Manualmente'}
              </Button>
              {manualMode && (
                <form onSubmit={handleManualSubmit}>
                  <Stack gap={2}>
                    <WalletAddressInput
                      value={manualAddress}
                      onChange={handleManualChange}
                      error={addressError || undefined}
                    />
                    <Button type="submit" colorScheme="teal" disabled={!isValid}>
                      Acompanhar Endereço
                    </Button>
                  </Stack>
                </form>
              )}
              {submittedAddress && (
                <Box p={3} bg="green.50" borderRadius="md" borderWidth={1} borderColor="green.200">
                  <Text fontSize="sm" color="green.700">Acompanhando endereço:</Text>
                  <Text fontWeight="bold" fontSize="sm" color="green.800" wordBreak="break-all">
                    {submittedAddress}
                  </Text>
                </Box>
              )}
            </Stack>
          </Box>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default WalletConnection; 