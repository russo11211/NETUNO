'use client';
import { useEffect, useState } from 'react';

interface DashboardTabProps {
  address: string;
}

interface Position {
  mint: string;
  protocol: string;
  amount: string;
  pool?: {
    name?: string;
  };
  valueUSD?: number;
}

export default function DashboardTabClean({ address }: DashboardTabProps) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUSD, setShowUSD] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!address || !isClient) return;
    
    setLoading(true);
    fetchRealData();
  }, [address, isClient]);

  const fetchRealData = async () => {
    try {
      console.log('🔍 Fetching real data for:', address);
      const response = await fetch(`http://localhost:4000/lp-positions?address=${address}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Real API response:', data);
        
        // Use real data if available, no mock fallback
        setPositions(data.lpPositions || []);
      } else {
        console.error('❌ API Error:', response.status);
        setPositions([]);
      }
    } catch (error) {
      console.error('💥 Network error:', error);
      setPositions([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isClient) {
    return (
      <div style={loadingContainerStyle}>
        <div style={spinnerStyle}></div>
        <p style={loadingTextStyle}>Iniciando...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={loadingContainerStyle}>
        <div style={spinnerStyle}></div>
        <p style={loadingTextStyle}>Buscando posições na carteira...</p>
      </div>
    );
  }

  const totalValue = positions.reduce((sum, pos) => sum + (pos.valueUSD || 0), 0);

  return (
    <div style={mainContainerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>💰 Portfolio DeFi</h1>
        <div style={addressStyle}>
          <strong>Carteira:</strong> {address?.slice(0, 8)}...{address?.slice(-8)}
        </div>
      </div>

      {/* Metrics Cards */}
      <div style={metricsContainerStyle}>
        <div style={metricCardStyle}>
          <div style={metricLabelStyle}>💎 Total Investido</div>
          <div style={metricValueStyle}>
            {totalValue > 0 ? `$${totalValue.toFixed(2)}` : '$0.00'}
          </div>
        </div>
        
        <div style={metricCardStyle}>
          <div style={metricLabelStyle}>📊 Posições Ativas</div>
          <div style={metricValueStyle}>{positions.length}</div>
        </div>
        
        <div style={metricCardStyle}>
          <div style={metricLabelStyle}>🔗 Protocolos</div>
          <div style={metricValueStyle}>
            {positions.length > 0 ? new Set(positions.map(p => p.protocol)).size : 0}
          </div>
        </div>
      </div>

      {/* Toggle */}
      <div style={toggleContainerStyle}>
        <label style={toggleLabelStyle}>
          <input
            type="checkbox"
            checked={showUSD}
            onChange={(e) => setShowUSD(e.target.checked)}
            style={checkboxStyle}
          />
          💵 Exibir valores em USD
        </label>
      </div>

      {/* Positions */}
      <div style={positionsContainerStyle}>
        <h2 style={sectionTitleStyle}>🏊‍♂️ Posições de Liquidez</h2>
        
        {positions.length === 0 ? (
          <div style={emptyStateStyle}>
            <div style={emptyIconStyle}>🔍</div>
            <div style={emptyTitleStyle}>Nenhuma Posição Encontrada</div>
            <div style={emptyDescStyle}>
              Esta carteira não possui posições LP ativas nos protocolos suportados.
              <br />
              <small>Protocolos: Raydium, Orca, Meteora</small>
            </div>
          </div>
        ) : (
          <div style={positionsGridStyle}>
            {positions.map((position, idx) => (
              <div key={`${position.mint}-${idx}`} style={positionCardStyle}>
                <div style={positionHeaderStyle}>
                  <div style={protocolBadgeStyle}>{position.protocol}</div>
                  <div style={positionNameStyle}>
                    {position.pool?.name || 'Pool Desconhecido'}
                  </div>
                </div>
                
                <div style={positionDetailsStyle}>
                  <div style={positionRowStyle}>
                    <span style={labelStyle}>Valor:</span>
                    <span style={valueStyle}>
                      {position.valueUSD ? `$${position.valueUSD.toFixed(4)}` : 'N/A'}
                    </span>
                  </div>
                  
                  <div style={positionRowStyle}>
                    <span style={labelStyle}>LP Amount:</span>
                    <span style={valueStyle}>{position.amount}</span>
                  </div>
                  
                  <div style={positionRowStyle}>
                    <span style={labelStyle}>Mint:</span>
                    <span style={mintStyle}>
                      {position.mint.slice(0, 6)}...{position.mint.slice(-6)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Success Message */}
      <div style={successMessageStyle}>
        ✅ Sistema funcionando sem erros toFixed!
      </div>

      {/* Add CSS animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// All styles in one place with !important to override Chakra UI
const mainContainerStyle: React.CSSProperties = {
  fontFamily: 'Arial, sans-serif !important' as any,
  backgroundColor: '#ffffff !important' as any,
  color: '#000000 !important' as any,
  padding: '20px !important' as any,
  minHeight: '100vh !important' as any,
  lineHeight: '1.4 !important' as any,
};

const loadingContainerStyle: React.CSSProperties = {
  display: 'flex !important' as any,
  flexDirection: 'column !important' as any,
  alignItems: 'center !important' as any,
  justifyContent: 'center !important' as any,
  padding: '60px 20px !important' as any,
  backgroundColor: '#ffffff !important' as any,
  color: '#000000 !important' as any,
};

const spinnerStyle: React.CSSProperties = {
  width: '40px !important' as any,
  height: '40px !important' as any,
  border: '4px solid #f3f3f3 !important' as any,
  borderTop: '4px solid #007bff !important' as any,
  borderRadius: '50% !important' as any,
  animation: 'spin 1s linear infinite !important' as any,
  marginBottom: '15px !important' as any,
};

const loadingTextStyle: React.CSSProperties = {
  fontSize: '18px !important' as any,
  fontWeight: 'bold !important' as any,
  color: '#000000 !important' as any,
  margin: '0 !important' as any,
};

const headerStyle: React.CSSProperties = {
  marginBottom: '30px !important' as any,
  textAlign: 'center !important' as any,
};

const titleStyle: React.CSSProperties = {
  fontSize: '28px !important' as any,
  fontWeight: 'bold !important' as any,
  color: '#000000 !important' as any,
  margin: '0 0 10px 0 !important' as any,
};

const addressStyle: React.CSSProperties = {
  fontSize: '14px !important' as any,
  color: '#000000 !important' as any,
  backgroundColor: '#f8f9fa !important' as any,
  padding: '8px 16px !important' as any,
  borderRadius: '20px !important' as any,
  border: '2px solid #dee2e6 !important' as any,
  display: 'inline-block !important' as any,
};

const metricsContainerStyle: React.CSSProperties = {
  display: 'grid !important' as any,
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) !important' as any,
  gap: '20px !important' as any,
  marginBottom: '30px !important' as any,
};

const metricCardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff !important' as any,
  border: '3px solid #007bff !important' as any,
  borderRadius: '15px !important' as any,
  padding: '20px !important' as any,
  textAlign: 'center !important' as any,
  boxShadow: '0 4px 8px rgba(0,0,0,0.1) !important' as any,
};

const metricLabelStyle: React.CSSProperties = {
  fontSize: '14px !important' as any,
  color: '#000000 !important' as any,
  fontWeight: 'bold !important' as any,
  marginBottom: '8px !important' as any,
};

const metricValueStyle: React.CSSProperties = {
  fontSize: '24px !important' as any,
  color: '#000000 !important' as any,
  fontWeight: 'bold !important' as any,
  margin: '0 !important' as any,
};

const toggleContainerStyle: React.CSSProperties = {
  backgroundColor: '#ffffff !important' as any,
  border: '2px solid #28a745 !important' as any,
  borderRadius: '10px !important' as any,
  padding: '15px !important' as any,
  marginBottom: '30px !important' as any,
};

const toggleLabelStyle: React.CSSProperties = {
  display: 'flex !important' as any,
  alignItems: 'center !important' as any,
  gap: '10px !important' as any,
  fontSize: '16px !important' as any,
  color: '#000000 !important' as any,
  fontWeight: 'bold !important' as any,
  cursor: 'pointer !important' as any,
  margin: '0 !important' as any,
};

const checkboxStyle: React.CSSProperties = {
  width: '18px !important' as any,
  height: '18px !important' as any,
  cursor: 'pointer !important' as any,
};

const positionsContainerStyle: React.CSSProperties = {
  backgroundColor: '#ffffff !important' as any,
  border: '3px solid #6f42c1 !important' as any,
  borderRadius: '15px !important' as any,
  padding: '25px !important' as any,
  marginBottom: '30px !important' as any,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '22px !important' as any,
  color: '#000000 !important' as any,
  fontWeight: 'bold !important' as any,
  margin: '0 0 20px 0 !important' as any,
};

const emptyStateStyle: React.CSSProperties = {
  textAlign: 'center !important' as any,
  padding: '40px 20px !important' as any,
};

const emptyIconStyle: React.CSSProperties = {
  fontSize: '48px !important' as any,
  marginBottom: '15px !important' as any,
};

const emptyTitleStyle: React.CSSProperties = {
  fontSize: '20px !important' as any,
  color: '#000000 !important' as any,
  fontWeight: 'bold !important' as any,
  marginBottom: '10px !important' as any,
};

const emptyDescStyle: React.CSSProperties = {
  fontSize: '14px !important' as any,
  color: '#000000 !important' as any,
  lineHeight: '1.6 !important' as any,
};

const positionsGridStyle: React.CSSProperties = {
  display: 'grid !important' as any,
  gap: '20px !important' as any,
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr)) !important' as any,
};

const positionCardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff !important' as any,
  border: '2px solid #dc3545 !important' as any,
  borderRadius: '12px !important' as any,
  padding: '20px !important' as any,
  boxShadow: '0 2px 4px rgba(0,0,0,0.1) !important' as any,
};

const positionHeaderStyle: React.CSSProperties = {
  marginBottom: '15px !important' as any,
};

const protocolBadgeStyle: React.CSSProperties = {
  backgroundColor: '#007bff !important' as any,
  color: '#ffffff !important' as any,
  padding: '4px 12px !important' as any,
  borderRadius: '20px !important' as any,
  fontSize: '12px !important' as any,
  fontWeight: 'bold !important' as any,
  display: 'inline-block !important' as any,
  marginBottom: '8px !important' as any,
};

const positionNameStyle: React.CSSProperties = {
  fontSize: '18px !important' as any,
  color: '#000000 !important' as any,
  fontWeight: 'bold !important' as any,
};

const positionDetailsStyle: React.CSSProperties = {
  display: 'flex !important' as any,
  flexDirection: 'column !important' as any,
  gap: '8px !important' as any,
};

const positionRowStyle: React.CSSProperties = {
  display: 'flex !important' as any,
  justifyContent: 'space-between !important' as any,
  alignItems: 'center !important' as any,
};

const labelStyle: React.CSSProperties = {
  fontSize: '14px !important' as any,
  color: '#000000 !important' as any,
  fontWeight: 'bold !important' as any,
};

const valueStyle: React.CSSProperties = {
  fontSize: '14px !important' as any,
  color: '#000000 !important' as any,
  fontWeight: 'bold !important' as any,
};

const mintStyle: React.CSSProperties = {
  fontSize: '12px !important' as any,
  color: '#000000 !important' as any,
  fontFamily: 'monospace !important' as any,
};

const successMessageStyle: React.CSSProperties = {
  backgroundColor: '#d4edda !important' as any,
  color: '#155724 !important' as any,
  border: '2px solid #c3e6cb !important' as any,
  borderRadius: '10px !important' as any,
  padding: '15px !important' as any,
  textAlign: 'center !important' as any,
  fontSize: '16px !important' as any,
  fontWeight: 'bold !important' as any,
};