'use client';

import React, { useState, useMemo } from 'react';
import { useWebSocket } from '../../lib/websocket';

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
  metrics?: {
    apy?: number;
    fees24h?: number;
    volume24h?: number;
    utilization?: number;
    impermanentLoss?: number;
  };
}

interface OptimizedPositionCardProps {
  position: Position;
  showUSD: boolean;
  onToggleCurrency?: () => void;
  solPrice?: number;
}

// 🎯 Optimized Position Card with SOL/USD Toggle
const OptimizedPositionCard: React.FC<OptimizedPositionCardProps> = ({ 
  position, 
  showUSD = true, 
  onToggleCurrency,
  solPrice = 180 // Default SOL price
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isConnected } = useWebSocket();

  // 💰 Calculate values in SOL
  const solValues = useMemo(() => {
    const totalValueSOL = (position.valueUSD || 0) / solPrice;
    const tokenXValueSOL = (position.tokenXValueUSD || 0) / solPrice;
    const tokenYValueSOL = (position.tokenYValueUSD || 0) / solPrice;
    
    return {
      total: totalValueSOL,
      tokenX: tokenXValueSOL,
      tokenY: tokenYValueSOL,
    };
  }, [position, solPrice]);

  // 🎨 Protocol colors
  const protocolColors = {
    'raydium': '#8B5CF6',
    'orca': '#4F46E5',
    'meteora': '#06B6D4',
    'default': '#10B981'
  };

  const protocolColor = protocolColors[position.protocol.toLowerCase() as keyof typeof protocolColors] || protocolColors.default;

  // 🎯 Styles with Ocean theme
  const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 58, 138, 0.8) 100%)',
    border: '1px solid rgba(79, 209, 197, 0.3)',
    borderRadius: '20px',
    padding: '24px',
    margin: '16px 0',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
    backdropFilter: 'blur(10px)',
    position: 'relative',
    overflow: 'hidden',
    color: 'white',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
  };

  const protocolBadgeStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${protocolColor}40, ${protocolColor}60)`,
    color: 'white',
    padding: '6px 12px',
    borderRadius: '25px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    border: `1px solid ${protocolColor}80`,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  };

  const poolNameStyle: React.CSSProperties = {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#e2e8f0',
    marginTop: '8px',
    marginBottom: '4px',
  };

  const poolDetailsStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  // 🔄 Currency Toggle Button (positioned like in the image)
  const toggleButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '20px',
    right: '120px', // Position where red rectangle was in image
    background: showUSD ? 
      'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 
      'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    border: 'none',
    borderRadius: '25px',
    padding: '8px 16px',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  };

  const valueDisplayStyle: React.CSSProperties = {
    textAlign: 'right',
  };

  const mainValueStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#4fd1c7',
    marginBottom: '4px',
  };

  const subValueStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#94a3b8',
  };

  // 📊 Metrics grid
  const metricsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '12px',
    marginBottom: '20px',
  };

  const metricCardStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '12px',
    backdropFilter: 'blur(5px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    transition: 'all 0.2s ease',
  };

  const metricLabelStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: '#94a3b8',
    marginBottom: '4px',
    fontWeight: '500',
  };

  const metricValueStyle: React.CSSProperties = {
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#e2e8f0',
    marginBottom: '2px',
  };

  const metricSubtitleStyle: React.CSSProperties = {
    fontSize: '0.625rem',
    color: '#64748b',
  };

  // 🌊 Token composition section
  const compositionStyle: React.CSSProperties = {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid rgba(79, 209, 197, 0.2)',
  };

  const compositionTitleStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#94a3b8',
    marginBottom: '16px',
    fontWeight: '600',
  };

  const tokenDetailsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '16px',
  };

  const tokenCardStyle: React.CSSProperties = {
    flex: 1,
    padding: '16px',
    background: 'rgba(79, 209, 197, 0.1)',
    borderRadius: '12px',
    border: '1px solid rgba(79, 209, 197, 0.3)',
    backdropFilter: 'blur(5px)',
  };

  const tokenCardStyleY: React.CSSProperties = {
    ...tokenCardStyle,
    background: 'rgba(64, 224, 255, 0.1)',
    border: '1px solid rgba(64, 224, 255, 0.3)',
  };

  const tokenNameStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 'bold',
    color: '#4fd1c7',
    marginBottom: '8px',
  };

  const tokenAmountStyle: React.CSSProperties = {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    color: '#e2e8f0',
    marginBottom: '4px',
  };

  const tokenValueStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: '#94a3b8',
  };

  // 🎯 Status indicator
  const statusIndicatorStyle: React.CSSProperties = {
    position: 'absolute',
    top: '20px',
    right: '20px',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: isConnected ? '#10B981' : '#EF4444',
    boxShadow: `0 0 10px ${isConnected ? '#10B981' : '#EF4444'}`,
  };

  // 🌊 Wave animation
  const waveStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '200%',
    height: '3px',
    background: 'linear-gradient(90deg, transparent, #4fd1c7, transparent)',
    animation: 'wave 3s ease-in-out infinite',
  };

  // 📊 Format values based on currency mode
  const formatValue = (usdValue: number | null, solValue: number) => {
    if (showUSD) {
      return usdValue !== null ? `$${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';
    } else {
      return `${solValue.toFixed(4)} SOL`;
    }
  };

  const formatAmount = (amount: number, decimals: number = 6) => {
    return amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: decimals 
    });
  };

  return (
    <>
      {/* CSS Animation */}
      <style>{`
        @keyframes wave {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 25px 30px -5px rgba(0, 0, 0, 0.5);
          border-color: rgba(79, 209, 197, 0.6);
        }
        .metric-hover:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: scale(1.02);
        }
      `}</style>

      <div 
        className="card-hover"
        style={cardStyle}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Wave effect */}
        <div style={waveStyle} />
        
        {/* Status indicator */}
        <div style={statusIndicatorStyle} />
        
        {/* Currency Toggle Button */}
        <button
          style={toggleButtonStyle}
          onClick={(e) => {
            e.stopPropagation();
            onToggleCurrency?.();
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {showUSD ? '💵 USD' : '🟡 SOL'}
        </button>

        {/* Header */}
        <div style={headerStyle}>
          <div>
            <div style={protocolBadgeStyle}>
              {position.protocol === 'raydium' && '⚡'} 
              {position.protocol === 'orca' && '🐋'} 
              {position.protocol === 'meteora' && '☄️'} 
              {position.protocol.toUpperCase()}
            </div>
            <div style={poolNameStyle}>
              {position.tokenInfo ? 
                `${position.tokenInfo.tokenX.symbol}/${position.tokenInfo.tokenY.symbol}` : 
                position.pool?.name || 'LP Pool'
              }
            </div>
            <div style={poolDetailsStyle}>
              <span>🏊‍♂️ Pool</span>
              {position.pool?.bin_step && (
                <span>• Bin Step: {position.pool.bin_step}</span>
              )}
            </div>
          </div>
          
          <div style={valueDisplayStyle}>
            <div style={mainValueStyle}>
              {formatValue(position.valueUSD, solValues.total)}
            </div>
            <div style={subValueStyle}>
              Total Value
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div style={metricsGridStyle}>
          <div className="metric-hover" style={metricCardStyle}>
            <div style={metricLabelStyle}>APY</div>
            <div style={metricValueStyle}>
              {position.metrics?.apy ? `${position.metrics.apy.toFixed(1)}%` : 'N/A'}
            </div>
            <div style={metricSubtitleStyle}>Annual Yield</div>
          </div>

          <div className="metric-hover" style={metricCardStyle}>
            <div style={metricLabelStyle}>24h Fees</div>
            <div style={metricValueStyle}>
              {position.metrics?.fees24h ? 
                formatValue(position.metrics.fees24h, position.metrics.fees24h / solPrice) : 
                'N/A'
              }
            </div>
            <div style={metricSubtitleStyle}>Earned</div>
          </div>

          <div className="metric-hover" style={metricCardStyle}>
            <div style={metricLabelStyle}>Volume 24h</div>
            <div style={metricValueStyle}>
              {position.metrics?.volume24h ? 
                `$${(position.metrics.volume24h / 1000).toFixed(1)}K` : 
                'N/A'
              }
            </div>
            <div style={metricSubtitleStyle}>Pool Activity</div>
          </div>

          <div className="metric-hover" style={metricCardStyle}>
            <div style={metricLabelStyle}>IL Risk</div>
            <div style={metricValueStyle}>
              {position.metrics?.impermanentLoss ? 
                `${position.metrics.impermanentLoss.toFixed(1)}%` : 
                'Low'
              }
            </div>
            <div style={metricSubtitleStyle}>Current</div>
          </div>
        </div>

        {/* Token Composition (expanded view) */}
        {isExpanded && position.tokenInfo && (
          <div style={compositionStyle}>
            <div style={compositionTitleStyle}>
              🌊 Pool Composition
            </div>
            
            <div style={tokenDetailsStyle}>
              {/* Token X */}
              <div style={tokenCardStyle}>
                <div style={tokenNameStyle}>
                  {position.tokenInfo.tokenX.symbol}
                </div>
                <div style={tokenAmountStyle}>
                  {formatAmount(position.tokenInfo.tokenX.userAmount, position.tokenInfo.tokenX.decimals)}
                </div>
                <div style={tokenValueStyle}>
                  {formatValue(position.tokenXValueUSD, solValues.tokenX)}
                </div>
              </div>

              {/* Token Y */}
              <div style={tokenCardStyleY}>
                <div style={{...tokenNameStyle, color: '#40e0ff'}}>
                  {position.tokenInfo.tokenY.symbol}
                </div>
                <div style={tokenAmountStyle}>
                  {formatAmount(position.tokenInfo.tokenY.userAmount, position.tokenInfo.tokenY.decimals)}
                </div>
                <div style={tokenValueStyle}>
                  {formatValue(position.tokenYValueUSD, solValues.tokenY)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Expand indicator */}
        <div style={{
          textAlign: 'center',
          marginTop: '16px',
          color: '#64748b',
          fontSize: '0.75rem',
        }}>
          {isExpanded ? '▲ Click to collapse' : '▼ Click for details'}
        </div>
      </div>
    </>
  );
};

export default OptimizedPositionCard;