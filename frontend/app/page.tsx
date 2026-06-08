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
import { AdminPanel } from './components/AdminPanel';

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Elegant SVG Logo representation of UNLu Phoenix/Academic Shield */}
            <div style={{ 
              background: 'linear-gradient(135deg, var(--color-unlu-navy) 0%, #153e70 100%)', 
              padding: '0.75rem', 
              borderRadius: '12px', 
              boxShadow: '0 4px 15px rgba(12, 50, 96, 0.4)',
              border: '1px solid rgba(229, 193, 88, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L1 7L12 12L21 7.82V13.5C21 13.5 19 14.5 17 14.5C15 14.5 13 13.5 13 13.5V11L12 11.5L2 7L12 2Z" fill="var(--color-unlu-gold)"/>
                <path d="M12 12.5V22C12 22 7.5 20 6.5 16.5C5.5 13 5.5 13 5.5 13L12 12.5Z" fill="#fff" opacity="0.9"/>
                <path d="M12 12.5V22C12 22 16.5 20 17.5 16.5C18.5 13 18.5 13 18.5 13L12 12.5Z" fill="var(--color-unlu-red)" opacity="0.9"/>
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
                UNIVERSIDAD NACIONAL <span style={{ color: 'var(--color-unlu-gold)' }}>DE LUJÁN</span>
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
            background: 'rgba(255, 255, 255, 0.03)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '10px', 
            padding: '0.75rem 1rem', 
            display: 'flex', 
            flexWrap: 'wrap', 
            alignItems: 'center', 
            gap: '1rem',
            fontSize: '0.85rem' 
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>Wallet Conectada: <code className="mono-text" style={{ fontSize: '0.8rem' }}>{address}</code></span>
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
              {isAdmin && <span className="badge-valid" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>🛡️ Administrador Rector</span>}
              {isIssuer && <span className="badge-valid" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'rgba(229, 193, 88, 0.1)', borderColor: 'rgba(229, 193, 88, 0.3)', color: 'var(--color-unlu-gold)' }}>🎓 Emisor Oficial</span>}
              {!isAdmin && !isIssuer && <span style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', padding: '0.25rem 0.5rem', borderRadius: '6px', color: 'var(--text-secondary)' }}>👤 Consultor Público</span>}
            </div>
          </div>
        )}
      </header>

      {/* DASHBOARD NAVIGATION TABS */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '2rem', 
        background: 'rgba(17, 25, 46, 0.5)', 
        padding: '0.5rem', 
        borderRadius: '12px',
        border: '1px solid var(--border-color)'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('verify')}
          style={{
            flex: 1,
            padding: '1rem',
            background: activeTab === 'verify' ? 'linear-gradient(135deg, var(--color-unlu-navy), #153e70)' : 'transparent',
            border: activeTab === 'verify' ? '1px solid rgba(229, 193, 88, 0.3)' : 'none',
            color: activeTab === 'verify' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 600,
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'var(--transition-smooth)',
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
            onClick={() => setActiveTab('issue')}
            style={{
              flex: 1,
              padding: '1rem',
              background: activeTab === 'issue' ? 'linear-gradient(135deg, var(--color-unlu-navy), #153e70)' : 'transparent',
              border: activeTab === 'issue' ? '1px solid rgba(229, 193, 88, 0.3)' : 'none',
              color: activeTab === 'issue' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)',
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
            onClick={() => setActiveTab('admin')}
            style={{
              flex: 1,
              padding: '1rem',
              background: activeTab === 'admin' ? 'linear-gradient(135deg, var(--color-unlu-navy), #153e70)' : 'transparent',
              border: activeTab === 'admin' ? '1px solid rgba(229, 193, 88, 0.3)' : 'none',
              color: activeTab === 'admin' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)',
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
          Desarrollado sobre Base & Ethereum Sepolia Testnet · dApp de Credenciales Académicas Soulbound · Trabajo Final de Diplomatura
        </p>
      </footer>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#fff', backgroundColor: '#080d1a' }}>
        <p style={{ fontSize: '1.2rem', fontWeight: 500 }}>Cargando aplicación UNLu...</p>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
