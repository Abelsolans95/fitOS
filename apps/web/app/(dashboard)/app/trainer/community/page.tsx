"use client";

import { Suspense, useEffect } from "react";
import { useCommunityPage } from "./useCommunityPage";
import { CommunityFeed } from "./components/CommunityFeed";
import { CommunityPublish } from "./components/CommunityPublish";
import { CommunitySettings } from "./components/CommunitySettings";
import type { CommunityTab } from "./components/types";

const TABS: { key: CommunityTab; label: string }[] = [
  { key: "feed", label: "Feed" },
  { key: "publish", label: "Publicar" },
  { key: "settings", label: "Ajustes" },
];

function CommunityPageInner() {
  const {
    state,
    dispatch,
    handlePublish,
    handleDeletePost,
    handleToggleLike,
    handleLoadComments,
    handleAddComment,
    handleDeleteComment,
    handleToggleCommentLike,
    handleTogglePin,
    handleSaveSettings,
    handleMarkAsRead,
  } = useCommunityPage();

  // Mark as read when community loads
  useEffect(() => {
    if (state.community && state.userId) handleMarkAsRead();
  }, [state.community, state.userId, handleMarkAsRead]);

  if (state.loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF]/20 border-t-[#00E5FF]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            {state.community?.name ?? "Comunidad"}
          </h1>
          <p className="mt-1 text-sm text-[#5A5A72]">
            Feed de Alto Rendimiento para tus clientes
          </p>
        </div>

        {/* Status badge */}
        {state.community && (
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              state.community.is_active
                ? "bg-[#00C853]/10 text-[#00C853]"
                : "bg-[#FF1744]/10 text-[#FF1744]"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${state.community.is_active ? "bg-[#00C853]" : "bg-[#FF1744]"}`} />
              {state.community.is_active ? "Activa" : "Inactiva"}
            </span>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
              state.community.mode === "OPEN"
                ? "bg-[#00E5FF]/10 text-[#00E5FF]"
                : "bg-[#FF9100]/10 text-[#FF9100]"
            }`}>
              {state.community.mode === "OPEN" ? "Abierta" : "Solo Coach"}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-[#12121A] p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => dispatch({ type: "SET_TAB", payload: tab.key })}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              state.activeTab === tab.key
                ? "bg-[#00E5FF]/10 text-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.1)]"
                : "text-[#5A5A72] hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {state.activeTab === "feed" && (
        <CommunityFeed
          userId={state.userId}
          posts={state.posts}
          expandedPostId={state.expandedPostId}
          comments={state.comments}
          loadingComments={state.loadingComments}
          newComment={state.newComment}
          replyingTo={state.replyingTo}
          replyText={state.replyText}
          onDeletePost={handleDeletePost}
          onToggleLike={handleToggleLike}
          onExpandPost={(id) => dispatch({ type: "SET_EXPANDED_POST", payload: id })}
          onLoadComments={handleLoadComments}
          onSetNewComment={(postId, text) => dispatch({ type: "SET_NEW_COMMENT", payload: { postId, text } })}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
          onToggleCommentLike={handleToggleCommentLike}
          onSetReplyingTo={(postId, commentId) => dispatch({ type: "SET_REPLYING_TO", payload: { postId, commentId } })}
          onSetReplyText={(commentId, text) => dispatch({ type: "SET_REPLY_TEXT", payload: { commentId, text } })}
          onTogglePin={handleTogglePin}
        />
      )}

      {state.activeTab === "publish" && (
        <CommunityPublish
          newPostTitle={state.newPostTitle}
          newPostContent={state.newPostContent}
          newPostImagePreview={state.newPostImagePreview}
          publishing={state.publishing}
          onSetTitle={(v: string) => dispatch({ type: "SET_NEW_POST_TITLE", payload: v })}
          onSetContent={(v: string) => dispatch({ type: "SET_NEW_POST_CONTENT", payload: v })}
          onSetImage={(file: File | null, preview: string | null) => dispatch({ type: "SET_NEW_POST_IMAGE", payload: { file, preview } })}
          onPublish={handlePublish}
        />
      )}

      {state.activeTab === "settings" && (
        <CommunitySettings
          name={state.settingsName}
          description={state.settingsDescription}
          mode={state.settingsMode}
          isActive={state.settingsActive}
          saving={state.savingSettings}
          onSetName={(v) => dispatch({ type: "SET_SETTINGS_NAME", payload: v })}
          onSetDescription={(v) => dispatch({ type: "SET_SETTINGS_DESCRIPTION", payload: v })}
          onSetMode={(v) => dispatch({ type: "SET_SETTINGS_MODE", payload: v })}
          onSetActive={(v) => dispatch({ type: "SET_SETTINGS_ACTIVE", payload: v })}
          onSave={handleSaveSettings}
        />
      )}
    </div>
  );
}

export default function CommunityPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF]/20 border-t-[#00E5FF]" />
      </div>
    }>
      <CommunityPageInner />
    </Suspense>
  );
}
