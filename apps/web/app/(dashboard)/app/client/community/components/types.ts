export interface Post {
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

export interface Comment {
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

export interface Community {
  id: string;
  coach_id: string;
  name: string;
  description: string | null;
  mode: "OPEN" | "READ_ONLY_CLIENTS";
  is_active: boolean;
}

export type CommunityTab = "feed" | "publish";
