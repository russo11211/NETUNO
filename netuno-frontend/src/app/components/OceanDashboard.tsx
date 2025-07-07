'use client';
import React, { useEffect, useState } from 'react';
import OceanPositionCard from './OceanPositionCard';

interface DashboardProps {
  address: string;
}

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
    pool_name?: string;
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
  metrics?: any;
}

const OceanDashboard: React.FC<DashboardProps> = ({ address }) => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUSD, setShowUSD] = useState(true);

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
  `;

  useEffect(() => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    
    // Multiple fetch strategies - production and local fallbacks
    const fetchWithFallback = async () => {
      const urls = [
        `https://netuno-backend-nqk7.onrender.com/lp-positions?address=${address}`,
        `http://127.0.0.1:3001/lp-positions?address=${address}`,
        `http://localhost:3001/lp-positions?address=${address}`,
        `http://127.0.0.1:8080/lp-positions?address=${address}`,
        `http://localhost:8080/lp-positions?address=${address}`,
        `http://127.0.0.1:4000/lp-positions?address=${address}`,
        `http://localhost:4000/lp-positions?address=${address}`,
      ];
      
      for (const url of urls) {
        try {
          console.log(`Tentando fetch em: ${url}`);
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
            },
            cache: 'no-cache',
            mode: 'cors'
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log('LP Positions from backend:', data);
          setPositions(data.lpPositions || []);
          setLoading(false);
          return; // Success, exit function
          
        } catch (error) {
          console.error(`Error with ${url}:`, error);
          continue; // Try next URL
        }
      }
      
      // If all URLs fail
      setError('Não foi possível conectar ao backend. Verifique se o servidor está rodando na porta 4000.');
      setLoading(false);
    };
    
    fetchWithFallback();
  }, [address]);

  const totalValue = positions.reduce((sum, pos) => sum + (pos.valueUSD || 0), 0);
  const totalPositions = positions.length;
  const activeProtocols = new Set(positions.map(p => p.protocol)).size;
  const avgAPY = positions.reduce((sum, pos) => sum + (pos.metrics?.apy || 0), 0) / (totalPositions || 1);

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

  const loadingSpinnerStyle: React.CSSProperties = {
    width: '60px',
    height: '60px',
    border: '4px solid rgba(79, 209, 197, 0.3)',
    borderTop: '4px solid #4fd1c7',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem'
  };

  return (
    <div style={containerStyle}>
      <style>{waveAnimation}</style>
      <div style={backgroundEffectStyle} />
      
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
        </div>

        {/* Ocean Metrics Grid */}
        <div style={metricsGridStyle}>
          <div style={{...metricCardStyle, animation: 'glow 2s ease-in-out infinite'}}>
            <div style={waveStyle} />
            <p style={{ fontSize: '0.9rem', color: '#4fd1c7', margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
              💰 Patrimônio Total
            </p>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#e2e8f0', margin: 0 }}>
              {totalValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </p>
          </div>
          
          <div style={metricCardStyle}>
            <div style={waveStyle} />
            <p style={{ fontSize: '0.9rem', color: '#40e0ff', margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
              🎯 Posições Ativas
            </p>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#e2e8f0', margin: 0 }}>
              {totalPositions}
            </p>
          </div>
          
          <div style={metricCardStyle}>
            <div style={waveStyle} />
            <p style={{ fontSize: '0.9rem', color: '#8b5cf6', margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
              🌐 Protocolos
            </p>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#e2e8f0', margin: 0 }}>
              {activeProtocols}
            </p>
          </div>
          
          <div style={metricCardStyle}>
            <div style={waveStyle} />
            <p style={{ fontSize: '0.9rem', color: '#f59e0b', margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
              📈 APY Médio
            </p>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#e2e8f0', margin: 0 }}>
              {avgAPY.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Settings Toggle */}
        <div style={{ marginBottom: '2rem', padding: '1rem', textAlign: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '1.1rem' }}>
            <input
              type="checkbox"
              checked={showUSD}
              onChange={(e) => setShowUSD(e.target.checked)}
              style={{ 
                marginRight: '0.5rem',
                width: '20px',
                height: '20px',
                accentColor: '#4fd1c7'
              }}
            />
            💵 Exibir valores em USD
          </label>
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
          
          {loading && (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={loadingSpinnerStyle}></div>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '1.1rem' }}>
                Mergulhando nas profundezas dos dados...
              </p>
            </div>
          )}
          
          {error && (
            <div style={{ 
              padding: '1.5rem', 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.3)', 
              borderRadius: '12px',
              color: '#fca5a5',
              textAlign: 'center',
              fontSize: '1.1rem'
            }}>
              ⚠️ {error}
            </div>
          )}
          
          {!loading && !error && (
            <>
              {positions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {positions.map((position, idx) => (
                    <OceanPositionCard
                      key={`${position.mint}-${idx}`}
                      position={position}
                      showUSD={showUSD}
                    />
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <p style={{ color: '#94a3b8', fontSize: '1.3rem', margin: '0 0 0.5rem 0' }}>
                    🐠 Nenhuma posição LP encontrada nestes mares
                  </p>
                  <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>
                    Verifique se o endereço está correto ou se possui posições ativas
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Additional CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default OceanDashboard;