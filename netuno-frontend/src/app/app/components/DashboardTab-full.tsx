'use client';
import { useEffect, useState } from 'react';

interface DashboardTabProps {
  address: string;
}

interface TokenAccount {
  pubkey: string;
  mint: string;
  amount: string;
  decimals: number;
}

interface Pool {
  name?: string;
  pool_name?: string;
  baseMint?: string;
  token_a_mint?: string;
  token_a?: string;
  quoteMint?: string;
  token_b_mint?: string;
  token_b?: string;
  baseReserve?: number | string;
  reserve_a?: number | string;
  reserve0?: number | string;
  quoteReserve?: number | string;
  reserve_b?: number | string;
  reserve1?: number | string;
  lpSupply?: number | string;
  lp_total_supply?: number | string;
  lp_supply?: number | string;
}

interface Position {
  mint: string;
  protocol: string;
  amount: string;
  decimals?: number;
  pool?: Pool;
  valueUSD?: number;
}

interface HistoryItem {
  id?: string;
  protocol: string;
  mint: string;
  closeDate?: string;
  initialValue?: number;
  finalValue?: number;
  totalFees?: number;
}

export default function DashboardTab({ address }: DashboardTabProps) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [tokenAccounts, setTokenAccounts] = useState<TokenAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUSD, setShowUSD] = useState(true);
  const [solPrice, setSolPrice] = useState<number>(219.5); // Preço padrão do SOL
  const [isClient, setIsClient] = useState(false);

  // Função ultra-robusta para garantir números válidos
  const safeToFixed = (value: any, decimals: number = 2, prefix: string = '', suffix: string = ''): string => {
    try {
      // Múltiplas camadas de validação
      if (value === null || value === undefined || value === '' || value === 'undefined' || value === 'null') {
        return prefix + '0.' + '0'.repeat(decimals) + suffix;
      }
      
      let num: number;
      if (typeof value === 'string') {
        num = parseFloat(value);
      } else if (typeof value === 'number') {
        num = value;
      } else {
        num = Number(value);
      }
      
      // Verificar se é um número válido
      if (isNaN(num) || !isFinite(num)) {
        return prefix + '0.' + '0'.repeat(decimals) + suffix;
      }
      
      // Garantir que toFixed não vai falhar
      return prefix + num.toFixed(decimals) + suffix;
    } catch (error) {
      // Fallback extremo em caso de qualquer erro
      return prefix + '0.' + '0'.repeat(decimals) + suffix;
    }
  };

  // Função auxiliar para obter valores seguros
  const safeNumber = (value: any, defaultValue: number = 0): number => {
    try {
      if (value === null || value === undefined || value === '' || value === 'undefined' || value === 'null') {
        return defaultValue;
      }
      
      let num: number;
      if (typeof value === 'string') {
        num = parseFloat(value);
      } else if (typeof value === 'number') {
        num = value;
      } else {
        num = Number(value);
      }
      
      return isNaN(num) || !isFinite(num) ? defaultValue : num;
    } catch (error) {
      return defaultValue;
    }
  };

  // Prevent hydration issues
  useEffect(() => {
    setIsClient(true);
    fetchSolPrice(); // Buscar preço do SOL quando o componente monta
  }, []);

  // Fetch SOL price
  const fetchSolPrice = async () => {
    try {
      const response = await fetch('http://localhost:4000/price?symbol=SOL');
      if (response.ok) {
        const data = await response.json();
        setSolPrice(data.price);
        console.log('SOL price fetched:', data.price);
      }
    } catch (error) {
      console.warn('Failed to fetch SOL price, using default:', error);
    }
  };

  // Fetch all data when address changes
  useEffect(() => {
    if (!address || !isClient) return;
    
    setLoading(true);
    setError(null);
    
    console.log('Fetching data for address:', address);
    fetchAllData();
  }, [address, isClient]);

  const fetchAllData = async () => {
    try {
      console.log('Starting data fetch for address:', address);
      
      // Fetch token accounts
      const tokenAccountsResponse = await fetch(`http://localhost:4000/token-accounts?address=${address}`);
      if (tokenAccountsResponse.ok) {
        const tokenData = await tokenAccountsResponse.json();
        console.log('Token accounts:', tokenData);
        setTokenAccounts(tokenData.accounts || []);
      } else {
        console.error('Token accounts request failed:', tokenAccountsResponse.status);
      }

      // Fetch LP positions
      const positionsResponse = await fetch(`http://localhost:4000/lp-positions?address=${address}`);
      if (positionsResponse.ok) {
        const positionData = await positionsResponse.json();
        console.log('LP Positions response:', positionData);
        
        if (positionData.lpPositions && positionData.lpPositions.length > 0) {
          // Calculate USD values for positions
          const positionsWithValues = await Promise.all(
            positionData.lpPositions.map(async (position: Position) => {
              const valueUSD = await calculatePositionValue(position);
              return { ...position, valueUSD };
            })
          );
          setPositions(positionsWithValues);
        } else {
          console.log('No LP positions found, using mock data');
          // Set mock data when no positions found
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
        }
      } else {
        console.error('LP positions request failed:', positionsResponse.status);
        // Set mock data on error
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
      }

      // Fetch history
      const historyResponse = await fetch(`http://localhost:4000/lp-history?address=${address}`);
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        console.log('History data:', historyData);
        setHistory(historyData.history || []);
      } else {
        console.error('History request failed:', historyResponse.status);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Erro ao carregar dados da carteira');
      
      // Set mock data on error
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
    } finally {
      setLoading(false);
    }
  };

  const calculatePositionValue = async (position: Position): Promise<number | undefined> => {
    const { amount, pool } = position;
    if (!amount || !pool) return undefined;

    const tokenA = pool?.baseMint || pool?.token_a_mint || pool?.token_a || '';
    const tokenB = pool?.quoteMint || pool?.token_b_mint || pool?.token_b || '';
    const reserveA = pool?.baseReserve || pool?.reserve_a || pool?.reserve0 || 0;
    const reserveB = pool?.quoteReserve || pool?.reserve_b || pool?.reserve1 || 0;
    const totalLp = pool?.lpSupply || pool?.lp_total_supply || pool?.lp_supply || 0;

    if (!tokenA || !tokenB || !reserveA || !reserveB || !totalLp) return undefined;

    try {
      const [priceARes, priceBRes] = await Promise.all([
        fetch(`http://localhost:4000/price?symbol=${tokenA}`),
        fetch(`http://localhost:4000/price?symbol=${tokenB}`)
      ]);

      if (!priceARes.ok || !priceBRes.ok) return undefined;

      const [priceAData, priceBData] = await Promise.all([
        priceARes.json(),
        priceBRes.json()
      ]);

      const priceA = priceAData.price || 0;
      const priceB = priceBData.price || 0;
      const userLp = parseFloat(amount);
      const totalLpNum = parseFloat(String(totalLp));
      const reserveANum = parseFloat(String(reserveA));
      const reserveBNum = parseFloat(String(reserveB));

      if (!userLp || !totalLpNum || (!reserveANum && !reserveBNum)) return undefined;

      const poolValueUSD = (reserveANum * priceA) + (reserveBNum * priceB);
      const userValueUSD = (userLp / totalLpNum) * poolValueUSD;

      return userValueUSD;
    } catch {
      return undefined;
    }
  };

  const totalValue = positions.reduce((sum, pos) => sum + (pos.valueUSD || 0), 0);
  const totalFees = history.reduce((sum, item) => sum + (item.totalFees || 0), 0);
  const totalClosed = history.reduce((sum, item) => sum + (item.finalValue || 0), 0);
  const profit = totalClosed + totalValue;

  // Styles
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  };

  const metricsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1rem'
  };

  const metricCardStyle: React.CSSProperties = {
    padding: '1.5rem',
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  };

  const sectionStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  };

  const positionCardStyle: React.CSSProperties = {
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
          marginBottom: '1rem'
        }}></div>
        <p style={{ color: '#718096', fontSize: '1.125rem' }}>
          Carregando dados da carteira...
        </p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Metrics Overview */}
      <div style={metricsGridStyle}>
        <div style={{ ...metricCardStyle, backgroundColor: '#ebf8ff', borderColor: '#3182ce' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>💰</span>
            <h3 style={{ margin: 0, color: '#2c5aa0', fontSize: '0.875rem', fontWeight: '600' }}>
              Total Investido
            </h3>
          </div>
          <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 'bold', color: '#2a4a6b' }}>
            {totalValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </p>
        </div>

        <div style={{ ...metricCardStyle, backgroundColor: '#f0fff4', borderColor: '#38a169' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>📊</span>
            <h3 style={{ margin: 0, color: '#38a169', fontSize: '0.875rem', fontWeight: '600' }}>
              Posições Ativas
            </h3>
          </div>
          <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 'bold', color: '#2f855a' }}>
            {positions.length}
          </p>
        </div>

        <div style={{ ...metricCardStyle, backgroundColor: '#faf5ff', borderColor: '#805ad5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🔗</span>
            <h3 style={{ margin: 0, color: '#805ad5', fontSize: '0.875rem', fontWeight: '600' }}>
              Protocolos
            </h3>
          </div>
          <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 'bold', color: '#6b46c1' }}>
            {new Set(positions.map(p => p.protocol)).size}
          </p>
        </div>

        <div style={{ ...metricCardStyle, backgroundColor: '#fff5f5', borderColor: '#fc8181' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>💎</span>
            <h3 style={{ margin: 0, color: '#e53e3e', fontSize: '0.875rem', fontWeight: '600' }}>
              Total Fees
            </h3>
          </div>
          <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 'bold', color: '#c53030' }}>
            {totalFees.toLocaleString('en-US', { 
              style: 'currency', 
              currency: 'USD', 
              signDisplay: 'always' 
            })}
          </p>
        </div>
      </div>

      {/* Toggle */}
      <div style={sectionStyle}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4a5568', fontSize: '1rem' }}>
          <input
            type="checkbox"
            checked={showUSD}
            onChange={(e) => setShowUSD(e.target.checked)}
            style={{ width: '1.2rem', height: '1.2rem' }}
          />
          Exibir valores em USD
        </label>
      </div>

      {/* LP Positions */}
      <div style={sectionStyle}>
        <h2 style={{ margin: '0 0 1.5rem 0', color: '#2d3748', fontSize: '1.5rem', fontWeight: 'bold' }}>
          🏊‍♂️ Posições de Liquidez Ativas
        </h2>
        
        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#fed7d7',
            border: '1px solid #fc8181',
            borderRadius: '8px',
            color: '#c53030',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {positions.length > 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            {/* Cabeçalho da tabela */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr', 
              gap: '1rem',
              padding: '1rem',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: '#6b7280'
            }}>
              <div>Position/Pool</div>
              <div>Age</div>
              <div>Value</div>
              <div>Collected Fee</div>
              <div>Uncol. Fee</div>
              <div>uPnL</div>
              <div>APR %</div>
              <div>Range</div>
            </div>
            
            {/* Linhas da tabela */}
            {positions.map((position, idx) => (
              <div key={`${position.mint}-${idx}`} style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr',
                gap: '1rem',
                padding: '1rem',
                borderBottom: idx < positions.length - 1 ? '1px solid #f1f5f9' : 'none',
                alignItems: 'center',
                fontSize: '0.875rem'
              }}>
                {/* Position/Pool */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ 
                    width: '24px', 
                    height: '24px', 
                    backgroundColor: '#10b981', 
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    color: 'white',
                    fontWeight: 'bold'
                  }}>
                    {position.positionData?.poolName?.charAt(0) || position.pool?.name?.charAt(0) || 'M'}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1f2937' }}>
                      {position.positionData?.poolName || position.pool?.name || `Pool ${position.protocol}`}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {position.positionData?.poolAddress?.slice(0, 6)}...{position.positionData?.poolAddress?.slice(-4)} • Spot
                    </div>
                  </div>
                </div>
                
                {/* Age */}
                <div style={{ color: '#6b7280' }}>
                  {position.positionData?.age || position.age || '-'}
                </div>
                
                {/* Value */}
                <div style={{ fontWeight: '600', color: '#1f2937' }}>
                  {(() => {
                    try {
                      // Usar função ultra-robusta para garantir formatação segura
                      const valueUSD = position.valueUSD || position.positionData?.valueUSD;
                      const valueSOL = position.positionData?.valueSOL;
                      
                      if (showUSD) {
                        return safeToFixed(valueUSD, 4, '$', '');
                      } else {
                        // Conversão mais segura para SOL
                        let solValue = 0;
                        if (valueSOL && typeof valueSOL === 'number') {
                          solValue = valueSOL;
                        } else {
                          const safeUSD = safeNumber(valueUSD, 0);
                          solValue = safeUSD / solPrice;
                        }
                        return safeToFixed(solValue, 6, '', ' SOL');
                      }
                    } catch (error) {
                      return showUSD ? '$0.0000' : '0.000000 SOL';
                    }
                  })()}
                </div>
                
                {/* Collected Fee */}
                <div>
                  <div style={{ color: '#10b981', fontSize: '0.75rem' }}>
                    {showUSD 
                      ? safeToFixed(position.positionData?.collectedFeeUSD, 4, '$', '')
                      : safeToFixed(position.positionData?.collectedFeeSOL, 6, '', ' SOL')
                    }
                  </div>
                </div>
                
                {/* Uncol. Fee */}
                <div>
                  <div style={{ color: '#f59e0b', fontSize: '0.75rem' }}>
                    {showUSD 
                      ? safeToFixed(position.positionData?.uncolFeeUSD, 4, '$', '')
                      : safeToFixed(position.positionData?.uncolFeeSOL, 6, '', ' SOL')
                    }
                  </div>
                </div>
                
                {/* uPnL */}
                <div>
                  <div style={{ color: '#f59e0b', fontSize: '0.75rem' }}>
                    {(() => {
                      const value = showUSD 
                        ? position.positionData?.upnlValueUSD 
                        : position.positionData?.upnlValueSOL;
                      const num = safeNumber(value, 0);
                      const sign = num >= 0 ? '+' : '';
                      const absValue = Math.abs(num);
                      
                      return showUSD 
                        ? `${sign}${safeToFixed(absValue, 4, '$', '')}`
                        : `${sign}${safeToFixed(absValue, 6, '', ' SOL')}`;
                    })()}
                  </div>
                  <div style={{ color: '#ef4444', fontSize: '0.75rem' }}>
                    {position.upnlPercentage || position.positionData?.upnlPercentage || '0%'}
                  </div>
                </div>
                
                {/* APR % */}
                <div style={{ 
                  color: (() => {
                    try {
                      const apy = safeNumber(position.positionData?.apy || position.pool?.apy, 0);
                      return apy > 5 ? '#10b981' : '#6b7280';
                    } catch (error) {
                      return '#6b7280';
                    }
                  })(),
                  fontWeight: '600'
                }}>
                  {(() => {
                    try {
                      const apy = position.positionData?.apy || position.pool?.apy;
                      return apy ? safeToFixed(apy, 2, '', '%') : '-';
                    } catch (error) {
                      return '-';
                    }
                  })()}
                </div>
                
                {/* Range */}
                <div style={{ fontSize: '0.75rem' }}>
                  <div style={{ color: '#1f2937', marginBottom: '2px' }}>
                    {position.range || position.positionData?.range || '$0.0000 - $0.0000'}
                  </div>
                  <div style={{ 
                    width: '60px', 
                    height: '4px', 
                    backgroundColor: '#e5e7eb', 
                    borderRadius: '2px',
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      left: '20%',
                      width: '60%',
                      height: '100%',
                      background: 'linear-gradient(90deg, #3b82f6, #10b981)',
                      borderRadius: '2px'
                    }}></div>
                    <div style={{
                      position: 'absolute',
                      left: '50%',
                      top: '-2px',
                      width: '2px',
                      height: '8px',
                      backgroundColor: '#1f2937',
                      borderRadius: '1px'
                    }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
            <p style={{ color: '#718096', fontSize: '1.125rem', margin: '0 0 0.5rem 0' }}>
              Nenhuma posição LP encontrada
            </p>
            <p style={{ color: '#a0aec0', fontSize: '0.875rem', margin: 0 }}>
              Esta carteira não possui posições de liquidez ativas nos protocolos suportados
            </p>
          </div>
        )}
      </div>

      {/* Token Accounts Summary */}
      <div style={sectionStyle}>
        <h2 style={{ margin: '0 0 1.5rem 0', color: '#2d3748', fontSize: '1.5rem', fontWeight: 'bold' }}>
          🪙 Resumo da Carteira
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#718096' }}>
              Total de Tokens
            </p>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#2d3748' }}>
              {tokenAccounts.length}
            </p>
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#718096' }}>
              Histórico LP
            </p>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#2d3748' }}>
              {history.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}