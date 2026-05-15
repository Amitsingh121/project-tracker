import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { useUpdateTask, useDeleteTask } from './hooks.ts';
import { Button } from '../../components/ui/button.tsx';
import { Input } from '../../components/ui/input.tsx';
import { Textarea } from '../../components/ui/textarea.tsx';
import { Badge } from '../../components/ui/badge.tsx';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select.tsx';
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
} from '../../components/ui/alert-dialog.tsx';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const PRIORITY_LABELS: Record<string, string> = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High' };
const STATUS_LABELS: Record<string, string> = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };

interface Member {
  userId: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string | null;
  creatorId?: string;
  assigneeId?: string;
  creator?: { id: string; name: string };
  assignee?: { id: string; name: string } | null;
}

interface Project {
  myRole: string;
  members?: Member[];
}

interface User {
  id: string;
}

export default function TaskDetailDialog({
  open,
  onClose,
  task,
  project,
  projectId,
  user,
}: {
  open: boolean;
  onClose: () => void;
  task: Task | null;
  project: Project | null;
  projectId: string;
  user: User | null;
}) {
  const updateTask = useUpdateTask(projectId);
  const deleteTask = useDeleteTask(projectId);

  const isAdmin = project?.myRole === 'ADMIN';
  const isCreator = task?.creator?.id === user?.id;
  const isAssignee = task?.assignee?.id === user?.id;

  const canEditMeta = isAdmin || isCreator;
  const canEditStatus = isAdmin || isAssignee;
  const canEditAssignee = isAdmin;
  const canDelete = isAdmin || isCreator;
  const canEdit = canEditMeta || canEditStatus;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      status: (task?.status as FormData['status']) ?? 'TODO',
      priority: (task?.priority as FormData['priority']) ?? 'MEDIUM',
      dueDate: task?.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
      assigneeId: task?.assignee?.id ?? 'none',
    },
  });

  useEffect(() => {
    if (task) {
      reset({
        title: task.title ?? '',
        description: task.description ?? '',
        status: (task.status as FormData['status']) ?? 'TODO',
        priority: (task.priority as FormData['priority']) ?? 'MEDIUM',
        dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
        assigneeId: task.assignee?.id ?? 'none',
      });
    }
  }, [task, reset]);

  const status = watch('status');
  const priority = watch('priority');
  const assigneeId = watch('assigneeId');

  const onSave = async (data: FormData) => {
    try {
      const payload: Record<string, unknown> = {};
      if (canEditMeta) {
        payload.title = data.title;
        if (data.description !== undefined) payload.description = data.description;
        payload.priority = data.priority;
        if (data.dueDate) payload.dueDate = new Date(data.dueDate).toISOString();
      }
      if (canEditStatus) payload.status = data.status;
      if (canEditAssignee) {
        payload.assigneeId = data.assigneeId === 'none' ? null : data.assigneeId;
      }

      await updateTask.mutateAsync({ taskId: task!.id, data: payload });
      toast.success('Task updated');
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(e.response?.data?.error?.message || 'Failed to update task');
    }
  };

  const onDelete = async () => {
    try {
      await deleteTask.mutateAsync(task!.id);
      toast.success('Task deleted');
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(e.response?.data?.error?.message || 'Failed to delete task');
    }
  };

  if (!task) return null;

  const members = project?.members ?? [];

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="pr-8">
            {canEditMeta ? (
              <Input
                {...register('title')}
                className="text-base font-semibold border-0 p-0 h-auto focus-visible:ring-0"
                placeholder="Task title"
              />
            ) : (
              task.title
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</label>
              {canEditStatus ? (
                <Select value={status} onValueChange={(v) => setValue('status', v as FormData['status'], { shouldDirty: true })}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline">{STATUS_LABELS[task.status]}</Badge>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Priority</label>
              {canEditMeta ? (
                <Select value={priority} onValueChange={(v) => setValue('priority', v as FormData['priority'], { shouldDirty: true })}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline">{PRIORITY_LABELS[task.priority]}</Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Due date</label>
              {canEditMeta ? (
                <Input
                  type="date"
                  {...register('dueDate')}
                  min={new Date().toISOString().split('T')[0]}
                  className="h-8 text-sm"
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '-'}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assignee</label>
              {canEditAssignee ? (
                <Select
                  value={assigneeId || 'none'}
                  onValueChange={(v) => setValue('assigneeId', v ?? '', { shouldDirty: true })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.userId} value={m.userId}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">{task.assignee?.name ?? 'Unassigned'}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</label>
            {canEditMeta ? (
              <Textarea {...register('description')} rows={3} placeholder="Add details..." />
            ) : (
              <p className="text-sm text-muted-foreground min-h-[60px]">
                {task.description || 'No description'}
              </p>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            Created by {task.creator?.name}
          </div>

          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}

          <DialogFooter className="gap-2">
            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className="mr-auto text-destructive hover:text-destructive border-destructive/30">
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                    <AlertDialogDescription>
                      &quot;{task.title}&quot; will be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={onDelete}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            {canEdit && (
              <Button type="submit" disabled={isSubmitting || !isDirty}>
                {isSubmitting ? 'Saving…' : 'Save'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
