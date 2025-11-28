
import { createClient } from '@supabase/supabase-js';
import { Project, User, ProjectFile, Comment, ProjectStatus } from '../types';
import { SUPABASE_URL, SUPABASE_ANON_KEY, APP_URL } from '../config';

// Initialize Supabase Client
// We use a fallback so the app doesn't crash immediately if config is empty, 
// allowing the user to see the UI (though requests will fail).
const supabaseUrl = SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to get the correct redirect URL
const getRedirectUrl = () => {
    // If user manually configured APP_URL in config.ts, use it (removing trailing slash if present)
    if (APP_URL && APP_URL.length > 0) {
        return APP_URL.replace(/\/$/, "");
    }
    // Otherwise fall back to auto-detection
    return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
};

export const api = {
  auth: {
    async getCurrentUser(): Promise<User | null> {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) return null;
      
      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (profileError) {
          // If table doesn't exist yet, simply return null to trigger login/signup flow logic
          // or let the UI handle the missing profile state
          if (profileError.code === '42P01') {
              console.error("Database tables not found. Please run the supabase_setup.sql script.");
          }
          return null;
      }
        
      if (!profile) return null;

      return {
        id: session.user.id,
        email: session.user.email!,
        full_name: profile.full_name,
        role: profile.role,
        avatar_url: profile.avatar_url
      };
    },
    
    async signIn(email: string, password?: string) {
       const { data, error } = await supabase.auth.signInWithPassword({
         email,
         password: password || 'password'
       });
       if (error) throw error;

       // Lazy Profile Creation:
       // If the user just confirmed their email, they might not have a profile row yet 
       // (because the signUp insert failed due to RLS when they weren't logged in).
       if (data.session?.user) {
           const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.session.user.id)
            .single();
            
           if (!profile) {
               // Retrieve metadata saved during signUp
               const metadata = data.session.user.user_metadata || {};
               const { full_name, role } = metadata;
               const userRole = role || 'client';
               const userFullName = full_name || email.split('@')[0];

               // Insert the missing profile now that we have a session
               const { error: insertError } = await supabase.from('profiles').insert([{
                    id: data.session.user.id,
                    email: email,
                    full_name: userFullName,
                    role: userRole,
                    avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(userFullName)}&background=random`
               }]);

               if (insertError) {
                   // If error code is 23505 (unique_violation), it means a trigger or race condition 
                   // already created the profile, so we can safely ignore it.
                   if (insertError.code === '23505') {
                       console.log("Profile already exists (duplicate key), proceeding.");
                   } else if (insertError.code === '42P01') {
                       throw new Error("Database tables not found. Please run the 'supabase_setup.sql' script in your Supabase SQL Editor.");
                   } else {
                       console.error("Failed to create profile during sign in:", insertError.message || insertError);
                   }
               }
           }
       }

       return data;
    },

    async signUp(email: string, password: string, full_name: string, role: string = 'client') {
      // 1. Sign up with Supabase Auth
      // We explicitly set emailRedirectTo to the configured URL or current window origin
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name, role },
          emailRedirectTo: getRedirectUrl()
        }
      });
      
      if (error) throw error;
      
      // 2. Create Profile record manually (if no DB trigger exists and we have a session)
      if (data.session && data.user) {
         const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: data.user.id,
            email: email,
            full_name: full_name,
            role: role,
            avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(full_name)}&background=random`
          }]);
          
         if (profileError) {
             if (profileError.code === '23505') {
                 // duplicate, ignore
             } else if (profileError.code === '42P01') {
                 console.error("Database tables missing. Please run the setup SQL.");
             } else {
                 console.error("Profile creation failed", profileError.message || profileError);
             }
         }
      }
      
      return data;
    },

    async resendConfirmation(email: string) {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: getRedirectUrl()
        }
      });
      if (error) throw error;
    },

    async resetPassword(email: string) {
      // This sends a password reset email that redirects BACK to this specific app URL
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getRedirectUrl(),
      });
      if (error) throw error;
    },

    async signOut() {
      await supabase.auth.signOut();
    }
  },

  projects: {
    async list(role: string, userId: string): Promise<Project[]> {
      let query = supabase
        .from('projects')
        .select(`
          *,
          client:client_id(full_name),
          editor:editor_id(full_name)
        `)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      // Transform joined data to flat structure expected by UI
      const projects = (data || []).map((p: any) => ({
        ...p,
        client_name: p.client?.full_name,
        editor_name: p.editor?.full_name
      }));

      if (role === 'client') {
        return projects.filter((p: Project) => p.client_id === userId);
      }
      if (role === 'editor') {
        return projects.filter((p: Project) => 
          p.editor_id === userId || 
          p.status === 'new' || 
          p.status === 'awaiting_assignment'
        );
      }
      return projects; // Admin sees all
    },

    async get(id: string): Promise<Project | null> {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:client_id(full_name),
          editor:editor_id(full_name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        ...data,
        client_name: data.client?.full_name,
        editor_name: data.editor?.full_name
      };
    },

    async create(project: Partial<Project>) {
      // Get current user for client_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('projects')
        .insert([{
          ...project,
          client_id: user.id,
          status: 'new',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async update(id: string, updates: Partial<Project>) {
      const { data, error } = await supabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  files: {
    async list(projectId: string): Promise<ProjectFile[]> {
      const { data, error } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId);
      
      if (error) throw error;

      // Generate signed URLs for viewing
      const filesWithUrls = await Promise.all((data || []).map(async (file: any) => {
        try {
            const { data: signed } = await supabase.storage
            .from('project-files')
            .createSignedUrl(file.storage_path, 3600); // URL valid for 1 hour
            return { ...file, url: signed?.signedUrl || '#' };
        } catch (e) {
            return { ...file, url: '#' };
        }
      }));

      return filesWithUrls;
    },

    async upload(projectId: string, file: File, type: 'raw' | 'final' | 'reference') {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const filePath = `${projectId}/${type}/${fileName}`;

      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Create DB Record
      const { data, error: dbError } = await supabase
        .from('project_files')
        .insert([{
          project_id: projectId,
          uploaded_by: user.id,
          file_type: type,
          file_name: file.name,
          file_size_bytes: file.size,
          mime_type: file.type,
          storage_path: filePath
        }])
        .select()
        .single();

      if (dbError) throw dbError;
      return data;
    }
  },

  comments: {
    async list(projectId: string): Promise<Comment[]> {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          author:author_id(full_name, role)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      return (data || []).map((c: any) => ({
        ...c,
        author_name: c.author?.full_name,
        author_role: c.author?.role
      }));
    },

    async create(projectId: string, body: string, isInternal: boolean = false) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('comments')
        .insert([{
          project_id: projectId,
          author_id: user.id,
          body,
          is_internal: isInternal
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  admin: {
    async getUsers() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
      if (error) throw error;
      return data as User[];
    },
    
    async updateUserRole(userId: string, role: string) {
       const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);
       if (error) throw error;
    },

    async getEditors() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'editor');
      if (error) throw error;
      return data as User[];
    },

    async getStats() {
      const { data: projects } = await supabase.from('projects').select('status, priority');
      if (!projects) return { totalProjects: 0, activeProjects: 0, newRequests: 0, urgentAttention: 0 };
      
      const active = projects.filter(p => !['approved', 'cancelled'].includes(p.status)).length;
      const newReqs = projects.filter(p => p.status === 'new').length;
      const urgent = projects.filter(p => p.priority === 'urgent' && !['approved', 'cancelled'].includes(p.status)).length;
      
      return {
        totalProjects: projects.length,
        activeProjects: active,
        newRequests: newReqs,
        urgentAttention: urgent
      };
    }
  }
};
