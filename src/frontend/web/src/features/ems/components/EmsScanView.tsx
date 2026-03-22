import { useEffect, useRef, useState } from 'react';
import { scanVial, lookupBarcode } from '../api';
import { navigateEms } from '../routing';
import { T, cardStyle, inputStyle, btnBackStyle } from '../theme';
import type { MedVial, OpenFdaLookup } from '../../../types/ems';

interface Props {
  tenantId: string;
  mode?: 'administer' | 'waste' | 'stock';
}

export default function EmsScanView({ tenantId, mode }: Props) {
  const [code, setCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [foundVial, setFoundVial] = useState<MedVial | null>(null);
  const [fdaResult, setFdaResult] = useState<OpenFdaLookup | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);

  const modeLabel = mode === 'administer' ? 'Administer — Scan Vial'
    : mode === 'waste' ? 'Waste — Scan Vial'
    : mode === 'stock' ? 'Stock — Scan Vial'
    : 'Scan Vial';

  useEffect(() => () => { stopCamera(); }, []);

  function stopCamera() {
    cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setScanning(false);
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
      try {
        const BD = (window as any).BarcodeDetector;
        if (BD) {
          const detector = new BD({ formats: ['qr_code', 'data_matrix', 'ean_13', 'ean_8', 'code_128', 'upc_a', 'upc_e'] });
          const detect = async () => {
            if (!videoRef.current || !streamRef.current) return;
            try {
              const codes = await detector.detect(videoRef.current);
              if (codes.length > 0) {
                stopCamera();
                await handleCode(codes[0].rawValue);
                return;
              }
            } catch { /* continue */ }
            animFrameRef.current = requestAnimationFrame(detect);
          };
          detect();
        }
      } catch { /* BarcodeDetector not supported */ }
    } catch { /* camera denied */ }
  }

  async function handleCode(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    setCode(trimmed);
    setLoading(true);
    setError('');
    setFoundVial(null);
    setFdaResult(null);
    try {
      const vial = await scanVial(tenantId, trimmed);
      setFoundVial(vial);
    } catch {
      try {
        const fda = await lookupBarcode(trimmed);
        setFdaResult(fda);
      } catch {
        setError(`No vial found for code "${trimmed}". It may be an unknown code or manufacturer barcode not in OpenFDA.`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-3">
        <button style={btnBackStyle} className="btn btn-sm" onClick={() => navigateEms({ kind: 'dashboard' })}>
          <i className="bi bi-arrow-left" />
        </button>
        <h5 style={{ margin: 0, flex: 1, color: T.text, fontWeight: 700 }}>
          <i className="bi bi-qr-code-scan me-2" style={{ color: T.accent }} />{modeLabel}
        </h5>
      </div>

      {/* Camera preview */}
      <div style={{ ...cardStyle, marginBottom: 16, overflow: 'hidden' }}>
        <div style={{ background: '#000', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', display: scanning ? 'block' : 'none' }} playsInline muted />
          {!scanning && (
            <div style={{ textAlign: 'center', color: '#fff', padding: 32 }}>
              <i className="bi bi-camera-fill" style={{ fontSize: '3rem', opacity: 0.4 }} />
              <div style={{ marginTop: 8, opacity: 0.6, fontSize: '0.85rem' }}>Point camera at QR code or barcode</div>
            </div>
          )}
          {scanning && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
              width: 200, height: 200, border: `2px solid ${T.green}`, borderRadius: 12,
              boxShadow: '0 0 0 2000px rgba(0,0,0,0.45)',
            }} />
          )}
        </div>
        <div style={{ padding: 12 }}>
          {!scanning ? (
            <button style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', background: T.green, color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }} onClick={startCamera}>
              <i className="bi bi-camera-fill me-2" />Start Camera Scan
            </button>
          ) : (
            <button style={{ width: '100%', padding: '10px 0', borderRadius: 10, border: 'none', background: T.red, color: '#fff', fontWeight: 700, cursor: 'pointer' }} onClick={stopCamera}>
              <i className="bi bi-x-circle me-2" />Stop Camera
            </button>
          )}
        </div>
      </div>

      {/* Manual entry */}
      <div style={{ ...cardStyle, marginBottom: 16, padding: 16 }}>
        <label style={{ color: T.muted, fontSize: '0.8rem', display: 'block', marginBottom: 6, fontWeight: 600 }}>Or enter code manually</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{ ...inputStyle, flex: 1, padding: '10px 12px', fontSize: '1rem' }}
            placeholder="Agency QR code or vial barcode…"
            value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCode(code)}
          />
          <button style={{ background: T.accent, border: 'none', borderRadius: 8, color: '#fff', padding: '0 16px', cursor: 'pointer' }}
            disabled={!code.trim() || loading} onClick={() => handleCode(code)}>
            {loading ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-search" />}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#2a1a0e', border: `1px solid ${T.amber}`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: T.amber, fontSize: '0.85rem' }}>
          <i className="bi bi-exclamation-triangle-fill me-2" />
          <strong>Not found.</strong> {error}
        </div>
      )}

      {foundVial && <FoundVialCard vial={foundVial} mode={mode} />}
      {fdaResult && <FdaPrefillCard result={fdaResult} scannedBarcode={code} tenantId={tenantId} />}
    </div>
  );
}

function FoundVialCard({ vial, mode }: { vial: MedVial; mode?: string }) {
  return (
    <div style={{ ...cardStyle, border: `2px solid ${T.green}`, marginBottom: 16 }}>
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: T.text }}>{vial.medication?.genericName ?? 'Unknown Medication'}</div>
            {vial.medication?.brandName && <div style={{ fontSize: '0.82rem', color: T.muted }}>{vial.medication.brandName}</div>}
          </div>
          <span style={{ background: T.accent, color: '#fff', borderRadius: 10, fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px' }}>
            {vial.status.toUpperCase()}
          </span>
        </div>
        <div style={{ fontSize: '0.82rem', color: T.muted, display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 12 }}>
          <span><i className="bi bi-upc me-1" />Lot: <strong style={{ color: T.text }}>{vial.lotNumber}</strong></span>
          <span><i className="bi bi-droplet me-1" />{vial.remainingVolumeMl} / {vial.totalVolumeMl} mL</span>
          {vial.expiresAt && (
            <span style={{ color: new Date(vial.expiresAt) < new Date() ? T.red : T.muted }}>
              <i className="bi bi-calendar-x me-1" />Expires: {new Date(vial.expiresAt).toLocaleDateString()}
              {new Date(vial.expiresAt) < new Date() && <strong style={{ color: T.red, marginLeft: 6 }}>EXPIRED</strong>}
            </span>
          )}
          {vial.container?.storageLocation && (
            <span><i className="bi bi-geo-alt me-1" />{vial.container.storageLocation.name} → {vial.container.name}</span>
          )}
        </div>
        <button
          style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', background: T.accent, color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
          onClick={() => navigateEms({ kind: 'vial', vialId: vial.id })}
        >
          <i className="bi bi-arrow-right-circle me-2" />
          {mode === 'administer' ? 'Administer This Vial' :
           mode === 'waste' ? 'Waste This Vial' :
           mode === 'stock' ? 'Stock This Vial' :
           'View Full Detail'}
        </button>
      </div>
    </div>
  );
}

function FdaPrefillCard({ result, scannedBarcode: _barcode, tenantId: _tenantId }: { result: OpenFdaLookup; scannedBarcode: string; tenantId: string }) {
  return (
    <div style={{ ...cardStyle, border: `2px solid ${T.cyan}`, marginBottom: 16 }}>
      <div style={{ background: '#0c2a40', borderBottom: `1px solid ${T.border}`, padding: '10px 16px', borderRadius: '14px 14px 0 0' }}>
        <strong style={{ color: T.cyan }}><i className="bi bi-database-check me-2" />Found in OpenFDA — New Vial?</strong>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 700, color: T.text }}>{result.genericName || 'Unknown'}</div>
          {result.brandName && <div style={{ fontSize: '0.82rem', color: T.muted }}>{result.brandName}</div>}
        </div>
        <div style={{ fontSize: '0.82rem', color: T.muted, display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 12 }}>
          {result.concentration && <span><i className="bi bi-droplet me-1" />{result.concentration}</span>}
          {result.routeOfAdministration && <span><i className="bi bi-arrow-right me-1" />{result.routeOfAdministration}</span>}
          {result.formDescription && <span><i className="bi bi-capsule me-1" />{result.formDescription}</span>}
        </div>
        <div style={{ background: '#0c2a40', border: `1px solid ${T.cyan}`, borderRadius: 8, padding: '8px 12px', fontSize: '0.82rem', color: T.cyan, marginBottom: 12 }}>
          <i className="bi bi-info-circle me-1" />This vial is not in your system yet. Info prefilled from the FDA database.
        </div>
        <button
          style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', background: T.cyan, color: '#000', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
          onClick={() => navigateEms({ kind: 'vials' })}
        >
          <i className="bi bi-plus-circle me-2" />Receive as New Vial
        </button>
      </div>
    </div>
  );
}
