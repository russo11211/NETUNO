'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { usePortfolio } from '../../hooks/usePortfolio';
import { SkeletonCard, SkeletonMetrics } from '../../components/SkeletonCard';
import OptimizedPositionCard from './OptimizedPositionCard';
import { useWebSocket } from '../../lib/websocket';

interface DashboardProps {
  address: string;
}

// 🎯 Optimized Ocean Dashboard with React Query + WebSocket
const OptimizedOceanDashboard: React.FC<DashboardProps> = ({ address }) => {
  const [showUSD, setShowUSD] = useState(true);
  const [solPrice, setSolPrice] = useState(180); // Default SOL price
  const { isConnected, subscribe, unsubscribe, on, off } = useWebSocket();

  // 🚀 Use optimized portfolio hook with React Query
  const {
    positions,
    metrics,
    isLoading,
    isError,
    error,
    isFetching,
    isEmpty,
    refresh,
    lastUpdated,
    isStale,
  } = usePortfolio(address);

  // 🌐 WebSocket Effects
  useEffect(() => {
    if (address) {
      // Subscribe to real-time updates for this address
      subscribe(address);

      // Listen for portfolio refresh signals
      const handlePortfolioRefresh = (data: { address: string }) => {
        if (data.address === address) {
          console.log('🔄 Real-time portfolio refresh triggered');
          refresh();
        }
      };

      // Listen for price updates
      const handlePriceUpdate = (data: { symbol: string; price: number }) => {
        if (data.symbol === 'SOL') {
          setSolPrice(data.price);
        }
      };

      on('portfolio-refresh', handlePortfolioRefresh);
      on('price-update', handlePriceUpdate);

      // Cleanup on unmount
      return () => {
        unsubscribe(address);
        off('portfolio-refresh', handlePortfolioRefresh);
        off('price-update', handlePriceUpdate);
      };
    }
  }, [address, subscribe, unsubscribe, on, off, refresh]);

  // 🔄 Manual refresh handler
  const handleRefresh = useCallback(async () => {
    try {
      await refresh();
    } catch (err) {
      console.error('Failed to refresh:', err);
    }
  }, [refresh]);

  // 🔄 Toggle currency handler
  const handleToggleCurrency = useCallback(() => {
    setShowUSD(!showUSD);
  }, [showUSD]);

  // Ocean wave animation keyframes
  const waveAnimation = `
    @keyframes wave {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(100%);
      }
    }
    
    @keyframes float {
      0%, 100% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-10px);
      }
    }
    
    @keyframes glow {
      0%, 100% {
        box-shadow: 0 0 20px rgba(79, 209, 197, 0.3);
      }
      50% {
        box-shadow: 0 0 40px rgba(79, 209, 197, 0.6);
      }
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.8;
      }
    }
  `;

  // Ocean-themed styles
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a1628 0%, #1e3a8a 50%, #0f172a 100%)',
    color: 'white',
    position: 'relative',
    overflow: 'hidden'
  };

  const backgroundEffectStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `
      radial-gradient(circle at 25% 25%, rgba(79, 209, 197, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, rgba(64, 224, 255, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, rgba(30, 58, 138, 0.2) 0%, transparent 70%)
    `,
    pointerEvents: 'none',
    zIndex: 0
  };

  const contentStyle: React.CSSProperties = {
    position: 'relative',
    zIndex: 1,
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '2rem'
  };

  const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '3rem',
    position: 'relative'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '3.5rem',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #4fd1c7 0%, #40e0ff 50%, #8b5cf6 100%)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '1rem',
    textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
    animation: 'float 3s ease-in-out infinite'
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '1.2rem',
    color: '#94a3b8',
    marginBottom: '2rem'
  };

  const addressBoxStyle: React.CSSProperties = {
    padding: '1.5rem',
    background: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid rgba(79, 209, 197, 0.3)',
    borderRadius: '20px',
    marginBottom: '2rem',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
  };

  const metricsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '2rem',
    marginBottom: '3rem'
  };

  const metricCardStyle: React.CSSProperties = {
    padding: '2rem',
    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 58, 138, 0.7) 100%)',
    border: '1px solid rgba(79, 209, 197, 0.3)',
    borderRadius: '20px',
    backdropFilter: 'blur(15px)',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
    position: 'relative',
    overflow: 'hidden'
  };

  const waveStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '200%',
    height: '4px',
    background: 'linear-gradient(90deg, transparent, #4fd1c7, transparent)',
    animation: 'wave 3s ease-in-out infinite'
  };

  // 🔄 Loading indicator style
  const loadingIndicatorStyle: React.CSSProperties = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    background: 'rgba(79, 209, 197, 0.1)',
    border: '1px solid rgba(79, 209, 197, 0.3)',
    borderRadius: '50px',
    padding: '8px 16px',
    color: '#4fd1c7',
    fontSize: '12px',
    fontWeight: 'bold',
    zIndex: 1000,
    animation: isFetching ? 'pulse 1s infinite' : 'none',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  // 🌐 WebSocket status indicator
  const wsStatusStyle: React.CSSProperties = {
    position: 'fixed',
    top: '20px',
    right: '200px',
    background: 'rgba(15, 23, 42, 0.1)',
    border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
    borderRadius: '50px',
    padding: '8px 16px',
    color: isConnected ? '#10b981' : '#ef4444',
    fontSize: '12px',
    fontWeight: 'bold',
    zIndex: 1000,
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  // 📊 Status indicator style
  const statusStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#94a3b8',
    marginBottom: '1rem',
  };

  return (
    <div style={containerStyle}>
      <style>{waveAnimation}</style>
      <div style={backgroundEffectStyle} />
      
      {/* 🔄 Loading/Status Indicator */}
      {(isFetching || isLoading) && (
        <div style={loadingIndicatorStyle}>
          <span>{isLoading ? '🌊 Loading...' : '🔄 Updating...'}</span>
        </div>
      )}
      
      {/* 🌐 WebSocket Status Indicator */}
      <div style={wsStatusStyle}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: isConnected ? '#10b981' : '#ef4444',
          boxShadow: `0 0 6px ${isConnected ? '#10b981' : '#ef4444'}`,
        }} />
        <span>{isConnected ? 'Real-time ON' : 'Real-time OFF'}</span>
      </div>
      
      <div style={contentStyle}>
        {/* Ocean-themed Header */}
        <div style={headerStyle}>
          <h1 style={titleStyle}>
            🌊 NETUNO DeFi Ocean
          </h1>
          <p style={subtitleStyle}>
            Navegue pelas profundezas dos seus investimentos DeFi
          </p>
        </div>
        
        {/* Wallet Address Display */}
        <div style={addressBoxStyle}>
          <div style={waveStyle} />
          <p style={{ fontSize: '0.9rem', color: '#4fd1c7', margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
            🏛️ Carteira Conectada
          </p>
          <p style={{ fontSize: '1rem', fontWeight: 'bold', color: '#e2e8f0', margin: 0, wordBreak: 'break-all', fontFamily: 'monospace' }}>
            {address}
          </p>
          
          {/* 📊 Status indicators */}
          <div style={statusStyle}>
            <span>📊 Status:</span>
            {isLoading ? (
              <span style={{ color: '#f59e0b' }}>Carregando...</span>
            ) : isError ? (
              <span style={{ color: '#ef4444' }}>❌ Erro de conexão</span>
            ) : (
              <span style={{ color: '#10b981' }}>✅ Conectado</span>
            )}
            
            {lastUpdated && (
              <>
                <span>•</span>
                <span>Atualizado: {new Date(lastUpdated).toLocaleTimeString()}</span>
                {isStale && <span style={{ color: '#f59e0b' }}>⚠️ Desatualizado</span>}
              </>
            )}
            
            {!isLoading && (
              <>
                <span>•</span>
                <button
                  onClick={handleRefresh}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4fd1c7',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontSize: '12px',
                  }}
                  disabled={isFetching}
                >
                  {isFetching ? 'Atualizando...' : '🔄 Atualizar'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Ocean Metrics Grid */}
        {isLoading ? (
          <SkeletonMetrics />
        ) : (
          <div style={metricsGridStyle}>
            <div style={{...metricCardStyle, animation: 'glow 2s ease-in-out infinite'}}>
              <div style={waveStyle} />
              <p style={{ fontSize: '0.9rem', color: '#4fd1c7', margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
                💰 Patrimônio Total
              </p>
              <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#e2e8f0', margin: 0 }}>
                {metrics.totalValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </p>
            </div>
            
            <div style={metricCardStyle}>
              <div style={waveStyle} />
              <p style={{ fontSize: '0.9rem', color: '#40e0ff', margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
                🎯 Posições Ativas
              </p>
              <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#e2e8f0', margin: 0 }}>
                {metrics.totalPositions}
              </p>
            </div>
            
            <div style={metricCardStyle}>
              <div style={waveStyle} />
              <p style={{ fontSize: '0.9rem', color: '#8b5cf6', margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
                🌐 Protocolos
              </p>
              <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#e2e8f0', margin: 0 }}>
                {metrics.activeProtocols}
              </p>
            </div>
            
            <div style={metricCardStyle}>
              <div style={waveStyle} />
              <p style={{ fontSize: '0.9rem', color: '#f59e0b', margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
                📈 APY Médio
              </p>
              <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#e2e8f0', margin: 0 }}>
                {metrics.avgAPY.toFixed(1)}%
              </p>
            </div>
          </div>
        )}

        {/* Global Currency Toggle */}
        <div style={{ 
          marginBottom: '2rem', 
          padding: '1.5rem', 
          textAlign: 'center',
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: '20px',
          border: '1px solid rgba(79, 209, 197, 0.2)',
          backdropFilter: 'blur(10px)',
        }}>
          <button
            onClick={handleToggleCurrency}
            style={{
              background: showUSD ? 
                'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 
                'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              border: 'none',
              borderRadius: '25px',
              padding: '12px 24px',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: '0 auto',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {showUSD ? '💵 Displaying in USD' : '🟡 Displaying in SOL'}
            <span style={{ fontSize: '0.875rem', opacity: 0.8 }}>
              (Click to switch)
            </span>
          </button>
          <div style={{ 
            marginTop: '8px', 
            fontSize: '0.875rem', 
            color: '#94a3b8' 
          }}>
            SOL Price: ${solPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Positions Section */}
        <div style={{ 
          padding: '2rem', 
          background: 'rgba(15, 23, 42, 0.6)', 
          borderRadius: '20px', 
          border: '1px solid rgba(79, 209, 197, 0.2)',
          backdropFilter: 'blur(10px)',
          position: 'relative'
        }}>
          <div style={waveStyle} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '2rem', textAlign: 'center' }}>
            🏊‍♂️ Suas Posições de Liquidez
          </h2>
          
          {/* 🔄 Loading State */}
          {isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {[...Array(3)].map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          )}
          
          {/* ❌ Error State */}
          {isError && (
            <div style={{ 
              padding: '1.5rem', 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.3)', 
              borderRadius: '12px',
              color: '#fca5a5',
              textAlign: 'center',
              fontSize: '1.1rem'
            }}>
              ⚠️ {error?.message || 'Erro ao carregar dados'}
              <br />
              <button
                onClick={handleRefresh}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '8px',
                  color: '#fca5a5',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
                disabled={isFetching}
              >
                {isFetching ? '🔄 Tentando...' : '🔄 Tentar Novamente'}
              </button>
            </div>
          )}
          
          {/* ✅ Success State - Show positions */}
          {!isLoading && !isError && (
            <>
              {positions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {positions.map((position, idx) => (
                    <OptimizedPositionCard
                      key={`${position.mint}-${idx}`}
                      position={position}
                      showUSD={showUSD}
                      onToggleCurrency={handleToggleCurrency}
                      solPrice={solPrice}
                    />
                  ))}
                </div>
              ) : isEmpty ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <p style={{ color: '#94a3b8', fontSize: '1.3rem', margin: '0 0 0.5rem 0' }}>
                    🐠 Nenhuma posição LP encontrada nestes mares
                  </p>
                  <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>
                    Verifique se o endereço está correto ou se possui posições ativas
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OptimizedOceanDashboard;