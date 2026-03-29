"use client";

import { Suspense } from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";

interface Post {
  id: string;
  community_id: string;
  author_id: string;
  title: string | null;
  content: string;
  image_url: string | null;
  is_pinned: boolean;
  created_at: string;
  author_name: string;
  author_role: "trainer" | "client";
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
}

interface Comment {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_id: string;
  content: string;
  created_at: string;
  author_name: string;
  author_role: "trainer" | "client";
  likes_count: number;
  coach_liked: boolean;
  user_has_liked: boolean;
  replies: Comment[];
}

interface Community {
  id: string;
  coach_id: string;
  name: string;
  description: string | null;
  mode: "OPEN" | "READ_ONLY_CLIENTS";
  is_active: boolean;
}

function ClientCommunityInner() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newImage, setNewImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<Record<string, string | null>>({});
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"feed" | "publish">("feed");
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = useRef(createClient());

  // ── Init ──
  useEffect(() => {
    const init = async () => {
      const sb = supabase.current;
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: tc, error: tcErr } = await sb
        .from("trainer_clients")
        .select("trainer_id")
        .eq("client_id", user.id)
        .eq("status", "active")
        .single();

      if (tcErr || !tc) { setLoading(false); return; }

      const { data: comm, error: commErr } = await sb
        .from("communities")
        .select("*")
        .eq("coach_id", tc.trainer_id)
        .eq("is_active", true)
        .single();

      if (commErr || !comm) { setLoading(false); return; }
      setCommunity(comm as Community);

      const { data: rawPosts, error: postsErr } = await sb
        .from("community_posts")
        .select("*")
        .eq("community_id", comm.id)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (postsErr) {
        toast.error("Error al cargar el feed");
        console.error("[ClientCommunity] posts:", postsErr);
        setLoading(false);
        return;
      }

      if (!rawPosts || rawPosts.length === 0) { setPosts([]); setLoading(false); return; }

      const postIds = rawPosts.map((p) => p.id);
      const authorIds = [...new Set(rawPosts.map((p) => p.author_id))];

      const [likesRes, commentsRes, profilesRes] = await Promise.all([
        sb.from("community_likes").select("post_id, user_id").in("post_id", postIds),
        sb.from("community_comments").select("post_id").in("post_id", postIds),
        sb.from("profiles").select("user_id, full_name, business_name, role").in("user_id", authorIds),
      ]);

      const profileMap = new Map(profilesRes.data?.map((p) => [p.user_id, p]) ?? []);

      const enriched: Post[] = rawPosts.map((p) => {
        const profile = profileMap.get(p.author_id);
        const postLikes = likesRes.data?.filter((l) => l.post_id === p.id) ?? [];
        const postComments = commentsRes.data?.filter((c) => c.post_id === p.id) ?? [];
        return {
          ...p,
          author_name: profile?.role === "trainer" ? (profile.business_name ?? profile.full_name ?? "Coach") : (profile?.full_name ?? "Cliente"),
          author_role: (profile?.role ?? "client") as "trainer" | "client",
          likes_count: postLikes.length,
          comments_count: postComments.length,
          user_has_liked: postLikes.some((l) => l.user_id === user.id),
        };
      });

      setPosts(enriched);

      // Mark community as read
      await sb.from("community_read_status").upsert(
        { community_id: comm.id, user_id: user.id, last_seen_at: new Date().toISOString() },
        { onConflict: "community_id,user_id" }
      ); // No bloqueante

      setLoading(false);
    };
    init();
  }, []);

  // ── Realtime ──
  useEffect(() => {
    if (!community) return;
    const sb = supabase.current;
    const channel = sb
      .channel("client-community-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "community_posts", filter: `community_id=eq.${community.id}` }, (payload) => {
        if (payload.new.author_id !== userId) {
          const post = payload.new as Post;
          post.likes_count = 0;
          post.comments_count = 0;
          post.user_has_liked = false;
          post.author_role = "trainer";
          post.author_name = "Coach";
          setPosts((prev) => [post, ...prev]);
        }
      })
      .subscribe();
    return () => { sb.removeChannel(channel); };
  }, [community, userId]);

  // ── Toggle post like ──
  const toggleLike = useCallback(async (postId: string, liked: boolean) => {
    if (!userId) return;
    const sb = supabase.current;
    setPosts((prev) => prev.map((p) =>
      p.id === postId ? { ...p, user_has_liked: !liked, likes_count: p.likes_count + (liked ? -1 : 1) } : p
    ));
    if (liked) {
      const { error } = await sb.from("community_likes").delete().eq("post_id", postId).eq("user_id", userId);
      if (error) { setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, user_has_liked: liked, likes_count: p.likes_count + (liked ? 1 : -1) } : p)); console.error("[ClientCommunity] unlike:", error); }
    } else {
      const { error } = await sb.from("community_likes").insert({ post_id: postId, user_id: userId });
      if (error) { setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, user_has_liked: liked, likes_count: p.likes_count + (liked ? 1 : -1) } : p)); console.error("[ClientCommunity] like:", error); }
    }
  }, [userId]);

  // ── Publish (only if mode=OPEN) ──
  const handlePublish = useCallback(async () => {
    if (!community || !userId || !newContent.trim()) return;
    setPublishing(true);
    const sb = supabase.current;

    let imageUrl: string | null = null;
    if (newImage) {
      const ext = newImage.name.split(".").pop();
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: upErr } = await sb.storage.from("community-images").upload(path, newImage);
      if (upErr) { toast.error("Error al subir imagen"); console.error("[ClientCommunity] upload:", upErr); setPublishing(false); return; }
      const { data: urlData } = sb.storage.from("community-images").getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }

    const titleTrimmed = newTitle.trim() || null;

    const { data: post, error } = await sb
      .from("community_posts")
      .insert({ community_id: community.id, author_id: userId, title: titleTrimmed, content: newContent.trim(), image_url: imageUrl })
      .select()
      .single();

    if (error) { toast.error("Error al publicar"); console.error("[ClientCommunity] publish:", error); setPublishing(false); return; }

    setPosts((prev) => [{ ...post, author_name: "Yo", author_role: "client" as const, likes_count: 0, comments_count: 0, user_has_liked: false }, ...prev]);
    setNewTitle("");
    setNewContent("");
    setNewImage(null);
    setImagePreview(null);
    setPublishing(false);
    toast.success("Publicacion creada");
  }, [community, userId, newTitle, newContent, newImage]);

  // ── Load comments (with nesting + comment likes) ──
  const loadComments = useCallback(async (postId: string) => {
    setLoadingComments((prev) => ({ ...prev, [postId]: true }));
    const sb = supabase.current;

    const { data, error } = await sb
      .from("community_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) { toast.error("Error al cargar comentarios"); console.error("[ClientCommunity] comments:", error); setLoadingComments((prev) => ({ ...prev, [postId]: false })); return; }

    const allComments = data ?? [];
    const commentIds = allComments.map((c) => c.id);
    const authorIds = [...new Set(allComments.map((c) => c.author_id))];

    const [profilesRes, commentLikesRes] = await Promise.all([
      authorIds.length > 0 ? sb.from("profiles").select("user_id, full_name, business_name, role").in("user_id", authorIds) : Promise.resolve({ data: [] }),
      commentIds.length > 0 ? sb.from("community_comment_likes").select("comment_id, user_id, is_coach").in("comment_id", commentIds) : Promise.resolve({ data: [] }),
    ]);

    const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.user_id, p]));
    const commentLikes = commentLikesRes.data ?? [];

    const enrichedFlat: Comment[] = allComments.map((c) => {
      const profile = profileMap.get(c.author_id);
      const thisLikes = commentLikes.filter((l) => l.comment_id === c.id);
      return {
        ...c,
        author_name: profile?.role === "trainer" ? (profile.business_name ?? profile.full_name ?? "Coach") : (profile?.full_name ?? "Yo"),
        author_role: (profile?.role ?? "client") as "trainer" | "client",
        likes_count: thisLikes.length,
        coach_liked: thisLikes.some((l) => l.is_coach),
        user_has_liked: thisLikes.some((l) => l.user_id === userId),
        replies: [],
      };
    });

    // Build tree
    const commentMap = new Map<string, Comment>();
    enrichedFlat.forEach((c) => commentMap.set(c.id, c));
    const rootComments: Comment[] = [];
    enrichedFlat.forEach((c) => {
      if (c.parent_id && commentMap.has(c.parent_id)) {
        const parent = commentMap.get(c.parent_id)!;
        parent.replies = [...(parent.replies ?? []), c];
      } else {
        rootComments.push(c);
      }
    });

    setComments((prev) => ({ ...prev, [postId]: rootComments }));
    setLoadingComments((prev) => ({ ...prev, [postId]: false }));
  }, [userId]);

  // ── Add comment (top-level or reply) ──
  const addComment = useCallback(async (postId: string, parentId?: string | null) => {
    const text = parentId ? replyText[parentId]?.trim() : newComment[postId]?.trim();
    if (!text || !userId) return;
    const sb = supabase.current;

    const { data, error } = await sb
      .from("community_comments")
      .insert({ post_id: postId, author_id: userId, content: text, parent_id: parentId ?? null })
      .select()
      .single();

    if (error) { toast.error("Error al comentar"); console.error("[ClientCommunity] addComment:", error); return; }

    const newC: Comment = { ...data, author_name: "Yo", author_role: "client" as const, likes_count: 0, coach_liked: false, user_has_liked: false, replies: [] };

    if (parentId) {
      setComments((prev) => ({
        ...prev,
        [postId]: addReplyToTree(prev[postId] ?? [], parentId, newC),
      }));
      setReplyText((prev) => ({ ...prev, [parentId]: "" }));
      setReplyingTo((prev) => ({ ...prev, [postId]: null }));
    } else {
      setComments((prev) => ({ ...prev, [postId]: [...(prev[postId] ?? []), newC] }));
      setNewComment((prev) => ({ ...prev, [postId]: "" }));
    }
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p));
  }, [newComment, replyText, userId]);

  // ── Toggle comment like ──
  const toggleCommentLike = useCallback(async (postId: string, commentId: string, currentlyLiked: boolean) => {
    if (!userId) return;
    const sb = supabase.current;
    const isCoach = false; // Client is never coach

    // Optimistic
    setComments((prev) => ({
      ...prev,
      [postId]: updateCommentInTree(prev[postId] ?? [], commentId, (c) => ({
        ...c,
        user_has_liked: !currentlyLiked,
        likes_count: (c.likes_count ?? 0) + (currentlyLiked ? -1 : 1),
      })),
    }));

    if (currentlyLiked) {
      const { error } = await sb.from("community_comment_likes").delete().eq("comment_id", commentId).eq("user_id", userId);
      if (error) {
        setComments((prev) => ({ ...prev, [postId]: updateCommentInTree(prev[postId] ?? [], commentId, (c) => ({ ...c, user_has_liked: currentlyLiked, likes_count: (c.likes_count ?? 0) + (currentlyLiked ? 1 : -1) })) }));
        console.error("[ClientCommunity] unlikeComment:", error);
      }
    } else {
      const { error } = await sb.from("community_comment_likes").insert({ comment_id: commentId, user_id: userId, is_coach: isCoach });
      if (error) {
        setComments((prev) => ({ ...prev, [postId]: updateCommentInTree(prev[postId] ?? [], commentId, (c) => ({ ...c, user_has_liked: currentlyLiked, likes_count: (c.likes_count ?? 0) + (currentlyLiked ? 1 : -1) })) }));
        console.error("[ClientCommunity] likeComment:", error);
      }
    }
  }, [userId]);

  // ── Delete own post ──
  const deletePost = useCallback(async (postId: string) => {
    const sb = supabase.current;
    const { error } = await sb.from("community_posts").delete().eq("id", postId);
    if (error) { toast.error("Error al eliminar publicacion"); console.error("[ClientCommunity] delete:", error); return; }
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  // ── Delete own comment ──
  const deleteComment = useCallback(async (postId: string, commentId: string) => {
    const sb = supabase.current;
    const { error } = await sb.from("community_comments").delete().eq("id", commentId);
    if (error) { toast.error("Error al eliminar comentario"); console.error("[ClientCommunity] deleteComment:", error); return; }
    setComments((prev) => ({ ...prev, [postId]: removeCommentFromTree(prev[postId] ?? [], commentId) }));
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, comments_count: Math.max(0, p.comments_count - 1) } : p));
  }, []);

  // ── Render ──
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

  const clientTabs = canPost
    ? [{ key: "feed" as const, label: "Feed" }, { key: "publish" as const, label: "Publicar" }]
    : [{ key: "feed" as const, label: "Feed" }];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">{community.name}</h1>
        {community.description && <p className="mt-1 text-sm text-[#5A5A72]">{community.description}</p>}
      </div>

      {/* Tabs */}
      {clientTabs.length > 1 && (
        <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-[#12121A] p-1">
          {clientTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
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
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#8B8BA3]">Nueva publicacion</h2>
            <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Titulo (opcional)" className="mb-3 w-full rounded-xl border border-white/[0.06] bg-[#0A0A0F] px-4 py-3 text-sm font-semibold text-white placeholder-[#5A5A72] focus:border-[#00E5FF]/30 focus:outline-none focus:ring-1 focus:ring-[#00E5FF]/20" />
            <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="Comparte algo con la comunidad..." rows={5} className="w-full resize-none rounded-xl border border-white/[0.06] bg-[#0A0A0F] px-4 py-3 text-sm text-white placeholder-[#5A5A72] focus:border-[#00E5FF]/30 focus:outline-none focus:ring-1 focus:ring-[#00E5FF]/20" />
            {imagePreview && (
              <div className="relative mt-3 inline-block">
                <img src={imagePreview} alt="Preview" className="max-h-48 rounded-xl border border-white/[0.06]" />
                <button onClick={() => { setNewImage(null); setImagePreview(null); if (fileRef.current) fileRef.current.value = ""; }} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#FF1744] text-white text-xs">x</button>
              </div>
            )}
            <div className="mt-4 flex items-center justify-between">
              <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#8B8BA3] transition-colors hover:bg-white/[0.04] hover:text-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" /></svg>
                Imagen
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; setNewImage(f); setImagePreview(URL.createObjectURL(f)); }} />
              <button onClick={handlePublish} disabled={!newContent.trim() || publishing} className="rounded-xl bg-[#00E5FF] px-6 py-2.5 text-sm font-semibold text-[#0A0A0F] transition-all hover:bg-[#00E5FF]/90 disabled:opacity-40 disabled:cursor-not-allowed">
                {publishing ? "Publicando..." : "Publicar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feed tab */}
      {activeTab === "feed" && (
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Posts */}
        {posts.length === 0 && (
          <div className="py-16 text-center text-[#5A5A72]">
            <svg className="mx-auto mb-3 h-12 w-12 text-[#5A5A72]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5" /></svg>
            <p className="text-sm">Aun no hay publicaciones en la comunidad</p>
            {canPost && <p className="mt-1 text-xs text-[#5A5A72]/60">Ve al tab Publicar para crear la primera</p>}
          </div>
        )}

        {posts.map((post) => {
          const isAuthor = post.author_id === userId;
          const isTrainer = post.author_role === "trainer";
          const isExp = expandedPost === post.id;
          const postComments = comments[post.id] ?? [];
          const isLoadingComments = loadingComments[post.id] ?? false;
          const postReplyingTo = replyingTo[post.id] ?? null;

          return (
            <div key={post.id} className={`rounded-2xl border bg-[#12121A] p-5 transition-all ${post.is_pinned ? "border-[#7C3AED]/30 ring-1 ring-[#7C3AED]/10" : "border-white/[0.06]"}`}>
              {post.is_pinned && (
                <div className="mb-3 flex items-center gap-1.5 text-xs text-[#7C3AED]">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
                  <span className="font-semibold uppercase tracking-wider">Fijado</span>
                </div>
              )}

              {/* Author */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full font-bold text-sm ${isTrainer ? "bg-[#7C3AED]/20 text-[#7C3AED]" : "bg-[#00E5FF]/10 text-[#00E5FF]"}`}>
                    {(post.author_name ?? "?")[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${isTrainer ? "text-[#7C3AED]" : "text-white"}`}>{post.author_name}</span>
                      {isTrainer && <VerifiedBadge />}
                    </div>
                    <span className="text-xs text-[#5A5A72]">{getTimeAgo(post.created_at)}</span>
                  </div>
                </div>
                {isAuthor && (
                  <button onClick={() => deletePost(post.id)} className="rounded-lg p-1.5 text-[#5A5A72] transition-colors hover:text-[#FF1744]" title="Eliminar">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                  </button>
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

              {/* Actions */}
              <div className="mt-4 flex items-center gap-4 border-t border-white/[0.04] pt-3">
                <button onClick={() => toggleLike(post.id, post.user_has_liked)} className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-all ${post.user_has_liked ? "text-[#00E5FF]" : "text-[#5A5A72] hover:text-[#00E5FF]"}`}>
                  <svg className="h-4 w-4" fill={post.user_has_liked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                  <span className="font-medium">{post.likes_count}</span>
                </button>
                <button onClick={() => { if (isExp) { setExpandedPost(null); } else { setExpandedPost(post.id); if (!postComments.length) loadComments(post.id); } }} className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-all ${isExp ? "text-[#00E5FF]" : "text-[#5A5A72] hover:text-[#00E5FF]"}`}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" /></svg>
                  <span className="font-medium">{post.comments_count}</span>
                </button>
              </div>

              {/* Comments */}
              {isExp && (
                <div className="mt-3 space-y-3 border-t border-white/[0.04] pt-3">
                  {isLoadingComments && (
                    <div className="flex items-center justify-center py-4"><div className="h-5 w-5 animate-spin rounded-full border-2 border-[#00E5FF]/20 border-t-[#00E5FF]" /></div>
                  )}
                  {!isLoadingComments && postComments.map((c) => (
                    <ClientCommentItem
                      key={c.id}
                      comment={c}
                      postId={post.id}
                      userId={userId}
                      depth={0}
                      replyingTo={postReplyingTo}
                      replyText={replyText}
                      onDeleteComment={deleteComment}
                      onToggleCommentLike={toggleCommentLike}
                      onSetReplyingTo={(cId) => setReplyingTo((prev) => ({ ...prev, [post.id]: cId }))}
                      onSetReplyText={(cId, t) => setReplyText((prev) => ({ ...prev, [cId]: t }))}
                      onAddComment={addComment}
                    />
                  ))}
                  <div className="flex gap-2">
                    <input type="text" value={newComment[post.id] ?? ""} onChange={(e) => setNewComment((prev) => ({ ...prev, [post.id]: e.target.value }))} placeholder="Escribe un comentario..." className="flex-1 rounded-lg border border-white/[0.06] bg-[#0A0A0F] px-3 py-2 text-xs text-white placeholder-[#5A5A72] focus:border-[#00E5FF]/30 focus:outline-none" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addComment(post.id); } }} />
                    <button onClick={() => addComment(post.id)} disabled={!(newComment[post.id]?.trim())} className="rounded-lg bg-[#00E5FF]/10 px-3 py-2 text-xs font-medium text-[#00E5FF] transition-all hover:bg-[#00E5FF]/20 disabled:opacity-40">Enviar</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}

// ── Client Comment Item (recursive) ──
interface ClientCommentItemProps {
  comment: Comment;
  postId: string;
  userId: string | null;
  depth: number;
  replyingTo: string | null;
  replyText: Record<string, string>;
  onDeleteComment: (postId: string, commentId: string) => void;
  onToggleCommentLike: (postId: string, commentId: string, liked: boolean) => void;
  onSetReplyingTo: (commentId: string | null) => void;
  onSetReplyText: (commentId: string, text: string) => void;
  onAddComment: (postId: string, parentId?: string | null) => void;
}

function ClientCommentItem({
  comment, postId, userId, depth, replyingTo, replyText,
  onDeleteComment, onToggleCommentLike, onSetReplyingTo, onSetReplyText, onAddComment,
}: ClientCommentItemProps) {
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

          {/* Comment actions */}
          <div className="mt-1 flex items-center gap-3">
            <button onClick={() => onToggleCommentLike(postId, comment.id, !!comment.user_has_liked)} className={`flex items-center gap-1 text-[10px] transition-all ${comment.user_has_liked ? "text-[#00E5FF]" : "text-[#5A5A72] hover:text-[#00E5FF]"}`}>
              <svg className="h-3 w-3" fill={comment.user_has_liked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
              {(comment.likes_count ?? 0) > 0 && <span>{comment.likes_count}</span>}
            </button>

            {/* Coach liked indicator */}
            {comment.coach_liked && (
              <span className="flex items-center gap-1 text-[10px] text-[#7C3AED]">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                <span className="font-semibold">Coach</span>
              </span>
            )}

            {depth < maxDepth && (
              <button onClick={() => onSetReplyingTo(isReplying ? null : comment.id)} className={`text-[10px] font-medium transition-all ${isReplying ? "text-[#00E5FF]" : "text-[#5A5A72] hover:text-white"}`}>
                Responder
              </button>
            )}

            {isOwn && (
              <button onClick={() => onDeleteComment(postId, comment.id)} className="text-[10px] text-[#5A5A72] transition-colors hover:text-[#FF1744]">Eliminar</button>
            )}
          </div>

          {/* Reply input */}
          {isReplying && (
            <div className="mt-2 flex gap-2">
              <input type="text" value={currentReplyText} onChange={(e) => onSetReplyText(comment.id, e.target.value)} placeholder={`Responder a ${comment.author_name}...`} className="flex-1 rounded-lg border border-white/[0.06] bg-[#0A0A0F] px-3 py-1.5 text-xs text-white placeholder-[#5A5A72] focus:border-[#00E5FF]/30 focus:outline-none" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onAddComment(postId, comment.id); } }} autoFocus />
              <button onClick={() => onAddComment(postId, comment.id)} disabled={!currentReplyText.trim()} className="rounded-lg bg-[#00E5FF]/10 px-2.5 py-1.5 text-[10px] font-medium text-[#00E5FF] transition-all hover:bg-[#00E5FF]/20 disabled:opacity-40">Enviar</button>
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <ClientCommentItem key={reply.id} comment={reply} postId={postId} userId={userId} depth={depth + 1} replyingTo={replyingTo} replyText={replyText} onDeleteComment={onDeleteComment} onToggleCommentLike={onToggleCommentLike} onSetReplyingTo={onSetReplyingTo} onSetReplyText={onSetReplyText} onAddComment={onAddComment} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Verified Badge ──
function VerifiedBadge() {
  return (
    <span className="flex items-center gap-1 rounded-full bg-[#7C3AED]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#7C3AED]">
      <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
      Coach
    </span>
  );
}

// ── Tree helpers ──
function updateCommentInTree(comments: Comment[], id: string, updater: (c: Comment) => Comment): Comment[] {
  return comments.map((c) => {
    if (c.id === id) return updater(c);
    if (c.replies?.length) return { ...c, replies: updateCommentInTree(c.replies, id, updater) };
    return c;
  });
}

function removeCommentFromTree(comments: Comment[], id: string): Comment[] {
  return comments.filter((c) => c.id !== id).map((c) => {
    if (c.replies?.length) return { ...c, replies: removeCommentFromTree(c.replies, id) };
    return c;
  });
}

function addReplyToTree(comments: Comment[], parentId: string, reply: Comment): Comment[] {
  return comments.map((c) => {
    if (c.id === parentId) return { ...c, replies: [...(c.replies ?? []), reply] };
    if (c.replies?.length) return { ...c, replies: addReplyToTree(c.replies, parentId, reply) };
    return c;
  });
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

export default function ClientCommunityPage() {
  return (
    <Suspense fallback={<div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF]/20 border-t-[#00E5FF]" /></div>}>
      <ClientCommunityInner />
    </Suspense>
  );
}
