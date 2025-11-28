import { User, Project, ProjectFile, Comment, Notification, ProjectStatus } from '../types';

// --- MOCK DATA SEEDS ---

const USERS: User[] = [
  { id: 'u1', email: 'client@example.com', full_name: 'Alice Client', role: 'client', avatar_url: 'https://ui-avatars.com/api/?name=Alice+Client&background=random' },
  { id: 'u2', email: 'editor@example.com', full_name: 'Bob Editor', role: 'editor', avatar_url: 'https://ui-avatars.com/api/?name=Bob+Editor&background=random' },
  { id: 'u3', email: 'admin@example.com', full_name: 'Ken Admin', role: 'admin', avatar_url: 'https://ui-avatars.com/api/?name=Ken+Admin&background=random' },
  { id: 'u4', email: 'client2@example.com', full_name: 'Dave Client', role: 'client', avatar_url: 'https://ui-avatars.com/api/?name=Dave+Client&background=random' },
];

const PROJECTS: Project[] = [
  {
    id: 'p1',
    client_id: 'u1',
    editor_id: 'u2',
    title: 'Summer Collection Launch',
    description: 'Energetic video showcasing our new summer line. Fast cuts, upbeat music.',
    editing_style: 'Cinematic',
    platforms: ['Instagram', 'TikTok'],
    aspect_ratio: '9:16',
    desired_duration_seconds: 30,
    status: 'in_progress',
    priority: 'high',
    due_date: new Date(Date.now() + 86400000 * 3).toISOString(),
    reference_links: ['https://youtube.com/example'],
    notes_for_editor: 'Please use the assets from the "Raw" folder.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p2',
    client_id: 'u1',
    editor_id: null,
    title: 'Testimonial Compilation',
    description: 'Customer interviews stitched together with soft background music.',
    editing_style: 'Corporate',
    platforms: ['LinkedIn', 'YouTube'],
    aspect_ratio: '16:9',
    desired_duration_seconds: 120,
    status: 'new',
    priority: 'normal',
    due_date: new Date(Date.now() + 86400000 * 10).toISOString(),
    reference_links: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p3',
    client_id: 'u4',
    editor_id: 'u2',
    title: 'Product Unboxing',
    description: 'Detailed unboxing of the X-2000 widget.',
    editing_style: 'Vlog',
    platforms: ['YouTube'],
    aspect_ratio: '16:9',
    desired_duration_seconds: 600,
    status: 'awaiting_client_review',
    priority: 'normal',
    due_date: new Date(Date.now() - 86400000).toISOString(),
    reference_links: [],
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
  }
];

const FILES: ProjectFile[] = [
  { id: 'f1', project_id: 'p1', uploaded_by: 'u1', file_type: 'raw', file_name: 'IMG_4021.MOV', file_size_bytes: 25000000, mime_type: 'video/quicktime', created_at: new Date().toISOString(), url: '#', storage_path: 'mock/p1/raw/IMG_4021.MOV' },
  { id: 'f2', project_id: 'p3', uploaded_by: 'u2', file_type: 'final', file_name: 'Unboxing_v1_Final.mp4', file_size_bytes: 150000000, mime_type: 'video/mp4', created_at: new Date().toISOString(), url: '#', storage_path: 'mock/p3/final/Unboxing_v1_Final.mp4' },
];

const COMMENTS: Comment[] = [
  { id: 'c1', project_id: 'p1', author_id: 'u1', author_name: 'Alice Client', author_role: 'client', body: 'Just uploaded the raw files!', is_internal: false, created_at: new Date(Date.now() - 86000000).toISOString() },
  { id: 'c2', project_id: 'p1', author_id: 'u2', author_name: 'Bob Editor', author_role: 'editor', body: 'Got it, starting work now.', is_internal: false, created_at: new Date(Date.now() - 85000000).toISOString() },
];

// --- SERVICE IMPLEMENTATION ---

class MockService {
  private users = USERS;
  private projects = PROJECTS;
  private files = FILES;
  private comments = COMMENTS;
  private currentUser: User | null = null;

  async login(email: string): Promise<User> {
    await new Promise(r => setTimeout(r, 600)); // Simulate latency
    const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error('User not found. Try client@example.com, editor@example.com, or admin@example.com');
    this.currentUser = user;
    return user;
  }

  logout() {
    this.currentUser = null;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  async getProjects(): Promise<Project[]> {
    await new Promise(r => setTimeout(r, 400));
    if (!this.currentUser) return [];

    // Attach names for UI
    const enrichedProjects = this.projects.map(p => ({
      ...p,
      client_name: this.users.find(u => u.id === p.client_id)?.full_name,
      editor_name: p.editor_id ? this.users.find(u => u.id === p.editor_id)?.full_name : 'Unassigned'
    }));

    if (this.currentUser.role === 'admin') {
      return enrichedProjects;
    }
    if (this.currentUser.role === 'client') {
      return enrichedProjects.filter(p => p.client_id === this.currentUser!.id);
    }
    if (this.currentUser.role === 'editor') {
      // Editors see assigned projects AND unassigned/new projects they can claim
      return enrichedProjects.filter(p => 
        p.editor_id === this.currentUser!.id || 
        (p.status === 'new' || p.status === 'awaiting_assignment')
      );
    }
    return [];
  }

  async getProjectById(id: string): Promise<Project | null> {
    await new Promise(r => setTimeout(r, 200));
    const project = this.projects.find(p => p.id === id);
    if (!project) return null;
    return {
      ...project,
      client_name: this.users.find(u => u.id === project.client_id)?.full_name,
      editor_name: project.editor_id ? this.users.find(u => u.id === project.editor_id)?.full_name : 'Unassigned'
    };
  }

  async createProject(data: Partial<Project>): Promise<Project> {
    await new Promise(r => setTimeout(r, 800));
    if (!this.currentUser) throw new Error("Not logged in");

    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      client_id: this.currentUser.id,
      editor_id: null,
      title: data.title || 'Untitled Project',
      description: data.description || '',
      editing_style: data.editing_style || 'General',
      platforms: data.platforms || [],
      aspect_ratio: data.aspect_ratio || '16:9',
      desired_duration_seconds: data.desired_duration_seconds,
      status: 'new',
      priority: data.priority || 'normal',
      due_date: data.due_date || new Date().toISOString(),
      reference_links: data.reference_links || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notes_for_editor: data.notes_for_editor
    };
    this.projects.push(newProject);
    return newProject;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    await new Promise(r => setTimeout(r, 500));
    const idx = this.projects.findIndex(p => p.id === id);
    if (idx === -1) throw new Error("Project not found");
    
    this.projects[idx] = { ...this.projects[idx], ...updates, updated_at: new Date().toISOString() };
    return this.projects[idx];
  }

  async getFiles(projectId: string): Promise<ProjectFile[]> {
    await new Promise(r => setTimeout(r, 300));
    return this.files.filter(f => f.project_id === projectId);
  }

  async uploadFile(projectId: string, file: File, type: 'raw' | 'final' | 'reference'): Promise<ProjectFile> {
    await new Promise(r => setTimeout(r, 1000)); // Simulate upload time
    if (!this.currentUser) throw new Error("Not logged in");

    const newFile: ProjectFile = {
      id: Math.random().toString(36).substr(2, 9),
      project_id: projectId,
      uploaded_by: this.currentUser.id,
      file_type: type,
      file_name: file.name,
      file_size_bytes: file.size,
      mime_type: file.type,
      created_at: new Date().toISOString(),
      url: '#', // Local object URL for demo would go here
      storage_path: `mock/${projectId}/${type}/${file.name}`
    };
    this.files.push(newFile);
    return newFile;
  }

  async getComments(projectId: string): Promise<Comment[]> {
    await new Promise(r => setTimeout(r, 200));
    return this.comments
      .filter(c => c.project_id === projectId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  async addComment(projectId: string, body: string, isInternal: boolean = false): Promise<Comment> {
    await new Promise(r => setTimeout(r, 300));
    if (!this.currentUser) throw new Error("Not logged in");

    const newComment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      project_id: projectId,
      author_id: this.currentUser.id,
      author_name: this.currentUser.full_name,
      author_role: this.currentUser.role,
      body,
      is_internal: isInternal,
      created_at: new Date().toISOString()
    };
    this.comments.push(newComment);
    return newComment;
  }

  async claimProject(projectId: string): Promise<Project> {
    if (!this.currentUser) throw new Error("Not logged in");
    return this.updateProject(projectId, { editor_id: this.currentUser.id, status: 'in_progress' });
  }

  async getAllUsers(): Promise<User[]> {
      return this.users;
  }

  async getStats() {
    await new Promise(r => setTimeout(r, 200));
    const active = this.projects.filter(p => !['approved', 'cancelled'].includes(p.status)).length;
    const newReqs = this.projects.filter(p => p.status === 'new').length;
    const urgent = this.projects.filter(p => p.priority === 'urgent' && !['approved', 'cancelled'].includes(p.status)).length;
    return {
      totalProjects: this.projects.length,
      activeProjects: active,
      newRequests: newReqs,
      urgentAttention: urgent
    };
  }
}

export const mockService = new MockService();