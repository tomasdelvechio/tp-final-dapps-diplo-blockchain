'use client';

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { CREDENTIALS_ADDRESS, CREDENTIALS_ABI } from '../../contracts/credentials';

export function AdminPanel() {
  const { chain } = useAccount();
  const [targetAddress, setTargetAddress] = useState('');
  const [adminAction, setAdminAction] = useState<'grant' | 'revoke'>('grant');

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const explorerUrl = chain?.blockExplorers?.default.url || 'https://sepolia.basescan.org';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetAddress.startsWith('0x') || targetAddress.length !== 42) {
      alert('Por favor, ingresá una dirección de wallet válida (0x...)');
      return;
    }

    reset();

    if (adminAction === 'grant') {
      writeContract({
        address: CREDENTIALS_ADDRESS,
        abi: CREDENTIALS_ABI,
        functionName: 'grantIssuer',
        args: [targetAddress as `0x${string}`],
      } as any);
    } else {
      writeContract({
        address: CREDENTIALS_ADDRESS,
        abi: CREDENTIALS_ABI,
        functionName: 'revokeIssuer',
        args: [targetAddress as `0x${string}`],
      } as any);
    }
  }

  return (
    <section className="card fade-in" style={{ marginBottom: '1.5rem' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <span>🛡️</span> Panel de Administración (Super-Admin)
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Como rector o administrador central de la UNLu, podés autorizar o revocar departamentos o autoridades (Issuers) para que emitan títulos oficiales.
      </p>

      <div className="tab-container">
        <button
          type="button"
          className={`tab-btn ${adminAction === 'grant' ? 'active' : ''}`}
          onClick={() => { setAdminAction('grant'); reset(); }}
        >
          Autorizar Emisor
        </button>
        <button
          type="button"
          className={`tab-btn ${adminAction === 'revoke' ? 'active' : ''}`}
          onClick={() => { setAdminAction('revoke'); reset(); }}
        >
          Revocar Emisor
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="form-group">
          <label className="form-label">Dirección (Wallet Address) del Emisor</label>
          <input
            type="text"
            className="form-input"
            placeholder="0x..."
            value={targetAddress}
            onChange={(e) => setTargetAddress(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isPending || confirming}
          className={adminAction === 'grant' ? 'btn-primary' : 'btn-danger'}
        >
          {isPending
            ? 'Confirmá en tu wallet...'
            : confirming
              ? 'Procesando transacción...'
              : adminAction === 'grant'
                ? 'Autorizar como Emisor (Grant)'
                : 'Quitar Autorización de Emisor (Revoke)'}
        </button>
      </form>

      {isSuccess && hash && (
        <div className="alert-success fade-in">
          <p style={{ margin: 0, fontWeight: 600 }}>
            🎉 Operación completada con éxito.
          </p>
          <a
            href={`${explorerUrl}/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '0.85rem', textDecoration: 'underline', marginTop: '0.25rem', display: 'inline-block' }}
          >
            Ver transacción en el Explorador ({hash.slice(0, 10)}...{hash.slice(-8)})
          </a>
        </div>
      )}

      {error && (
        <div className="alert-error fade-in">
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            <strong>Error:</strong> {(error as any).shortMessage || error.message}
          </p>
        </div>
      )}
    </section>
  );
}
