'use client';
import React from 'react';
import { Box, Text, Badge, HStack, VStack, Flex } from '@chakra-ui/react';

interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  mint: string;
  userAmount: number;
  reserveAmount: number;
}

interface Position {
  mint: string;
  protocol: string;
  amount: string;
  pool?: {
    name?: string;
    bin_step?: number;
  };
  tokenInfo?: {
    tokenX: TokenInfo;
    tokenY: TokenInfo;
  };
  valueUSD?: number | null;
  tokenXValueUSD?: number | null;
  tokenYValueUSD?: number | null;
  lastPriceUpdate?: string;
}

interface EnhancedPositionCardProps {
  position: Position;
  showUSD: boolean;
}

const EnhancedPositionCard: React.FC<EnhancedPositionCardProps> = ({ position, showUSD }) => {
  const { mint, protocol, pool, tokenInfo, valueUSD, tokenXValueUSD, tokenYValueUSD } = position;

  // Mapa temporário para corrigir nomes dos tokens
  const getCorrectTokenSymbol = (symbol: string, mint: string) => {
    const tokenMap: Record<string, string> = {
      '1zJX5gRnjLgmTpq5sVwkq69mNDQkCemqoasyjaPW6jm': 'KLED',
      '8NNXWrWVctNw1UFeaBypffimTdcLCcD8XJzHvYsmgwpF': 'GOR',
      'DtR4D9FtVoTX2569gaL837ZgrB6wNjj6tkmnX9Rdk9B2': 'aura'
    };
    return tokenMap[mint] || symbol;
  };

  // Calcular proporções se não temos valores USD
  const getTokenProportions = () => {
    if (!tokenInfo) return null;

    const { tokenX, tokenY } = tokenInfo;
    const adjustedAmountX = tokenX.userAmount / Math.pow(10, tokenX.decimals);
    const adjustedAmountY = tokenY.userAmount / Math.pow(10, tokenY.decimals);

    // Se não temos preços USD, calcular proporção baseada em quantidade
    if (tokenXValueUSD === null || tokenYValueUSD === null || tokenXValueUSD === undefined || tokenYValueUSD === undefined) {
      const totalValue = adjustedAmountX + adjustedAmountY;
      if (totalValue === 0) return null;
      
      return {
        tokenX: {
          amount: adjustedAmountX,
          percentage: (adjustedAmountX / totalValue) * 100,
          valueUSD: null
        },
        tokenY: {
          amount: adjustedAmountY,
          percentage: (adjustedAmountY / totalValue) * 100,
          valueUSD: null
        }
      };
    }

    // Com preços USD
    const totalValueUSD = (tokenXValueUSD || 0) + (tokenYValueUSD || 0);
    return {
      tokenX: {
        amount: adjustedAmountX,
        percentage: totalValueUSD > 0 ? ((tokenXValueUSD || 0) / totalValueUSD) * 100 : 50,
        valueUSD: tokenXValueUSD
      },
      tokenY: {
        amount: adjustedAmountY,
        percentage: totalValueUSD > 0 ? ((tokenYValueUSD || 0) / totalValueUSD) * 100 : 50,
        valueUSD: tokenYValueUSD
      }
    };
  };

  const proportions = getTokenProportions();

  const formatAmount = (amount: number, decimals: number = 4) => {
    if (amount === 0) return '0';
    if (amount < 0.0001) return '<0.0001';
    if (amount > 1000000) return `${(amount / 1000000).toFixed(2)}M`;
    if (amount > 1000) return `${(amount / 1000).toFixed(2)}K`;
    return amount.toFixed(decimals);
  };

  const formatUSD = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A';
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  const getProtocolColor = (protocol: string) => {
    switch (protocol.toLowerCase()) {
      case 'meteora': return 'purple';
      case 'raydium': return 'blue';
      case 'orca': return 'teal';
      default: return 'gray';
    }
  };

  return (
    <Box 
      borderWidth={2} 
      borderRadius="lg" 
      p={6} 
      bg="white" 
      boxShadow="lg"
      borderColor={`${getProtocolColor(protocol)}.200`}
      _hover={{ 
        boxShadow: 'xl', 
        borderColor: `${getProtocolColor(protocol)}.300`,
        transform: 'translateY(-2px)'
      }}
      transition="all 0.2s"
    >
      {/* Header */}
      <Flex justify="space-between" align="flex-start" mb={4}>
        <VStack align="start" gap={2}>
          <HStack gap={2}>
            <Badge 
              colorScheme={getProtocolColor(protocol)} 
              fontSize="sm" 
              px={3} 
              py={1}
              borderRadius="full"
            >
              {protocol}
            </Badge>
            {pool?.bin_step && (
              <Badge variant="outline" fontSize="xs">
                Bin Step: {pool.bin_step}
              </Badge>
            )}
          </HStack>
          <Text fontSize="xl" fontWeight="bold" color="gray.800">
            {tokenInfo 
              ? `${getCorrectTokenSymbol(tokenInfo.tokenX.symbol, tokenInfo.tokenX.mint)}/${getCorrectTokenSymbol(tokenInfo.tokenY.symbol, tokenInfo.tokenY.mint)} DLMM`
              : (pool?.name || `${protocol} Pool`)
            }
          </Text>
        </VStack>
        
        <VStack align="end" gap={1}>
          <Text fontSize="2xl" fontWeight="bold" color="green.600">
            {valueUSD !== null && valueUSD !== undefined ? formatUSD(valueUSD) : 'Calculating...'}
          </Text>
          <Text fontSize="sm" color="gray.500">
            Total Value
          </Text>
        </VStack>
      </Flex>

      {/* Token Composition */}
      {tokenInfo && proportions && (
        <VStack gap={4} align="stretch">
          <Text fontSize="md" fontWeight="semibold" color="gray.700">
            Token Composition
          </Text>
          
          {/* Progress Bar */}
          <Box>
            <HStack justify="space-between" mb={2}>
              <Text fontSize="sm" color="gray.600">
                {getCorrectTokenSymbol(tokenInfo.tokenX.symbol, tokenInfo.tokenX.mint)} / {getCorrectTokenSymbol(tokenInfo.tokenY.symbol, tokenInfo.tokenY.mint)}
              </Text>
              <Text fontSize="sm" color="gray.600">
                {proportions.tokenX.percentage.toFixed(1)}% / {proportions.tokenY.percentage.toFixed(1)}%
              </Text>
            </HStack>
            <Box w="full" bg="purple.100" borderRadius="full" h={3}>
              <Box 
                w={`${proportions.tokenX.percentage}%`} 
                h="full" 
                bg="blue.500" 
                borderRadius="full"
              />
            </Box>
          </Box>

          {/* Token Details */}
          <HStack gap={4}>
            {/* Token X */}
            <Box flex={1} p={3} bg="blue.50" borderRadius="md" borderWidth={1} borderColor="blue.200">
              <VStack gap={1} align="start">
                <HStack>
                  <Text fontSize="sm" fontWeight="bold" color="blue.800">
                    {getCorrectTokenSymbol(tokenInfo.tokenX.symbol, tokenInfo.tokenX.mint)}
                  </Text>
                  <Badge size="sm" variant="subtle" colorScheme="blue">
                    {proportions.tokenX.percentage.toFixed(1)}%
                  </Badge>
                </HStack>
                <Text fontSize="lg" fontWeight="semibold" color="blue.700">
                  {formatAmount(proportions.tokenX.amount)}
                </Text>
                <Text fontSize="sm" color="blue.600">
                  {proportions.tokenX.valueUSD !== null && proportions.tokenX.valueUSD !== undefined
                    ? formatUSD(proportions.tokenX.valueUSD)
                    : 'Price pending...'
                  }
                </Text>
              </VStack>
            </Box>

            {/* Token Y */}
            <Box flex={1} p={3} bg="purple.50" borderRadius="md" borderWidth={1} borderColor="purple.200">
              <VStack gap={1} align="start">
                <HStack>
                  <Text fontSize="sm" fontWeight="bold" color="purple.800">
                    {getCorrectTokenSymbol(tokenInfo.tokenY.symbol, tokenInfo.tokenY.mint)}
                  </Text>
                  <Badge size="sm" variant="subtle" colorScheme="purple">
                    {proportions.tokenY.percentage.toFixed(1)}%
                  </Badge>
                </HStack>
                <Text fontSize="lg" fontWeight="semibold" color="purple.700">
                  {formatAmount(proportions.tokenY.amount)}
                </Text>
                <Text fontSize="sm" color="purple.600">
                  {proportions.tokenY.valueUSD !== null && proportions.tokenY.valueUSD !== undefined
                    ? formatUSD(proportions.tokenY.valueUSD)
                    : 'Price pending...'
                  }
                </Text>
              </VStack>
            </Box>
          </HStack>

          {/* Additional Info */}
          <HStack justify="space-between" pt={2} borderTop="1px" borderColor="gray.200">
            <VStack align="start" gap={0}>
              <Text fontSize="xs" color="gray.500">LP Token Address</Text>
              <Text fontSize="sm" fontFamily="mono" color="gray.700" title={mint}>
                {mint.slice(0, 8)}...{mint.slice(-8)}
              </Text>
            </VStack>
            <VStack align="end" gap={0}>
              <Text fontSize="xs" color="gray.500">Last Updated</Text>
              <Text fontSize="sm" color="gray.700">
                {position.lastPriceUpdate ? new Date(position.lastPriceUpdate).toLocaleTimeString() : 'Unknown'}
              </Text>
            </VStack>
          </HStack>
        </VStack>
      )}

      {/* Fallback for positions without tokenInfo */}
      {!tokenInfo && (
        <VStack gap={2} align="stretch">
          <Text fontSize="md" color="gray.600">
            LP Amount: {position.amount}
          </Text>
          <Text fontSize="sm" color="gray.500">
            Detailed composition data not available
          </Text>
        </VStack>
      )}
    </Box>
  );
};

export default EnhancedPositionCard;