'use client';

import { useState, useEffect } from 'react';
import { keccak256, encodePacked } from 'viem';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { CREDENTIALS_ADDRESS, CREDENTIALS_ABI } from '../../contracts/credentials';

export function IssueCredentialForm() {
  const { chain } = useAccount();
  const [activeTab, setActiveTab] = useState<'issue' | 'revoke'>('issue');

  // Issue fields
  const [studentAddress, setStudentAddress] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [degreeName, setDegreeName] = useState('Licenciatura en Sistemas de Información');
  const [studentName, setStudentName] = useState('');
  const [studentDni, setStudentDni] = useState('');
  const [pdfHashInput, setPdfHashInput] = useState('');
  const [metadataURI, setMetadataURI] = useState('');

  // Revoke fields
  const [revokeTokenId, setRevokeTokenId] = useState('');
  const [revokeReason, setRevokeReason] = useState('');

  // Real-time privacy hashing previews
  const [previewNameHash, setPreviewNameHash] = useState('0x...');
  const [previewDocHash, setPreviewDocHash] = useState('0x...');

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const explorerUrl = chain?.blockExplorers?.default.url || 'https://sepolia.etherscan.io';

  // Update real-time previews
  useEffect(() => {
    if (studentName.trim() && studentDni.trim()) {
      try {
        const hashed = keccak256(encodePacked(['string', 'string'], [studentName.trim(), studentDni.trim()]));
        setPreviewNameHash(hashed);
      } catch (err) {
        setPreviewNameHash('Error al hashear');
      }
    } else {
      setPreviewNameHash('Completa Nombre y DNI');
    }
  }, [studentName, studentDni]);

  useEffect(() => {
    if (pdfHashInput.trim()) {
      try {
        const hashed = keccak256(encodePacked(['string'], [pdfHashInput.trim()]));
        setPreviewDocHash(hashed);
      } catch (err) {
        setPreviewDocHash('Error al hashear');
      }
    } else {
      setPreviewDocHash('Completa el identificador del PDF');
    }
  }, [pdfHashInput]);

  function handleIssueSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentAddress.startsWith('0x') || studentAddress.length !== 42) {
      alert('Ingresá una dirección de estudiante válida (0x...)');
      return;
    }
    if (!tokenId) {
      alert('Ingresá un Token ID válido');
      return;
    }
    if (!studentName.trim() || !studentDni.trim()) {
      alert('Completá el nombre y el DNI para generar el hash de privacidad');
      return;
    }
    if (!pdfHashInput.trim()) {
      alert('Completá el identificador del PDF');
      return;
    }
    if (!metadataURI.trim()) {
      alert('Completá la Metadata URI (IPFS)');
      return;
    }

    reset();

    const nameHash = keccak256(encodePacked(['string', 'string'], [studentName.trim(), studentDni.trim()]));
    const docHash = keccak256(encodePacked(['string'], [pdfHashInput.trim()]));

    writeContract({
      address: CREDENTIALS_ADDRESS,
      abi: CREDENTIALS_ABI,
      functionName: 'issueCredential',
      args: [
        studentAddress as `0x${string}`,
        BigInt(tokenId),
        degreeName.trim(),
        nameHash,
        docHash,
        metadataURI.trim(),
      ],
    } as any);
  }

  function handleRevokeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!revokeTokenId) {
      alert('Ingresá un Token ID válido');
      return;
    }
    if (!revokeReason.trim()) {
      alert('Ingresá un motivo de revocación');
      return;
    }

    reset();

    writeContract({
      address: CREDENTIALS_ADDRESS,
      abi: CREDENTIALS_ABI,
      functionName: 'revoke',
      args: [
        BigInt(revokeTokenId),
        revokeReason.trim(),
      ],
    } as any);
  }

  return (
    <section className="card fade-in" style={{ marginBottom: '1.5rem' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <span>🎓</span> Panel de Emisión de la Universidad (Issuer)
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Emitir o revocar credenciales académicas oficiales con privacidad asegurada por criptografía off-chain.
      </p>

      <div className="tab-container">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'issue' ? 'active' : ''}`}
          onClick={() => { setActiveTab('issue'); reset(); }}
        >
          Emitir Nueva Credencial
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'revoke' ? 'active' : ''}`}
          onClick={() => { setActiveTab('revoke'); reset(); }}
        >
          Revocar Credencial Existente
        </button>
      </div>

      {activeTab === 'issue' ? (
        <form onSubmit={handleIssueSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Dirección (Wallet Address) del Estudiante</label>
              <input
                type="text"
                className="form-input"
                placeholder="0x..."
                value={studentAddress}
                onChange={(e) => setStudentAddress(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Token ID (Único e Incremental)</label>
              <input
                type="number"
                className="form-input"
                placeholder="Ej: 1"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nombre del Título / Carrera</label>
            <input
              type="text"
              className="form-input"
              value={degreeName}
              onChange={(e) => setDegreeName(e.target.value)}
              required
            />
          </div>

          <div className="grid-2 hash-preview-box">
            <div className="form-group">
              <label className="form-label">Nombre Completo (Firma Digital)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Juan Pérez"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">DNI / ID de Identificación</label>
              <input
                type="text"
                className="form-input"
                placeholder="12345678"
                value={studentDni}
                onChange={(e) => setStudentDni(e.target.value)}
                required
              />
            </div>
            <div style={{ gridColumn: '1 / -1', fontSize: '0.8rem', color: 'var(--color-unlu-blue)', fontWeight: 600 }}>
              🔒 <strong>Hash de Identidad Resultante (On-Chain):</strong> <code className="mono-text" style={{ fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>{previewNameHash}</code>
            </div>
          </div>

          <div className="grid-2 hash-preview-box">
            <div className="form-group">
              <label className="form-label">Identificador del PDF (CID de IPFS o nombre de archivo)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: QmXyZ... o titulo_juan_perez.pdf"
                value={pdfHashInput}
                onChange={(e) => setPdfHashInput(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Metadata URI (JSON en IPFS)</label>
              <input
                type="text"
                className="form-input"
                placeholder="ipfs://bafybeih..."
                value={metadataURI}
                onChange={(e) => setMetadataURI(e.target.value)}
                required
              />
            </div>
            <div style={{ gridColumn: '1 / -1', fontSize: '0.8rem', color: 'var(--color-unlu-blue)', fontWeight: 600 }}>
              🔒 <strong>Hash del Documento Resultante (On-Chain):</strong> <code className="mono-text" style={{ fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>{previewDocHash}</code>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending || confirming}
            className="btn-primary"
          >
            {isPending
              ? 'Confirmá en tu wallet...'
              : confirming
                ? 'Emitiendo credencial en blockchain...'
                : 'Emitir Credencial Oficial (Mint)'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRevokeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Token ID de la Credencial a Revocar</label>
            <input
              type="number"
              className="form-input"
              placeholder="Ej: 1"
              value={revokeTokenId}
              onChange={(e) => setRevokeTokenId(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Motivo de la Revocación (Público)</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Ej: Título emitido con errores tipográficos en el acta / Reemplazado por nueva resolución"
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              style={{ resize: 'vertical' }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isPending || confirming}
            className="btn-danger"
          >
            {isPending
              ? 'Confirmá en tu wallet...'
              : confirming
                ? 'Revocando credencial en blockchain...'
                : 'Revocar Credencial Permanentemente'}
          </button>
        </form>
      )}

      {isSuccess && hash && (
        <div className="alert-success fade-in">
          <p style={{ margin: 0, fontWeight: 600 }}>
            🎉 Transacción enviada con éxito.
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
            <strong>Error en la transacción:</strong> {(error as any).shortMessage || error.message}
          </p>
        </div>
      )}
    </section>
  );
}
