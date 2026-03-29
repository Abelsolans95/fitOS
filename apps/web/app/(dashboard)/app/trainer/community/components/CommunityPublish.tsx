"use client";

import { useRef } from "react";

interface CommunityPublishProps {
  newPostTitle: string;
  newPostContent: string;
  newPostImagePreview: string | null;
  publishing: boolean;
  onSetTitle: (v: string) => void;
  onSetContent: (v: string) => void;
  onSetImage: (file: File | null, preview: string | null) => void;
  onPublish: () => void;
}

export function CommunityPublish({
  newPostTitle,
  newPostContent,
  newPostImagePreview,
  publishing,
  onSetTitle,
  onSetContent,
  onSetImage,
  onPublish,
}: CommunityPublishProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-6">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#8B8BA3]">
          Nueva publicacion
        </h2>

        <input
          type="text"
          value={newPostTitle}
          onChange={(e) => onSetTitle(e.target.value)}
          placeholder="Titulo (opcional)"
          className="mb-3 w-full rounded-xl border border-white/[0.06] bg-[#0A0A0F] px-4 py-3 text-sm font-semibold text-white placeholder-[#5A5A72] focus:border-[#00E5FF]/30 focus:outline-none focus:ring-1 focus:ring-[#00E5FF]/20"
        />

        <textarea
          value={newPostContent}
          onChange={(e) => onSetContent(e.target.value)}
          placeholder="Comparte algo con tu comunidad..."
          rows={5}
          className="w-full resize-none rounded-xl border border-white/[0.06] bg-[#0A0A0F] px-4 py-3 text-sm text-white placeholder-[#5A5A72] focus:border-[#00E5FF]/30 focus:outline-none focus:ring-1 focus:ring-[#00E5FF]/20"
        />

        {newPostImagePreview && (
          <div className="relative mt-3 inline-block">
            <img
              src={newPostImagePreview}
              alt="Preview"
              className="max-h-48 rounded-xl border border-white/[0.06]"
            />
            <button
              onClick={() => {
                onSetImage(null, null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#FF1744] text-white text-xs"
            >
              x
            </button>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#8B8BA3] transition-colors hover:bg-white/[0.04] hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
            </svg>
            Imagen
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              onSetImage(f, URL.createObjectURL(f));
            }}
          />
          <button
            onClick={onPublish}
            disabled={!newPostContent.trim() || publishing}
            className="rounded-xl bg-[#00E5FF] px-6 py-2.5 text-sm font-semibold text-[#0A0A0F] transition-all hover:bg-[#00E5FF]/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {publishing ? "Publicando..." : "Publicar"}
          </button>
        </div>
      </div>
    </div>
  );
}
