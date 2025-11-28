export type Role = 'client' | 'editor' | 'admin';

export type User = {
  id: string;
  email: string; // Synced from auth.users via triggers usually, or joined
  full_name: string;
  role: Role;
  avatar_url?: string;
};

// Profile matches the database table structure
export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  avatar_url?: string;
  created_at?: string;
};

export type ProjectStatus = 
  | 'new'
  | 'awaiting_assignment'
  | 'in_progress'
  | 'revision_requested'
  | 'awaiting_client_review'
  | 'approved'
  | 'on_hold'
  | 'cancelled';

export type Priority = 'normal' | 'high' | 'urgent';

export interface Project {
  id: string;
  client_id: string;
  editor_id?: string | null;
  title: string;
  description: string;
  editing_style: string;
  platforms: string[];
  aspect_ratio: string;
  desired_duration_seconds?: number;
  status: ProjectStatus;
  priority: Priority;
  due_date: string; // ISO string
  reference_links: string[];
  notes_for_editor?: string;
  created_at: string;
  updated_at: string;
  // Computed/Joined fields for UI convenience
  client_name?: string;
  editor_name?: string;
}

export type FileType = 'raw' | 'final' | 'reference' | 'other';

export interface ProjectFile {
  id: string;
  project_id: string;
  uploaded_by: string;
  file_type: FileType;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  created_at: string;
  url: string; 
  storage_path: string;
}

export interface Comment {
  id: string;
  project_id: string;
  author_id: string;
  author_name: string;
  author_role: Role;
  body: string;
  is_internal: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  created_at: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}