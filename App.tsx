
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CreateProject } from './pages/CreateProject';
import { ProjectDetails } from './pages/ProjectDetails';
import { AdminArea } from './pages/AdminArea';
import { api } from './services/api';
import { User } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('login');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const currentUser = await api.auth.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setCurrentPage('dashboard');
      }
    } catch (e) {
      console.error("Session check failed", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    await checkSession();
  };

  const handleLogout = async () => {
    await api.auth.signOut();
    setUser(null);
    setCurrentPage('login');
  };

  const handleNavigate = (page: string, params?: any) => {
    if (page === 'project-details' && params?.id) {
        setCurrentProjectId(params.id);
    }
    setCurrentPage(page);
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-slate-500">Loading StreamlineEdit...</div>;

  if (!user || currentPage === 'login') {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      currentPage={currentPage}
      onNavigate={handleNavigate}
    >
      {currentPage === 'dashboard' && (
        <Dashboard user={user} view="dashboard" onNavigate={handleNavigate} />
      )}
      
      {currentPage === 'create-project' && (
        <CreateProject 
          onBack={() => handleNavigate('dashboard')} 
          onSuccess={() => handleNavigate('dashboard')}
        />
      )}

      {currentPage === 'project-details' && currentProjectId && (
        <ProjectDetails 
          projectId={currentProjectId}
          user={user}
          onBack={() => handleNavigate('projects')}
        />
      )}

      {currentPage === 'projects' && (
         <Dashboard user={user} view="projects" onNavigate={handleNavigate} />
      )}

      {currentPage === 'admin' && (
         <AdminArea user={user} />
      )}

      {currentPage === 'settings' && (
        <div className="text-center p-12 text-slate-500">
          <h2 className="text-2xl font-bold mb-2">Settings</h2>
          <p>Global configuration and profile settings would go here.</p>
        </div>
      )}
    </Layout>
  );
}

export default App;