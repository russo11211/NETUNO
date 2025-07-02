'use client';
import { useEffect, useState } from 'react';

interface ManageLPTabProps {
  address: string;
}

interface Pool {
  name?: string;
  pool_name?: string;
  protocol: string;
  tvl?: number;
  apy?: number;
  volume24h?: number;
}

interface HistoryItem {
  id?: string;
  protocol: string;
  mint: string;
  closeDate?: string;
  initialValue?: number;
  finalValue?: number;
  totalFees?: number;
  openDate?: string;
}

export default function ManageLPTab({ address }: ManageLPTabProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [availablePools, setAvailablePools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'history' | 'discover'>('history');
  const [isClient, setIsClient] = useState(false);

  // Prevent hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!address || !isClient) return;
    
    setLoading(true);
    fetchManagementData();
  }, [address, isClient]);

  const fetchManagementData = async () => {
    try {
      // Fetch LP history
      const historyResponse = await fetch(`http://localhost:4000/lp-history?address=${address}`);
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setHistory(historyData.history || []);
      }

      // Mock available pools data (would come from DeFi protocols APIs)
      setAvailablePools([
        {
          name: 'SOL/USDC',
          protocol: 'Raydium',
          tvl: 45000000,
          apy: 12.5,
          volume24h: 2300000
        },
        {
          name: 'USDC/USDT',
          protocol: 'Orca',
          tvl: 28000000,
          apy: 8.2,
          volume24h: 1800000
        },
        {
          name: 'RAY/SOL',
          protocol: 'Raydium',
          tvl: 15000000,
          apy: 18.7,
          volume24h: 950000
        },
        {
          name: 'mSOL/SOL',
          protocol: 'Marinade',
          tvl: 12000000,
          apy: 6.8,
          volume24h: 450000
        }
      ]);

    } catch (err) {
      console.error('Error fetching management data:', err);
    } finally {
      setLoading(false);
    }
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  };

  const sectionStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  };

  const tabButtonStyle: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    borderRadius: '8px',
    transition: 'all 0.2s ease'
  };

  const activeTabStyle: React.CSSProperties = {
    ...tabButtonStyle,
    backgroundColor: '#3182ce',
    color: 'white'
  };

  const inactiveTabStyle: React.CSSProperties = {
    ...tabButtonStyle,
    color: '#718096',
    backgroundColor: '#f8fafc'
  };

  const poolCardStyle: React.CSSProperties = {
    padding: '1.5rem',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    marginBottom: '1rem',
    transition: 'all 0.2s ease',
    cursor: 'pointer'
  };

  const historyCardStyle: React.CSSProperties = {
    padding: '1rem',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    marginBottom: '1rem'
  };

  if (!isClient || loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e2e8f0',
          borderTop: '4px solid #3182ce',
          borderRadius: '50%',
          display: 'inline-block',
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem'
        }}></div>
        <p style={{ color: '#718096', fontSize: '1.125rem' }}>
          Carregando dados de gerenciamento...
        </p>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Section Tabs */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={() => setActiveSection('history')}
            style={activeSection === 'history' ? activeTabStyle : inactiveTabStyle}
          >
            📊 Histórico de Posições
          </button>
          <button
            onClick={() => setActiveSection('discover')}
            style={activeSection === 'discover' ? activeTabStyle : inactiveTabStyle}
          >
            🔍 Descobrir Pools
          </button>
        </div>

        {activeSection === 'history' && (
          <div>
            <h2 style={{ margin: '0 0 1.5rem 0', color: '#2d3748', fontSize: '1.5rem', fontWeight: 'bold' }}>
              📈 Histórico de Posições LP
            </h2>
            
            {history.length > 0 ? (
              <div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '1rem',
                  marginBottom: '2rem'
                }}>
                  <div style={{ padding: '1rem', backgroundColor: '#ebf8ff', borderRadius: '8px', border: '1px solid #3182ce' }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#2c5aa0' }}>
                      Total Fechadas
                    </p>
                    <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#2a4a6b' }}>
                      {history.length}
                    </p>
                  </div>
                  <div style={{ padding: '1rem', backgroundColor: '#f0fff4', borderRadius: '8px', border: '1px solid #38a169' }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#38a169' }}>
                      Total em Fees
                    </p>
                    <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#2f855a' }}>
                      {history.reduce((sum, item) => sum + (item.totalFees || 0), 0).toLocaleString('en-US', { 
                        style: 'currency', 
                        currency: 'USD' 
                      })}
                    </p>
                  </div>
                </div>

                {history.map((item, idx) => (
                  <div key={item.id || idx} style={historyCardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#2d3748', fontSize: '1.125rem', fontWeight: 'bold' }}>
                          {item.protocol}
                        </h3>
                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#718096' }}>
                          Mint: <code style={{ 
                            backgroundColor: '#f1f5f9', 
                            padding: '0.125rem 0.25rem', 
                            borderRadius: '4px',
                            fontSize: '0.75rem'
                          }}>
                            {item.mint.slice(0, 8)}...{item.mint.slice(-8)}
                          </code>
                        </p>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#718096' }}>
                          Fechado em: {item.closeDate ? new Date(item.closeDate).toLocaleDateString('pt-BR') : 'N/A'}
                        </p>
                      </div>
                      
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: '#718096' }}>Valor Inicial</p>
                          <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#2d3748' }}>
                            {item.initialValue ? 
                              item.initialValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : 
                              'N/A'
                            }
                          </p>
                        </div>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: '#718096' }}>Valor Final</p>
                          <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#2d3748' }}>
                            {item.finalValue ? 
                              item.finalValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : 
                              'N/A'
                            }
                          </p>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: '#718096' }}>Fees Coletadas</p>
                          <p style={{ 
                            margin: 0, 
                            fontSize: '1rem', 
                            fontWeight: '600', 
                            color: item.totalFees && item.totalFees > 0 ? '#38a169' : '#e53e3e'
                          }}>
                            {item.totalFees ? 
                              item.totalFees.toLocaleString('en-US', { 
                                style: 'currency', 
                                currency: 'USD',
                                signDisplay: 'always'
                              }) : 
                              'N/A'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
                <p style={{ color: '#718096', fontSize: '1.125rem', margin: '0 0 0.5rem 0' }}>
                  Nenhum histórico encontrado
                </p>
                <p style={{ color: '#a0aec0', fontSize: '0.875rem', margin: 0 }}>
                  Suas posições fechadas aparecerão aqui
                </p>
              </div>
            )}
          </div>
        )}

        {activeSection === 'discover' && (
          <div>
            <h2 style={{ margin: '0 0 1.5rem 0', color: '#2d3748', fontSize: '1.5rem', fontWeight: 'bold' }}>
              🔍 Pools Disponíveis para LP
            </h2>
            
            <div style={{ marginBottom: '2rem' }}>
              <p style={{ color: '#718096', fontSize: '1rem', margin: 0 }}>
                Explore as melhores oportunidades de liquidez nos principais protocolos DeFi do Solana
              </p>
            </div>

            {availablePools.map((pool, idx) => (
              <div 
                key={idx} 
                style={{
                  ...poolCardStyle,
                  ':hover': { borderColor: '#3182ce', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3182ce';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <h3 style={{ margin: 0, color: '#2d3748', fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {pool.name}
                      </h3>
                      <span style={{
                        fontSize: '0.75rem',
                        color: 'white',
                        backgroundColor: '#805ad5',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontWeight: '600'
                      }}>
                        {pool.protocol}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '2rem' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#718096' }}>TVL</p>
                        <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#2d3748' }}>
                          {pool.tvl ? 
                            pool.tvl.toLocaleString('en-US', { 
                              style: 'currency', 
                              currency: 'USD',
                              notation: 'compact',
                              maximumFractionDigits: 1
                            }) : 
                            'N/A'
                          }
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#718096' }}>APY</p>
                        <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#38a169' }}>
                          {pool.apy ? `${pool.apy}%` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#718096' }}>Volume 24h</p>
                        <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#2d3748' }}>
                          {pool.volume24h ? 
                            pool.volume24h.toLocaleString('en-US', { 
                              style: 'currency', 
                              currency: 'USD',
                              notation: 'compact',
                              maximumFractionDigits: 1
                            }) : 
                            'N/A'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    style={{
                      backgroundColor: '#3182ce',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#2c5aa0';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#3182ce';
                    }}
                  >
                    Fornecer Liquidez
                  </button>
                </div>
              </div>
            ))}

            <div style={{
              padding: '1.5rem',
              backgroundColor: '#fffaf0',
              border: '1px solid #ed8936',
              borderRadius: '8px',
              marginTop: '2rem'
            }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#c05621', fontSize: '1.125rem', fontWeight: 'bold' }}>
                ⚠️ Aviso Importante
              </h3>
              <p style={{ margin: 0, color: '#9c4221', fontSize: '0.875rem' }}>
                Fornecer liquidez envolve riscos, incluindo perda impermanente. 
                Sempre faça sua própria pesquisa antes de investir em pools de liquidez.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}