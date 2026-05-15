import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { format, isPast, formatDistanceToNow } from 'date-fns';
import { ArrowLeft, UserPlus, Trash2, Clock } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext.tsx';
import KanbanBoard from '../features/tasks/KanbanBoard.tsx';
import { useTasks } from '../features/tasks/hooks.ts';
import {
  useProject,
  useUpdateProject,
  useDeleteProject,
  useAddMember,
  useChangeMemberRole,
  useRemoveMember,
} from '../features/projects/hooks.ts';
import { useProjectInvitations } from '../features/invitations/hooks.ts';
import { Button } from '../components/ui/button.tsx';
import { Input } from '../components/ui/input.tsx';
import { Textarea } from '../components/ui/textarea.tsx';
import { Badge } from '../components/ui/badge.tsx';
import { Skeleton } from '../components/ui/skeleton.tsx';
import { Separator } from '../components/ui/separator.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select.tsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog.tsx';

const PROJECT_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#f97316', '#14b8a6'];
function projectColor(id: string) {
  const n = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return PROJECT_COLORS[n % PROJECT_COLORS.length];
}

const settingsSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
});
const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
});
type SettingsFormData = z.infer<typeof settingsSchema>;
type InviteFormData = z.infer<typeof inviteSchema>;

interface Member {
  userId: string;
  name: string;
  email: string;
  role: string;
  isOwner: boolean;
}
interface Project {
  id: string;
  name: string;
  description?: string;
  myRole: string;
  members: Member[];
}
interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string | null;
  assignee?: { id: string; name: string } | null;
}

/* ── Timeline (Gantt-style) ──────────────────────────────── */
function TimelineTab({ projectId }: { projectId: string }) {
  const { data: tasks = [], isLoading } = useTasks(projectId);

  if (isLoading) return <div className="space-y-2">{[1,2,3].map(i=><Skeleton key={i} className="h-10 w-full rounded-lg"/>)}</div>;

  const withDue = (tasks as Task[]).filter((t) => t.dueDate);
  if (withDue.length === 0) return (
    <div className="text-center py-20 text-sm text-muted-foreground border border-dashed border-border rounded-xl">
      No tasks with due dates to display on the timeline.
    </div>
  );

  const dates = withDue.map((t) => new Date(t.dueDate!).getTime());
  const minMs = Math.min(...dates);
  const maxMs = Math.max(...dates);
  const rangeMs = maxMs - minMs || 1;

  const STATUS_COLOR: Record<string, string> = {
    DONE: '#22c55e',
    IN_PROGRESS: '#6366f1',
    TODO: '#9090b8',
  };

  const sorted = [...withDue].sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

  return (
    <div className="overflow-x-auto">
      <div className="min-w-140 space-y-2">
        {/* Header rule */}
        <div className="flex gap-3 items-center mb-4">
          <span className="text-xs text-muted-foreground w-44 shrink-0 font-medium">Task</span>
          <div className="flex-1 relative h-4">
            {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
              const d = new Date(minMs + frac * rangeMs);
              return (
                <span
                  key={frac}
                  className="absolute text-[10px] text-muted-foreground -translate-x-1/2"
                  style={{ left: `${frac * 100}%` }}
                >
                  {format(d, 'MMM d')}
                </span>
              );
            })}
          </div>
        </div>

        {sorted.map((task) => {
          const pct = ((new Date(task.dueDate!).getTime() - minMs) / rangeMs) * 100;
          const color = STATUS_COLOR[task.status] ?? '#888';
          const overdue = isPast(new Date(task.dueDate!)) && task.status !== 'DONE';
          return (
            <div key={task.id} className="flex gap-3 items-center py-1 border-b border-border last:border-0">
              <span className="text-xs text-foreground w-44 shrink-0 truncate font-medium">{task.title}</span>
              <div className="flex-1 relative h-5">
                <div
                  className="absolute h-5 rounded flex items-center px-2"
                  style={{
                    left: `${Math.max(0, pct - 4)}%`,
                    minWidth: '8%',
                    background: color + (overdue ? 'ff' : '33'),
                    borderLeft: `3px solid ${color}`,
                  }}
                >
                  <span className="text-[10px] font-semibold truncate" style={{ color }}>
                    {format(new Date(task.dueDate!), 'MMM d')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        <div className="flex gap-3 mt-4 flex-wrap">
          {Object.entries(STATUS_COLOR).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: v }} />
              {k === 'IN_PROGRESS' ? 'In Progress' : k.charAt(0) + k.slice(1).toLowerCase()}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Calendar ────────────────────────────────────────────── */
function CalendarTab({ projectId }: { projectId: string }) {
  const { data: tasks = [] } = useTasks(projectId);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: { d: number; other: boolean }[] = [];
  const prevDays = new Date(year, month, 0).getDate();
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ d: prevDays - i, other: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ d, other: false });
  const trailing = 7 - (cells.length % 7);
  if (trailing < 7) for (let i = 1; i <= trailing; i++) cells.push({ d: i, other: true });

  const STATUS_COLOR: Record<string, string> = {
    DONE: '#22c55e',
    IN_PROGRESS: '#6366f1',
    TODO: '#9090b8',
  };

  const getTasksForDay = (day: number) =>
    (tasks as Task[]).filter((t) => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="sm" onClick={prevMonth}>←</Button>
        <span className="text-sm font-semibold text-foreground">{MONTHS[month]} {year}</span>
        <Button variant="outline" size="sm" onClick={nextMonth}>→</Button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border border-border">
        {DAYS.map((d) => (
          <div key={d} className="bg-muted py-2 text-center text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
            {d}
          </div>
        ))}
        {cells.map((cell, i) => {
          const dayTasks = cell.other ? [] : getTasksForDay(cell.d);
          const isToday = !cell.other && cell.d === now.getDate() && month === now.getMonth() && year === now.getFullYear();
          return (
            <div
              key={i}
              className={`bg-card min-h-18 p-1.5 ${cell.other ? 'opacity-30' : ''} ${isToday ? 'ring-1 ring-inset ring-primary' : ''}`}
            >
              <span className={`text-xs font-semibold ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                {cell.d}
              </span>
              <div className="mt-0.5 space-y-0.5">
                {dayTasks.slice(0, 2).map((t) => (
                  <div
                    key={t.id}
                    className="text-[10px] px-1 py-0.5 rounded truncate"
                    style={{
                      background: (STATUS_COLOR[t.status] ?? '#888') + '25',
                      borderLeft: `2px solid ${STATUS_COLOR[t.status] ?? '#888'}`,
                      color: STATUS_COLOR[t.status] ?? '#888',
                    }}
                  >
                    {t.title}
                  </div>
                ))}
                {dayTasks.length > 2 && (
                  <span className="text-[10px] text-muted-foreground">+{dayTasks.length - 2}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Members tab ─────────────────────────────────────────── */
function MembersTab({ project, isAdmin }: { project: Project; isAdmin: boolean }) {
  const addMember = useAddMember(project.id);
  const changeMemberRole = useChangeMemberRole(project.id);
  const removeMember = useRemoveMember(project.id);
  const { data: pendingInvitations = [] } = useProjectInvitations(project.id);
  const { user } = useAuth();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<InviteFormData>({ resolver: zodResolver(inviteSchema) });

  const onInvite = async (data: InviteFormData) => {
    try {
      await addMember.mutateAsync(data);
      toast.success(`Invitation sent to ${data.email}`);
      reset();
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { error?: { message?: string } } } };
      if (e.response?.status === 409) toast.error('That user is already a member or has a pending invite');
      else if (e.response?.status === 404) toast.error('No account found with that email');
      else toast.error(e.response?.data?.error?.message || 'Failed to send invitation');
    }
  };

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div>
          <h3 className="text-sm font-medium mb-3">Invite a member</h3>
          <form onSubmit={handleSubmit(onInvite)} className="flex gap-2">
            <div className="flex-1">
              <Input type="email" {...register('email')} placeholder="colleague@example.com" />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              <UserPlus className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Sending…' : 'Invite'}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2">
            The user will receive an invitation they must accept before joining.
          </p>
        </div>
      )}

      {isAdmin && pendingInvitations.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Pending invitations ({pendingInvitations.length})
          </h3>
          <div className="space-y-2">
            {pendingInvitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-2 px-3 rounded-lg border border-dashed border-border bg-muted/30">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{inv.inviteeName}</p>
                  <p className="text-xs text-muted-foreground truncate">{inv.inviteeEmail}</p>
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0 ml-3">
                  expires {formatDistanceToNow(new Date(inv.expiresAt), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium mb-3">Members ({project.members.length})</h3>
        <div className="space-y-2">
          {project.members.map((member) => {
            const initials = member.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
            const canEdit = isAdmin && member.userId !== user?.id && !member.isOwner;
            return (
              <div key={member.userId} className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate">{member.name}</p>
                      {member.isOwner && (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded shrink-0">
                          Owner
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  {canEdit ? (
                    <Select
                      value={member.role}
                      onValueChange={(role: string | null) => {
                        if (!role) return;
                        changeMemberRole.mutateAsync({ userId: member.userId, role })
                          .then(() => toast.success('Role updated'))
                          .catch(() => toast.error('Failed to update role'));
                      }}
                      disabled={changeMemberRole.isPending}
                    >
                      <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="MEMBER">Member</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={member.role === 'ADMIN' ? 'default' : 'secondary'} className="text-xs">
                      {member.role}
                    </Badge>
                  )}
                  {canEdit && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove member?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {member.name} will lose access to this project and all its tasks.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => removeMember.mutateAsync(member.userId)
                              .then(() => toast.success('Member removed'))
                              .catch(() => toast.error('Failed to remove member'))}
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Settings tab ────────────────────────────────────────── */
function SettingsTab({ project }: { project: Project }) {
  const navigate = useNavigate();
  const updateProject = useUpdateProject(project.id);
  const deleteProject = useDeleteProject();
  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty } } =
    useForm<SettingsFormData>({
      resolver: zodResolver(settingsSchema),
      defaultValues: { name: project.name, description: project.description ?? '' },
    });

  const onSave = async (data: SettingsFormData) => {
    try {
      await updateProject.mutateAsync(data);
      toast.success('Project updated');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(e.response?.data?.error?.message || 'Failed to update project');
    }
  };

  const onDelete = async () => {
    try {
      await deleteProject.mutateAsync(project.id);
      toast.success('Project deleted');
      navigate('/projects');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(e.response?.data?.error?.message || 'Failed to delete project');
    }
  };

  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <h3 className="text-sm font-medium mb-4">General</h3>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Project name</label>
            <Input {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Textarea {...register('description')} rows={3} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </div>
      <Separator />
      <div>
        <h3 className="text-sm font-medium text-destructive mb-1">Danger zone</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Deleting a project permanently removes all its tasks and member associations.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete project
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete &quot;{project.name}&quot;?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. All tasks and member associations will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={onDelete}
              >
                Delete project
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

/* ── Skeleton ────────────────────────────────────────────── */
function DetailSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="flex gap-2 mt-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-9 w-20 rounded-lg" />)}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────── */
type Tab = { id: string; label: string; adminOnly?: boolean };
const TABS: Tab[] = [
  { id: 'board', label: 'Board' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'members', label: 'Members' },
  { id: 'settings', label: 'Settings', adminOnly: true },
];

type TabId = 'board' | 'timeline' | 'calendar' | 'members' | 'settings';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>('board');
  const { data: project, isLoading, isError } = useProject(id);

  if (isLoading) return <DetailSkeleton />;
  if (isError) return (
    <div className="p-6 flex flex-col items-center justify-center h-full gap-4">
      <p className="text-destructive text-sm">Failed to load project.</p>
      <Button variant="outline" size="sm" onClick={() => navigate('/projects')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to projects
      </Button>
    </div>
  );

  const isAdmin = project?.myRole === 'ADMIN';
  const col = projectColor(id ?? '');

  const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdmin);

  return (
    <div className="p-6 min-h-full">
      {/* Back link */}
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </button>

      {/* Project header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: col + '22' }}
        >
          <div className="w-3.5 h-3.5 rounded-sm" style={{ background: col }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-foreground">{project.name}</h1>
            <Badge
              variant={isAdmin ? 'default' : 'secondary'}
              className="text-xs shrink-0"
            >
              {project.myRole}
            </Badge>
          </div>
          {project.description && (
            <p className="text-sm text-muted-foreground mt-0.5">{project.description}</p>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit mb-6">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as TabId)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'board' && <KanbanBoard projectId={id!} project={project} />}
      {tab === 'timeline' && <TimelineTab projectId={id!} />}
      {tab === 'calendar' && <CalendarTab projectId={id!} />}
      {tab === 'members' && <MembersTab project={project} isAdmin={isAdmin} />}
      {tab === 'settings' && isAdmin && <SettingsTab project={project} />}
    </div>
  );
}
