import React from 'react';
import { 
  LayoutDashboard, 
  FolderOpen, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bell,
  User,
  ShieldCheck
} from 'lucide-react';
import { User as UserType } from '../types';
import clsx from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
  user: UserType | null;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, currentPage, onNavigate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const roleLabel = user?.role === 'admin' ? 'Admin' : user?.role === 'editor' ? 'Editor' : 'Client';
  const roleColor = user?.role === 'admin' ? 'bg-purple-100 text-purple-800' : user?.role === 'editor' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';

  const NavItem = ({ page, icon: Icon, label }: { page: string; icon: any; label: string }) => (
    <button
      onClick={() => {
        onNavigate(page);
        setIsSidebarOpen(false);
      }}
      className={clsx(
        "flex items-center w-full px-4 py-3 text-sm font-medium transition-colors rounded-lg mb-1",
        currentPage === page 
          ? "bg-slate-900 text-white" 
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      <Icon className="w-5 h-5 mr-3" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b p-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center font-bold text-xl text-slate-800">
          <span className="text-indigo-600 mr-2">Streamline</span>Edit
        </div>
        <button onClick={toggleSidebar} className="p-2 rounded-md hover:bg-slate-100">
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside 
        className={clsx(
          "fixed inset-y-0 left-0 z-30 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:h-screen flex flex-col",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 border-b hidden md:block">
          <div className="flex items-center font-bold text-xl text-slate-800">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white mr-2">S</div>
            Streamline
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="mb-6">
            <div className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Menu
            </div>
            <NavItem page="dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem page="projects" icon={FolderOpen} label="Projects" />
            {user?.role === 'admin' && (
              <NavItem page="admin" icon={ShieldCheck} label="Admin Area" />
            )}
            <NavItem page="settings" icon={Settings} label="Settings" />
          </div>
        </div>

        <div className="p-4 border-t bg-slate-50">
          <div className="flex items-center p-2 mb-2">
            <img 
              src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.full_name}`} 
              alt="Avatar" 
              className="w-10 h-10 rounded-full bg-slate-300 object-cover" 
            />
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.full_name}</p>
              <span className={clsx("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", roleColor)}>
                {roleLabel}
              </span>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-slate-500 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Desktop Header */}
        <header className="hidden md:flex bg-white border-b h-16 items-center justify-between px-8">
          <h1 className="text-xl font-semibold text-slate-800 capitalize">
            {currentPage.replace('-', ' ')}
          </h1>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-slate-400 hover:text-indigo-600 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </div>
  );
};