import { useState } from 'react';
import { isPast, format } from 'date-fns';
import { Search } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '../auth/AuthContext.tsx';
import { useTasks, useUpdateTask } from './hooks.ts';
import * as tasksApi from '../../api/tasks.ts';
import { Button } from '../../components/ui/button.tsx';
import { Input } from '../../components/ui/input.tsx';
import { Skeleton } from '../../components/ui/skeleton.tsx';
import NewTaskDialog from './NewTaskDialog.tsx';
import TaskDetailDialog from './TaskDetailDialog.tsx';

const COLUMNS = [
  { status: 'TODO', label: 'To Do', dot: 'bg-slate-400' },
  { status: 'IN_PROGRESS', label: 'In Progress', dot: 'bg-blue-500' },
  { status: 'DONE', label: 'Done', dot: 'bg-green-500' },
] as const;

const PRIORITY_STYLES: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600 border-slate-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  HIGH: 'bg-red-50 text-red-700 border-red-200',
};

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string | null;
  creator?: { id: string; name: string };
  assignee?: { id: string; name: string } | null;
}

interface Member {
  userId: string;
  name: string;
  email: string;
  role: string;
}

interface Project {
  myRole: string;
  members?: Member[];
}

function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${PRIORITY_STYLES[priority]}`}>
      {priority}
    </span>
  );
}

function TaskCardContent({ task }: { task: Task }) {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'DONE';
  return (
    <>
      <p className="text-sm font-medium leading-snug line-clamp-2 mb-2">{task.title}</p>
      <div className="flex items-center justify-between gap-2">
        <PriorityBadge priority={task.priority} />
        {task.dueDate && (
          <span className={`text-[11px] ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
            {isOverdue ? '⚠ ' : ''}{format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}
      </div>
      {task.assignee && (
        <p className="text-[11px] text-muted-foreground mt-1.5 truncate">{task.assignee.name}</p>
      )}
    </>
  );
}

function DraggableTaskCard({
  task,
  project,
  projectId,
  user,
  canDrag,
}: {
  task: Task;
  project: Project | null;
  projectId: string;
  user: { id: string } | null;
  canDrag: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
    disabled: !canDrag,
  });

  return (
    <>
      <div
        ref={setNodeRef}
        {...(canDrag ? listeners : {})}
        {...attributes}
        onClick={() => !isDragging && setOpen(true)}
        className={`bg-card border border-border rounded-md p-3 cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all select-none ${isDragging ? 'opacity-40' : ''}`}
      >
        <TaskCardContent task={task} />
      </div>
      <TaskDetailDialog
        open={open}
        onClose={() => setOpen(false)}
        task={task}
        project={project}
        projectId={projectId}
        user={user}
      />
    </>
  );
}

function DroppableColumn({
  status,
  label,
  dot,
  children,
  count,
}: {
  status: string;
  label: string;
  dot: string;
  children: React.ReactNode;
  count: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div ref={setNodeRef} className={`min-h-[200px] rounded-lg transition-colors ${isOver ? 'bg-primary/5' : ''}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full ${dot}`} />
        <h3 className="text-sm font-semibold">{label}</h3>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 ml-auto">{count}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function KanbanSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[1, 2, 3].map((col) => (
        <div key={col} className="space-y-2">
          <Skeleton className="h-5 w-24 mb-3" />
          {[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-md" />)}
        </div>
      ))}
    </div>
  );
}

export default function KanbanBoard({ projectId, project }: { projectId: string; project: Project | null }) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const qc = useQueryClient();
  const { data: tasks = [], isLoading, isError } = useTasks(projectId);
  useUpdateTask(projectId);

  const isAdmin = project?.myRole === 'ADMIN';

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const filtered = (tasks as Task[]).filter((task) => {
    if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (priorityFilter && task.priority !== priorityFilter) return false;
    return true;
  });

  const grouped: Record<string, Task[]> = {
    TODO: filtered.filter((t) => t.status === 'TODO'),
    IN_PROGRESS: filtered.filter((t) => t.status === 'IN_PROGRESS'),
    DONE: filtered.filter((t) => t.status === 'DONE'),
  };

  const canDragTask = (task: Task) => {
    if (isAdmin) return true;
    return task.assignee?.id === user?.id;
  };

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveTask((tasks as Task[]).find((t) => t.id === active.id) ?? null);
  };

  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveTask(null);
    if (!over) return;

    const task = (tasks as Task[]).find((t) => t.id === active.id);
    const newStatus = over.id as string;

    if (!task || task.status === newStatus) return;

    const oldTasks = qc.getQueryData(['tasks', projectId]);
    qc.setQueryData(['tasks', projectId], (prev: Task[] | undefined) =>
      prev?.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)) ?? prev,
    );

    try {
      await tasksApi.updateTask(task.id, { status: newStatus });
    } catch (err: unknown) {
      qc.setQueryData(['tasks', projectId], oldTasks);
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(e.response?.data?.error?.message || 'Could not move task');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search tasks…"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="pl-8 h-8 w-52 text-sm"
          />
        </div>
        <div className="flex gap-1">
          {[
            { value: '', label: 'All' },
            { value: 'HIGH', label: 'High' },
            { value: 'MEDIUM', label: 'Medium' },
            { value: 'LOW', label: 'Low' },
          ].map(({ value, label }) => (
            <Button
              key={value}
              variant={priorityFilter === value ? 'default' : 'outline'}
              size="sm"
              className="h-8 text-xs px-2.5"
              onClick={() => setPriorityFilter(value)}
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="ml-auto">
          <NewTaskDialog projectId={projectId} members={project?.members ?? []} />
        </div>
      </div>

      {isError && <div className="text-center py-8 text-sm text-destructive">Failed to load tasks.</div>}
      {isLoading && <KanbanSkeleton />}

      {!isLoading && !isError && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="grid grid-cols-3 gap-4">
            {COLUMNS.map((col) => (
              <DroppableColumn key={col.status} {...col} count={grouped[col.status].length}>
                {grouped[col.status].map((task) => (
                  <DraggableTaskCard
                    key={task.id}
                    task={task}
                    project={project}
                    projectId={projectId}
                    user={user}
                    canDrag={canDragTask(task)}
                  />
                ))}
                {grouped[col.status].length === 0 && !search && !priorityFilter && (
                  <div className="text-center py-8 text-xs text-muted-foreground border border-dashed border-border rounded-md">
                    No tasks
                  </div>
                )}
              </DroppableColumn>
            ))}
          </div>

          <DragOverlay>
            {activeTask && (
              <div className="bg-card border border-primary/40 rounded-md p-3 shadow-lg w-64 rotate-2">
                <TaskCardContent task={activeTask} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
