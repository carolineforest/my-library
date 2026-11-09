// Live camera view that reads ISBN barcodes using the ZXing library.
// (iPhone Safari has no built-in barcode reader, so we use ZXing.)
import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { normalizeIsbn } from '../../utils/isbn';
import { Icon } from '../../components/Icon';
import './scan.css';

interface Props {
  /** Called with a valid ISBN-13 when a book barcode is seen. */
  onIsbn: (isbn13: string) => void;
  /** While paused, barcodes are ignored (e.g. a confirm panel is open). */
  paused?: boolean;
}

type CameraProblem = 'denied' | 'nocamera' | 'unsupported' | 'other';

export function BarcodeScanner({ onIsbn, paused }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pausedRef = useRef(paused);
  const onIsbnRef = useRef(onIsbn);
  const last = useRef({ code: '', at: 0 });
  const [problem, setProblem] = useState<CameraProblem>();
  const [starting, setStarting] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [notBook, setNotBook] = useState(false);
  pausedRef.current = paused;
  onIsbnRef.current = onIsbn;

  useEffect(() => {
    let controls: IScannerControls | undefined;
    let cancelled = false;
    setProblem(undefined);
    setStarting(true);
    if (!navigator.mediaDevices?.getUserMedia) {
      setProblem('unsupported');
      return;
    }
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 120 });

    reader
      .decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        videoRef.current!,
        (result) => {
          if (!result || pausedRef.current) return;
          const text = result.getText();
          const now = Date.now();
          if (text === last.current.code && now - last.current.at < 3000) return;
          last.current = { code: text, at: now };
          const { isbn13 } = normalizeIsbn(text);
          // Book barcodes start with 978 or 979. Other barcodes (e.g. price codes) are ignored.
          if (isbn13 && (isbn13.startsWith('978') || isbn13.startsWith('979'))) {
            setNotBook(false);
            navigator.vibrate?.(60);
            onIsbnRef.current(isbn13);
          } else {
            setNotBook(true);
          }
        },
      )
      .then((c) => {
        if (cancelled) c.stop();
        else {
          controls = c;
          setStarting(false);
        }
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setStarting(false);
        if (e.name === 'NotAllowedError' || e.name === 'SecurityError') setProblem('denied');
        else if (e.name === 'NotFoundError' || e.name === 'OverconstrainedError') setProblem('nocamera');
        else setProblem('other');
      });

    return () => {
      cancelled = true;
      controls?.stop();
    };
  }, [attempt]);

  if (problem) return <CameraHelp problem={problem} onRetry={() => setAttempt((n) => n + 1)} />;

  return (
    <div className="scanner">
      <video ref={videoRef} playsInline muted autoPlay aria-label="Camera view" />
      <div className="scanner-frame" aria-hidden />
      <p className="scanner-hint" aria-live="polite">
        {starting
          ? 'Starting camera…'
          : notBook
            ? "That barcode isn't a book ISBN. Try the barcode that starts with 978 or 979."
            : 'Point the camera at the barcode on the back of the book'}
      </p>
    </div>
  );
}

function CameraHelp({ problem, onRetry }: { problem: CameraProblem; onRetry: () => void }) {
  return (
    <div className="card stack" role="alert">
      <h3 className="row">
        <Icon name="camera" /> {problem === 'denied' ? 'Camera access is off' : "Can't use the camera"}
      </h3>
      {problem === 'denied' && (
        <>
          <p>To scan barcodes, My Library needs permission to use your camera. Nothing is recorded or uploaded.</p>
          <ol className="small" style={{ paddingLeft: 20 }}>
            <li>
              Open the iPhone <strong>Settings</strong> app, tap <strong>Apps</strong> (on older iPhones skip this step),
              then <strong>Safari</strong>.
            </li>
            <li>
              Tap <strong>Camera</strong> and choose <strong>Ask</strong> or <strong>Allow</strong>.
            </li>
            <li>
              Come back here. If you're using the home screen app, close it completely (swipe it away) and open it again.
            </li>
            <li>
              Tap <strong>Try Again</strong> below and choose <strong>Allow</strong> when asked.
            </li>
          </ol>
        </>
      )}
      {problem === 'nocamera' && <p>No camera was found on this device.</p>}
      {problem === 'unsupported' && <p>This browser doesn't allow camera access here. Open the app from Safari or your home screen.</p>}
      {problem === 'other' && <p>The camera couldn't start. Another app may be using it.</p>}
      <p className="small muted">You can always type the ISBN below instead.</p>
      <button type="button" className="btn btn-primary" onClick={onRetry}>
        Try Again
      </button>
    </div>
  );
}
