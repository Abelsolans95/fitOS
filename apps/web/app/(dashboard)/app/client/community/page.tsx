"use client";

import { Suspense } from "react";
import { useClientCommunityPage } from "./useClientCommunityPage";
import { CommunityFeed } from "./components/CommunityFeed";
import { PublishPost } from "./components/PublishPost";
import type { CommunityTab } from "./components/types";

function ClientCommunityInner() {
  const {
    state,
    dispatch,
    toggleLike,
    handlePublish,
    loadComments,
    addComment,
    toggleCommentLike,
    deletePost,
    deleteComment,
  } = useClientCommunityPage();

  const { loading, community, posts, activeTab, userId, newTitle, newContent, imagePreview, publishing, expandedPost, comments, loadingComments, newComment, replyingTo, replyText } = state;

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF]/20 border-t-[#00E5FF]" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <svg className="h-16 w-16 text-[#5A5A72]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /></svg>
        <p className="text-sm text-[#5A5A72]">Tu entrenador aun no ha activado la comunidad</p>
      </div>
    );
  }

  const canPost = community.mode === "OPEN";
  const clientTabs: { key: CommunityTab; label: string }[] = canPost
    ? [{ key: "feed", label: "Feed" }, { key: "publish", label: "Publicar" }]
    : [{ key: "feed", label: "Feed" }];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">{community.name}</h1>
        {community.description && <p className="mt-1 text-sm text-[#5A5A72]">{community.description}</p>}
      </div>

      {/* Tabs */}
      {clientTabs.length > 1 && (
        <div className="flex gap-1 rounded-xl border border-white/10 bg-[#12121A] p-1">
          {clientTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => dispatch({ type: "SET_ACTIVE_TAB", payload: tab.key })}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-[#00E5FF]/10 text-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.1)]"
                  : "text-[#5A5A72] hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Publish tab */}
      {activeTab === "publish" && canPost && (
        <PublishPost
          newTitle={newTitle}
          newContent={newContent}
          imagePreview={imagePreview}
          publishing={publishing}
          onTitleChange={(v) => dispatch({ type: "SET_NEW_TITLE", payload: v })}
          onContentChange={(v) => dispatch({ type: "SET_NEW_CONTENT", payload: v })}
          onImageChange={(file) => dispatch({ type: "SET_NEW_IMAGE", payload: { file, preview: URL.createObjectURL(file) } })}
          onRemoveImage={() => dispatch({ type: "SET_NEW_IMAGE", payload: null })}
          onPublish={handlePublish}
        />
      )}

      {/* Feed tab */}
      {activeTab === "feed" && (
        <CommunityFeed
          posts={posts}
          userId={userId}
          canPost={canPost}
          expandedPost={expandedPost}
          comments={comments}
          loadingComments={loadingComments}
          newComment={newComment}
          replyingTo={replyingTo}
          replyText={replyText}
          onToggleLike={toggleLike}
          onToggleExpand={(postId) => {
            if (expandedPost === postId) {
              dispatch({ type: "SET_EXPANDED_POST", payload: null });
            } else {
              dispatch({ type: "SET_EXPANDED_POST", payload: postId });
              if (!(comments[postId]?.length)) loadComments(postId);
            }
          }}
          onLoadComments={loadComments}
          onDeletePost={deletePost}
          onDeleteComment={deleteComment}
          onToggleCommentLike={toggleCommentLike}
          onSetNewComment={(postId, text) => dispatch({ type: "SET_NEW_COMMENT", payload: { postId, text } })}
          onAddComment={addComment}
          onSetReplyingTo={(postId, commentId) => dispatch({ type: "SET_REPLYING_TO", payload: { postId, commentId } })}
          onSetReplyText={(commentId, text) => dispatch({ type: "SET_REPLY_TEXT", payload: { commentId, text } })}
        />
      )}
    </div>
  );
}

export default function ClientCommunityPage() {
  return (
    <Suspense fallback={<div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF]/20 border-t-[#00E5FF]" /></div>}>
      <ClientCommunityInner />
    </Suspense>
  );
}
