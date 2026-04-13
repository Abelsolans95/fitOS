import { updateCommentInTree, removeCommentFromTree, addReplyToTree } from "@/lib/community-utils";
import type { Community, CommunityPost, CommunityComment, CommunityTab } from "./components/types";

// ── State ──
export interface CommunityState {
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
  newPostIsPublic: boolean;
  publishing: boolean;
  // Comments
  expandedPostId: string | null;
  comments: Record<string, CommunityComment[]>;
  loadingComments: Record<string, boolean>;
  newComment: Record<string, string>;
  // Replies
  replyingTo: Record<string, string | null>;
  replyText: Record<string, string>;
  // Settings
  savingSettings: boolean;
  settingsName: string;
  settingsDescription: string;
  settingsMode: "OPEN" | "READ_ONLY_CLIENTS";
  settingsActive: boolean;
}

export const communityInitialState: CommunityState = {
  loading: true,
  userId: null,
  community: null,
  posts: [],
  activeTab: "feed",
  newPostTitle: "",
  newPostContent: "",
  newPostImage: null,
  newPostImagePreview: null,
  newPostIsPublic: false,
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
export type CommunityAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_USER_ID"; payload: string }
  | { type: "SET_COMMUNITY"; payload: Community }
  | { type: "SET_POSTS"; payload: CommunityPost[] }
  | { type: "SET_TAB"; payload: CommunityTab }
  | { type: "SET_NEW_POST_TITLE"; payload: string }
  | { type: "SET_NEW_POST_CONTENT"; payload: string }
  | { type: "SET_NEW_POST_IMAGE"; payload: { file: File | null; preview: string | null } }
  | { type: "SET_NEW_POST_IS_PUBLIC"; payload: boolean }
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

export function communityReducer(state: CommunityState, action: CommunityAction): CommunityState {
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
    case "SET_NEW_POST_IS_PUBLIC":
      return { ...state, newPostIsPublic: action.payload };
    case "SET_PUBLISHING":
      return { ...state, publishing: action.payload };
    case "ADD_POST":
      return { ...state, posts: [action.payload, ...state.posts], newPostTitle: "", newPostContent: "", newPostImage: null, newPostImagePreview: null, newPostIsPublic: false, publishing: false };
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
        updated = addReplyToTree(existing, action.payload.parentId, action.payload.comment);
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
        comments: { ...state.comments, [action.payload.postId]: removeCommentFromTree(existing2, action.payload.commentId) },
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
      const newComments = { ...state.comments };
      const postId = action.payload.postId;
      if (newComments[postId]) {
        newComments[postId] = updateCommentInTree(newComments[postId], action.payload.commentId, (c) => ({
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
