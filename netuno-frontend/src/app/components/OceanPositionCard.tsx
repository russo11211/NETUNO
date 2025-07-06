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

interface DeFiMetrics {
  // NOVAS MÉTRICAS DO USUÁRIO
  valorDepositado?: number | null;
  pnlTotal?: {
    value: number | null;
    percentage: number | null;
    since: string | null;
    initialValue: number | null;
    currentValue: number | null;
  };
  fees?: {
    coletadas: number | null;
    naoColetadas: number | null;
    totalAcumuladas: number | null;
    feeRate: number | null;
  };
  
  // MÉTRICAS EXISTENTES (corrigidas)
  impermanentLoss?: {
    value: number | null;
    percentage: number | null;
    hodlValue: number | null;
  };
  
  // METADADOS
  positionAge?: number;
  initialDate?: string | null;
  lastCalculated?: string;
  computeTime?: number;
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
  metrics?: DeFiMetrics;
}

interface OceanPositionCardProps {
  position: Position;
  showUSD: boolean;
}

const OceanPositionCard: React.FC<OceanPositionCardProps> = ({ position, showUSD }) => {
  const { mint, protocol, pool, tokenInfo, valueUSD, tokenXValueUSD, tokenYValueUSD, metrics } = position;

  // Token symbol correction
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

  const getProtocolGradient = (protocol: string) => {
    switch (protocol.toLowerCase()) {
      case 'meteora': 
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      case 'raydium': 
        return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
      case 'orca': 
        return 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
      default: 
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  };


  // Calculate token proportions
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

  // Ocean-themed styles
  const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #0f1419 0%, #1a365d 50%, #2c5aa0 100%)',
    border: '1px solid rgba(79, 209, 197, 0.3)',
    borderRadius: '20px',
    padding: '24px',
    margin: '16px 0',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
    backdropFilter: 'blur(10px)',
    position: 'relative',
    overflow: 'hidden',
    color: 'white'
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px'
  };

  const protocolBadgeStyle: React.CSSProperties = {
    background: getProtocolGradient(protocol),
    color: 'white',
    padding: '6px 16px',
    borderRadius: '25px',
    fontSize: '12px',
    fontWeight: 'bold',
    marginBottom: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#e2e8f0',
    margin: 0,
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#4fd1c7',
    margin: 0,
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
  };

  const metricsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '12px',
    marginBottom: '20px'
  };

  const metricCardStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '12px',
    backdropFilter: 'blur(5px)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  };

  return (
    <div style={cardStyle}>
      {/* Animated Ocean Background Effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 80%, rgba(79, 209, 197, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(64, 224, 255, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />
      
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <div style={protocolBadgeStyle}>
            {protocol}
            {pool?.bin_step && ` • Bin: ${pool.bin_step}`}
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
          <div style={{ fontSize: '14px', color: '#94a3b8' }}>
            Total Value
          </div>
        </div>
      </div>

      {/* User-Specific DeFi Metrics Grid */}
      {metrics && (
        <div style={metricsGridStyle}>
          {/* Valor Depositado - Nova métrica */}
          {metrics.valorDepositado !== null && metrics.valorDepositado !== undefined && (
            <div style={metricCardStyle}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Valor Depositado</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#60a5fa' }}>
                {formatUSD(metrics.valorDepositado)}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Inicial
              </div>
            </div>
          )}

          {/* P&L Total - Mudança de 24h para total */}
          {metrics.pnlTotal?.value !== null && metrics.pnlTotal?.value !== undefined && (
            <div style={metricCardStyle}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>P&L Total</div>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                color: (metrics.pnlTotal.value || 0) >= 0 ? '#10b981' : '#ef4444' 
              }}>
                {formatUSD(metrics.pnlTotal.value)}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                {metrics.pnlTotal.percentage?.toFixed(2)}% {metrics.pnlTotal.since ? 'desde início' : ''}
              </div>
            </div>
          )}
          
          {/* Fees Coletadas */}
          {metrics.fees?.coletadas !== null && metrics.fees?.coletadas !== undefined && (
            <div style={metricCardStyle}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Fees Coletadas</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                {formatUSD(metrics.fees.coletadas)}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Já coletadas
              </div>
            </div>
          )}

          {/* Fees Não Coletadas */}
          {metrics.fees?.naoColetadas !== null && metrics.fees?.naoColetadas !== undefined && (
            <div style={metricCardStyle}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Fees Não Coletadas</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b' }}>
                {formatUSD(metrics.fees.naoColetadas)}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Disponíveis
              </div>
            </div>
          )}

          {/* Impermanent Loss - mantida mas corrigida para usuário */}
          {metrics.impermanentLoss?.value !== null && metrics.impermanentLoss?.value !== undefined && (
            <div style={metricCardStyle}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Impermanent Loss</div>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                color: (metrics.impermanentLoss.value || 0) >= 0 ? '#10b981' : '#ef4444' 
              }}>
                {formatUSD(metrics.impermanentLoss.value)}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                {metrics.impermanentLoss.percentage?.toFixed(2)}%
              </div>
            </div>
          )}
        </div>
      )}

      {/* Token Composition */}
      {tokenInfo && proportions && (
        <div style={{ marginTop: '20px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#e2e8f0', marginBottom: '16px' }}>
            Position Composition
          </h4>
          
          {/* Ocean-themed Progress Bar */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
              <span>{getCorrectTokenSymbol(tokenInfo.tokenX.symbol, tokenInfo.tokenX.mint)} / {getCorrectTokenSymbol(tokenInfo.tokenY.symbol, tokenInfo.tokenY.mint)}</span>
              <span>{proportions.tokenX.percentage.toFixed(1)}% / {proportions.tokenY.percentage.toFixed(1)}%</span>
            </div>
            <div style={{ 
              width: '100%', 
              background: 'rgba(0, 0, 0, 0.3)', 
              borderRadius: '12px', 
              height: '16px',
              overflow: 'hidden',
              border: '1px solid rgba(79, 209, 197, 0.3)'
            }}>
              <div style={{ 
                width: `${proportions.tokenX.percentage}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, #4fd1c7 0%, #40e0ff 100%)',
                borderRadius: '12px',
                boxShadow: '0 0 10px rgba(79, 209, 197, 0.5)'
              }} />
            </div>
          </div>

          {/* Token Details with Ocean Theme */}
          <div style={{ display: 'flex', gap: '16px' }}>
            {/* Token X */}
            <div style={{ 
              flex: 1, 
              padding: '16px', 
              background: 'rgba(79, 209, 197, 0.1)', 
              borderRadius: '12px', 
              border: '1px solid rgba(79, 209, 197, 0.3)',
              backdropFilter: 'blur(5px)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#4fd1c7' }}>
                  {getCorrectTokenSymbol(tokenInfo.tokenX.symbol, tokenInfo.tokenX.mint)}
                </span>
                <span style={{ 
                  fontSize: '12px', 
                  background: 'rgba(79, 209, 197, 0.2)', 
                  color: '#4fd1c7', 
                  padding: '2px 8px', 
                  borderRadius: '8px' 
                }}>
                  {proportions.tokenX.percentage.toFixed(1)}%
                </span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: '600', color: '#e2e8f0', marginBottom: '4px' }}>
                {formatAmount(proportions.tokenX.amount)}
              </div>
              <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                {proportions.tokenX.valueUSD !== null && proportions.tokenX.valueUSD !== undefined
                  ? formatUSD(proportions.tokenX.valueUSD)
                  : 'Price pending...'
                }
              </div>
            </div>

            {/* Token Y */}
            <div style={{ 
              flex: 1, 
              padding: '16px', 
              background: 'rgba(64, 224, 255, 0.1)', 
              borderRadius: '12px', 
              border: '1px solid rgba(64, 224, 255, 0.3)',
              backdropFilter: 'blur(5px)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#40e0ff' }}>
                  {getCorrectTokenSymbol(tokenInfo.tokenY.symbol, tokenInfo.tokenY.mint)}
                </span>
                <span style={{ 
                  fontSize: '12px', 
                  background: 'rgba(64, 224, 255, 0.2)', 
                  color: '#40e0ff', 
                  padding: '2px 8px', 
                  borderRadius: '8px' 
                }}>
                  {proportions.tokenY.percentage.toFixed(1)}%
                </span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: '600', color: '#e2e8f0', marginBottom: '4px' }}>
                {formatAmount(proportions.tokenY.amount)}
              </div>
              <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                {proportions.tokenY.valueUSD !== null && proportions.tokenY.valueUSD !== undefined
                  ? formatUSD(proportions.tokenY.valueUSD)
                  : 'Price pending...'
                }
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginTop: '16px', 
            paddingTop: '16px', 
            borderTop: '1px solid rgba(255, 255, 255, 0.1)' 
          }}>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>LP Token</div>
              <div style={{ fontSize: '14px', fontFamily: 'monospace', color: '#94a3b8' }} title={mint}>
                {mint.slice(0, 8)}...{mint.slice(-8)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Last Updated</div>
              <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                {position.lastPriceUpdate ? new Date(position.lastPriceUpdate).toLocaleTimeString() : 'Unknown'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fallback for positions without tokenInfo */}
      {!tokenInfo && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '8px' }}>
            LP Amount: {position.amount}
          </div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>
            Detailed composition data not available
          </div>
        </div>
      )}
    </div>
  );
};

export default OceanPositionCard;