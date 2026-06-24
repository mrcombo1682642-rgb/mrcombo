export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  role: "member" | "admin" | "moderator";
  badge: string | null;
  join_date: string;
  thread_count: number;
  post_count: number;
}

export interface ThreadListItem {
  id: string;
  title: string;
  content: string;
  category: string;
  subcategory: string;
  created_at: string;
  user_id: string | null;
  pinned: boolean;
  locked: boolean;
  views_count: number;
  reply_count: number;
  username: string | null;
  avatar_url: string | null;
  role: string | null;
  badge: string | null;
  likes_count: number;  // yeh add karo
}

export interface Thread {
  id: string;
  title: string;
  content: string;
  category: string;
  subcategory: string;
  created_at: string;
  user_id: string | null;
  pinned: boolean;
  locked: boolean;
  views_count: number;
}

export interface Reply {
  id: string;
  thread_id: string;
  content: string;
  created_at: string;
  user_id: string | null;
  image_url?: string | null;
  video_url?: string | null;
  quoted_reply_id?: string | null;
  edited_at?: string | null;
  profile?: Profile | null;
  quoted_reply?: Pick<Reply, "id" | "content" | "user_id"> & {
    profile?: Profile | null;
  } | null;
  like_count?: number;
  liked_by_me?: boolean;
}