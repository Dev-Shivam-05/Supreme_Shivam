"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Loader2, Upload } from "lucide-react";

type Item = { id: string; url: string; filename: string; contentType: string };

export function TabMedia() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/media", { cache: "no-store" });
    const j = await r.json();
    setItems(j.media || []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const upload = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    await fetch("/api/admin/media", { method: "POST", body: fd });
    setUploading(false);
    load();
  };

  const copy = (url: string) => {
    navigator.clipboard?.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(""), 1500);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="hud tick mb-1">Assets</div>
          <h2 className="font-poster text-3xl">Media</h2>
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 bg-accent px-4 py-2 text-sm font-semibold text-accent-ink">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-accent" /></div>
      ) : items.length === 0 ? (
        <p className="border border-border bg-bg-elev p-6 text-sm text-fg-muted">No media yet. Upload an image (stored in Mongo, served at <code>/api/media/:id</code>).</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((m) => (
            <button key={m.id} onClick={() => copy(m.url)} className="group relative aspect-square overflow-hidden border border-border bg-bg" title="Click to copy URL">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt={m.filename} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
              <div className="absolute inset-0 flex items-center justify-center bg-bg/70 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="inline-flex items-center gap-1.5 font-mono text-xs text-accent">
                  {copied === m.url ? <><Check className="h-3.5 w-3.5" /> copied</> : "copy url"}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
