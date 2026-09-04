"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { Save } from "lucide-react";
import { VoucherLayout, FieldPos } from "@/lib/gift-voucher";

const FIELD_LABELS: Record<keyof VoucherLayout, string> = {
  amount: "R250",
  to: "Jane Smith",
  from: "Sarah",
  voucherNo: "BU250040926X7K2",
  validUntil: "04/12/2026",
};

const FIELD_NAMES: Record<keyof VoucherLayout, string> = {
  amount: "Amount / Service",
  to: "To",
  from: "From",
  voucherNo: "Voucher No",
  validUntil: "Valid Until",
};

const FONTS = [
  { id: "sans", label: "Sans-serif" },
  { id: "serif", label: "Serif" },
  { id: "mono", label: "Monospace" },
];

const DEFAULT_LAYOUT: VoucherLayout = {
  amount: { x: 75, y: 5, size: 18, font: "sans" },
  to: { x: 30, y: 40, size: 18, font: "sans" },
  from: { x: 30, y: 55, size: 18, font: "sans" },
  voucherNo: { x: 5, y: 85, size: 14, font: "mono" },
  validUntil: { x: 70, y: 85, size: 16, font: "sans" },
};

const FONT_FAMILY: Record<string, string> = {
  sans: "system-ui, sans-serif",
  serif: "Georgia, serif",
  mono: "ui-monospace, monospace",
};

function updateField(
  prev: VoucherLayout,
  field: keyof VoucherLayout,
  patch: Partial<FieldPos>
): VoucherLayout {
  return { ...prev, [field]: { ...prev[field], ...patch } };
}

export function VoucherLayoutEditor({ initialLayout }: { initialLayout?: VoucherLayout }) {
  const [layout, setLayout] = useState<VoucherLayout>(initialLayout ?? DEFAULT_LAYOUT);
  const [dragging, setDragging] = useState<keyof VoucherLayout | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getPos = useCallback(
    (e: React.MouseEvent | React.TouchEvent, field: keyof VoucherLayout) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const x = Math.round(((clientX - rect.left) / rect.width) * 100);
      const y = Math.round(((clientY - rect.top) / rect.height) * 100);
      setLayout((prev) =>
        updateField(prev, field, { x: Math.max(0, Math.min(95, x)), y: Math.max(0, Math.min(95, y)) })
      );
    },
    []
  );

  const handleMouseDown = useCallback(
    (field: keyof VoucherLayout) => (e: React.MouseEvent) => {
      e.preventDefault();
      setDragging(field);
      getPos(e, field);
    },
    [getPos]
  );

  const handleTouchStart = useCallback(
    (field: keyof VoucherLayout) => (e: React.TouchEvent) => {
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
      setLayout((prev) =>
        updateField(prev, dragging, { x: Math.max(0, Math.min(95, x)), y: Math.max(0, Math.min(95, y)) })
      );
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

  function scaleTransform(field: keyof VoucherLayout): number {
    const size = layout[field].size;
    return Math.max(0.5, Math.min(3, size / 18));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-foreground/60">
          Drag each value to sit on top of its label on the template. You can also set each field&apos;s
          font and font size, then Save.
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
        {(Object.keys(layout) as (keyof VoucherLayout)[]).map((field) => {
          const pos = layout[field];
          const isActive = dragging === field;
          return (
            <div
              key={field}
              onMouseDown={handleMouseDown(field)}
              onTouchStart={handleTouchStart(field)}
              className={`absolute cursor-grab px-3 py-1.5 rounded-lg transition-[outline,transform] select-none ${
                isActive
                  ? "z-20 scale-110 outline-2 outline-primary text-primary-dark"
                  : "z-10 outline outline-primary/60 text-primary-dark hover:z-20"
              }`}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                touchAction: "none",
                transform: `scale(${scaleTransform(field)})`,
                transformOrigin: "top left",
              }}
            >
              <span
                className="pointer-events-none block text-primary-dark"
                style={{
                  fontSize: `${pos.size}px`,
                  fontFamily: FONT_FAMILY[pos.font] ?? "inherit",
                }}
              >
                {FIELD_LABELS[field]}
              </span>
              <span className="pointer-events-none block font-mono text-[10px] opacity-50">
                {pos.x}%, {pos.y}% · {pos.size}px · {pos.font}
              </span>
            </div>
          );
        })}
      </div>

      {/* Per-field controls */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(Object.keys(layout) as (keyof VoucherLayout)[]).map((field) => (
          <div key={field} className="rounded-xl border border-foreground/10 p-3">
            <p className="mb-2 text-xs font-semibold text-foreground/60">{FIELD_NAMES[field]}</p>

            <div className="grid grid-cols-4 gap-2">
              <label className="flex flex-col gap-1 text-xs text-foreground/50">
                X
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={layout[field].x}
                  onChange={(e) => setLayout((prev) => updateField(prev, field, { x: Number(e.target.value) }))}
                  className="w-full rounded border border-foreground/20 px-2 py-1 text-xs"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-foreground/50">
                Y
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={layout[field].y}
                  onChange={(e) => setLayout((prev) => updateField(prev, field, { y: Number(e.target.value) }))}
                  className="w-full rounded border border-foreground/20 px-2 py-1 text-xs"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-foreground/50">
                Size
                <input
                  type="number"
                  min={8}
                  max={60}
                  value={layout[field].size}
                  onChange={(e) => setLayout((prev) => updateField(prev, field, { size: Number(e.target.value) }))}
                  className="w-full rounded border border-foreground/20 px-2 py-1 text-xs"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-foreground/50">
                Font
                <select
                  value={layout[field].font}
                  onChange={(e) => setLayout((prev) => updateField(prev, field, { font: e.target.value }))}
                  className="w-full rounded border border-foreground/20 bg-white px-1 py-1 text-xs"
                >
                  {FONTS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}