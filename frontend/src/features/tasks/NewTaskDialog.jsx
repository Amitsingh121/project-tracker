import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { useCreateTask } from './hooks.js';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Textarea } from '../../components/ui/textarea.jsx';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select.jsx';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
});

export default function NewTaskDialog({ projectId, members = [] }) {
  const [open, setOpen] = useState(false);
  const createTask = useCreateTask(projectId);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'MEDIUM' },
  });

  const priority = watch('priority');
  const assigneeId = watch('assigneeId');

  const onSubmit = async (data) => {
    try {
      const payload = {
        title: data.title,
        priority: data.priority,
        ...(data.description && { description: data.description }),
        ...(data.dueDate && { dueDate: new Date(data.dueDate).toISOString() }),
        ...(data.assigneeId && data.assigneeId !== 'none' && { assigneeId: data.assigneeId }),
      };
      await createTask.mutateAsync(payload);
      toast.success('Task created');
      reset({ priority: 'MEDIUM' });
      setOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to create task');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create a new task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title</label>
            <Input {...register('title')} placeholder="What needs to be done?" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Textarea {...register('description')} placeholder="Add more details..." rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Priority</label>
              <Select value={priority} onValueChange={(v) => setValue('priority', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Due date <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                type="date"
                {...register('dueDate')}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {members.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Assignee <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Select
                value={assigneeId || 'none'}
                onValueChange={(v) => setValue('assigneeId', v === 'none' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
