export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<User, 'id' | 'created_at'>>
      }
      videos: {
        Row: Omit<Video, 'user' | 'is_liked' | 'is_following'>
        Insert: Omit<Video, 'id' | 'user' | 'is_liked' | 'is_following' | 'created_at' | 'updated_at'>
        Update: Partial<Video>
      }
      likes: {
        Row: Omit<Like, 'user'>
        Insert: Omit<Like, 'id' | 'user' | 'created_at'>
        Update: never
      }
      comments: {
        Row: Omit<Comment, 'user' | 'replies' | 'is_liked'>
        Insert: Omit<Comment, 'id' | 'user' | 'replies' | 'is_liked' | 'created_at' | 'updated_at'>
        Update: Partial<Comment>
      }
      follows: {
        Row: Omit<Follow, 'follower' | 'following'>
        Insert: Omit<Follow, 'id' | 'follower' | 'following' | 'created_at'>
        Update: never
      }
      video_views: {
        Row: Omit<VideoView, 'user'>
        Insert: Omit<VideoView, 'id' | 'user' | 'created_at'>
        Update: never
      }
    }
  }
}

export interface User {
  id: string
  email: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  follower_count: number
  following_count: number
  video_count: number
  created_at: string
  updated_at: string
}

export interface Video {
  id: string
  user_id: string
  title: string | null
  description: string | null
  video_url: string
  thumbnail_url: string | null
  duration: number | null
  view_count: number
  like_count: number
  comment_count: number
  created_at: string
  updated_at: string
  user: User
  is_liked?: boolean
  is_following?: boolean
}

export interface Like {
  id: string
  user_id: string
  video_id: string
  created_at: string
  user: User
}

export interface Comment {
  id: string
  user_id: string
  video_id: string
  parent_id: string | null
  content: string
  like_count: number
  created_at: string
  updated_at: string
  user: User
  replies?: Comment[]
  is_liked?: boolean
}

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
  follower: User
  following: User
}

export interface VideoView {
  id: string
  user_id: string
  video_id: string
  watch_duration: number
  created_at: string
}

export interface AuthUser {
  id: string
  email: string
  user_metadata: {
    username: string
    full_name: string | null
    avatar_url: string | null
  }
}
