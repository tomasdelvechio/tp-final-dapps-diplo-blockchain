'use client';

import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { CREDENTIALS_ADDRESS, CREDENTIALS_ABI } from '../../contracts/credentials';
import QRCode from 'react-qr-code';

interface VerifierProps {
  initialTokenId?: string;
}

export function Verifier({ initialTokenId }: VerifierProps) {
  const [tokenIdInput, setTokenIdInput] = useState('');
  const [queryId, setQueryId] = useState<bigint | null>(null);
  const [originUrl, setOriginUrl] = useState('');

  // Handle initial query from URL search params
  useEffect(() => {
    if (initialTokenId) {
      setTokenIdInput(initialTokenId);
      try {
        setQueryId(BigInt(initialTokenId));
      } catch (e) {
        // ignore invalid token ID format
      }
    }
  }, [initialTokenId]);

  // Handle client-side origin for QR code
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOriginUrl(window.location.origin);
    }
  }, []);

  // 1. Fetch details: (Credential, isValid)
  const { data: verifyData, isLoading: verifyLoading, error: verifyError } = useReadContract({
    address: CREDENTIALS_ADDRESS,
    abi: CREDENTIALS_ABI,
    functionName: 'verify',
    args: queryId !== null ? [queryId] : undefined,
    query: { enabled: queryId !== null },
  });

  const record = (verifyData as any)?.[0];
  const isValid = (verifyData as any)?.[1] as boolean | undefined;

  // 2. Fetch standard owner address (only if valid)
  const { data: ownerAddress, isLoading: ownerLoading } = useReadContract({
    address: CREDENTIALS_ADDRESS,
    abi: CREDENTIALS_ABI,
    functionName: 'ownerOf',
    args: queryId !== null ? [queryId] : undefined,
    query: { enabled: queryId !== null && !!isValid },
  });

  // 3. Fetch tokenURI (only if valid)
  const { data: metadataURI, isLoading: uriLoading } = useReadContract({
    address: CREDENTIALS_ADDRESS,
    abi: CREDENTIALS_ABI,
    functionName: 'tokenURI',
    args: queryId !== null ? [queryId] : undefined,
    query: { enabled: queryId !== null && !!isValid },
  });

  const ownerAddressStr = ownerAddress as string | undefined;
  const metadataURIStr = metadataURI as string | undefined;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const parsedId = BigInt(tokenIdInput.trim());
      setQueryId(parsedId);
      // Update browser URL query string without reloading page
      if (typeof window !== 'undefined') {
        const newUrl = `${window.location.pathname}?tokenId=${parsedId}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
      }
    } catch {
      alert('Por favor, ingresá un ID de token numérico válido');
      setQueryId(null);
    }
  }

  const isLoading = verifyLoading || (isValid && (ownerLoading || uriLoading));

  return (
    <section className="card fade-in" style={{ marginBottom: '1.5rem' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <span>🔍</span> Verificador Público de Títulos
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Cualquier empleador, institución u oficina pública puede ingresar el ID de una credencial para comprobar instantáneamente su validez académica on-chain.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1 }}>
          <input
            type="number"
            className="form-input"
            value={tokenIdInput}
            onChange={(e) => setTokenIdInput(e.target.value)}
            placeholder="Ingresá el Token ID de la credencial (ej: 1)"
            required
            style={{ height: '100%' }}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary"
          style={{ width: 'auto', padding: '0 2rem' }}
        >
          {isLoading ? 'Consultando...' : 'Verificar'}
        </button>
      </form>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-unlu-blue)' }}>
          <div className="spinner" style={{ display: 'inline-block', marginBottom: '0.5rem' }}>⏳</div>
          <p>Consultando base de datos descentralizada en la blockchain...</p>
        </div>
      )}

      {verifyError && (
        <div className="alert-error fade-in">
          <strong>Error de consulta:</strong> El Token ID ingresado no existe o no pudo ser procesado.
        </div>
      )}

      {!isLoading && verifyData && (
        <div className="fade-in" style={{ marginTop: '1rem' }}>
          {isValid ? (
            <div className="alert-success fade-in" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem' }}>
                <div style={{ flex: '1 1 350px' }}>
                  <span className="badge-valid" style={{ marginBottom: '1rem', display: 'inline-block' }}>
                    ✅ CREDENCIAL ACADÉMICA VÁLIDA
                  </span>
                  
                  <dl style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <dt style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Carrera / Título</dt>
                      <dd style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-unlu-green)' }}>{record.degreeName}</dd>
                    </div>
                    
                    <div>
                      <dt style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Fecha de Emisión</dt>
                      <dd style={{ fontWeight: 500 }}>{new Date(Number(record.issueDate) * 1000).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</dd>
                    </div>

                    <div>
                      <dt style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Wallet del Egresado (Owner)</dt>
                      <dd><code className="mono-text">{ownerAddressStr || 'Cargando...'}</code></dd>
                    </div>

                    <div>
                      <dt style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Hash de Privacidad Estudiante (Nombre + DNI)</dt>
                      <dd><code className="mono-text">{record.studentNameHash}</code></dd>
                    </div>

                    <div>
                      <dt style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Hash de Privacidad del PDF original</dt>
                      <dd><code className="mono-text">{record.documentHash}</code></dd>
                    </div>

                    <div>
                      <dt style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Metadatos URI (IPFS / JSON)</dt>
                      <dd>
                        {metadataURIStr ? (
                          <a 
                            href={metadataURIStr.startsWith('ipfs://') ? `https://ipfs.io/ipfs/${metadataURIStr.slice(7)}` : metadataURIStr} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ wordBreak: 'break-all', fontSize: '0.85rem', textDecoration: 'underline' }}
                          >
                            {metadataURIStr} 🌐
                          </a>
                        ) : 'No disponible'}
                      </dd>
                    </div>
                  </dl>
                </div>

                {originUrl && queryId !== null && (
                  <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ background: '#ffffff', padding: '8px', borderRadius: '8px', display: 'inline-block', border: '1px solid var(--border-color)' }}>
                      <QRCode
                        value={`${originUrl}/?tokenId=${queryId}`}
                        size={120}
                        style={{ height: 'auto', maxWidth: '100%', width: '120px' }}
                      />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontWeight: 500 }}>
                      Escanear QR de Verificación
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="alert-error fade-in" style={{ padding: '1.5rem' }}>
              <span className="badge-invalid" style={{ marginBottom: '1rem', display: 'inline-block' }}>
                ❌ CREDENCIAL INVÁLIDA O REVOCADA
              </span>
              <p style={{ color: 'var(--error-text)', margin: 0, fontWeight: 600, fontSize: '1rem' }}>
                El Token ID <code className="mono-text">#{queryId?.toString()}</code> no corresponde a una credencial actualmente activa en la Universidad Nacional de Luján.
              </p>
              {record && !record.active && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--error-border)', paddingTop: '0.75rem', fontSize: '0.9rem' }}>
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                    <strong>Motivo de baja:</strong> {record.reason || 'Esta credencial fue revocada formalmente por la entidad emisora.'}
                  </p>
                  <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                    <strong>Fecha de emisión original:</strong> {new Date(Number(record.issueDate) * 1000).toLocaleDateString('es-AR')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
