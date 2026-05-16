import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderOpen, BarChart2, ChevronLeft, ChevronRight, LogOut, Moon, Sun, Mail } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext.tsx';
import { useMyProjects } from '../../features/projects/hooks.ts';
import { useMyInvitations } from '../../features/invitations/hooks.ts';

const PROJECT_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#f97316', '#14b8a6'];

function projectColor(id: string): string {
  const n = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return PROJECT_COLORS[n % PROJECT_COLORS.length];
}

interface Props {
  collapsed: boolean;
  onToggle: () => void;
  dark: boolean;
  onToggleDark: () => void;
}

export default function Sidebar({ collapsed, onToggle, dark, onToggleDark }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { data: projects = [] } = useMyProjects();
  const { data: invitations = [] } = useMyInvitations();

  const inviteCount = invitations.length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const isActive = (to: string) =>
    location.pathname === to || location.pathname.startsWith(to + '/');

  const NAV = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: 0 },
    { to: '/projects', label: 'Projects', icon: FolderOpen, badge: 0 },
    { to: '/analytics', label: 'Analytics', icon: BarChart2, badge: 0 },
    { to: '/invitations', label: 'Invitations', icon: Mail, badge: inviteCount },
  ];

  return (
    <aside
      className={`flex flex-col h-screen bg-sidebar border-r border-sidebar-border shrink-0 transition-all duration-200 ${
        collapsed ? 'w-[56px]' : 'w-[220px] sm:w-[240px]'
      }`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-2.5 border-b border-sidebar-border shrink-0 ${collapsed ? 'px-3.5 py-4 justify-center' : 'px-4 py-4'}`}>
        <img src="/logo.svg" alt="ProjectTracker" className="w-8 h-8 shrink-0" />
        {!collapsed && <span className="font-bold text-sm text-foreground">ProjectTracker</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-0.5">
        {NAV.map(({ to, label, icon: Icon, badge }) => {
          const active = isActive(to);
          return (
            <Link
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap overflow-hidden ${
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              }`}
            >
              <span className="relative shrink-0">
                <Icon className="w-4 h-4" />
                {badge > 0 && collapsed && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-destructive" />
                )}
              </span>
              {!collapsed && <span className="flex-1">{label}</span>}
              {!collapsed && badge > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center shrink-0">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Projects list */}
        {!collapsed && projects.length > 0 && (
          <>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-2.5 pt-4 pb-1">
              Projects
            </p>
            {(projects as { id: string; name: string }[]).map((p) => {
              const active = location.pathname === `/projects/${p.id}`;
              const col = projectColor(p.id);
              return (
                <Link
                  key={p.id}
                  to={`/projects/${p.id}`}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors whitespace-nowrap overflow-hidden ${
                    active
                      ? 'bg-primary/15 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: col }}
                  />
                  <span className="truncate text-xs">{p.name}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Collapse + dark mode toggle */}
      <div className="px-2 pb-2 flex gap-1">
        <button
          onClick={onToggleDark}
          className="flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors shrink-0"
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button
          onClick={onToggle}
          className="flex-1 flex items-center justify-center gap-2 px-2.5 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>

      {/* User footer */}
      <div className="border-t border-sidebar-border px-2 py-3">
        <div
          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-muted/60 transition-colors ${collapsed ? 'justify-center' : ''}`}
          onClick={handleLogout}
          title="Log out"
        >
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-[11px] font-bold text-primary-foreground shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-foreground">{user?.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          )}
          {!collapsed && <LogOut className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
        </div>
      </div>
    </aside>
  );
}
