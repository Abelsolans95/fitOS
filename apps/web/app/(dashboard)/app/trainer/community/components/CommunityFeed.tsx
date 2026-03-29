"use client";

import type { CommunityPost, CommunityComment } from "./types";

interface CommunityFeedProps {
  userId: string | null;
  posts: CommunityPost[];
  expandedPostId: string | null;
  comments: Record<string, CommunityComment[]>;
  loadingComments: Record<string, boolean>;
  newComment: Record<string, string>;
  replyingTo: Record<string, string | null>;
  replyText: Record<string, string>;
  onDeletePost: (id: string) => void;
  onToggleLike: (id: string, liked: boolean) => void;
  onExpandPost: (id: string | null) => void;
  onLoadComments: (id: string) => void;
  onSetNewComment: (postId: string, text: string) => void;
  onAddComment: (postId: string, parentId?: string | null) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onToggleCommentLike: (postId: string, commentId: string, liked: boolean) => void;
  onSetReplyingTo: (postId: string, commentId: string | null) => void;
  onSetReplyText: (commentId: string, text: string) => void;
  onTogglePin: (id: string, pinned: boolean) => void;
}

export function CommunityFeed({
  userId, posts, expandedPostId, comments, loadingComments, newComment,
  replyingTo, replyText,
  onDeletePost, onToggleLike, onExpandPost, onLoadComments, onSetNewComment,
  onAddComment, onDeleteComment, onToggleCommentLike, onSetReplyingTo, onSetReplyText, onTogglePin,
}: CommunityFeedProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* ── Empty state ── */}
      {posts.length === 0 && (
        <div className="py-16 text-center text-[#5A5A72]">
          <svg className="mx-auto mb-3 h-12 w-12 text-[#5A5A72]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5" /></svg>
          <p className="text-sm">Aun no hay publicaciones</p>
          <p className="mt-1 text-xs text-[#5A5A72]/60">Ve al tab Publicar para crear la primera</p>
        </div>
      )}

      {/* ── Posts ── */}
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          userId={userId}
          isExpanded={expandedPostId === post.id}
          comments={comments[post.id] ?? []}
          loadingComments={loadingComments[post.id] ?? false}
          newCommentText={newComment[post.id] ?? ""}
          replyingTo={replyingTo[post.id] ?? null}
          replyText={replyText}
          onToggleLike={onToggleLike}
          onExpand={onExpandPost}
          onLoadComments={onLoadComments}
          onSetNewComment={onSetNewComment}
          onAddComment={onAddComment}
          onDeleteComment={onDeleteComment}
          onToggleCommentLike={onToggleCommentLike}
          onSetReplyingTo={onSetReplyingTo}
          onSetReplyText={onSetReplyText}
          onDeletePost={onDeletePost}
          onTogglePin={onTogglePin}
        />
      ))}
    </div>
  );
}

// ── Post Card ──
interface PostCardProps {
  post: CommunityPost;
  userId: string | null;
  isExpanded: boolean;
  comments: CommunityComment[];
  loadingComments: boolean;
  newCommentText: string;
  replyingTo: string | null;
  replyText: Record<string, string>;
  onToggleLike: (id: string, liked: boolean) => void;
  onExpand: (id: string | null) => void;
  onLoadComments: (id: string) => void;
  onSetNewComment: (postId: string, text: string) => void;
  onAddComment: (postId: string, parentId?: string | null) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onToggleCommentLike: (postId: string, commentId: string, liked: boolean) => void;
  onSetReplyingTo: (postId: string, commentId: string | null) => void;
  onSetReplyText: (commentId: string, text: string) => void;
  onDeletePost: (id: string) => void;
  onTogglePin: (id: string, pinned: boolean) => void;
}

function PostCard({
  post, userId, isExpanded, comments, loadingComments, newCommentText,
  replyingTo, replyText,
  onToggleLike, onExpand, onLoadComments, onSetNewComment, onAddComment,
  onDeleteComment, onToggleCommentLike, onSetReplyingTo, onSetReplyText,
  onDeletePost, onTogglePin,
}: PostCardProps) {
  const isAuthor = post.author_id === userId;
  const isTrainerPost = post.author_role === "trainer";

  const handleExpandToggle = () => {
    if (isExpanded) { onExpand(null); } else { onExpand(post.id); if (!comments.length) onLoadComments(post.id); }
  };

  return (
    <div className={`rounded-2xl border bg-[#12121A] p-5 transition-all ${post.is_pinned ? "border-[#7C3AED]/30 ring-1 ring-[#7C3AED]/10" : "border-white/[0.06]"}`}>
      {post.is_pinned && (
        <div className="mb-3 flex items-center gap-1.5 text-xs text-[#7C3AED]">
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
          <span className="font-semibold uppercase tracking-wider">Fijado</span>
        </div>
      )}

      {/* Author header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-full font-bold text-sm ${isTrainerPost ? "bg-[#7C3AED]/20 text-[#7C3AED]" : "bg-[#00E5FF]/10 text-[#00E5FF]"}`}>
            {(post.author_name ?? "?")[0]?.toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${isTrainerPost ? "text-[#7C3AED]" : "text-white"}`}>{post.author_name}</span>
              {isTrainerPost && <VerifiedBadge />}
            </div>
            <span className="text-xs text-[#5A5A72]">{getTimeAgo(post.created_at)}</span>
          </div>
        </div>
        {isAuthor && (
          <div className="flex items-center gap-1">
            <button onClick={() => onTogglePin(post.id, post.is_pinned)} className={`rounded-lg p-1.5 text-xs transition-colors ${post.is_pinned ? "text-[#7C3AED]" : "text-[#5A5A72] hover:text-[#7C3AED]"}`} title={post.is_pinned ? "Desfijar" : "Fijar"}>
              <svg className="h-4 w-4" fill={post.is_pinned ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" /></svg>
            </button>
            <button onClick={() => onDeletePost(post.id)} className="rounded-lg p-1.5 text-[#5A5A72] transition-colors hover:text-[#FF1744]" title="Eliminar">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
            </button>
          </div>
        )}
      </div>

      {post.title && (
        <h3 className="mt-3 text-base font-bold text-white">{post.title}</h3>
      )}
      <p className={`${post.title ? "mt-1" : "mt-3"} whitespace-pre-wrap text-sm leading-relaxed text-[#E0E0E8]`}>{post.content}</p>

      {post.image_url && (
        <div className="mt-3 overflow-hidden rounded-xl border border-white/[0.04]">
          <img src={post.image_url} alt="" className="w-full object-cover" style={{ maxHeight: 400 }} />
        </div>
      )}

      {/* Actions bar */}
      <div className="mt-4 flex items-center gap-4 border-t border-white/[0.04] pt-3">
        <button onClick={() => onToggleLike(post.id, !!post.user_has_liked)} className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-all ${post.user_has_liked ? "text-[#00E5FF]" : "text-[#5A5A72] hover:text-[#00E5FF]"}`}>
          <svg className="h-4 w-4" fill={post.user_has_liked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
          <span className="font-medium">{post.likes_count ?? 0}</span>
        </button>
        <button onClick={handleExpandToggle} className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-all ${isExpanded ? "text-[#00E5FF]" : "text-[#5A5A72] hover:text-[#00E5FF]"}`}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" /></svg>
          <span className="font-medium">{post.comments_count ?? 0}</span>
        </button>
      </div>

      {/* Comments section */}
      {isExpanded && (
        <div className="mt-3 space-y-3 border-t border-white/[0.04] pt-3">
          {loadingComments && (
            <div className="flex items-center justify-center py-4"><div className="h-5 w-5 animate-spin rounded-full border-2 border-[#00E5FF]/20 border-t-[#00E5FF]" /></div>
          )}
          {!loadingComments && comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} postId={post.id} userId={userId} depth={0} replyingTo={replyingTo} replyText={replyText} onDeleteComment={onDeleteComment} onToggleCommentLike={onToggleCommentLike} onSetReplyingTo={onSetReplyingTo} onSetReplyText={onSetReplyText} onAddComment={onAddComment} />
          ))}
          <div className="flex gap-2">
            <input type="text" value={newCommentText} onChange={(e) => onSetNewComment(post.id, e.target.value)} placeholder="Escribe un comentario..." className="flex-1 rounded-lg border border-white/[0.06] bg-[#0A0A0F] px-3 py-2 text-xs text-white placeholder-[#5A5A72] focus:border-[#00E5FF]/30 focus:outline-none" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onAddComment(post.id); } }} />
            <button onClick={() => onAddComment(post.id)} disabled={!newCommentText?.trim()} className="rounded-lg bg-[#00E5FF]/10 px-3 py-2 text-xs font-medium text-[#00E5FF] transition-all hover:bg-[#00E5FF]/20 disabled:opacity-40">Enviar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Comment Item (recursive for replies) ──
interface CommentItemProps {
  comment: CommunityComment;
  postId: string;
  userId: string | null;
  depth: number;
  replyingTo: string | null;
  replyText: Record<string, string>;
  onDeleteComment: (postId: string, commentId: string) => void;
  onToggleCommentLike: (postId: string, commentId: string, liked: boolean) => void;
  onSetReplyingTo: (postId: string, commentId: string | null) => void;
  onSetReplyText: (commentId: string, text: string) => void;
  onAddComment: (postId: string, parentId?: string | null) => void;
}

function CommentItem({ comment, postId, userId, depth, replyingTo, replyText, onDeleteComment, onToggleCommentLike, onSetReplyingTo, onSetReplyText, onAddComment }: CommentItemProps) {
  const isTrainer = comment.author_role === "trainer";
  const isOwn = comment.author_id === userId;
  const isReplying = replyingTo === comment.id;
  const currentReplyText = replyText[comment.id] ?? "";
  const maxDepth = 2;

  return (
    <div className={depth > 0 ? "ml-6 border-l border-white/[0.04] pl-3" : ""}>
      <div className="flex gap-2.5">
        <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isTrainer ? "bg-[#7C3AED]/20 text-[#7C3AED]" : "bg-white/[0.06] text-[#8B8BA3]"}`}>
          {(comment.author_name ?? "?")[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold ${isTrainer ? "text-[#7C3AED]" : "text-white"}`}>{comment.author_name}</span>
            {isTrainer && <svg className="h-3 w-3 text-[#7C3AED]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>}
            <span className="text-[10px] text-[#5A5A72]">{getTimeAgo(comment.created_at)}</span>
          </div>
          <p className="mt-0.5 text-xs text-[#E0E0E8]">{comment.content}</p>
          <div className="mt-1 flex items-center gap-3">
            <button onClick={() => onToggleCommentLike(postId, comment.id, !!comment.user_has_liked)} className={`flex items-center gap-1 text-[10px] transition-all ${comment.user_has_liked ? "text-[#00E5FF]" : "text-[#5A5A72] hover:text-[#00E5FF]"}`}>
              <svg className="h-3 w-3" fill={comment.user_has_liked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
              {(comment.likes_count ?? 0) > 0 && <span>{comment.likes_count}</span>}
            </button>
            {comment.coach_liked && !comment.user_has_liked && (
              <span className="flex items-center gap-1 text-[10px] text-[#7C3AED]">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                <span className="font-semibold">Coach</span>
              </span>
            )}
            {comment.coach_liked && comment.user_has_liked && (
              <span className="flex items-center gap-1 text-[10px] text-[#7C3AED]">
                <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                <span className="font-semibold">Coach</span>
              </span>
            )}
            {depth < maxDepth && (
              <button onClick={() => onSetReplyingTo(postId, isReplying ? null : comment.id)} className={`text-[10px] font-medium transition-all ${isReplying ? "text-[#00E5FF]" : "text-[#5A5A72] hover:text-white"}`}>Responder</button>
            )}
            {isOwn && (
              <button onClick={() => onDeleteComment(postId, comment.id)} className="text-[10px] text-[#5A5A72] transition-colors hover:text-[#FF1744]">Eliminar</button>
            )}
          </div>
          {isReplying && (
            <div className="mt-2 flex gap-2">
              <input type="text" value={currentReplyText} onChange={(e) => onSetReplyText(comment.id, e.target.value)} placeholder={`Responder a ${comment.author_name}...`} className="flex-1 rounded-lg border border-white/[0.06] bg-[#0A0A0F] px-3 py-1.5 text-xs text-white placeholder-[#5A5A72] focus:border-[#00E5FF]/30 focus:outline-none" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onAddComment(postId, comment.id); } }} autoFocus />
              <button onClick={() => onAddComment(postId, comment.id)} disabled={!currentReplyText.trim()} className="rounded-lg bg-[#00E5FF]/10 px-2.5 py-1.5 text-[10px] font-medium text-[#00E5FF] transition-all hover:bg-[#00E5FF]/20 disabled:opacity-40">Enviar</button>
            </div>
          )}
        </div>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} postId={postId} userId={userId} depth={depth + 1} replyingTo={replyingTo} replyText={replyText} onDeleteComment={onDeleteComment} onToggleCommentLike={onToggleCommentLike} onSetReplyingTo={onSetReplyingTo} onSetReplyText={onSetReplyText} onAddComment={onAddComment} />
          ))}
        </div>
      )}
    </div>
  );
}

function VerifiedBadge() {
  return (
    <span className="flex items-center gap-1 rounded-full bg-[#7C3AED]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#7C3AED]">
      <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
      Coach
    </span>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `hace ${days}d`;
  return new Date(dateStr).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}
