"use client";

import { useReducer, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { QUERY_LIMITS } from "@/lib/constants";
import { toast } from "sonner";
import { buildCommentTree } from "@/lib/community-utils";
import type { Community, CommunityPost, CommunityComment } from "./components/types";
import { communityReducer, communityInitialState } from "./community-reducer";
export { communityInitialState, communityReducer } from "./community-reducer";
export type { CommunityState, CommunityAction } from "./community-reducer";

export function useCommunityPage() {
  const [state, dispatch] = useReducer(communityReducer, communityInitialState);
  const supabaseRef = useRef(createClient());

  const loadPosts = useCallback(async (communityId: string, userId: string) => {
    const supabase = supabaseRef.current;

    const { data: posts, error } = await supabase
      .from("community_posts")
      .select("id,community_id,author_id,title,content,image_url,is_pinned,created_at,updated_at")
      .eq("community_id", communityId)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(QUERY_LIMITS.COMMUNITY_POSTS);

    if (error) {
      toast.error("Error al cargar publicaciones");
      console.error("[Community] loadPosts:", error);
      return;
    }

    if (!posts || posts.length === 0) {
      dispatch({ type: "SET_POSTS", payload: [] });
      return;
    }

    const postIds = posts.map((p) => p.id);
    const authorIds = [...new Set(posts.map((p) => p.author_id))];

    const [likesRes, commentsRes, profilesRes] = await Promise.all([
      supabase
        .from("community_likes")
        .select("post_id, user_id")
        .in("post_id", postIds),
      supabase
        .from("community_comments")
        .select("post_id")
        .in("post_id", postIds),
      supabase
        .from("profiles")
        .select("user_id, full_name, business_name, role")
        .in("user_id", authorIds),
    ]);

    const profileMap = new Map(profilesRes.data?.map((p) => [p.user_id, p]) ?? []);

    // Build lookup maps to avoid O(n*m) filtering
    const likesPerPost = new Map<string, { count: number; userLiked: boolean }>();
    for (const l of likesRes.data ?? []) {
      const entry = likesPerPost.get(l.post_id) ?? { count: 0, userLiked: false };
      entry.count++;
      if (l.user_id === userId) entry.userLiked = true;
      likesPerPost.set(l.post_id, entry);
    }
    const commentsPerPost = new Map<string, number>();
    for (const c of commentsRes.data ?? []) {
      commentsPerPost.set(c.post_id, (commentsPerPost.get(c.post_id) ?? 0) + 1);
    }

    const enriched: CommunityPost[] = posts.map((p) => {
      const profile = profileMap.get(p.author_id);
      const likeInfo = likesPerPost.get(p.id);
      return {
        ...p,
        author_name: profile?.role === "trainer" ? (profile.business_name ?? profile.full_name ?? "Coach") : (profile?.full_name ?? "Cliente"),
        author_role: profile?.role as "trainer" | "client" | undefined,
        likes_count: likeInfo?.count ?? 0,
        comments_count: commentsPerPost.get(p.id) ?? 0,
        user_has_liked: likeInfo?.userLiked ?? false,
      };
    });

    dispatch({ type: "SET_POSTS", payload: enriched });
  }, []);

  // ── Init: load or create community + posts ──
  useEffect(() => {
    const init = async () => {
      const supabase = supabaseRef.current;
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;
      dispatch({ type: "SET_USER_ID", payload: user.id });

      // Get or create community
      let { data: community, error } = await supabase
        .from("communities")
        .select("id,coach_id,name,description,mode,is_active,created_at")
        .eq("coach_id", user.id)
        .single();

      if (error && error.code === "PGRST116") {
        const { data: newCommunity, error: createError } = await supabase
          .from("communities")
          .insert({ coach_id: user.id, name: "Mi Comunidad" })
          .select()
          .single();
        if (createError) {
          toast.error("Error al crear la comunidad");
          console.error("[Community] create:", createError);
          dispatch({ type: "SET_LOADING", payload: false });
          return;
        }
        community = newCommunity;
      } else if (error) {
        toast.error("Error al cargar la comunidad");
        console.error("[Community] fetch:", error);
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }

      dispatch({ type: "SET_COMMUNITY", payload: community as Community });
      dispatch({ type: "INIT_SETTINGS", payload: community as Community });

      await loadPosts(community!.id, user.id);
      dispatch({ type: "SET_LOADING", payload: false });
    };
    init();
  }, [loadPosts]);

  // ── Realtime subscription ──
  useEffect(() => {
    if (!state.community) return;
    const supabase = supabaseRef.current;
    const channel = supabase
      .channel("community-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "community_posts", filter: `community_id=eq.${state.community.id}` }, (payload) => {
        if (payload.new.author_id !== state.userId) {
          const post = payload.new as CommunityPost;
          post.likes_count = 0;
          post.comments_count = 0;
          post.user_has_liked = false;
          post.author_role = "client";
          dispatch({ type: "ADD_POST", payload: post });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [state.community, state.userId]);

  // ── Publish post ──
  // ── Mark community as read ──
  const handleMarkAsRead = useCallback(async () => {
    if (!state.community || !state.userId) return;
    const supabase = supabaseRef.current;
    await supabase
      .from("community_read_status")
      .upsert(
        { community_id: state.community.id, user_id: state.userId, last_seen_at: new Date().toISOString() },
        { onConflict: "community_id,user_id" }
      );
    // No bloqueante — no need to check error
  }, [state.community, state.userId]);

  const handlePublish = useCallback(async () => {
    if (!state.community || !state.userId || !state.newPostContent.trim()) return;
    dispatch({ type: "SET_PUBLISHING", payload: true });
    const supabase = supabaseRef.current;

    let imageUrl: string | null = null;

    if (state.newPostImage) {
      // SECURITY: Whitelist extensions to prevent SVG XSS and disguised files
      const ext = state.newPostImage.name.split(".").pop()?.toLowerCase();
      if (!ext || !["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
        toast.error("Solo se permiten imagenes .jpg, .png, .webp o .gif");
        dispatch({ type: "SET_PUBLISHING", payload: false });
        return;
      }
      const path = `${state.userId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("community-images").upload(path, state.newPostImage);
      if (uploadError) {
        toast.error("Error al subir la imagen");
        console.error("[Community] upload:", uploadError);
        dispatch({ type: "SET_PUBLISHING", payload: false });
        return;
      }
      const { data: urlData } = supabase.storage.from("community-images").getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }

    const titleTrimmed = state.newPostTitle.trim() || null;

    // Auto-generate post slug from title when publishing publicly
    let postSlug: string | null = null;
    if (state.newPostIsPublic && titleTrimmed) {
      postSlug = titleTrimmed
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80);
      if (!postSlug) postSlug = null;
    }

    const insertData: Record<string, unknown> = {
      community_id: state.community.id,
      author_id: state.userId,
      title: titleTrimmed,
      content: state.newPostContent.trim(),
      image_url: imageUrl,
      is_public: state.newPostIsPublic,
      ...(postSlug ? { slug: postSlug } : {}),
    };

    const { data: post, error } = await supabase
      .from("community_posts")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      toast.error("Error al publicar");
      console.error("[Community] publish:", error);
      dispatch({ type: "SET_PUBLISHING", payload: false });
      return;
    }

    dispatch({ type: "ADD_POST", payload: { ...post, author_name: "Coach", author_role: "trainer", likes_count: 0, comments_count: 0, user_has_liked: false } });
    toast.success(state.newPostIsPublic ? "Publicacion creada (publica)" : "Publicacion creada");
  }, [state.community, state.userId, state.newPostTitle, state.newPostContent, state.newPostImage, state.newPostIsPublic]);

  const handleDeletePost = useCallback(async (postId: string) => {
    const supabase = supabaseRef.current;
    const { error } = await supabase.from("community_posts").delete().eq("id", postId);
    if (error) {
      toast.error("Error al eliminar publicacion");
      console.error("[Community] deletePost:", error);
      return;
    }
    dispatch({ type: "REMOVE_POST", payload: postId });
  }, []);

  const handleToggleLike = useCallback(async (postId: string, currentlyLiked: boolean) => {
    if (!state.userId) return;
    const supabase = supabaseRef.current;
    dispatch({ type: "TOGGLE_LIKE", payload: { postId, liked: !currentlyLiked } });
    if (currentlyLiked) {
      const { error } = await supabase.from("community_likes").delete().eq("post_id", postId).eq("user_id", state.userId);
      if (error) { dispatch({ type: "TOGGLE_LIKE", payload: { postId, liked: currentlyLiked } }); console.error("[Community] unlike:", error); }
    } else {
      const { error } = await supabase.from("community_likes").insert({ post_id: postId, user_id: state.userId });
      if (error) { dispatch({ type: "TOGGLE_LIKE", payload: { postId, liked: currentlyLiked } }); console.error("[Community] like:", error); }
    }
  }, [state.userId]);

  // ── Load comments for a post (with nesting + comment likes) ──
  const handleLoadComments = useCallback(async (postId: string) => {
    dispatch({ type: "SET_LOADING_COMMENTS", payload: { postId, loading: true } });
    const supabase = supabaseRef.current;
    const userId = state.userId;

    const { data, error } = await supabase
      .from("community_comments")
      .select("id,post_id,parent_id,author_id,content,created_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: true })
      .limit(QUERY_LIMITS.COMMUNITY_COMMENTS);

    if (error) {
      toast.error("Error al cargar comentarios");
      console.error("[Community] loadComments:", error);
      dispatch({ type: "SET_LOADING_COMMENTS", payload: { postId, loading: false } });
      return;
    }

    const allComments = data ?? [];
    const commentIds = allComments.map((c) => c.id);

    // Fetch profiles + comment likes in parallel
    const authorIds = [...new Set(allComments.map((c) => c.author_id))];
    const [profilesRes, commentLikesRes] = await Promise.all([
      authorIds.length > 0
        ? supabase.from("profiles").select("user_id, full_name, business_name, role").in("user_id", authorIds)
        : Promise.resolve({ data: [] }),
      commentIds.length > 0
        ? supabase.from("community_comment_likes").select("comment_id, user_id, is_coach").in("comment_id", commentIds)
        : Promise.resolve({ data: [] }),
    ]);

    const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.user_id, p]));

    // Build lookup map for comment likes to avoid O(n*m)
    const commentLikeMap = new Map<string, { count: number; coachLiked: boolean; userLiked: boolean }>();
    for (const l of commentLikesRes.data ?? []) {
      const entry = commentLikeMap.get(l.comment_id) ?? { count: 0, coachLiked: false, userLiked: false };
      entry.count++;
      if (l.is_coach) entry.coachLiked = true;
      if (l.user_id === userId) entry.userLiked = true;
      commentLikeMap.set(l.comment_id, entry);
    }

    // Enrich flat list
    const enrichedFlat: CommunityComment[] = allComments.map((c) => {
      const profile = profileMap.get(c.author_id);
      const likeInfo = commentLikeMap.get(c.id);
      return {
        ...c,
        author_name: profile?.role === "trainer" ? (profile.business_name ?? profile.full_name ?? "Coach") : (profile?.full_name ?? "Cliente"),
        author_role: profile?.role as "trainer" | "client" | undefined,
        likes_count: likeInfo?.count ?? 0,
        coach_liked: likeInfo?.coachLiked ?? false,
        user_has_liked: likeInfo?.userLiked ?? false,
        replies: [],
      };
    });

    // Build tree: group replies under parents
    const rootComments = buildCommentTree(enrichedFlat);

    dispatch({ type: "SET_COMMENTS", payload: { postId, comments: rootComments } });
    dispatch({ type: "SET_LOADING_COMMENTS", payload: { postId, loading: false } });
  }, [state.userId]);

  // ── Add comment (top-level or reply) ──
  const handleAddComment = useCallback(async (postId: string, parentId?: string | null) => {
    const text = parentId
      ? state.replyText[parentId]?.trim()
      : state.newComment[postId]?.trim();
    if (!text || !state.userId) return;
    const supabase = supabaseRef.current;

    const { data, error } = await supabase
      .from("community_comments")
      .insert({ post_id: postId, author_id: state.userId, content: text, parent_id: parentId ?? null })
      .select()
      .single();

    if (error) {
      toast.error("Error al comentar");
      console.error("[Community] addComment:", error);
      return;
    }

    dispatch({
      type: "ADD_COMMENT",
      payload: {
        postId,
        parentId: parentId ?? null,
        comment: { ...data, author_name: "Coach", author_role: "trainer" as const, likes_count: 0, coach_liked: false, user_has_liked: false, replies: [] },
      },
    });
  }, [state.newComment, state.replyText, state.userId]);

  const handleDeleteComment = useCallback(async (postId: string, commentId: string) => {
    const supabase = supabaseRef.current;
    const { error } = await supabase.from("community_comments").delete().eq("id", commentId);
    if (error) {
      toast.error("Error al eliminar comentario");
      console.error("[Community] deleteComment:", error);
      return;
    }
    dispatch({ type: "REMOVE_COMMENT", payload: { postId, commentId } });
  }, []);

  // ── Toggle comment like ──
  const handleToggleCommentLike = useCallback(async (postId: string, commentId: string, currentlyLiked: boolean) => {
    if (!state.userId) return;
    const supabase = supabaseRef.current;
    // Trainer is always coach in this context
    const isCoach = true;

    dispatch({ type: "TOGGLE_COMMENT_LIKE", payload: { postId, commentId, liked: !currentlyLiked, isCoach } });

    if (currentlyLiked) {
      const { error } = await supabase.from("community_comment_likes").delete().eq("comment_id", commentId).eq("user_id", state.userId);
      if (error) {
        dispatch({ type: "TOGGLE_COMMENT_LIKE", payload: { postId, commentId, liked: currentlyLiked, isCoach } });
        console.error("[Community] unlikeComment:", error);
      }
    } else {
      const { error } = await supabase.from("community_comment_likes").insert({ comment_id: commentId, user_id: state.userId, is_coach: isCoach });
      if (error) {
        dispatch({ type: "TOGGLE_COMMENT_LIKE", payload: { postId, commentId, liked: currentlyLiked, isCoach } });
        console.error("[Community] likeComment:", error);
      }
    }
  }, [state.userId]);

  const handleTogglePin = useCallback(async (postId: string, currentlyPinned: boolean) => {
    const supabase = supabaseRef.current;
    const { error } = await supabase.from("community_posts").update({ is_pinned: !currentlyPinned }).eq("id", postId);
    if (error) {
      toast.error("Error al fijar publicacion");
      console.error("[Community] togglePin:", error);
      return;
    }
    dispatch({ type: "TOGGLE_PIN", payload: postId });
  }, []);

  const handleSaveSettings = useCallback(async () => {
    if (!state.community) return;
    dispatch({ type: "SET_SAVING_SETTINGS", payload: true });
    const supabase = supabaseRef.current;

    const { data, error } = await supabase
      .from("communities")
      .update({
        name: state.settingsName.trim() || "Mi Comunidad",
        description: state.settingsDescription.trim() || null,
        mode: state.settingsMode,
        is_active: state.settingsActive,
      })
      .eq("id", state.community.id)
      .select()
      .single();

    if (error) {
      toast.error("Error al guardar ajustes");
      console.error("[Community] saveSettings:", error);
      dispatch({ type: "SET_SAVING_SETTINGS", payload: false });
      return;
    }

    dispatch({ type: "SET_COMMUNITY", payload: data as Community });
    dispatch({ type: "SET_SAVING_SETTINGS", payload: false });
    toast.success("Ajustes guardados");
  }, [state.community, state.settingsName, state.settingsDescription, state.settingsMode, state.settingsActive]);

  return {
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
  };
}
