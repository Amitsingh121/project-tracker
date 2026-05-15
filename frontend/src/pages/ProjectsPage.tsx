import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Folder, Users, CheckSquare } from 'lucide-react';
import { useMyProjects, useCreateProject } from '../features/projects/hooks.ts';
import { Button } from '../components/ui/button.tsx';
import { Input } from '../components/ui/input.tsx';
import { Textarea } from '../components/ui/textarea.tsx';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog.tsx';
import { Skeleton } from '../components/ui/skeleton.tsx';

const PROJECT_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#f97316', '#14b8a6'];
function projectColor(id: string) {
  const n = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return PROJECT_COLORS[n % PROJECT_COLORS.length];
}

const createSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
});
type CreateFormData = z.infer<typeof createSchema>;

function NewProjectDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const createProject = useCreateProject();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<CreateFormData>({ resolver: zodResolver(createSchema) });

  const onSubmit = async (data: CreateFormData) => {
    try {
      await createProject.mutateAsync(data);
      toast.success('Project created');
      reset();
      setOpen(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(e.response?.data?.error?.message || 'Failed to create project');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name</label>
            <Input {...register('name')} placeholder="My Awesome Project" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Textarea {...register('description')} placeholder="What is this project about?" rows={3} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface Project {
  id: string;
  name: string;
  description?: string;
  myRole: string;
  taskCount: number;
  memberCount: number;
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const col = projectColor(project.id);
  return (
    <div
      className="bg-card border border-border rounded-xl cursor-pointer hover:border-border/80 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 overflow-hidden relative"
      onClick={onClick}
    >
      {/* Colored top accent */}
      <div className="h-0.75 absolute top-0 left-0 right-0" style={{ background: col }} />

      <div className="p-5 pt-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: col + '22' }}
            >
              <div className="w-3.5 h-3.5 rounded-sm" style={{ background: col }} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{project.name}</p>
              {project.description && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">{project.description}</p>
              )}
            </div>
          </div>
          <span
            className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 ${
              project.myRole === 'ADMIN'
                ? 'bg-primary/15 text-primary'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {project.myRole}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5" />
            {project.taskCount} task{project.taskCount !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {project.memberCount} member{project.memberCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { data: projects, isLoading, isError } = useMyProjects();

  return (
    <div className="p-6 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage and track all your team projects</p>
        </div>
        <NewProjectDialog />
      </div>

      {isError && (
        <div className="text-center py-12 text-sm text-destructive">
          Failed to load projects. Please refresh.
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      )}

      {!isLoading && !isError && (!projects || projects.length === 0) && (
        <div className="text-center py-24 border border-dashed border-border rounded-xl">
          <Folder className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-lg">No projects yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-5">Create your first project to get started.</p>
          <NewProjectDialog
            trigger={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create your first project
              </Button>
            }
          />
        </div>
      )}

      {!isLoading && !isError && projects && projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {(projects as Project[]).map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => navigate(`/projects/${project.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
