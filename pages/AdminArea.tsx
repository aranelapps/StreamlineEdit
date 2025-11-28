
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Project, User, Role } from '../types';
import { Button, Card, StatusBadge, Select } from '../components/UIComponents';
import { Users, BarChart3, Shield, Search, ArrowRight, UserCog } from 'lucide-react';

interface AdminAreaProps {
  user: User;
}

export const AdminArea: React.FC<AdminAreaProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, usersData, projectsData] = await Promise.all([
        api.admin.getStats(),
        api.admin.getUsers(),
        api.projects.list('admin', user.id)
      ]);
      setStats(statsData);
      setUsers(usersData);
      setProjects(projectsData);
    } catch (e) {
      console.error("Failed to load admin data", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (targetUserId: string, newRole: string) => {
    try {
      await api.admin.updateUserRole(targetUserId, newRole);
      // Optimistic update
      setUsers(users.map(u => u.id === targetUserId ? { ...u, role: newRole as Role } : u));
    } catch (e) {
      console.error("Failed to update role", e);
      alert("Failed to update user role");
    }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading Admin Area...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Admin Area</h2>
        <div className="flex space-x-2">
           <Button 
             variant={activeTab === 'overview' ? 'primary' : 'ghost'} 
             onClick={() => setActiveTab('overview')}
             size="sm"
           >
             <BarChart3 className="w-4 h-4 mr-2" /> Overview
           </Button>
           <Button 
             variant={activeTab === 'users' ? 'primary' : 'ghost'} 
             onClick={() => setActiveTab('users')}
             size="sm"
           >
             <Users className="w-4 h-4 mr-2" /> User Management
           </Button>
        </div>
      </div>

      {activeTab === 'overview' && stats && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6 border-l-4 border-l-blue-500">
              <p className="text-sm font-medium text-slate-500">Total Projects</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalProjects}</p>
            </Card>
            <Card className="p-6 border-l-4 border-l-green-500">
              <p className="text-sm font-medium text-slate-500">Active Projects</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.activeProjects}</p>
            </Card>
            <Card className="p-6 border-l-4 border-l-purple-500">
              <p className="text-sm font-medium text-slate-500">New Requests</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.newRequests}</p>
            </Card>
            <Card className="p-6 border-l-4 border-l-red-500">
              <p className="text-sm font-medium text-slate-500">Urgent Attention</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.urgentAttention}</p>
            </Card>
          </div>

          {/* Recent Unassigned Projects */}
          <Card className="p-6">
             <h3 className="text-lg font-semibold text-slate-900 mb-4">New / Unassigned Projects</h3>
             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Client</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Due</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {projects.filter(p => !p.editor_id).slice(0, 5).map(p => (
                      <tr key={p.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">{p.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{p.client_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={p.status} /></td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(p.due_date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {projects.filter(p => !p.editor_id).length === 0 && (
                        <tr><td colSpan={4} className="px-6 py-4 text-center text-slate-500 text-sm">No unassigned projects.</td></tr>
                    )}
                  </tbody>
                </table>
             </div>
          </Card>
        </div>
      )}

      {activeTab === 'users' && (
        <Card className="p-0 overflow-hidden animate-fade-in-up">
          <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
             <h3 className="font-semibold text-slate-800 flex items-center">
               <UserCog className="w-5 h-5 mr-2" /> Manage Users
             </h3>
             <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input type="text" placeholder="Search users..." className="pl-9 pr-4 py-2 border rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500" />
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold mr-3">
                           {u.full_name.charAt(0)}
                        </div>
                        <div className="text-sm font-medium text-slate-900">{u.full_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select 
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="text-xs rounded-full px-2 py-1 border-0 font-semibold bg-slate-100 text-slate-800 cursor-pointer focus:ring-2 focus:ring-indigo-500"
                        style={{
                            backgroundColor: u.role === 'admin' ? '#f3e8ff' : u.role === 'editor' ? '#dbeafe' : '#dcfce7',
                            color: u.role === 'admin' ? '#6b21a8' : u.role === 'editor' ? '#1e40af' : '#166534'
                        }}
                      >
                        <option value="client">Client</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <span className="text-slate-300 text-xs">ID: {u.id.substring(0,6)}...</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};