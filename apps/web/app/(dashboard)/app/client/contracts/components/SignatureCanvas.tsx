"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

interface SignatureCanvasProps {
  onSign: (dataUrl: string) => void;
  onCancel: () => void;
  signing: boolean;
}

export const SignatureCanvas = React.memo(function SignatureCanvas({
  onSign,
  onCancel,
  signing,
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Style
    ctx.strokeStyle = "#E8E8ED";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Clear with dark background
    ctx.fillStyle = "#0A0A0F";
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw guide line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.10)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, rect.height - 30);
    ctx.lineTo(rect.width - 20, rect.height - 30);
    ctx.stroke();

    // Reset stroke style for drawing
    ctx.strokeStyle = "#E8E8ED";
    ctx.lineWidth = 2;
  }, []);

  const getPosition = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      const touch = e.touches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  }, []);

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);
    const pos = getPosition(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }, [getPosition]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const pos = getPosition(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }, [isDrawing, getPosition]);

  const stopDraw = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#0A0A0F";
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Redraw guide line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.10)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, rect.height - 30);
    ctx.lineTo(rect.width - 20, rect.height - 30);
    ctx.stroke();

    ctx.strokeStyle = "#E8E8ED";
    ctx.lineWidth = 2;
    setHasDrawn(false);
  }, []);

  const handleSubmit = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    const dataUrl = canvas.toDataURL("image/png");
    onSign(dataUrl);
  }, [hasDrawn, onSign]);

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium text-white">Firma aqui</p>
        <p className="mb-3 text-xs text-[#5A5A72]">
          Dibuja tu firma en el recuadro usando el raton o el dedo
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/[0.08]">
        <canvas
          ref={canvasRef}
          className="h-48 w-full cursor-crosshair touch-none"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={!hasDrawn || signing}
          className="rounded-xl bg-[#00C853] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#00C853]/80 disabled:opacity-40"
        >
          {signing ? "Firmando..." : "Confirmar firma"}
        </button>
        <button
          onClick={handleClear}
          disabled={signing}
          className="rounded-xl border border-white/[0.08] px-4 py-2.5 text-sm text-[#8B8BA3] transition-colors hover:text-white disabled:opacity-40"
        >
          Borrar
        </button>
        <button
          onClick={onCancel}
          disabled={signing}
          className="rounded-xl px-4 py-2.5 text-sm text-[#5A5A72] transition-colors hover:text-white disabled:opacity-40"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
});
