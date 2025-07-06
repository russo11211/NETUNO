'use client';
import React from 'react';

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

interface SimplePositionCardProps {
  position: Position;
  showUSD: boolean;
}

const SimplePositionCard: React.FC<SimplePositionCardProps> = ({ position, showUSD }) => {
  const { mint, protocol, pool, tokenInfo, valueUSD, tokenXValueUSD, tokenYValueUSD } = position;

  // Corrigir nomes dos tokens
  const getCorrectTokenSymbol = (symbol: string, mint: string) => {
    const tokenMap: Record<string, string> = {
      '1zJX5gRnjLgmTpq5sVwkq69mNDQkCemqoasyjaPW6jm': 'KLED',
      '8NNXWrWVctNw1UFeaBypffimTdcLCcD8XJzHvYsmgwpF': 'GOR',
      'DtR4D9FtVoTX2569gaL837ZgrB6wNjj6tkmnX9Rdk9B2': 'aura'
    };
    return tokenMap[mint] || symbol;
  };

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
      case 'meteora': return '#9333ea'; // purple
      case 'raydium': return '#3b82f6'; // blue
      case 'orca': return '#14b8a6'; // teal
      default: return '#6b7280'; // gray
    }
  };

  // Calcular proporções
  let proportions = null;
  if (tokenInfo) {
    const { tokenX, tokenY } = tokenInfo;
    const adjustedAmountX = tokenX.userAmount / Math.pow(10, tokenX.decimals); // Converter de wei
    const adjustedAmountY = tokenY.userAmount / Math.pow(10, tokenY.decimals); // Converter de wei

    if (tokenXValueUSD !== null && tokenYValueUSD !== null && tokenXValueUSD !== undefined && tokenYValueUSD !== undefined) {
      const totalValueUSD = (tokenXValueUSD || 0) + (tokenYValueUSD || 0);
      proportions = {
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
    } else {
      const totalValue = adjustedAmountX + adjustedAmountY;
      if (totalValue > 0) {
        proportions = {
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
    }
  }

  const cardStyle: React.CSSProperties = {
    borderWidth: '2px',
    borderRadius: '12px',
    padding: '24px',
    backgroundColor: 'white',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    borderColor: getProtocolColor(protocol) + '33',
    transition: 'all 0.2s',
    marginBottom: '16px'
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  };

  const badgeStyle: React.CSSProperties = {
    backgroundColor: getProtocolColor(protocol),
    color: 'white',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    marginBottom: '8px'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#374151',
    margin: 0
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#10b981',
    margin: 0
  };

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <div style={badgeStyle}>
            {protocol}
            {pool?.bin_step && ` - Bin Step: ${pool.bin_step}`}
          </div>
          <h3 style={titleStyle}>
            {tokenInfo 
              ? `${getCorrectTokenSymbol(tokenInfo.tokenX.symbol, tokenInfo.tokenX.mint)}/${getCorrectTokenSymbol(tokenInfo.tokenY.symbol, tokenInfo.tokenY.mint)} DLMM`
              : (pool?.name || `${protocol} Pool`)
            }
          </h3>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div style={valueStyle}>
            {valueUSD !== null && valueUSD !== undefined ? formatUSD(valueUSD) : 'Calculating...'}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Total Value
          </div>
        </div>
      </div>

      {/* Token Composition */}
      {tokenInfo && proportions && (
        <div style={{ marginTop: '16px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
            Token Composition
          </h4>
          
          {/* Progress Bar */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#6b7280' }}>
              <span>{getCorrectTokenSymbol(tokenInfo.tokenX.symbol, tokenInfo.tokenX.mint)} / {getCorrectTokenSymbol(tokenInfo.tokenY.symbol, tokenInfo.tokenY.mint)}</span>
              <span>{proportions.tokenX.percentage.toFixed(1)}% / {proportions.tokenY.percentage.toFixed(1)}%</span>
            </div>
            <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '9999px', height: '12px' }}>
              <div 
                style={{ 
                  width: `${proportions.tokenX.percentage}%`, 
                  height: '100%', 
                  backgroundColor: '#3b82f6', 
                  borderRadius: '9999px' 
                }}
              />
            </div>
          </div>

          {/* Token Details */}
          <div style={{ display: 'flex', gap: '16px' }}>
            {/* Token X */}
            <div style={{ flex: 1, padding: '12px', backgroundColor: '#dbeafe', borderRadius: '8px', border: '1px solid #93c5fd' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e40af' }}>
                  {getCorrectTokenSymbol(tokenInfo.tokenX.symbol, tokenInfo.tokenX.mint)}
                </span>
                <span style={{ fontSize: '12px', backgroundColor: '#3b82f6', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>
                  {proportions.tokenX.percentage.toFixed(1)}%
                </span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#1e40af', marginBottom: '4px' }}>
                {formatAmount(proportions.tokenX.amount)}
              </div>
              <div style={{ fontSize: '14px', color: '#1e40af' }}>
                {proportions.tokenX.valueUSD !== null && proportions.tokenX.valueUSD !== undefined
                  ? formatUSD(proportions.tokenX.valueUSD)
                  : 'Price pending...'
                }
              </div>
            </div>

            {/* Token Y */}
            <div style={{ flex: 1, padding: '12px', backgroundColor: '#faf5ff', borderRadius: '8px', border: '1px solid #c4b5fd' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#7c3aed' }}>
                  {getCorrectTokenSymbol(tokenInfo.tokenY.symbol, tokenInfo.tokenY.mint)}
                </span>
                <span style={{ fontSize: '12px', backgroundColor: '#7c3aed', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>
                  {proportions.tokenY.percentage.toFixed(1)}%
                </span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#7c3aed', marginBottom: '4px' }}>
                {formatAmount(proportions.tokenY.amount)}
              </div>
              <div style={{ fontSize: '14px', color: '#7c3aed' }}>
                {proportions.tokenY.valueUSD !== null && proportions.tokenY.valueUSD !== undefined
                  ? formatUSD(proportions.tokenY.valueUSD)
                  : 'Price pending...'
                }
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>LP Token Address</div>
              <div style={{ fontSize: '14px', fontFamily: 'monospace', color: '#374151' }} title={mint}>
                {mint.slice(0, 8)}...{mint.slice(-8)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Last Updated</div>
              <div style={{ fontSize: '14px', color: '#374151' }}>
                {position.lastPriceUpdate ? new Date(position.lastPriceUpdate).toLocaleTimeString() : 'Unknown'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fallback for positions without tokenInfo */}
      {!tokenInfo && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '16px', color: '#6b7280', marginBottom: '8px' }}>
            LP Amount: {position.amount}
          </div>
          <div style={{ fontSize: '14px', color: '#9ca3af' }}>
            Detailed composition data not available
          </div>
        </div>
      )}
    </div>
  );
};

export default SimplePositionCard;