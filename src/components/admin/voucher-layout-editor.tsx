"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { Save } from "lucide-react";

interface FieldPos {
  x: number;
  y: number;
}

interface Layout {
  amount: FieldPos;
  to: FieldPos;
  from: FieldPos;
  voucherNo: FieldPos;
  validUntil: FieldPos;
}

const FIELD_LABELS: Record<keyof Layout, string> = {
  amount: "R250",
  to: "Jane Smith",
  from: "Sarah",
  voucherNo: "BU250040926X7K2",
  validUntil: "04/12/2026",
};

const FIELD_NAMES: Record<keyof Layout, string> = {
  amount: "Amount",
  to: "To",
  from: "From",
  voucherNo: "Voucher No",
  validUntil: "Valid Until",
};

const DEFAULT_LAYOUT: Layout = {
  amount: { x: 75, y: 5 },
  to: { x: 30, y: 40 },
  from: { x: 30, y: 55 },
  voucherNo: { x: 5, y: 85 },
  validUntil: { x: 70, y: 85 },
};

export function VoucherLayoutEditor({ initialLayout }: { initialLayout?: Layout }) {
  const [layout, setLayout] = useState<Layout>(initialLayout ?? DEFAULT_LAYOUT);
  const [dragging, setDragging] = useState<keyof Layout | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getPos = useCallback(
    (e: React.MouseEvent | React.TouchEvent, field: keyof Layout) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const x = Math.round(((clientX - rect.left) / rect.width) * 100);
      const y = Math.round(((clientY - rect.top) / rect.height) * 100);
      setLayout((prev) => ({
        ...prev,
        [field]: { x: Math.max(0, Math.min(95, x)), y: Math.max(0, Math.min(95, y)) },
      }));
    },
    []
  );

  const handleMouseDown = useCallback(
    (field: keyof Layout) => (e: React.MouseEvent) => {
      e.preventDefault();
      setDragging(field);
      getPos(e, field);
    },
    [getPos]
  );

  const handleTouchStart = useCallback(
    (field: keyof Layout) => (e: React.TouchEvent) => {
      setDragging(field);
      getPos(e, field);
    },
    [getPos]
  );

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const x = Math.round(((clientX - rect.left) / rect.width) * 100);
      const y = Math.round(((clientY - rect.top) / rect.height) * 100);
      setLayout((prev) => ({
        ...prev,
        [dragging]: { x: Math.max(0, Math.min(95, x)), y: Math.max(0, Math.min(95, y)) },
      }));
    };

    const handleUp = () => setDragging(null);

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [dragging]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/gift-vouchers/layout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(layout),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-foreground/60">
          Drag each value to sit on top of its label on the template (TO:, FROM:, AMOUNT:, VOUCHER NO:, VALID UNTIL: are already on the template). Fields snap to percentage coordinates.
        </p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : saved ? "Saved!" : "Save Layout"}
        </button>
      </div>

      {/* Editor canvas */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-2xl border-2 border-dashed border-foreground/20 select-none"
        style={{ aspectRatio: "1536/1024" }}
      >
        <Image
          src="/images/voucher-template.png"
          alt="Voucher template"
          fill
          className="object-cover"
          priority
          draggable={false}
        />

        {/* Draggable fields */}
        {(Object.keys(layout) as (keyof Layout)[]).map((field) => {
          const pos = layout[field];
          const isActive = dragging === field;
          return (
            <div
              key={field}
              onMouseDown={handleMouseDown(field)}
              onTouchStart={handleTouchStart(field)}
              className={`absolute cursor-grab rounded-lg px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-sm transition-[box-shadow,transform] select-none ${
                isActive
                  ? "z-20 scale-105 border-2 border-primary bg-primary/90 text-white shadow-xl"
                  : "z-10 border border-primary/30 bg-white/80 text-primary-dark hover:border-primary hover:shadow-xl"
              }`}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                touchAction: "none",
              }}
            >
              <span className="pointer-events-none block text-sm">
                {FIELD_LABELS[field]}
              </span>
              <span className="pointer-events-none block font-mono text-[10px] opacity-50">
                {pos.x}%, {pos.y}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Position inputs for precise editing */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {(Object.keys(layout) as (keyof Layout)[]).map((field) => (
          <div key={field} className="rounded-xl border border-foreground/10 p-3">
            <p className="mb-2 text-xs font-semibold text-foreground/60">{FIELD_NAMES[field]}</p>
            <div className="flex gap-2">
              <label className="flex items-center gap-1 text-xs text-foreground/50">
                X
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={layout[field].x}
                  onChange={(e) =>
                    setLayout((prev) => ({
                      ...prev,
                      [field]: { ...prev[field], x: Number(e.target.value) },
                    }))
                  }
                  className="w-14 rounded border border-foreground/20 px-2 py-1 text-xs"
                />
              </label>
              <label className="flex items-center gap-1 text-xs text-foreground/50">
                Y
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={layout[field].y}
                  onChange={(e) =>
                    setLayout((prev) => ({
                      ...prev,
                      [field]: { ...prev[field], y: Number(e.target.value) },
                    }))
                  }
                  className="w-14 rounded border border-foreground/20 px-2 py-1 text-xs"
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}