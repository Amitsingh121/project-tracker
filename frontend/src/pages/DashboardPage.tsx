import { useNavigate } from 'react-router-dom';
import { format, isPast } from 'date-fns';
import { FolderOpen, CheckSquare, Clock, TrendingUp, type LucideIcon } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext.tsx';
import { useDashboard } from '../features/dashboard/hooks.ts';
import { Skeleton } from '../components/ui/skeleton.tsx';

const PROJECT_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#f97316', '#14b8a6'];
function projectColor(id: string) {
  const n = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return PROJECT_COLORS[n % PROJECT_COLORS.length];
}

const PRIORITY_DOT: Record<string, string> = {
  LOW: '#22c55e',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  URGENT: '#ef4444',
};

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  project: { id: string; name: string };
}

interface Project {
  id: string;
  name: string;
  taskCount: number;
  memberCount: number;
  myRole: string;
  updatedAt: string;
}

function Donut({ pct, size = 80, color = '#6366f1' }: { pct: number; size?: number; color?: string }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(1, pct / 100)) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
      />
    </svg>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  iconColor,
  iconBg,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  sub: string;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 relative overflow-hidden">
      <div
        className="absolute top-3.5 right-3.5 w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: iconBg }}
      >
        <Icon className="w-4 h-4" style={{ color: iconColor }} />
      </div>
      <p className="text-xs font-medium text-muted-foreground pr-10 truncate">{label}</p>
      <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Skeleton className="h-7 w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return (
    <div className="p-6 flex items-center justify-center h-full">
      <p className="text-destructive text-sm">Failed to load dashboard.</p>
    </div>
  );

  const { totals, tasksByStatus, myAssignedTasks, overdueTasks, recentProjects } = data;
  const total = totals.tasks || 1;
  const donePct = Math.round((tasksByStatus.DONE / total) * 100);
  const inProgPct = Math.round((tasksByStatus.IN_PROGRESS / total) * 100);
  const todoPct = Math.round((tasksByStatus.TODO / total) * 100);

  const upcoming = [...(myAssignedTasks as Task[])]
    .filter((t) => t.dueDate && t.status !== 'DONE')
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 6);

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <div className="p-4 sm:p-6 space-y-6 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Good morning, {firstName}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Here's what's happening across your projects.</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FolderOpen} label="Total Projects" value={totals.projects}
          sub={`${totals.projects === 1 ? '1 project' : `${totals.projects} active`}`}
          iconColor="#6366f1" iconBg="rgba(99,102,241,0.15)"
        />
        <StatCard
          icon={CheckSquare} label="Total Tasks" value={totals.tasks}
          sub={`${tasksByStatus.DONE} completed`}
          iconColor="#22c55e" iconBg="rgba(34,197,94,0.15)"
        />
        <StatCard
          icon={Clock} label="In Progress" value={tasksByStatus.IN_PROGRESS}
          sub={`${tasksByStatus.TODO} to do`}
          iconColor="#f59e0b" iconBg="rgba(245,158,11,0.15)"
        />
        <StatCard
          icon={TrendingUp} label="Completed" value={tasksByStatus.DONE}
          sub={`${donePct}% completion rate`}
          iconColor="#6366f1" iconBg="rgba(99,102,241,0.15)"
        />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Task breakdown */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Task Status Breakdown</h2>
          <div className="flex items-center gap-5">
            <div className="relative flex items-center justify-center shrink-0">
              <Donut pct={donePct} size={84} color="#22c55e" />
              <div className="absolute text-center">
                <p className="text-base font-bold text-foreground leading-none">{donePct}%</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">done</p>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              {[
                { label: 'Done', n: tasksByStatus.DONE, color: '#22c55e', pct: donePct },
                { label: 'In Progress', n: tasksByStatus.IN_PROGRESS, color: '#6366f1', pct: inProgPct },
                { label: 'To Do', n: tasksByStatus.TODO, color: '#9090b8', pct: todoPct },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: row.color }} />
                      {row.label}
                    </span>
                    <span className="font-semibold text-foreground">{row.n}</span>
                  </div>
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${row.pct}%`, background: row.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming deadlines */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Upcoming Deadlines</h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No upcoming tasks</p>
          ) : (
            <div className="space-y-0">
              {upcoming.map((task) => {
                const overdue = task.dueDate ? isPast(new Date(task.dueDate)) : false;
                return (
                  <div key={task.id} className="flex items-center gap-2.5 py-2.5 border-b border-border last:border-0 min-w-0">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: PRIORITY_DOT[task.priority] ?? '#888' }}
                    />
                    <span className="flex-1 min-w-0 text-sm text-foreground truncate">{task.title}</span>
                    <span className="hidden sm:inline text-xs text-muted-foreground shrink-0 max-w-[40%] truncate">{task.project.name}</span>
                    {task.dueDate && (
                      <span className={`text-xs font-medium shrink-0 ${overdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {format(new Date(task.dueDate), 'MMM d')}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent projects */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Recent Projects</h2>
            <button
              onClick={() => navigate('/projects')}
              className="text-xs text-primary hover:underline font-medium"
            >
              View all
            </button>
          </div>
          {(recentProjects as Project[]).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No projects yet</p>
          ) : (
            <div className="space-y-1">
              {(recentProjects as Project[]).map((p) => {
                const col = projectColor(p.id);
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 py-2.5 border-b border-border last:border-0 cursor-pointer hover:opacity-80 transition-opacity min-w-0"
                    onClick={() => navigate(`/projects/${p.id}`)}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: col }} />
                    <span className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">{p.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{p.taskCount} tasks</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Overdue tasks */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#ef4444' }}>Overdue</h2>
          {(overdueTasks as Task[]).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No overdue tasks</p>
          ) : (
            <div className="space-y-0">
              {(overdueTasks as Task[]).slice(0, 6).map((task) => (
                <div key={task.id} className="flex items-center gap-2.5 py-2.5 border-b border-border last:border-0 min-w-0">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: PRIORITY_DOT[task.priority] ?? '#888' }}
                  />
                  <span className="flex-1 min-w-0 text-sm text-foreground truncate">{task.title}</span>
                  <span className="hidden sm:inline text-xs text-muted-foreground shrink-0 max-w-[40%] truncate">{task.project.name}</span>
                  {task.dueDate && (
                    <span className="text-xs font-medium text-destructive shrink-0">
                      {format(new Date(task.dueDate), 'MMM d')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
