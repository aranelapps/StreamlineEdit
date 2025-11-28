
import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { Project, ProjectFile, Comment, User, ProjectStatus } from '../types';
import { Button, Card, StatusBadge, PriorityBadge, TextArea, FileUploadZone, Select } from '../components/UIComponents';
import { ArrowLeft, Paperclip, Download, MessageSquare, User as UserIcon, Calendar, Check, Play, Upload, Save, FileVideo } from 'lucide-react';
import clsx from 'clsx';

interface ProjectDetailsProps {
  projectId: string;
  user: User;
  onBack: () => void;
}

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({ projectId, user, onBack }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [editors, setEditors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentBody, setCommentBody] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  useEffect(() => {
    if (commentsEndRef.current) {
        commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  const loadProjectData = async () => {
    try {
      const [p, f, c, eList] = await Promise.all([
        api.projects.get(projectId),
        api.files.list(projectId),
        api.comments.list(projectId),
        user.role === 'admin' ? api.admin.getEditors() : Promise.resolve([])
      ]);
      setProject(p);
      setFiles(f);
      setComments(c);
      setEditors(eList || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: ProjectStatus) => {
    if (!project) return;
    try {
      await api.projects.update(project.id, { status: newStatus });
      await loadProjectData();
    } catch (e) {
      console.error(e);
      alert('Failed to update status');
    }
  };

  const handleAssignEditor = async (editorId: string) => {
    if (!project) return;
    try {
        await api.projects.update(project.id, { editor_id: editorId, status: editorId ? 'in_progress' : 'awaiting_assignment' });
        await loadProjectData();
    } catch (e) {
        console.error(e);
        alert('Failed to assign editor');
    }
  };

  const handleClaim = async () => {
    if (!project) return;
    try {
      await api.projects.update(project.id, { editor_id: user.id, status: 'in_progress' });
      await loadProjectData();
    } catch (e) {
      console.error(e);
    }
  };

  const handlePostComment = async () => {
    if (!commentBody.trim() || !project) return;
    try {
      await api.comments.create(project.id, commentBody);
      setCommentBody('');
      const c = await api.comments.list(project.id);
      setComments(c);
    } catch (e) {
      console.error(e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handlePostComment();
      }
  }

  const handleFileUpload = async (fileList: FileList | null, type: 'raw' | 'final' | 'reference') => {
    if (!fileList || !project) return;
    setIsUploading(true);
    try {
      await Promise.all(Array.from(fileList).map(f => api.files.upload(project.id, f, type)));
      const f = await api.files.list(project.id);
      setFiles(f);
      
      if (type === 'final' && user.role === 'editor' && project.status === 'in_progress') {
        if(confirm("Mark project as 'Awaiting Client Review'?")) {
            await handleStatusChange('awaiting_client_review');
        }
      }
    } catch (e) {
      console.error(e);
      alert('Upload failed. Please ensure you have storage permissions.');
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading details...</div>;
  if (!project) return <div className="p-8 text-center text-red-500">Project not found</div>;

  const rawFiles = files.filter(f => f.file_type === 'raw');
  const finalFiles = files.filter(f => f.file_type === 'final');
  
  const isAssignedToMe = user.role === 'editor' && project.editor_id === user.id;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Navigation */}
      <button onClick={onBack} className="flex items-center text-sm text-slate-500 hover:text-indigo-600">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to List
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{project.title}</h1>
          <div className="flex items-center space-x-4 mt-2">
            <StatusBadge status={project.status} />
            <PriorityBadge priority={project.priority} />
            <span className="text-sm text-slate-500 flex items-center">
              <Calendar className="w-4 h-4 mr-1" /> Due: {new Date(project.due_date).toLocaleDateString()}
            </span>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex space-x-3">
          {user.role === 'editor' && !project.editor_id && (
            <Button onClick={handleClaim}>Claim Project</Button>
          )}
          
          {isAssignedToMe && project.status === 'in_progress' && (
            <Button onClick={() => handleStatusChange('awaiting_client_review')} variant="primary">
              <Check className="w-4 h-4 mr-2" /> Mark Ready for Review
            </Button>
          )}

          {user.role === 'client' && project.status === 'awaiting_client_review' && (
            <>
              <Button onClick={() => handleStatusChange('revision_requested')} variant="secondary">Request Revision</Button>
              <Button onClick={() => handleStatusChange('approved')} variant="primary">Approve Final</Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content: Info & Files */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Project Brief</h3>
            <div className="prose text-slate-600 mb-6">
              <p className="whitespace-pre-wrap">{project.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-lg">
              <div>
                <span className="block text-slate-400 text-xs uppercase tracking-wider mb-1">Editing Style</span>
                <span className="font-medium text-slate-900">{project.editing_style}</span>
              </div>
              <div>
                <span className="block text-slate-400 text-xs uppercase tracking-wider mb-1">Platform</span>
                <span className="font-medium text-slate-900">{project.platforms.join(', ')}</span>
              </div>
              <div>
                <span className="block text-slate-400 text-xs uppercase tracking-wider mb-1">Aspect Ratio</span>
                <span className="font-medium text-slate-900">{project.aspect_ratio}</span>
              </div>
              <div>
                <span className="block text-slate-400 text-xs uppercase tracking-wider mb-1">Duration</span>
                <span className="font-medium text-slate-900">{project.desired_duration_seconds} sec</span>
              </div>
            </div>

            {project.reference_links.length > 0 && (
                <div className="mt-4 border-t pt-4">
                     <span className="block text-slate-900 font-medium text-sm mb-2">References</span>
                     <ul className="list-disc list-inside text-sm text-indigo-600 space-y-1">
                         {project.reference_links.map((link, i) => (
                             <li key={i}><a href={link} target="_blank" rel="noreferrer" className="hover:underline">{link}</a></li>
                         ))}
                     </ul>
                </div>
            )}
            
            {project.notes_for_editor && (
                <div className="mt-4 border-t pt-4">
                     <span className="block text-slate-900 font-medium text-sm mb-1">Notes</span>
                     <p className="text-sm text-slate-600">{project.notes_for_editor}</p>
                </div>
            )}
          </Card>

          {/* Files Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900">Project Files</h3>
                {isUploading && <span className="text-sm text-indigo-600 animate-pulse">Uploading...</span>}
            </div>
            
            <div className="space-y-8">
              {/* Final Files */}
              <div>
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center">
                  <Play className="w-4 h-4 mr-2 text-indigo-600" /> Final Deliverables
                </h4>
                {finalFiles.length === 0 ? (
                  <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
                      <p className="text-sm text-slate-400 italic">No final files uploaded yet.</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {finalFiles.map(file => (
                      <li key={file.id} className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-100 group">
                        <div className="flex items-center overflow-hidden">
                          <div className="p-2 bg-indigo-100 rounded-md mr-3 text-indigo-600">
                            <FileVideo className="w-5 h-5" />
                          </div>
                          <div className="truncate min-w-0">
                            <p className="text-sm font-medium text-indigo-900 truncate">{file.file_name}</p>
                            <p className="text-xs text-indigo-600 mt-0.5">{(file.file_size_bytes / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <a 
                            href={file.url} 
                            download 
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                             <Button size="sm" variant="outline">Download</Button>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                
                {/* Editor Upload Final */}
                {isAssignedToMe && (
                   <div className="mt-3">
                       <FileUploadZone 
                          label="Upload Final Video" 
                          onFileSelect={(files) => handleFileUpload(files, 'final')} 
                          accept="video/*"
                        />
                   </div>
                )}
              </div>

              <div className="border-t border-slate-100"></div>

              {/* Raw Files */}
              <div>
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center">
                  <Paperclip className="w-4 h-4 mr-2 text-slate-500" /> Raw Assets
                </h4>
                
                {rawFiles.length === 0 && (
                    <div className="text-center p-4">
                        <p className="text-sm text-slate-400">No raw assets uploaded.</p>
                    </div>
                )}

                <ul className="space-y-2 mb-3">
                  {rawFiles.map(file => (
                    <li key={file.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors group">
                      <div className="flex items-center overflow-hidden">
                        <div className="p-2 bg-slate-100 rounded-md mr-3 text-slate-500">
                           <FileVideo className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-700 truncate">{file.file_name}</p>
                            <p className="text-xs text-slate-400">{(file.file_size_bytes / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <a href={file.url} download>
                              <Button size="sm" variant="ghost">
                                  <Download className="w-4 h-4" />
                              </Button>
                          </a>
                      </div>
                    </li>
                  ))}
                </ul>
                
                {/* Client Upload Raw */}
                {user.role === 'client' && project.client_id === user.id && (
                     <div className="mt-2">
                        <Button size="sm" variant="secondary" onClick={() => document.getElementById('upload-raw')?.click()} className="w-full border-dashed">
                            <Upload className="w-3 h-3 mr-2" /> Add More Assets
                        </Button>
                        <input id="upload-raw" type="file" multiple className="hidden" onChange={(e) => handleFileUpload(e.target.files, 'raw')} />
                     </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar: Meta & Comments */}
        <div className="space-y-6">
           {/* Team */}
           <Card className="p-6">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Team</h4>
              <div className="space-y-4">
                  <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs mr-3">
                        CL
                      </div>
                      <div>
                          <p className="text-sm font-medium">{project.client_name}</p>
                          <p className="text-xs text-slate-500">Client</p>
                      </div>
                  </div>
                  <div className="flex items-center">
                      <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mr-3", project.editor_id ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-400")}>
                        {project.editor_id ? 'ED' : '?'}
                      </div>
                      <div>
                          <p className="text-sm font-medium">{project.editor_name || 'Unassigned'}</p>
                          <p className="text-xs text-slate-500">Editor</p>
                      </div>
                  </div>
                  
                  {user.role === 'admin' && (
                      <div className="pt-4 mt-2 border-t border-slate-100">
                          <label className="text-xs font-semibold text-slate-700 block mb-2">Assign Editor (Admin)</label>
                          <div className="flex space-x-2">
                            <select 
                                className="block w-full text-sm rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                                value={project.editor_id || ''}
                                onChange={(e) => handleAssignEditor(e.target.value)}
                            >
                                <option value="">-- Select Editor --</option>
                                {editors.map(e => (
                                    <option key={e.id} value={e.id}>{e.full_name}</option>
                                ))}
                            </select>
                          </div>
                      </div>
                  )}
              </div>
           </Card>

           {/* Comments */}
           <Card className="p-0 flex flex-col h-[600px] shadow-lg">
              <div className="p-4 border-b bg-slate-50">
                 <h3 className="font-semibold text-slate-900 flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2" /> Comments
                 </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                  {comments.length === 0 && <p className="text-center text-sm text-slate-400 my-8">No comments yet. Start the conversation!</p>}
                  {comments.map((comment) => (
                      <div key={comment.id} className={clsx("flex flex-col max-w-[85%] animate-fade-in-up", comment.author_id === user.id ? "ml-auto items-end" : "mr-auto items-start")}>
                          <div className={clsx("rounded-2xl px-4 py-2 text-sm shadow-sm", comment.author_id === user.id ? "bg-indigo-600 text-white rounded-br-none" : "bg-white text-slate-800 border border-slate-100 rounded-bl-none")}>
                              {comment.body}
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 px-1">{comment.author_name} • {new Date(comment.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                  ))}
                  <div ref={commentsEndRef} />
              </div>
              <div className="p-4 border-t bg-white">
                  <TextArea 
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message... (Press Enter to send)"
                    rows={1}
                    className="mb-2 bg-slate-50 border-0 focus:ring-2 focus:ring-indigo-500 resize-none py-3"
                  />
                  <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>Enter to send, Shift+Enter for new line</span>
                      <Button size="sm" onClick={handlePostComment} disabled={!commentBody.trim()}>Send</Button>
                  </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}