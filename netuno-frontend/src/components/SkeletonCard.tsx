'use client';

import React from 'react';

// 🎨 Skeleton styles
const SkeletonCardStyles = {
  card: {
    background: 'linear-gradient(135deg, #0f1419 0%, #1a365d 50%, #2c5aa0 100%)',
    border: '1px solid rgba(79, 209, 197, 0.3)',
    borderRadius: '20px',
    padding: '24px',
    margin: '16px 0',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
    backdropFilter: 'blur(10px)',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    color: 'white',
  },
  shimmer: {
    position: 'absolute' as const,
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(79, 209, 197, 0.1), transparent)',
    animation: 'shimmer 2s infinite',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
  },
  badge: {
    width: '120px',
    height: '24px',
    background: 'rgba(79, 209, 197, 0.2)',
    borderRadius: '25px',
    marginBottom: '8px',
  },
  title: {
    width: '200px',
    height: '24px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    marginTop: '8px',
  },
  value: {
    width: '120px',
    height: '32px',
    background: 'rgba(79, 209, 197, 0.2)',
    borderRadius: '8px',
  },
  metrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '12px',
    marginBottom: '20px',
  },
  metricCard: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '12px',
    backdropFilter: 'blur(5px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  metricLabel: {
    width: '80px',
    height: '12px',
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '4px',
    marginBottom: '8px',
  },
  metricValue: {
    width: '60px',
    height: '18px',
    background: 'rgba(255, 255, 255, 0.3)',
    borderRadius: '4px',
    marginBottom: '4px',
  },
  metricSubtitle: {
    width: '50px',
    height: '10px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
  },
  composition: {
    marginTop: '20px',
  },
  compositionTitle: {
    width: '150px',
    height: '16px',
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    marginBottom: '16px',
  },
  progressBar: {
    width: '100%',
    height: '16px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '12px',
    marginBottom: '16px',
    border: '1px solid rgba(79, 209, 197, 0.3)',
    overflow: 'hidden' as const,
  },
  progress: {
    width: '60%',
    height: '100%',
    background: 'linear-gradient(90deg, #4fd1c7 0%, #40e0ff 100%)',
    borderRadius: '12px',
    opacity: 0.6,
  },
  tokenDetails: {
    display: 'flex',
    gap: '16px',
  },
  tokenCard: {
    flex: 1,
    padding: '16px',
    background: 'rgba(79, 209, 197, 0.1)',
    borderRadius: '12px',
    border: '1px solid rgba(79, 209, 197, 0.3)',
    backdropFilter: 'blur(5px)',
  },
  tokenName: {
    width: '60px',
    height: '14px',
    background: 'rgba(79, 209, 197, 0.4)',
    borderRadius: '6px',
    marginBottom: '8px',
  },
  tokenAmount: {
    width: '80px',
    height: '20px',
    background: 'rgba(255, 255, 255, 0.3)',
    borderRadius: '6px',
    marginBottom: '4px',
  },
  tokenValue: {
    width: '70px',
    height: '14px',
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '4px',
  },
} as const;

// 🌊 CSS Animation for shimmer effect
const shimmerKeyframes = `
  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
`;

// 🎯 Main Skeleton Card Component
export function SkeletonCard() {
  return (
    <>
      {/* Inject CSS animation */}
      <style>{shimmerKeyframes}</style>
      
      <div style={SkeletonCardStyles.card}>
        {/* Shimmer effect overlay */}
        <div style={SkeletonCardStyles.shimmer} />
        
        {/* Animated Ocean Background Effect */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 80%, rgba(79, 209, 197, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(64, 224, 255, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none',
        }} />

        {/* Header Skeleton */}
        <div style={SkeletonCardStyles.header}>
          <div>
            <div style={SkeletonCardStyles.badge} />
            <div style={SkeletonCardStyles.title} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={SkeletonCardStyles.value} />
            <div style={{ 
              width: '80px', 
              height: '14px', 
              background: 'rgba(255, 255, 255, 0.2)', 
              borderRadius: '4px',
              marginTop: '8px' 
            }} />
          </div>
        </div>

        {/* Metrics Grid Skeleton */}
        <div style={SkeletonCardStyles.metrics}>
          {[...Array(4)].map((_, index) => (
            <div key={index} style={SkeletonCardStyles.metricCard}>
              <div style={SkeletonCardStyles.metricLabel} />
              <div style={SkeletonCardStyles.metricValue} />
              <div style={SkeletonCardStyles.metricSubtitle} />
            </div>
          ))}
        </div>

        {/* Token Composition Skeleton */}
        <div style={SkeletonCardStyles.composition}>
          <div style={SkeletonCardStyles.compositionTitle} />
          
          {/* Progress Bar Skeleton */}
          <div style={SkeletonCardStyles.progressBar}>
            <div style={SkeletonCardStyles.progress} />
          </div>

          {/* Token Details Skeleton */}
          <div style={SkeletonCardStyles.tokenDetails}>
            {/* Token X */}
            <div style={SkeletonCardStyles.tokenCard}>
              <div style={SkeletonCardStyles.tokenName} />
              <div style={SkeletonCardStyles.tokenAmount} />
              <div style={SkeletonCardStyles.tokenValue} />
            </div>

            {/* Token Y */}
            <div style={{
              ...SkeletonCardStyles.tokenCard,
              background: 'rgba(64, 224, 255, 0.1)',
              border: '1px solid rgba(64, 224, 255, 0.3)',
            }}>
              <div style={{
                ...SkeletonCardStyles.tokenName,
                background: 'rgba(64, 224, 255, 0.4)',
              }} />
              <div style={SkeletonCardStyles.tokenAmount} />
              <div style={SkeletonCardStyles.tokenValue} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// 🎯 Metrics Grid Skeleton (for dashboard summary)
export function SkeletonMetrics() {
  const metricCardStyle = {
    padding: '2rem',
    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 58, 138, 0.7) 100%)',
    border: '1px solid rgba(79, 209, 197, 0.3)',
    borderRadius: '20px',
    backdropFilter: 'blur(15px)',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
    position: 'relative' as const,
    overflow: 'hidden' as const,
  };

  const labelStyle = {
    width: '120px',
    height: '14px',
    background: 'rgba(79, 209, 197, 0.3)',
    borderRadius: '6px',
    marginBottom: '12px',
  };

  const valueStyle = {
    width: '100px',
    height: '40px',
    background: 'rgba(226, 232, 240, 0.3)',
    borderRadius: '8px',
  };

  return (
    <>
      <style>{shimmerKeyframes}</style>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2rem',
        marginBottom: '3rem'
      }}>
        {[...Array(4)].map((_, index) => (
          <div key={index} style={metricCardStyle}>
            <div style={SkeletonCardStyles.shimmer} />
            <div style={labelStyle} />
            <div style={valueStyle} />
          </div>
        ))}
      </div>
    </>
  );
}

// 🎯 Compact Skeleton for list items
export function SkeletonListItem() {
  return (
    <>
      <style>{shimmerKeyframes}</style>
      
      <div style={{
        ...SkeletonCardStyles.card,
        padding: '16px',
        margin: '8px 0',
      }}>
        <div style={SkeletonCardStyles.shimmer} />
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{
              width: '80px',
              height: '16px',
              background: 'rgba(79, 209, 197, 0.3)',
              borderRadius: '6px',
              marginBottom: '8px',
            }} />
            <div style={{
              width: '120px',
              height: '14px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
            }} />
          </div>
          
          <div style={{
            width: '80px',
            height: '24px',
            background: 'rgba(79, 209, 197, 0.3)',
            borderRadius: '6px',
          }} />
        </div>
      </div>
    </>
  );
}

export default SkeletonCard;