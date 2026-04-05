"use client";

import { useReducer, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { QUERY_LIMITS } from "@/lib/constants";
import { updateCommentInTree, removeCommentFromTree, addReplyToTree, buildCommentTree, resolveAuthorName } from "@/lib/community-utils";
import { toast } from "sonner";
import type { Community, Post, Comment, CommunityTab } from "./components/types";

// ── State ──
interface State {
  loading: boolean;
  userId: string | null;
  community: Community | null;
  posts: Post[];
  activeTab: CommunityTab;
  // Create post
  newTitle: string;
  newContent: string;
  newImage: File | null;
  imagePreview: string | null;
  publishing: boolean;
  // Comments
  expandedPost: string | null;
  comments: Record<string, Comment[]>;
  loadingComments: Record<string, boolean>;
  newComment: Record<string, string>;
  // Replies
  replyingTo: Record<string, string | null>;
  replyText: Record<string, string>;
}

// ── Actions ──
type Action =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_USER_ID"; payload: string }
  | { type: "SET_COMMUNITY"; payload: Community | null }
  | { type: "SET_POSTS"; payload: Post[] }
  | { type: "ADD_POST"; payload: Post }
  | { type: "REMOVE_POST"; payload: string }
  | { type: "UPDATE_POST_LIKES"; payload: { postId: string; user_has_liked: boolean; likes_count: number } }
  | { type: "INCREMENT_COMMENTS_COUNT"; payload: string }
  | { type: "DECREMENT_COMMENTS_COUNT"; payload: string }
  | { type: "SET_ACTIVE_TAB"; payload: CommunityTab }
  | { type: "SET_NEW_TITLE"; payload: string }
  | { type: "SET_NEW_CONTENT"; payload: string }
  | { type: "SET_NEW_IMAGE"; payload: { file: File; preview: string } | null }
  | { type: "SET_PUBLISHING"; payload: boolean }
  | { type: "RESET_PUBLISH_FORM" }
  | { type: "SET_EXPANDED_POST"; payload: string | null }
  | { type: "SET_COMMENTS"; payload: { postId: string; comments: Comment[] } }
  | { type: "ADD_COMMENT"; payload: { postId: string; comment: Comment } }
  | { type: "ADD_REPLY"; payload: { postId: string; parentId: string; reply: Comment } }
  | { type: "REMOVE_COMMENT"; payload: { postId: string; commentId: string } }
  | { type: "UPDATE_COMMENT_LIKES"; payload: { postId: string; commentId: string; user_has_liked: boolean; likes_count: number } }
  | { type: "SET_LOADING_COMMENTS"; payload: { postId: string; loading: boolean } }
  | { type: "SET_NEW_COMMENT"; payload: { postId: string; text: string } }
  | { type: "SET_REPLYING_TO"; payload: { postId: string; commentId: string | null } }
  | { type: "SET_REPLY_TEXT"; payload: { commentId: string; text: string } };

const initialState: State = {
  loading: true,
  userId: null,
  community: null,
  posts: [],
  activeTab: "feed",
  newTitle: "",
  newContent: "",
  newImage: null,
  imagePreview: null,
  publishing: false,
  expandedPost: null,
  comments: {},
  loadingComments: {},
  newComment: {},
  replyingTo: {},
  replyText: {},
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_LOADING": return { ...state, loading: action.payload };
    case "SET_USER_ID": return { ...state, userId: action.payload };
    case "SET_COMMUNITY": return { ...state, community: action.payload };
    case "SET_POSTS": return { ...state, posts: action.payload };
    case "ADD_POST": return { ...state, posts: [action.payload, ...state.posts] };
    case "REMOVE_POST": return { ...state, posts: state.posts.filter((p) => p.id !== action.payload) };
    case "UPDATE_POST_LIKES":
      return {
        ...state,
        posts: state.posts.map((p) =>
          p.id === action.payload.postId
            ? { ...p, user_has_liked: action.payload.user_has_liked, likes_count: action.payload.likes_count }
            : p
        ),
      };
    case "INCREMENT_COMMENTS_COUNT":
      return { ...state, posts: state.posts.map((p) => p.id === action.payload ? { ...p, comments_count: p.comments_count + 1 } : p) };
    case "DECREMENT_COMMENTS_COUNT":
      return { ...state, posts: state.posts.map((p) => p.id === action.payload ? { ...p, comments_count: Math.max(0, p.comments_count - 1) } : p) };
    case "SET_ACTIVE_TAB": return { ...state, activeTab: action.payload };
    case "SET_NEW_TITLE": return { ...state, newTitle: action.payload };
    case "SET_NEW_CONTENT": return { ...state, newContent: action.payload };
    case "SET_NEW_IMAGE":
      return action.payload
        ? { ...state, newImage: action.payload.file, imagePreview: action.payload.preview }
        : { ...state, newImage: null, imagePreview: null };
    case "SET_PUBLISHING": return { ...state, publishing: action.payload };
    case "RESET_PUBLISH_FORM":
      return { ...state, newTitle: "", newContent: "", newImage: null, imagePreview: null, publishing: false };
    case "SET_EXPANDED_POST": return { ...state, expandedPost: action.payload };
    case "SET_COMMENTS":
      return { ...state, comments: { ...state.comments, [action.payload.postId]: action.payload.comments } };
    case "ADD_COMMENT":
      return {
        ...state,
        comments: { ...state.comments, [action.payload.postId]: [...(state.comments[action.payload.postId] ?? []), action.payload.comment] },
        newComment: { ...state.newComment, [action.payload.postId]: "" },
      };
    case "ADD_REPLY":
      return {
        ...state,
        comments: {
          ...state.comments,
          [action.payload.postId]: addReplyToTree(state.comments[action.payload.postId] ?? [], action.payload.parentId, action.payload.reply),
        },
        replyText: { ...state.replyText, [action.payload.parentId]: "" },
        replyingTo: { ...state.replyingTo, [action.payload.postId]: null },
      };
    case "REMOVE_COMMENT":
      return {
        ...state,
        comments: { ...state.comments, [action.payload.postId]: removeCommentFromTree(state.comments[action.payload.postId] ?? [], action.payload.commentId) },
      };
    case "UPDATE_COMMENT_LIKES":
      return {
        ...state,
        comments: {
          ...state.comments,
          [action.payload.postId]: updateCommentInTree(state.comments[action.payload.postId] ?? [], action.payload.commentId, (c) => ({
            ...c,
            user_has_liked: action.payload.user_has_liked,
            likes_count: action.payload.likes_count,
          })),
        },
      };
    case "SET_LOADING_COMMENTS":
      return { ...state, loadingComments: { ...state.loadingComments, [action.payload.postId]: action.payload.loading } };
    case "SET_NEW_COMMENT":
      return { ...state, newComment: { ...state.newComment, [action.payload.postId]: action.payload.text } };
    case "SET_REPLYING_TO":
      return { ...state, replyingTo: { ...state.replyingTo, [action.payload.postId]: action.payload.commentId } };
    case "SET_REPLY_TEXT":
      return { ...state, replyText: { ...state.replyText, [action.payload.commentId]: action.payload.text } };
    default:
      return state;
  }
}

export function useClientCommunityPage() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const supabase = useRef(createClient());

  // ── Init ──
  useEffect(() => {
    const init = async () => {
      const sb = supabase.current;
      const { data: { session } } = await sb.auth.getSession();
      if (!session?.user) { dispatch({ type: "SET_LOADING", payload: false }); return; }
      const user = session.user;
      dispatch({ type: "SET_USER_ID", payload: user.id });

      const { data: tc, error: tcErr } = await sb
        .from("trainer_clients")
        .select("trainer_id")
        .eq("client_id", user.id)
        .eq("status", "active")
        .single();

      if (tcErr || !tc) { dispatch({ type: "SET_LOADING", payload: false }); return; }

      const { data: comm, error: commErr } = await sb
        .from("communities")
        .select("id, coach_id, name, description, mode, is_active")
        .eq("coach_id", tc.trainer_id)
        .eq("is_active", true)
        .single();

      if (commErr || !comm) { dispatch({ type: "SET_LOADING", payload: false }); return; }
      dispatch({ type: "SET_COMMUNITY", payload: comm as Community });

      const { data: rawPosts, error: postsErr } = await sb
        .from("community_posts")
        .select("id, community_id, author_id, title, content, image_url, is_pinned, created_at")
        .eq("community_id", comm.id)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(QUERY_LIMITS.COMMUNITY_POSTS);

      if (postsErr) {
        toast.error("Error al cargar el feed");
        console.error("[ClientCommunity] posts:", postsErr);
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }

      if (!rawPosts || rawPosts.length === 0) {
        dispatch({ type: "SET_POSTS", payload: [] });
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }

      const postIds = rawPosts.map((p) => p.id);
      const authorIds = [...new Set(rawPosts.map((p) => p.author_id))];

      const [likesRes, commentsRes, profilesRes] = await Promise.all([
        sb.from("community_likes").select("post_id, user_id").in("post_id", postIds),
        sb.from("community_comments").select("post_id").in("post_id", postIds),
        sb.from("profiles").select("user_id, full_name, business_name, role").in("user_id", authorIds),
      ]);

      const profileMap = new Map(profilesRes.data?.map((p) => [p.user_id, p]) ?? []);

      // Build lookup maps to avoid O(n*m) filtering
      const likesPerPost = new Map<string, { count: number; userLiked: boolean }>();
      for (const l of likesRes.data ?? []) {
        const entry = likesPerPost.get(l.post_id) ?? { count: 0, userLiked: false };
        entry.count++;
        if (l.user_id === user.id) entry.userLiked = true;
        likesPerPost.set(l.post_id, entry);
      }
      const commentsPerPost = new Map<string, number>();
      for (const c of commentsRes.data ?? []) {
        commentsPerPost.set(c.post_id, (commentsPerPost.get(c.post_id) ?? 0) + 1);
      }

      const enriched: Post[] = rawPosts.map((p) => {
        const profile = profileMap.get(p.author_id);
        const likeInfo = likesPerPost.get(p.id);
        return {
          ...p,
          author_name: profile?.role === "trainer" ? (profile.business_name ?? profile.full_name ?? "Coach") : (profile?.full_name ?? "Cliente"),
          author_role: (profile?.role ?? "client") as "trainer" | "client",
          likes_count: likeInfo?.count ?? 0,
          comments_count: commentsPerPost.get(p.id) ?? 0,
          user_has_liked: likeInfo?.userLiked ?? false,
        };
      });

      dispatch({ type: "SET_POSTS", payload: enriched });

      // Mark as read — non-blocking
      await sb.from("community_read_status").upsert(
        { community_id: comm.id, user_id: user.id, last_seen_at: new Date().toISOString() },
        { onConflict: "community_id,user_id" }
      ); // No bloqueante

      dispatch({ type: "SET_LOADING", payload: false });
    };
    init();
  }, []);

  // ── Realtime ──
  useEffect(() => {
    if (!state.community) return;
    const sb = supabase.current;
    let channel: ReturnType<typeof sb.channel> | null = null;
    const setup = () => {
      channel = sb
        .channel("client-community-rt")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "community_posts", filter: `community_id=eq.${state.community!.id}` }, (payload) => {
          if (payload.new.author_id !== state.userId) {
            const post = payload.new as Post;
            dispatch({ type: "ADD_POST", payload: { ...post, likes_count: 0, comments_count: 0, user_has_liked: false, author_role: "trainer", author_name: "Coach" } });
          }
        })
        .subscribe();
    };
    setup();
    return () => { if (channel) supabase.current.removeChannel(channel); };
  }, [state.community, state.userId]);

  // ── Toggle post like ──
  const toggleLike = useCallback(async (postId: string, liked: boolean) => {
    if (!state.userId) return;
    const sb = supabase.current;
    const post = state.posts.find((p) => p.id === postId);
    if (!post) return;
    const newLiked = !liked;
    const newCount = post.likes_count + (liked ? -1 : 1);
    dispatch({ type: "UPDATE_POST_LIKES", payload: { postId, user_has_liked: newLiked, likes_count: newCount } });

    if (liked) {
      const { error } = await sb.from("community_likes").delete().eq("post_id", postId).eq("user_id", state.userId);
      if (error) {
        dispatch({ type: "UPDATE_POST_LIKES", payload: { postId, user_has_liked: liked, likes_count: post.likes_count } });
        console.error("[ClientCommunity] unlike:", error);
      }
    } else {
      const { error } = await sb.from("community_likes").insert({ post_id: postId, user_id: state.userId });
      if (error) {
        dispatch({ type: "UPDATE_POST_LIKES", payload: { postId, user_has_liked: liked, likes_count: post.likes_count } });
        console.error("[ClientCommunity] like:", error);
      }
    }
  }, [state.userId, state.posts]);

  // ── Publish ──
  const handlePublish = useCallback(async () => {
    if (!state.community || !state.userId || !state.newContent.trim()) return;
    dispatch({ type: "SET_PUBLISHING", payload: true });
    const sb = supabase.current;

    let imageUrl: string | null = null;
    if (state.newImage) {
      // SECURITY: Whitelist extensions
      const ext = state.newImage.name.split(".").pop()?.toLowerCase();
      if (!ext || !["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
        toast.error("Solo se permiten imagenes .jpg, .png, .webp o .gif");
        dispatch({ type: "SET_PUBLISHING", payload: false });
        return;
      }
      const path = `${state.userId}/${Date.now()}.${ext}`;
      const { error: upErr } = await sb.storage.from("community-images").upload(path, state.newImage);
      if (upErr) { toast.error("Error al subir imagen"); console.error("[ClientCommunity] upload:", upErr); dispatch({ type: "SET_PUBLISHING", payload: false }); return; }
      const { data: urlData } = sb.storage.from("community-images").getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }

    const titleTrimmed = state.newTitle.trim() || null;
    const { data: post, error } = await sb
      .from("community_posts")
      .insert({ community_id: state.community.id, author_id: state.userId, title: titleTrimmed, content: state.newContent.trim(), image_url: imageUrl })
      .select()
      .single();

    if (error) { toast.error("Error al publicar"); console.error("[ClientCommunity] publish:", error); dispatch({ type: "SET_PUBLISHING", payload: false }); return; }

    dispatch({ type: "ADD_POST", payload: { ...post, author_name: "Yo", author_role: "client" as const, likes_count: 0, comments_count: 0, user_has_liked: false } });
    dispatch({ type: "RESET_PUBLISH_FORM" });
    toast.success("Publicacion creada");
  }, [state.community, state.userId, state.newTitle, state.newContent, state.newImage]);

  // ── Load comments ──
  const loadComments = useCallback(async (postId: string) => {
    dispatch({ type: "SET_LOADING_COMMENTS", payload: { postId, loading: true } });
    const sb = supabase.current;

    const { data, error } = await sb
      .from("community_comments")
      .select("id, post_id, parent_id, author_id, content, created_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: true })
      .limit(QUERY_LIMITS.COMMUNITY_COMMENTS);

    if (error) { toast.error("Error al cargar comentarios"); console.error("[ClientCommunity] comments:", error); dispatch({ type: "SET_LOADING_COMMENTS", payload: { postId, loading: false } }); return; }

    const allComments = data ?? [];
    const commentIds = allComments.map((c) => c.id);
    const authorIds = [...new Set(allComments.map((c) => c.author_id))];

    const [profilesRes, commentLikesRes] = await Promise.all([
      authorIds.length > 0 ? sb.from("profiles").select("user_id, full_name, business_name, role").in("user_id", authorIds) : Promise.resolve({ data: [] }),
      commentIds.length > 0 ? sb.from("community_comment_likes").select("comment_id, user_id, is_coach").in("comment_id", commentIds) : Promise.resolve({ data: [] }),
    ]);

    const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.user_id, p]));

    // Build lookup map for comment likes to avoid O(n*m)
    const commentLikeMap = new Map<string, { count: number; coachLiked: boolean; userLiked: boolean }>();
    for (const l of commentLikesRes.data ?? []) {
      const entry = commentLikeMap.get(l.comment_id) ?? { count: 0, coachLiked: false, userLiked: false };
      entry.count++;
      if (l.is_coach) entry.coachLiked = true;
      if (l.user_id === state.userId) entry.userLiked = true;
      commentLikeMap.set(l.comment_id, entry);
    }

    const enrichedFlat: Comment[] = allComments.map((c) => {
      const profile = profileMap.get(c.author_id);
      const likeInfo = commentLikeMap.get(c.id);
      return {
        ...c,
        author_name: profile?.role === "trainer" ? (profile.business_name ?? profile.full_name ?? "Coach") : (profile?.full_name ?? "Yo"),
        author_role: (profile?.role ?? "client") as "trainer" | "client",
        likes_count: likeInfo?.count ?? 0,
        coach_liked: likeInfo?.coachLiked ?? false,
        user_has_liked: likeInfo?.userLiked ?? false,
        replies: [],
      };
    });

    // Build tree
    const rootComments = buildCommentTree(enrichedFlat);

    dispatch({ type: "SET_COMMENTS", payload: { postId, comments: rootComments } });
    dispatch({ type: "SET_LOADING_COMMENTS", payload: { postId, loading: false } });
  }, [state.userId]);

  // ── Add comment ──
  const addComment = useCallback(async (postId: string, parentId?: string | null) => {
    const text = parentId ? state.replyText[parentId]?.trim() : state.newComment[postId]?.trim();
    if (!text || !state.userId) return;
    const sb = supabase.current;

    const { data, error } = await sb
      .from("community_comments")
      .insert({ post_id: postId, author_id: state.userId, content: text, parent_id: parentId ?? null })
      .select()
      .single();

    if (error) { toast.error("Error al comentar"); console.error("[ClientCommunity] addComment:", error); return; }

    const newC: Comment = { ...data, author_name: "Yo", author_role: "client" as const, likes_count: 0, coach_liked: false, user_has_liked: false, replies: [] };

    if (parentId) {
      dispatch({ type: "ADD_REPLY", payload: { postId, parentId, reply: newC } });
    } else {
      dispatch({ type: "ADD_COMMENT", payload: { postId, comment: newC } });
    }
    dispatch({ type: "INCREMENT_COMMENTS_COUNT", payload: postId });
  }, [state.newComment, state.replyText, state.userId]);

  // ── Toggle comment like ──
  const toggleCommentLike = useCallback(async (postId: string, commentId: string, currentlyLiked: boolean) => {
    if (!state.userId) return;
    const sb = supabase.current;

    const postComments = state.comments[postId] ?? [];
    const findComment = (comments: Comment[]): Comment | undefined => {
      for (const c of comments) {
        if (c.id === commentId) return c;
        const found = findComment(c.replies ?? []);
        if (found) return found;
      }
    };
    const comment = findComment(postComments);
    if (!comment) return;

    const newLiked = !currentlyLiked;
    const newCount = (comment.likes_count ?? 0) + (currentlyLiked ? -1 : 1);
    dispatch({ type: "UPDATE_COMMENT_LIKES", payload: { postId, commentId, user_has_liked: newLiked, likes_count: newCount } });

    if (currentlyLiked) {
      const { error } = await sb.from("community_comment_likes").delete().eq("comment_id", commentId).eq("user_id", state.userId);
      if (error) {
        dispatch({ type: "UPDATE_COMMENT_LIKES", payload: { postId, commentId, user_has_liked: currentlyLiked, likes_count: comment.likes_count ?? 0 } });
        console.error("[ClientCommunity] unlikeComment:", error);
      }
    } else {
      const { error } = await sb.from("community_comment_likes").insert({ comment_id: commentId, user_id: state.userId, is_coach: false });
      if (error) {
        dispatch({ type: "UPDATE_COMMENT_LIKES", payload: { postId, commentId, user_has_liked: currentlyLiked, likes_count: comment.likes_count ?? 0 } });
        console.error("[ClientCommunity] likeComment:", error);
      }
    }
  }, [state.userId, state.comments]);

  // ── Delete post ──
  const deletePost = useCallback(async (postId: string) => {
    const sb = supabase.current;
    const { error } = await sb.from("community_posts").delete().eq("id", postId);
    if (error) { toast.error("Error al eliminar publicacion"); console.error("[ClientCommunity] delete:", error); return; }
    dispatch({ type: "REMOVE_POST", payload: postId });
  }, []);

  // ── Delete comment ──
  const deleteComment = useCallback(async (postId: string, commentId: string) => {
    const sb = supabase.current;
    const { error } = await sb.from("community_comments").delete().eq("id", commentId);
    if (error) { toast.error("Error al eliminar comentario"); console.error("[ClientCommunity] deleteComment:", error); return; }
    dispatch({ type: "REMOVE_COMMENT", payload: { postId, commentId } });
    dispatch({ type: "DECREMENT_COMMENTS_COUNT", payload: postId });
  }, []);

  return {
    state,
    dispatch,
    toggleLike,
    handlePublish,
    loadComments,
    addComment,
    toggleCommentLike,
    deletePost,
    deleteComment,
  };
}
