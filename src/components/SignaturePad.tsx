import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check } from 'lucide-react';

interface SignaturePadProps {
  label: string;
  placeholder?: string;
  onChange: (signatureDataUrl: string | null) => void;
  savedValue?: string | null;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  label,
  placeholder = 'Bitte unterschreiben Sie in diesem Feld',
  onChange,
  savedValue = null,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(!savedValue);
  const [hasConfirmed, setHasConfirmed] = useState(!!savedValue);

  // Initialize and resize canvas
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get parent dimensions
    const rect = canvas.parentElement?.getBoundingClientRect();
    const width = rect?.width || 400;
    const height = 180;

    // Handle high DPI screens (retina)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#18181b'; // zinc-900 (dark charcoal line)

    // Fill with solid white background to prevent transparent-to-black printing bugs
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    setIsEmpty(true);
    setHasConfirmed(false);
  };

  useEffect(() => {
    initCanvas();
    // Re-draw if there is a saved value
    if (savedValue) {
      loadSavedSignature(savedValue);
    }

    const handleResize = () => {
      // Don't clear if user has already signed unless necessary, but we must adapt
      // For safety on tablet rotate, we re-draw if we have a saved value.
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadSavedSignature = (dataUrl: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const rect = canvas.getBoundingClientRect();
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
      setIsEmpty(false);
      setHasConfirmed(true);
    };
  };

  // Helper to get coordinates relative to canvas
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent scrolling on touch
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
    setIsEmpty(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveSignature();
  };

  const clearCanvas = () => {
    initCanvas();
    onChange(null);
    setIsEmpty(true);
    setHasConfirmed(false);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;

    // Extract canvas as base64 PNG
    const dataUrl = canvas.toDataURL('image/png');
    setHasConfirmed(true);
    onChange(dataUrl);
  };

  return (
    <div className="flex flex-col space-y-2 w-full" ref={containerRef} id={`sig-container-${label.replace(/\s+/g, '-').toLowerCase()}`}>
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold text-zinc-300 tracking-wide uppercase">{label}</label>
        {hasConfirmed && (
          <span className="flex items-center text-xs text-emerald-400 font-medium">
            <Check className="w-3 h-3 mr-1" /> Signiert
          </span>
        )}
      </div>

      <div className="relative w-full border border-zinc-800 rounded-lg bg-white overflow-hidden shadow-inner group">
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-zinc-400 text-xs text-center px-4 font-sans select-none">
            {placeholder}
          </div>
        )}

        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="block w-full cursor-crosshair touch-none"
          style={{ height: '180px' }}
        />

        <div className="absolute bottom-2 right-2 flex space-x-2">
          <button
            type="button"
            onClick={clearCanvas}
            className="flex items-center justify-center p-2 rounded bg-zinc-900/90 text-zinc-300 hover:text-rose-400 hover:bg-zinc-800 transition-colors border border-zinc-800 text-xs shadow-md cursor-pointer"
            title="Unterschrift löschen"
          >
            <Eraser className="w-4 h-4 mr-1" /> Löschen
          </button>
        </div>
      </div>
    </div>
  );
};
