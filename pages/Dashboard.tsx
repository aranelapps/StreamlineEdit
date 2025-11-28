
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Project, User } from '../types';
import { Button, Card, StatusBadge, PriorityBadge } from '../components/UIComponents';
import { Plus, ArrowRight, BarChart3, Clock, AlertCircle, CheckCircle, LayoutGrid, List } from 'lucide-react';
import clsx from 'clsx';

interface DashboardProps {
  user: User;
  view: 'dashboard' | 'projects';
  onNavigate: (page: string, params?: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, view, onNavigate }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user, view]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [data, statsData] = await Promise.all([
        api.projects.list(user.role, user.id),
        user.role === 'admin' && view === 'dashboard' ? api.admin.getStats() : Promise.resolve(null)
      ]);
      setProjects(data);
      setStats(statsData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <Card className="p-6 flex items-center shadow-sm border-0 bg-white">
      <div className={clsx("p-3 rounded-xl mr-4", color)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </Card>
  );

  const ProjectList = ({ title, items, showHeader = true, compact = false }: { title: string, items: Project[], showHeader?: boolean, compact?: boolean }) => (
    <div className="mb-8 animate-fade-in-up">
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          {items.length === 0 && <span className="text-sm text-slate-500">No projects found</span>}
        </div>
      )}
      
      {items.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Project Title</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  {!compact && <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>}
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date</th>
                  {!compact && user.role !== 'client' && <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>}
                  {!compact && user.role !== 'editor' && <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Editor</th>}
                  <th className="relative px-6 py-3"><span className="sr-only">View</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {items.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => onNavigate('project-details', { id: project.id })}>
                      <div className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                         {project.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{project.platforms.join(', ')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={project.status} />
                    </td>
                    {!compact && (
                        <td className="px-6 py-4 whitespace-nowrap">
                        <PriorityBadge priority={project.priority} />
                        </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(project.due_date).toLocaleDateString()}
                    </td>
                    {!compact && user.role !== 'client' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{project.client_name}</td>
                    )}
                    {!compact && user.role !== 'editor' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{project.editor_name || '-'}</td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onNavigate('project-details', { id: project.id }); }}>
                        View <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading...</div>;

  // -- View: DASHBOARD (Stats and Overview) --
  if (view === 'dashboard') {
    return (
      <div className="space-y-8 animate-fade-in-up">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Hello, {user.full_name.split(' ')[0]}
            </h2>
            <p className="text-slate-500 mt-1">Here is what's happening with your projects today.</p>
          </div>
          {user.role === 'client' && (
            <Button onClick={() => onNavigate('create-project')}>
              <Plus className="w-4 h-4 mr-2" /> New Project
            </Button>
          )}
        </div>

        {/* Role-Specific Stats */}
        {user.role === 'client' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <StatCard 
                    title="Active Projects" 
                    value={projects.filter(p => !['approved', 'cancelled'].includes(p.status)).length} 
                    icon={Clock} 
                    color="bg-indigo-500" 
                 />
                 <StatCard 
                    title="Awaiting Review" 
                    value={projects.filter(p => p.status === 'awaiting_client_review').length} 
                    icon={AlertCircle} 
                    color="bg-orange-500" 
                 />
                 <StatCard 
                    title="Completed" 
                    value={projects.filter(p => p.status === 'approved').length} 
                    icon={CheckCircle} 
                    color="bg-green-500" 
                 />
            </div>
        )}

        {/* Admin Stats */}
        {user.role === 'admin' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard title="Total Projects" value={stats.totalProjects} icon={BarChart3} color="bg-blue-500" />
            <StatCard title="Active" value={stats.activeProjects} icon={Clock} color="bg-green-500" />
            <StatCard title="New Requests" value={stats.newRequests} icon={Plus} color="bg-purple-500" />
            <StatCard title="Urgent" value={stats.urgentAttention} icon={AlertCircle} color="bg-red-500" />
          </div>
        )}

        {/* Overview Project Lists */}
        {user.role === 'client' && (
          <ProjectList title="Active Projects" items={projects.filter(p => !['approved', 'cancelled'].includes(p.status)).slice(0, 5)} compact />
        )}
        
        {user.role === 'editor' && (
           <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <ProjectList title="My Active Assignments" items={projects.filter(p => p.editor_id === user.id && p.status !== 'approved')} compact />
                  </div>
                  <div>
                    <ProjectList title="Available to Claim" items={projects.filter(p => !p.editor_id && (p.status === 'new' || p.status === 'awaiting_assignment'))} compact />
                  </div>
              </div>
           </div>
        )}

        {user.role === 'admin' && (
          <ProjectList title="Recently Created" items={projects.slice(0, 5)} compact />
        )}
      </div>
    );
  }

  // -- View: PROJECTS (Full List) --
  return (
      <div className="space-y-6 animate-fade-in-up">
          <div className="flex justify-between items-center">
              <div>
                  <h2 className="text-2xl font-bold text-slate-900">All Projects</h2>
                  <p className="text-slate-500 text-sm mt-1">Manage and track all video requests</p>
              </div>
              {user.role === 'client' && (
                  <Button onClick={() => onNavigate('create-project')}>
                      <Plus className="w-4 h-4 mr-2" /> New Project
                  </Button>
              )}
          </div>
          <ProjectList title="Project Directory" items={projects} showHeader={false} />
      </div>
  );
};