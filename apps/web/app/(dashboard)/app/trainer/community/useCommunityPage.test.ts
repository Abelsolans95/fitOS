import { describe, it, expect } from "vitest";
import { communityReducer, communityInitialState } from "./useCommunityPage";
import type { CommunityPost, CommunityComment, Community } from "./components/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

type State = typeof communityInitialState;

function makePost(id: string, overrides: Partial<CommunityPost> = {}): CommunityPost {
  return {
    id,
    community_id: "comm-1",
    author_id: "user-1",
    title: null,
    content: "Test content",
    image_url: null,
    is_pinned: false,
    created_at: new Date().toISOString(),
    likes_count: 0,
    comments_count: 0,
    user_has_liked: false,
    author_name: "Trainer",
    ...overrides,
  };
}

function makeComment(id: string, postId = "post-1"): CommunityComment {
  return {
    id,
    post_id: postId,
    author_id: "user-1",
    parent_id: null,
    content: "Test comment",
    created_at: new Date().toISOString(),
    likes_count: 0,
    user_has_liked: false,
    coach_liked: false,
    author_name: "User",
    replies: [],
  };
}

function makeCommunity(overrides: Partial<Community> = {}): Community {
  return {
    id: "comm-1",
    coach_id: "trainer-1",
    name: "Mi Comunidad",
    description: null,
    mode: "OPEN",
    is_active: true,
    ...overrides,
  };
}

function stateWithPosts(posts: CommunityPost[]): State {
  return { ...communityInitialState, posts };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("communityReducer — initial state", () => {
  it("starts loading with no community or posts", () => {
    expect(communityInitialState.loading).toBe(true);
    expect(communityInitialState.community).toBeNull();
    expect(communityInitialState.posts).toHaveLength(0);
    expect(communityInitialState.activeTab).toBe("feed");
  });
});

describe("communityReducer — basic state updates", () => {
  it("SET_LOADING updates loading flag", () => {
    const next = communityReducer(communityInitialState, { type: "SET_LOADING", payload: false });
    expect(next.loading).toBe(false);
  });

  it("SET_COMMUNITY stores community data", () => {
    const community = makeCommunity();
    const next = communityReducer(communityInitialState, { type: "SET_COMMUNITY", payload: community });
    expect(next.community?.id).toBe("comm-1");
    expect(next.community?.name).toBe("Mi Comunidad");
  });

  it("SET_POSTS replaces post list", () => {
    const posts = [makePost("p1"), makePost("p2")];
    const next = communityReducer(communityInitialState, { type: "SET_POSTS", payload: posts });
    expect(next.posts).toHaveLength(2);
  });

  it("SET_TAB changes the active tab", () => {
    const next = communityReducer(communityInitialState, { type: "SET_TAB", payload: "settings" });
    expect(next.activeTab).toBe("settings");
  });
});

describe("communityReducer — posts", () => {
  it("ADD_POST prepends post and clears form", () => {
    const state: State = { ...communityInitialState, newPostContent: "my post", newPostTitle: "title" };
    const newPost = makePost("p-new");
    const next = communityReducer(state, { type: "ADD_POST", payload: newPost });
    expect(next.posts[0].id).toBe("p-new");
    expect(next.newPostContent).toBe("");
    expect(next.newPostTitle).toBe("");
    expect(next.publishing).toBe(false);
  });

  it("REMOVE_POST filters out the post by id", () => {
    const state = stateWithPosts([makePost("p1"), makePost("p2"), makePost("p3")]);
    const next = communityReducer(state, { type: "REMOVE_POST", payload: "p2" });
    expect(next.posts).toHaveLength(2);
    expect(next.posts.find((p) => p.id === "p2")).toBeUndefined();
  });

  it("TOGGLE_LIKE increments likes count when liked", () => {
    const state = stateWithPosts([makePost("p1", { likes_count: 3, user_has_liked: false })]);
    const next = communityReducer(state, { type: "TOGGLE_LIKE", payload: { postId: "p1", liked: true } });
    expect(next.posts[0].likes_count).toBe(4);
    expect(next.posts[0].user_has_liked).toBe(true);
  });

  it("TOGGLE_LIKE decrements likes count when unliked", () => {
    const state = stateWithPosts([makePost("p1", { likes_count: 5, user_has_liked: true })]);
    const next = communityReducer(state, { type: "TOGGLE_LIKE", payload: { postId: "p1", liked: false } });
    expect(next.posts[0].likes_count).toBe(4);
    expect(next.posts[0].user_has_liked).toBe(false);
  });

  it("TOGGLE_PIN flips pinned status", () => {
    const state = stateWithPosts([makePost("p1", { is_pinned: false })]);
    const next = communityReducer(state, { type: "TOGGLE_PIN", payload: "p1" });
    expect(next.posts[0].is_pinned).toBe(true);
    const back = communityReducer(next, { type: "TOGGLE_PIN", payload: "p1" });
    expect(back.posts[0].is_pinned).toBe(false);
  });
});

describe("communityReducer — comments", () => {
  it("SET_COMMENTS stores comments for a post", () => {
    const comments = [makeComment("c1"), makeComment("c2")];
    const next = communityReducer(communityInitialState, {
      type: "SET_COMMENTS",
      payload: { postId: "post-1", comments },
    });
    expect(next.comments["post-1"]).toHaveLength(2);
  });

  it("ADD_COMMENT appends top-level comment and increments post count", () => {
    const state: State = {
      ...communityInitialState,
      posts: [makePost("post-1", { comments_count: 2 })],
      comments: { "post-1": [makeComment("c1", "post-1")] },
    };
    const newComment = makeComment("c2", "post-1");
    const next = communityReducer(state, {
      type: "ADD_COMMENT",
      payload: { postId: "post-1", comment: newComment, parentId: null },
    });
    expect(next.comments["post-1"]).toHaveLength(2);
    expect(next.posts[0].comments_count).toBe(3);
    expect(next.newComment["post-1"]).toBe(""); // cleared
  });

  it("REMOVE_COMMENT removes comment and decrements post count", () => {
    const state: State = {
      ...communityInitialState,
      posts: [makePost("post-1", { comments_count: 3 })],
      comments: { "post-1": [makeComment("c1", "post-1"), makeComment("c2", "post-1")] },
    };
    const next = communityReducer(state, {
      type: "REMOVE_COMMENT",
      payload: { postId: "post-1", commentId: "c1" },
    });
    expect(next.comments["post-1"]).toHaveLength(1);
    expect(next.posts[0].comments_count).toBe(2);
  });
});

describe("communityReducer — settings", () => {
  it("INIT_SETTINGS loads community settings into form", () => {
    const community = makeCommunity({ name: "Comunidad VIP", description: "Solo élite", mode: "READ_ONLY_CLIENTS", is_active: false });
    const next = communityReducer(communityInitialState, { type: "INIT_SETTINGS", payload: community });
    expect(next.settingsName).toBe("Comunidad VIP");
    expect(next.settingsDescription).toBe("Solo élite");
    expect(next.settingsMode).toBe("READ_ONLY_CLIENTS");
    expect(next.settingsActive).toBe(false);
  });

  it("SET_SETTINGS_MODE updates mode", () => {
    const next = communityReducer(communityInitialState, { type: "SET_SETTINGS_MODE", payload: "READ_ONLY_CLIENTS" });
    expect(next.settingsMode).toBe("READ_ONLY_CLIENTS");
  });

  it("SET_SETTINGS_ACTIVE toggles active", () => {
    const next = communityReducer(communityInitialState, { type: "SET_SETTINGS_ACTIVE", payload: false });
    expect(next.settingsActive).toBe(false);
  });
});
