'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Simple component imports
import DashboardTab from './components/DashboardTab';
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f7fafc' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '1rem 0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
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
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#3182ce'
          }}>
            🌊 App Netuno
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#718096',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>🔗</span>
            <span>Carteira:</span>
            <code style={{ 
              backgroundColor: '#f1f5f9', 
              padding: '0.25rem 0.5rem', 
              borderRadius: '4px',
              fontSize: '0.75rem'
            }}>
              {walletAddress ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-8)}` : 'Não conectada'}
            </code>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0'
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

      {/* Content */}
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
            {activeTab === 'dashboard' && <DashboardTab address={walletAddress} />}
            {activeTab === 'manage' && <ManageLPTab address={walletAddress} />}
          </>
        )}
      </div>
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