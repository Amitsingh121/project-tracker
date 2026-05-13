import { useNavigate } from 'react-router-dom';
import { format, isPast } from 'date-fns';
import { FolderOpen, CheckSquare, Clock, AlertTriangle } from 'lucide-react';
import { useDashboard } from '../features/dashboard/hooks.js';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Skeleton } from '../components/ui/skeleton.jsx';

const PRIORITY_STYLES = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-amber-50 text-amber-700',
  HIGH: 'bg-red-50 text-red-700',
};

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskRow({ task, isOverdue }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
      <span
        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${PRIORITY_STYLES[task.priority]}`}
      >
        {task.priority}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{task.title}</p>
        <p className="text-xs text-muted-foreground">{task.project.name}</p>
      </div>
      {task.dueDate && (
        <span className={`text-xs shrink-0 ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
          {format(new Date(task.dueDate), 'MMM d')}
        </span>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8">
      <Skeleton className="h-8 w-40" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) return <DashboardSkeleton />;

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-destructive text-sm">Failed to load dashboard.</p>
      </div>
    );
  }

  const { totals, tasksByStatus, myAssignedTasks, overdueTasks, recentProjects } = data;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-8">
        <h1 className="text-2xl font-bold tracking-tight mb-8">Dashboard</h1>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={FolderOpen} label="Total Projects" value={totals.projects} color="bg-blue-50 text-blue-600" />
          <StatCard icon={CheckSquare} label="Total Tasks" value={totals.tasks} color="bg-purple-50 text-purple-600" />
          <StatCard icon={Clock} label="In Progress" value={tasksByStatus.IN_PROGRESS} color="bg-amber-50 text-amber-600" />
          <StatCard icon={AlertTriangle} label="Overdue" value={overdueTasks.length} color="bg-red-50 text-red-600" />
        </div>

        {/* Task lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">My Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {myAssignedTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No tasks assigned to you</p>
              ) : (
                <div>
                  {myAssignedTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      isOverdue={!!task.dueDate && isPast(new Date(task.dueDate))}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-destructive">Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              {overdueTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No overdue tasks</p>
              ) : (
                <div>
                  {overdueTasks.map((task) => (
                    <TaskRow key={task.id} task={task} isOverdue />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent projects */}
        <div>
          <h2 className="text-base font-semibold mb-3">Recent Projects</h2>
          {recentProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentProjects.map((project) => (
                <Card
                  key={project.id}
                  className="cursor-pointer hover:shadow-sm transition-shadow"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium line-clamp-1">{project.name}</p>
                      <Badge variant={project.myRole === 'ADMIN' ? 'default' : 'secondary'} className="text-xs shrink-0">
                        {project.myRole}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{project.taskCount} tasks</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
