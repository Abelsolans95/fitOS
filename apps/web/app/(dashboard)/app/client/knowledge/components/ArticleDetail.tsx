"use client";

import { memo } from "react";
import type { KnowledgeArticle } from "./types";
import { CategoryBadge, timeAgo } from "./shared";

interface ArticleDetailProps {
  article: KnowledgeArticle;
  onBack: () => void;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}

export const ArticleDetail = memo(function ArticleDetail({ article, onBack }: ArticleDetailProps) {
  const videoId = article.video_url ? extractYouTubeId(article.video_url) : null;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back button */}
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 text-sm text-[#5A5A72] transition-colors hover:text-[#00E5FF]"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Volver a artículos
      </button>

      <article className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-6">
        {/* Header */}
        <div className="mb-4 flex items-center gap-2">
          <CategoryBadge category={article.category} />
          <span className="text-xs text-[#5A5A72]">{timeAgo(article.created_at)}</span>
          <span className="text-xs text-[#5A5A72]">·</span>
          <span className="flex items-center gap-1 text-xs text-[#5A5A72]">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            {article.view_count}
          </span>
        </div>

        <h1 className="mb-6 text-xl font-bold text-white">{article.title}</h1>

        {/* Video embed */}
        {videoId && (
          <div className="mb-6 aspect-video overflow-hidden rounded-xl">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title={article.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        )}

        {/* Non-YouTube video link */}
        {article.video_url && !videoId && (
          <a
            href={article.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-6 flex items-center gap-2 rounded-xl border border-[#00E5FF]/20 bg-[#00E5FF]/5 px-4 py-3 text-sm text-[#00E5FF] transition-colors hover:bg-[#00E5FF]/10"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
            </svg>
            Ver video
          </a>
        )}

        {/* Image */}
        {article.image_url && (
          <div className="relative mb-6 overflow-hidden rounded-xl">
            <img
              src={article.image_url}
              alt={article.title}
              className="w-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-[#8B8BA3]">
          {article.content}
        </div>
      </article>
    </div>
  );
});
