'use client';
import React, { useEffect, useState } from 'react';

interface DashboardProps {
  address: string;
}

interface Position {
  mint: string;
  protocol: string;
  amount: string;
  pool?: {
    name?: string;
    pool_name?: string;
  };
  valueUSD?: number;
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
            valueUSD: 25000
          },
          {
            mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            protocol: 'Orca',
            amount: '500.25',
            pool: { name: 'USDC/USDT' },
            valueUSD: 12500
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

  const positionCardStyle: React.CSSProperties = {
    padding: '1rem',
    margin: '1rem 0',
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
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
              positions.map((position, idx) => (
                <div key={`${position.mint}-${idx}`} style={positionCardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#2d3748', margin: '0 0 0.5rem 0' }}>
                        {position.pool?.name || position.pool?.pool_name || 'Pool Desconhecido'}
                      </h3>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          color: 'white',
                          backgroundColor: '#805ad5',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '12px'
                        }}>
                          {position.protocol}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: '#718096', margin: 0 }}>
                        Mint: {position.mint.slice(0, 8)}...{position.mint.slice(-8)}
                      </p>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#2d3748', margin: '0 0 0.25rem 0' }}>
                        {position.amount} LP
                      </p>
                      {position.valueUSD && (
                        <p style={{ fontSize: '1rem', color: '#38a169', fontWeight: '500', margin: 0 }}>
                          {(() => {
                            const value = position.valueUSD || 0;
                            const safeValue = typeof value === 'number' ? value : 0;
                            return showUSD 
                              ? safeValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
                              : `${safeToFixed(safeValue / 100, 4)} SOL`;
                          })()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
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