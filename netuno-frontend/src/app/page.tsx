'use client';
import WalletConnection from "./components/WalletConnection";

export default function Home() {
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a1628 0%, #1e3a8a 50%, #0f172a 100%)',
    color: 'white',
    padding: '2rem 0',
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
      radial-gradient(circle at 75% 75%, rgba(64, 224, 255, 0.1) 0%, transparent 50%)
    `,
    pointerEvents: 'none'
  };

  const contentStyle: React.CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
    position: 'relative',
    zIndex: 1
  };

  const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '3rem'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '4rem',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #4fd1c7 0%, #40e0ff 50%, #8b5cf6 100%)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '1rem',
    textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    color: '#94a3b8',
    marginBottom: '2rem',
    fontWeight: '300'
  };

  const featuresBoxStyle: React.CSSProperties = {
    marginTop: '2rem',
    padding: '2rem',
    background: 'rgba(15, 23, 42, 0.8)',
    borderRadius: '20px',
    border: '1px solid rgba(79, 209, 197, 0.3)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)'
  };

  const featuresTitleStyle: React.CSSProperties = {
    fontSize: '1.3rem',
    color: '#4fd1c7',
    marginBottom: '1.5rem',
    fontWeight: 'bold'
  };

  const featureStyle: React.CSSProperties = {
    color: '#e2e8f0',
    fontSize: '1rem',
    marginBottom: '0.8rem',
    lineHeight: '1.6'
  };

  return (
    <div style={containerStyle}>
      <div style={backgroundEffectStyle} />
      <div style={contentStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>
            🌊 NETUNO
          </h1>
          <p style={subtitleStyle}>
            Dashboard DeFi Profissional para Liquidity Providers no Solana
          </p>
          
          <div style={featuresBoxStyle}>
            <h3 style={featuresTitleStyle}>
              ✨ Recursos Profissionais do NETUNO:
            </h3>
            <div style={{ textAlign: 'left' }}>
              <p style={featureStyle}>
                📊 <strong>Dashboard de Classe Mundial:</strong> Visualize todas suas posições LP com métricas profissionais em tempo real
              </p>
              <p style={featureStyle}>
                🚀 <strong>Performance Ultra-Rápida:</strong> Carregamento sub-segundo com cache inteligente e otimização de preços
              </p>
              <p style={featureStyle}>
                💎 <strong>Métricas Avançadas:</strong> APY, P&L 24h, fees coletadas, impermanent loss e health score
              </p>
              <p style={featureStyle}>
                🌊 <strong>Interface Oceânica:</strong> Design profissional inspirado no fundo do mar com tema Netuno
              </p>
              <p style={featureStyle}>
                🏊‍♂️ <strong>Multi-Protocolo:</strong> Suporte completo para Raydium, Orca, Meteora DLMM e mais
              </p>
              <p style={featureStyle}>
                📈 <strong>Análise Inteligente:</strong> Cálculos de posição precisos, utilização de pool e indicadores de risco
              </p>
            </div>
          </div>
        </div>
        
        <WalletConnection />
      </div>
    </div>
  );
}
