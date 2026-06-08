'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract } from 'wagmi';
import {
  CREDENTIALS_ADDRESS,
  CREDENTIALS_ABI,
  ISSUER_ROLE,
  DEFAULT_ADMIN_ROLE,
} from '../contracts/credentials';
import { Verifier } from './components/Verifier';
import { IssueCredentialForm } from './components/IssueCredentialForm';
import { AdminPanel } from '././components/AdminPanel';

function HomeContent() {
  const { address, isConnected } = useAccount();
  const searchParams = useSearchParams();
  const tokenIdParam = searchParams.get('tokenId') || undefined;

  const [activeTab, setActiveTab] = useState<'verify' | 'issue' | 'admin'>('verify');

  // Read Issuer Role
  const { data: isIssuer } = useReadContract({
    address: CREDENTIALS_ADDRESS,
    abi: CREDENTIALS_ABI,
    functionName: 'hasRole',
    args: address ? [ISSUER_ROLE, address] : undefined,
    query: { enabled: !!address },
  });

  // Read Admin Role
  const { data: isAdmin } = useReadContract({
    address: CREDENTIALS_ADDRESS,
    abi: CREDENTIALS_ABI,
    functionName: 'hasRole',
    args: address ? [DEFAULT_ADMIN_ROLE, address] : undefined,
    query: { enabled: !!address },
  });

  // If tokenIdParam is present, default to verify view
  useEffect(() => {
    if (tokenIdParam) {
      setActiveTab('verify');
    }
  }, [tokenIdParam]);

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: '3rem 1.5rem' }}>
      
      {/* HEADER SECTION */}
      <header style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <img 
              src="/logo.png" 
              alt="Logo UNLu" 
              style={{ width: '64px', height: '64px', objectFit: 'contain' }} 
            />
            <div>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, lineHeight: 1.2, color: 'var(--color-unlu-green)' }}>
                UNIVERSIDAD NACIONAL <span style={{ color: 'var(--color-unlu-blue)' }}>DE LUJÁN</span>
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: '0.25rem 0 0 0' }}>
                Registro y Verificación Descentralizada de Credenciales Académicas
              </p>
            </div>
          </div>
          <div>
            <ConnectButton showBalance={false} />
          </div>
        </div>

        {/* Status indicator for active roles */}
        {isConnected && (
          <div style={{ 
            background: '#ffffff', 
            border: '1px solid var(--border-color)', 
            borderRadius: '10px', 
            padding: '0.75rem 1rem', 
            display: 'flex', 
            flexWrap: 'wrap', 
            alignItems: 'center', 
            gap: '1rem',
            fontSize: '0.85rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>Wallet Conectada: <code className="mono-text">{address}</code></span>
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
              {isAdmin && <span className="badge-valid">🛡️ Administrador Rector</span>}
              {isIssuer && <span className="badge-valid" style={{ background: 'var(--warning-bg)', borderColor: 'var(--warning-border)', color: 'var(--warning-text)' }}>🎓 Emisor Oficial</span>}
              {!isAdmin && !isIssuer && <span style={{ background: '#f1f5f9', border: '1px solid var(--border-color)', padding: '0.25rem 0.5rem', borderRadius: '6px', color: 'var(--text-secondary)', fontWeight: 600 }}>👤 Consultor Público</span>}
            </div>
          </div>
        )}
      </header>

      {/* DASHBOARD NAVIGATION TABS */}
      <div className="tab-container" style={{ marginBottom: '2rem', padding: '0.35rem' }}>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'verify' ? 'active' : ''}`}
          onClick={() => setActiveTab('verify')}
          style={{
            padding: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <span>🔍</span> Verificar Título
        </button>

        {isConnected && isIssuer && (
          <button
            type="button"
            className={`tab-btn ${activeTab === 'issue' ? 'active' : ''}`}
            onClick={() => setActiveTab('issue')}
            style={{
              padding: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <span>🎓</span> Emitir y Revocar
          </button>
        )}

        {isConnected && isAdmin && (
          <button
            type="button"
            className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
            style={{
              padding: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <span>🛡️</span> Administración (Rectorado)
          </button>
        )}
      </div>

      {/* DASHBOARD CONTENT VIEWS */}
      <div style={{ minHeight: '400px' }}>
        {activeTab === 'verify' && <Verifier initialTokenId={tokenIdParam} />}
        {activeTab === 'issue' && isConnected && isIssuer && <IssueCredentialForm />}
        {activeTab === 'admin' && isConnected && isAdmin && <AdminPanel />}

        {/* Notice for connected non-issuers when looking for tools */}
        {isConnected && !isIssuer && !isAdmin && activeTab !== 'verify' && (
          <div className="card fade-in" style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Tu wallet conectada no cuenta con permisos administrativos o de emisión (<code>ISSUER_ROLE</code> / <code>DEFAULT_ADMIN_ROLE</code>). 
              <br />
              Solo podés verificar credenciales de manera pública. Si representás a un departamento de la universidad, solicitá tu asignación en el rectorado.
            </p>
          </div>
        )}
      </div>

      {/* FOOTER SECTION */}
      <footer style={{ 
        marginTop: '5rem', 
        paddingTop: '2rem', 
        borderTop: '1px solid var(--border-color)', 
        textAlign: 'center', 
        fontSize: '0.85rem', 
        color: 'var(--text-muted)' 
      }}>
        <p>© {new Date().getFullYear()} Universidad Nacional de Luján · Secretaría Académica</p>
        <p style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>
          Desarrollado sobre Base & Ethereum Sepolia Testnet · dApp de Credenciales Académicas Soulbound · Trabajo Final de dApps · Diplomatura Blockchain UNLu 2026
        </p>
      </footer>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text-primary)', backgroundColor: 'var(--background-color)' }}>
        <p style={{ fontSize: '1.2rem', fontWeight: 500 }}>Cargando aplicación UNLu...</p>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
