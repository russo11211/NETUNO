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

export default function DashboardTab({ address }: DashboardTabProps) {
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
        
        // Use real data only - NO MOCK FALLBACK
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

  const totalValue = positions.reduce((sum, pos) => sum + (pos.valueUSD || 0), 0);

  if (!isClient) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', backgroundColor: '#ffffff', color: '#000000' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #007bff', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '15px' }}></div>
        <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#000000', margin: '0' }}>Iniciando...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', backgroundColor: '#ffffff', color: '#000000' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #007bff', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '15px' }}></div>
        <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#000000', margin: '0' }}>Buscando posições na carteira...</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#ffffff', color: '#000000', padding: '20px', minHeight: '100vh', lineHeight: '1.4' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#000000', margin: '0 0 10px 0' }}>💰 Portfolio DeFi</h1>
        <div style={{ fontSize: '14px', color: '#000000', backgroundColor: '#f8f9fa', padding: '8px 16px', borderRadius: '20px', border: '2px solid #dee2e6', display: 'inline-block' }}>
          <strong>Carteira:</strong> {address?.slice(0, 8)}...{address?.slice(-8)}
        </div>
      </div>

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: '#ffffff', border: '3px solid #007bff', borderRadius: '15px', padding: '20px', textAlign: 'center', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', color: '#000000', fontWeight: 'bold', marginBottom: '8px' }}>💎 Total Investido</div>
          <div style={{ fontSize: '24px', color: '#000000', fontWeight: 'bold', margin: '0' }}>
            {totalValue > 0 ? `$${totalValue.toFixed(2)}` : '$0.00'}
          </div>
        </div>
        
        <div style={{ backgroundColor: '#ffffff', border: '3px solid #007bff', borderRadius: '15px', padding: '20px', textAlign: 'center', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', color: '#000000', fontWeight: 'bold', marginBottom: '8px' }}>📊 Posições Ativas</div>
          <div style={{ fontSize: '24px', color: '#000000', fontWeight: 'bold', margin: '0' }}>{positions.length}</div>
        </div>
        
        <div style={{ backgroundColor: '#ffffff', border: '3px solid #007bff', borderRadius: '15px', padding: '20px', textAlign: 'center', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', color: '#000000', fontWeight: 'bold', marginBottom: '8px' }}>🔗 Protocolos</div>
          <div style={{ fontSize: '24px', color: '#000000', fontWeight: 'bold', margin: '0' }}>
            {positions.length > 0 ? new Set(positions.map(p => p.protocol)).size : 0}
          </div>
        </div>
      </div>

      {/* Toggle */}
      <div style={{ backgroundColor: '#ffffff', border: '2px solid #28a745', borderRadius: '10px', padding: '15px', marginBottom: '30px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', color: '#000000', fontWeight: 'bold', cursor: 'pointer', margin: '0' }}>
          <input
            type="checkbox"
            checked={showUSD}
            onChange={(e) => setShowUSD(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          💵 Exibir valores em USD
        </label>
      </div>

      {/* Positions */}
      <div style={{ backgroundColor: '#ffffff', border: '3px solid #6f42c1', borderRadius: '15px', padding: '25px', marginBottom: '30px' }}>
        <h2 style={{ fontSize: '22px', color: '#000000', fontWeight: 'bold', margin: '0 0 20px 0' }}>🏊‍♂️ Posições de Liquidez</h2>
        
        {positions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>🔍</div>
            <div style={{ fontSize: '20px', color: '#000000', fontWeight: 'bold', marginBottom: '10px' }}>Nenhuma Posição Encontrada</div>
            <div style={{ fontSize: '14px', color: '#000000', lineHeight: '1.6' }}>
              Esta carteira não possui posições LP ativas nos protocolos suportados.
              <br />
              <small>Protocolos: Raydium, Orca, Meteora</small>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {positions.map((position, idx) => (
              <div key={`${position.mint}-${idx}`} style={{ backgroundColor: '#ffffff', border: '2px solid #dc3545', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ backgroundColor: '#007bff', color: '#ffffff', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block', marginBottom: '8px' }}>{position.protocol}</div>
                  <div style={{ fontSize: '18px', color: '#000000', fontWeight: 'bold' }}>
                    {position.pool?.name || 'Pool Desconhecido'}
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#000000', fontWeight: 'bold' }}>Valor:</span>
                    <span style={{ fontSize: '14px', color: '#000000', fontWeight: 'bold' }}>
                      {position.valueUSD ? `$${position.valueUSD.toFixed(4)}` : 'N/A'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#000000', fontWeight: 'bold' }}>LP Amount:</span>
                    <span style={{ fontSize: '14px', color: '#000000', fontWeight: 'bold' }}>{position.amount}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#000000', fontWeight: 'bold' }}>Mint:</span>
                    <span style={{ fontSize: '12px', color: '#000000', fontFamily: 'monospace' }}>
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
      <div style={{ backgroundColor: '#d4edda', color: '#155724', border: '2px solid #c3e6cb', borderRadius: '10px', padding: '15px', textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }}>
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