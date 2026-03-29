"use client";

import { useReducer, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import type { Community, CommunityPost, CommunityComment, CommunityTab } from "./components/types";

// ── State ──
interface State {
  loading: boolean;
  userId: string | null;
  community: Community | null;
  posts: CommunityPost[];
  activeTab: CommunityTab;
  // Create post
  newPostTitle: string;
  newPostContent: string;
  newPostImage: File | null;
  newPostImagePreview: string | null;
  publishing: boolean;
  // Comments
  expandedPostId: string | null;
  comments: Record<string, CommunityComment[]>;
  loadingComments: Record<string, boolean>;
  newComment: Record<string, string>;
  // Replies
  replyingTo: Record<string, string | null>; // postId → commentId being replied to
  replyText: Record<string, string>; // commentId → reply text
  // Settings
  savingSettings: boolean;
  settingsName: string;
  settingsDescription: string;
  settingsMode: "OPEN" | "READ_ONLY_CLIENTS";
  settingsActive: boolean;
}

const initialState: State = {
  loading: true,
  userId: null,
  community: null,
  posts: [],
  activeTab: "feed",
  newPostTitle: "",
  newPostContent: "",
  newPostImage: null,
  newPostImagePreview: null,
  publishing: false,
  expandedPostId: null,
  comments: {},
  loadingComments: {},
  newComment: {},
  replyingTo: {},
  replyText: {},
  savingSettings: false,
  settingsName: "",
  settingsDescription: "",
  settingsMode: "OPEN",
  settingsActive: true,
};

// ── Actions ──
type Action =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_USER_ID"; payload: string }
  | { type: "SET_COMMUNITY"; payload: Community }
  | { type: "SET_POSTS"; payload: CommunityPost[] }
  | { type: "SET_TAB"; payload: CommunityTab }
  | { type: "SET_NEW_POST_TITLE"; payload: string }
  | { type: "SET_NEW_POST_CONTENT"; payload: string }
  | { type: "SET_NEW_POST_IMAGE"; payload: { file: File | null; preview: string | null } }
  | { type: "SET_PUBLISHING"; payload: boolean }
  | { type: "ADD_POST"; payload: CommunityPost }
  | { type: "REMOVE_POST"; payload: string }
  | { type: "TOGGLE_LIKE"; payload: { postId: string; liked: boolean } }
  | { type: "SET_EXPANDED_POST"; payload: string | null }
  | { type: "SET_COMMENTS"; payload: { postId: string; comments: CommunityComment[] } }
  | { type: "SET_LOADING_COMMENTS"; payload: { postId: string; loading: boolean } }
  | { type: "SET_NEW_COMMENT"; payload: { postId: string; text: string } }
  | { type: "ADD_COMMENT"; payload: { postId: string; comment: CommunityComment; parentId: string | null } }
  | { type: "REMOVE_COMMENT"; payload: { postId: string; commentId: string } }
  | { type: "SET_REPLYING_TO"; payload: { postId: string; commentId: string | null } }
  | { type: "SET_REPLY_TEXT"; payload: { commentId: string; text: string } }
  | { type: "TOGGLE_COMMENT_LIKE"; payload: { postId: string; commentId: string; liked: boolean; isCoach: boolean } }
  | { type: "SET_SAVING_SETTINGS"; payload: boolean }
  | { type: "INIT_SETTINGS"; payload: Community }
  | { type: "SET_SETTINGS_NAME"; payload: string }
  | { type: "SET_SETTINGS_DESCRIPTION"; payload: string }
  | { type: "SET_SETTINGS_MODE"; payload: "OPEN" | "READ_ONLY_CLIENTS" }
  | { type: "SET_SETTINGS_ACTIVE"; payload: boolean }
  | { type: "TOGGLE_PIN"; payload: string };

// Helper: update comment in nested tree
function updateCommentInList(comments: CommunityComment[], commentId: string, updater: (c: CommunityComment) => CommunityComment): CommunityComment[] {
  return comments.map((c) => {
    if (c.id === commentId) return updater(c);
    if (c.replies && c.replies.length > 0) {
      return { ...c, replies: updateCommentInList(c.replies, commentId, updater) };
    }
    return c;
  });
}

// Helper: remove comment from nested tree
function removeCommentFromList(comments: CommunityComment[], commentId: string): CommunityComment[] {
  return comments
    .filter((c) => c.id !== commentId)
    .map((c) => {
      if (c.replies && c.replies.length > 0) {
        return { ...c, replies: removeCommentFromList(c.replies, commentId) };
      }
      return c;
    });
}

// Helper: add reply to parent in nested tree
function addReplyToComment(comments: CommunityComment[], parentId: string, reply: CommunityComment): CommunityComment[] {
  return comments.map((c) => {
    if (c.id === parentId) {
      return { ...c, replies: [...(c.replies ?? []), reply] };
    }
    if (c.replies && c.replies.length > 0) {
      return { ...c, replies: addReplyToComment(c.replies, parentId, reply) };
    }
    return c;
  });
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_USER_ID":
      return { ...state, userId: action.payload };
    case "SET_COMMUNITY":
      return { ...state, community: action.payload };
    case "SET_POSTS":
      return { ...state, posts: action.payload };
    case "SET_TAB":
      return { ...state, activeTab: action.payload };
    case "SET_NEW_POST_TITLE":
      return { ...state, newPostTitle: action.payload };
    case "SET_NEW_POST_CONTENT":
      return { ...state, newPostContent: action.payload };
    case "SET_NEW_POST_IMAGE":
      return { ...state, newPostImage: action.payload.file, newPostImagePreview: action.payload.preview };
    case "SET_PUBLISHING":
      return { ...state, publishing: action.payload };
    case "ADD_POST":
      return { ...state, posts: [action.payload, ...state.posts], newPostTitle: "", newPostContent: "", newPostImage: null, newPostImagePreview: null, publishing: false };
    case "REMOVE_POST":
      return { ...state, posts: state.posts.filter((p) => p.id !== action.payload) };
    case "TOGGLE_LIKE":
      return {
        ...state,
        posts: state.posts.map((p) =>
          p.id === action.payload.postId
            ? { ...p, user_has_liked: action.payload.liked, likes_count: (p.likes_count ?? 0) + (action.payload.liked ? 1 : -1) }
            : p
        ),
      };
    case "SET_EXPANDED_POST":
      return { ...state, expandedPostId: action.payload };
    case "SET_COMMENTS":
      return { ...state, comments: { ...state.comments, [action.payload.postId]: action.payload.comments } };
    case "SET_LOADING_COMMENTS":
      return { ...state, loadingComments: { ...state.loadingComments, [action.payload.postId]: action.payload.loading } };
    case "SET_NEW_COMMENT":
      return { ...state, newComment: { ...state.newComment, [action.payload.postId]: action.payload.text } };
    case "ADD_COMMENT": {
      const existing = state.comments[action.payload.postId] ?? [];
      let updated: CommunityComment[];
      if (action.payload.parentId) {
        updated = addReplyToComment(existing, action.payload.parentId, action.payload.comment);
      } else {
        updated = [...existing, action.payload.comment];
      }
      return {
        ...state,
        comments: { ...state.comments, [action.payload.postId]: updated },
        newComment: action.payload.parentId ? state.newComment : { ...state.newComment, [action.payload.postId]: "" },
        replyText: action.payload.parentId ? { ...state.replyText, [action.payload.parentId]: "" } : state.replyText,
        replyingTo: action.payload.parentId ? { ...state.replyingTo, [action.payload.postId]: null } : state.replyingTo,
        posts: state.posts.map((p) =>
          p.id === action.payload.postId ? { ...p, comments_count: (p.comments_count ?? 0) + 1 } : p
        ),
      };
    }
    case "REMOVE_COMMENT": {
      const existing2 = state.comments[action.payload.postId] ?? [];
      return {
        ...state,
        comments: { ...state.comments, [action.payload.postId]: removeCommentFromList(existing2, action.payload.commentId) },
        posts: state.posts.map((p) =>
          p.id === action.payload.postId ? { ...p, comments_count: Math.max(0, (p.comments_count ?? 0) - 1) } : p
        ),
      };
    }
    case "SET_REPLYING_TO":
      return { ...state, replyingTo: { ...state.replyingTo, [action.payload.postId]: action.payload.commentId } };
    case "SET_REPLY_TEXT":
      return { ...state, replyText: { ...state.replyText, [action.payload.commentId]: action.payload.text } };
    case "TOGGLE_COMMENT_LIKE": {
      // Find which postId this comment belongs to and update it
      const newComments = { ...state.comments };
      const postId = action.payload.postId;
      if (newComments[postId]) {
        newComments[postId] = updateCommentInList(newComments[postId], action.payload.commentId, (c) => ({
          ...c,
          user_has_liked: action.payload.liked,
          likes_count: (c.likes_count ?? 0) + (action.payload.liked ? 1 : -1),
          coach_liked: action.payload.isCoach ? action.payload.liked : c.coach_liked,
        }));
      }
      return { ...state, comments: newComments };
    }
    case "SET_SAVING_SETTINGS":
      return { ...state, savingSettings: action.payload };
    case "INIT_SETTINGS":
      return {
        ...state,
        settingsName: action.payload.name,
        settingsDescription: action.payload.description ?? "",
        settingsMode: action.payload.mode,
        settingsActive: action.payload.is_active,
      };
    case "SET_SETTINGS_NAME":
      return { ...state, settingsName: action.payload };
    case "SET_SETTINGS_DESCRIPTION":
      return { ...state, settingsDescription: action.payload };
    case "SET_SETTINGS_MODE":
      return { ...state, settingsMode: action.payload };
    case "SET_SETTINGS_ACTIVE":
      return { ...state, settingsActive: action.payload };
    case "TOGGLE_PIN":
      return {
        ...state,
        posts: state.posts.map((p) =>
          p.id === action.payload ? { ...p, is_pinned: !p.is_pinned } : p
        ),
      };
    default:
      return state;
  }
}

export function useCommunityPage() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const supabaseRef = useRef(createClient());

  // ── Init: load or create community + posts ──
  useEffect(() => {
    const init = async () => {
      const supabase = supabaseRef.current;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      dispatch({ type: "SET_USER_ID", payload: user.id });

      // Get or create community
      let { data: community, error } = await supabase
        .from("communities")
        .select("*")
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const loadPosts = useCallback(async (communityId: string, userId: string) => {
    const supabase = supabaseRef.current;

    const { data: posts, error } = await supabase
      .from("community_posts")
      .select("*")
      .eq("community_id", communityId)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

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
    const { data: likes } = await supabase
      .from("community_likes")
      .select("post_id, user_id")
      .in("post_id", postIds);

    const { data: comments } = await supabase
      .from("community_comments")
      .select("post_id")
      .in("post_id", postIds);

    const authorIds = [...new Set(posts.map((p) => p.author_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, business_name, role")
      .in("user_id", authorIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);

    const enriched: CommunityPost[] = posts.map((p) => {
      const profile = profileMap.get(p.author_id);
      const postLikes = likes?.filter((l) => l.post_id === p.id) ?? [];
      const postComments = comments?.filter((c) => c.post_id === p.id) ?? [];
      return {
        ...p,
        author_name: profile?.role === "trainer" ? (profile.business_name ?? profile.full_name ?? "Coach") : (profile?.full_name ?? "Cliente"),
        author_role: profile?.role as "trainer" | "client" | undefined,
        likes_count: postLikes.length,
        comments_count: postComments.length,
        user_has_liked: postLikes.some((l) => l.user_id === userId),
      };
    });

    dispatch({ type: "SET_POSTS", payload: enriched });
  }, []);

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
      const ext = state.newPostImage.name.split(".").pop();
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

    const { data: post, error } = await supabase
      .from("community_posts")
      .insert({ community_id: state.community.id, author_id: state.userId, title: titleTrimmed, content: state.newPostContent.trim(), image_url: imageUrl })
      .select()
      .single();

    if (error) {
      toast.error("Error al publicar");
      console.error("[Community] publish:", error);
      dispatch({ type: "SET_PUBLISHING", payload: false });
      return;
    }

    dispatch({ type: "ADD_POST", payload: { ...post, author_name: "Coach", author_role: "trainer", likes_count: 0, comments_count: 0, user_has_liked: false } });
    toast.success("Publicacion creada");
  }, [state.community, state.userId, state.newPostTitle, state.newPostContent, state.newPostImage]);

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
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

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
    const commentLikes = commentLikesRes.data ?? [];

    // Enrich flat list
    const enrichedFlat: CommunityComment[] = allComments.map((c) => {
      const profile = profileMap.get(c.author_id);
      const thisLikes = commentLikes.filter((l) => l.comment_id === c.id);
      return {
        ...c,
        author_name: profile?.role === "trainer" ? (profile.business_name ?? profile.full_name ?? "Coach") : (profile?.full_name ?? "Cliente"),
        author_role: profile?.role as "trainer" | "client" | undefined,
        likes_count: thisLikes.length,
        coach_liked: thisLikes.some((l) => l.is_coach),
        user_has_liked: thisLikes.some((l) => l.user_id === userId),
        replies: [],
      };
    });

    // Build tree: group replies under parents
    const commentMap = new Map<string, CommunityComment>();
    enrichedFlat.forEach((c) => commentMap.set(c.id, c));

    const rootComments: CommunityComment[] = [];
    enrichedFlat.forEach((c) => {
      if (c.parent_id && commentMap.has(c.parent_id)) {
        const parent = commentMap.get(c.parent_id)!;
        parent.replies = [...(parent.replies ?? []), c];
      } else {
        rootComments.push(c);
      }
    });

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
