import { TrendingUp, CheckSquare, Clock, AlertTriangle } from 'lucide-react';
import { useDashboard } from '../features/dashboard/hooks.ts';
import { Skeleton } from '../components/ui/skeleton.tsx';
import type { LucideIcon } from 'lucide-react';

const PROJECT_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#f97316', '#14b8a6'];
function projectColor(id: string) {
  const n = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return PROJECT_COLORS[n % PROJECT_COLORS.length];
}

interface Project {
  id: string;
  name: string;
  taskCount: number;
  memberCount: number;
  myRole: string;
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
  value: string | number;
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
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-foreground font-medium">{label}</span>
        <span className="text-muted-foreground font-semibold">{value}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-7 w-32" />
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

export default function AnalyticsPage() {
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) return <AnalyticsSkeleton />;
  if (isError) return (
    <div className="p-6 flex items-center justify-center h-full">
      <p className="text-destructive text-sm">Failed to load analytics.</p>
    </div>
  );

  const { totals, tasksByStatus, overdueTasks, recentProjects } = data;
  const total = totals.tasks || 1;
  const donePct = Math.round((tasksByStatus.DONE / total) * 100);

  const maxTasks = Math.max(...(recentProjects as Project[]).map((p) => p.taskCount), 1);

  return (
    <div className="p-6 space-y-6 min-h-full">
      <div>
        <h1 className="text-xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Performance overview across all projects</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp} label="Completion Rate" value={`${donePct}%`}
          sub={`${tasksByStatus.DONE} of ${totals.tasks} tasks`}
          iconColor="#22c55e" iconBg="rgba(34,197,94,0.15)"
        />
        <StatCard
          icon={CheckSquare} label="Total Tasks" value={totals.tasks}
          sub={`across ${totals.projects} project${totals.projects !== 1 ? 's' : ''}`}
          iconColor="#6366f1" iconBg="rgba(99,102,241,0.15)"
        />
        <StatCard
          icon={Clock} label="In Progress" value={tasksByStatus.IN_PROGRESS}
          sub={`${tasksByStatus.TODO} remaining to start`}
          iconColor="#f59e0b" iconBg="rgba(245,158,11,0.15)"
        />
        <StatCard
          icon={AlertTriangle} label="Overdue" value={(overdueTasks as unknown[]).length}
          sub={(overdueTasks as unknown[]).length === 0 ? 'All tasks on time' : 'Needs attention'}
          iconColor="#ef4444" iconBg="rgba(239,68,68,0.15)"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Project task breakdown */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-5">Tasks by Project</h2>
          {(recentProjects as Project[]).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No projects yet</p>
          ) : (
            (recentProjects as Project[]).map((p) => (
              <BarRow
                key={p.id}
                label={p.name}
                value={p.taskCount}
                max={maxTasks}
                color={projectColor(p.id)}
              />
            ))
          )}
        </div>

        {/* Task status breakdown */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-5">Task Status Distribution</h2>
          <BarRow label="Completed" value={tasksByStatus.DONE} max={total} color="#22c55e" />
          <BarRow label="In Progress" value={tasksByStatus.IN_PROGRESS} max={total} color="#6366f1" />
          <BarRow label="To Do" value={tasksByStatus.TODO} max={total} color="#9090b8" />

          <div className="mt-6 pt-4 border-t border-border">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Summary</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Done', value: tasksByStatus.DONE, color: '#22c55e' },
                { label: 'Active', value: tasksByStatus.IN_PROGRESS, color: '#6366f1' },
                { label: 'Todo', value: tasksByStatus.TODO, color: '#9090b8' },
              ].map((s) => (
                <div key={s.label} className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Projects table */}
      {(recentProjects as Project[]).length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Project Overview</h2>
          <div className="space-y-3">
            {(recentProjects as Project[]).map((p) => {
              const col = projectColor(p.id);
              return (
                <div key={p.id} className="flex items-center gap-4">
                  <div className="flex items-center gap-2.5 w-48 shrink-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: col }} />
                    <span className="text-sm font-medium text-foreground truncate">{p.name}</span>
                  </div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(p.taskCount / maxTasks) * 100}%`, background: col }}
                    />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground w-36 shrink-0 justify-end">
                    <span>{p.taskCount} tasks</span>
                    <span>{p.memberCount} members</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                        p.myRole === 'ADMIN'
                          ? 'bg-primary/15 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {p.myRole}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
