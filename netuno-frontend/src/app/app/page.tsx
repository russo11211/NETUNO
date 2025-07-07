'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Ocean-themed component imports
import OptimizedOceanDashboard from '../components/OptimizedOceanDashboard';
import Dashboard from '../components/Dashboard';
import ManageLPTab from './components/ManageLPTab';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [walletAddress, setWalletAddress] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Get address from URL params safely
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const address = urlParams.get('address') || '';
      setWalletAddress(address);
    }
  }, []);

  if (!isClient) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f7fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>Carregando aplicação...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(180deg, #0a1628 0%, #1e3a8a 50%, #0f172a 100%)'
    }}>
      {/* Ocean Header */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.9)',
        borderBottom: '1px solid rgba(79, 209, 197, 0.3)',
        padding: '1rem 0',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            fontSize: '1.8rem',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #4fd1c7 0%, #40e0ff 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            🌊 NETUNO
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>🔗</span>
            <span>Carteira:</span>
            <code style={{ 
              backgroundColor: 'rgba(79, 209, 197, 0.1)', 
              color: '#4fd1c7',
              padding: '0.25rem 0.5rem', 
              borderRadius: '6px',
              fontSize: '0.75rem',
              border: '1px solid rgba(79, 209, 197, 0.3)'
            }}>
              {walletAddress ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-8)}` : 'Não conectada'}
            </code>
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Hidden for Ocean Dashboard */}
      {activeTab !== 'dashboard' && (
      <div style={{
        background: 'rgba(15, 23, 42, 0.8)',
        borderBottom: '1px solid rgba(79, 209, 197, 0.3)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem',
          display: 'flex'
        }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              padding: '1rem 1.5rem',
              border: 'none',
              backgroundColor: activeTab === 'dashboard' ? '#f7fafc' : 'transparent',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderBottom: activeTab === 'dashboard' ? '2px solid #3182ce' : '2px solid transparent',
              color: activeTab === 'dashboard' ? '#3182ce' : '#718096'
            }}
          >
            <span>📊</span>
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            style={{
              padding: '1rem 1.5rem',
              border: 'none',
              backgroundColor: activeTab === 'manage' ? '#f7fafc' : 'transparent',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderBottom: activeTab === 'manage' ? '2px solid #3182ce' : '2px solid transparent',
              color: activeTab === 'manage' ? '#3182ce' : '#718096'
            }}
          >
            <span>⚙️</span>
            <span>Manage LP Pools</span>
          </button>
        </div>
      </div>
      )}

      {/* Content */}
      {activeTab === 'dashboard' ? (
        // Full-width Optimized Ocean Dashboard with React Query
        <OptimizedOceanDashboard address={walletAddress} />
      ) : (
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem'
      }}>
        {!walletAddress ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔗</div>
            <h2 style={{ color: '#2d3748', marginBottom: '0.5rem' }}>
              Nenhuma carteira conectada
            </h2>
            <p style={{ color: '#718096', marginBottom: '2rem' }}>
              Volte para a página inicial para conectar sua carteira Solana
            </p>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                backgroundColor: '#3182ce',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontSize: '1rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Voltar ao Início
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'manage' && <ManageLPTab address={walletAddress} />}
          </>
        )}
      </div>
      )}
    </div>
  );
}

const DynamicAppContent = dynamic(() => Promise.resolve(AppContent), {
  ssr: false,
  loading: () => (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f7fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div>Carregando aplicação...</div>
    </div>
  )
});

export default function AppPage() {
  return <DynamicAppContent />;
}