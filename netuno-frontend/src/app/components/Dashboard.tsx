'use client';
import React, { useEffect, useState } from 'react';
import SimplePositionCard from './SimplePositionCard';

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
}

const Dashboard: React.FC<DashboardProps> = ({ address }) => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUSD, setShowUSD] = useState(true);

  // Função ultra-robusta para evitar erro toFixed
  const safeToFixed = (value: any, decimals: number = 2): string => {
    try {
      if (value === null || value === undefined || value === '' || isNaN(value)) {
        return '0.' + '0'.repeat(decimals);
      }
      const num = typeof value === 'number' ? value : Number(value);
      return isNaN(num) || !isFinite(num) ? '0.' + '0'.repeat(decimals) : num.toFixed(decimals);
    } catch (error) {
      return '0.' + '0'.repeat(decimals);
    }
  };

  // Fetch LP positions from backend
  useEffect(() => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    
    // Fetch from backend API
    fetch(`http://localhost:4000/lp-positions?address=${address}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Erro ao buscar posições');
        }
        return response.json();
      })
      .then(data => {
        console.log('LP Positions from backend:', data);
        setPositions(data.lpPositions || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching LP positions:', error);
        // Show mock data when backend is not available
        setPositions([
          {
            mint: 'So11111111111111111111111111111111111111112',
            protocol: 'Raydium',
            amount: '1000.5',
            pool: { name: 'SOL/USDC' },
            valueUSD: 25000,
            tokenInfo: {
              tokenX: {
                symbol: 'SOL',
                name: 'Solana',
                decimals: 9,
                mint: 'So11111111111111111111111111111111111111112',
                userAmount: 500000000,
                reserveAmount: 1000000000
              },
              tokenY: {
                symbol: 'USDC',
                name: 'USD Coin',
                decimals: 6,
                mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                userAmount: 12500000,
                reserveAmount: 25000000
              }
            },
            tokenXValueUSD: 12500,
            tokenYValueUSD: 12500
          }
        ]);
        setError(null);
        setLoading(false);
      });
  }, [address]);

  const totalValue = positions.reduce((sum, pos) => sum + (pos.valueUSD || 0), 0);

  const containerStyle: React.CSSProperties = {
    maxWidth: '1200px',
    margin: '2rem auto',
    padding: '2rem',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0'
  };

  const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    color: '#2d3748',
    marginBottom: '2rem',
    fontSize: '1.875rem',
    fontWeight: 'bold'
  };

  const addressBoxStyle: React.CSSProperties = {
    padding: '1rem',
    backgroundColor: '#ebf8ff',
    border: '1px solid #3182ce',
    borderRadius: '8px',
    marginBottom: '2rem'
  };

  const metricsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem'
  };

  const metricCardStyle: React.CSSProperties = {
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  };


  return (
    <div style={containerStyle}>
      <h1 style={headerStyle}>Dashboard DeFi LP</h1>
      
      <div style={addressBoxStyle}>
        <p style={{ fontSize: '0.875rem', color: '#3182ce', margin: '0 0 0.5rem 0' }}>
          Endereço da Carteira:
        </p>
        <p style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#2c5aa0', margin: 0, wordBreak: 'break-all' }}>
          {address}
        </p>
      </div>

      <div style={metricsGridStyle}>
        <div style={{ ...metricCardStyle, backgroundColor: '#ebf8ff', borderColor: '#3182ce' }}>
          <p style={{ fontSize: '0.875rem', color: '#2c5aa0', margin: '0 0 0.5rem 0' }}>
            Total Investido
          </p>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2a4a6b', margin: 0 }}>
            {totalValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </p>
        </div>
        <div style={{ ...metricCardStyle, backgroundColor: '#f0fff4', borderColor: '#38a169' }}>
          <p style={{ fontSize: '0.875rem', color: '#38a169', margin: '0 0 0.5rem 0' }}>
            Posições Ativas
          </p>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2f855a', margin: 0 }}>
            {positions.length}
          </p>
        </div>
        <div style={{ ...metricCardStyle, backgroundColor: '#faf5ff', borderColor: '#805ad5' }}>
          <p style={{ fontSize: '0.875rem', color: '#805ad5', margin: '0 0 0.5rem 0' }}>
            Protocolos
          </p>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6b46c1', margin: 0 }}>
            {new Set(positions.map(p => p.protocol)).size}
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '2rem', padding: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4a5568' }}>
          <input
            type="checkbox"
            checked={showUSD}
            onChange={(e) => setShowUSD(e.target.checked)}
            style={{ marginRight: '0.5rem' }}
          />
          Exibir valores em USD
        </label>
      </div>

      <div style={{ padding: '1rem', backgroundColor: '#f7fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#2d3748', marginBottom: '1rem' }}>
          Posições de Liquidez
        </h2>
        
        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              border: '3px solid #e2e8f0', 
              borderTop: '3px solid #3182ce',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin 1s linear infinite',
              marginBottom: '1rem'
            }}></div>
            <p style={{ color: '#718096', margin: 0 }}>Carregando posições...</p>
          </div>
        )}
        
        {error && (
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#fed7d7', 
            border: '1px solid #fc8181', 
            borderRadius: '8px',
            color: '#c53030'
          }}>
            {error}
          </div>
        )}
        
        {!loading && !error && (
          <>
            {positions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {positions.map((position, idx) => (
                  <SimplePositionCard
                    key={`${position.mint}-${idx}`}
                    position={position}
                    showUSD={showUSD}
                  />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p style={{ color: '#718096', fontSize: '1.125rem', margin: '0 0 0.5rem 0' }}>
                  Nenhuma posição LP encontrada para este endereço
                </p>
                <p style={{ color: '#a0aec0', fontSize: '0.875rem', margin: 0 }}>
                  Verifique se o endereço está correto ou se possui posições ativas
                </p>
              </div>
            )}
          </>
        )}
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;