import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, UserPlus, Trash2 } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext.jsx';
import KanbanBoard from '../features/tasks/KanbanBoard.jsx';
import {
  useProject,
  useUpdateProject,
  useDeleteProject,
  useAddMember,
  useChangeMemberRole,
  useRemoveMember,
} from '../features/projects/hooks.js';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Textarea } from '../components/ui/textarea.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Skeleton } from '../components/ui/skeleton.jsx';
import { Separator } from '../components/ui/separator.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select.jsx';
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
} from '../components/ui/alert-dialog.jsx';

const settingsSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
});

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
});

function MembersTab({ project, isAdmin }) {
  const addMember = useAddMember(project.id);
  const changeMemberRole = useChangeMemberRole(project.id);
  const removeMember = useRemoveMember(project.id);
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(inviteSchema) });

  const onInvite = async (data) => {
    try {
      await addMember.mutateAsync(data);
      toast.success(`${data.email} added to the project`);
      reset();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to add member';
      if (err.response?.status === 409) {
        toast.error('That user is already a member');
      } else if (err.response?.status === 404) {
        toast.error('No user found with that email address');
      } else {
        toast.error(msg);
      }
    }
  };

  const onRoleChange = async (userId, role) => {
    try {
      await changeMemberRole.mutateAsync({ userId, role });
      toast.success('Role updated');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update role');
    }
  };

  const onRemove = async (userId) => {
    try {
      await removeMember.mutateAsync(userId);
      toast.success('Member removed');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to remove member');
    }
  };

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div>
          <h3 className="text-sm font-medium mb-3">Invite a member</h3>
          <form onSubmit={handleSubmit(onInvite)} className="flex gap-2">
            <div className="flex-1">
              <Input
                type="email"
                {...register('email')}
                placeholder="colleague@example.com"
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>
            <Button type="submit" disabled={isSubmitting}>
              <UserPlus className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Inviting…' : 'Invite'}
            </Button>
          </form>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium mb-3">
          Members ({project.members.length})
        </h3>
        <div className="space-y-2">
          {project.members.map((member) => (
            <div
              key={member.userId}
              className="flex items-center justify-between py-2.5 px-3 rounded-md border border-border"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{member.name}</p>
                <p className="text-xs text-muted-foreground truncate">{member.email}</p>
              </div>
              <div className="flex items-center gap-2 ml-3 shrink-0">
                {isAdmin && member.userId !== user?.id ? (
                  <Select
                    value={member.role}
                    onValueChange={(role) => onRoleChange(member.userId, role)}
                    disabled={changeMemberRole.isPending}
                  >
                    <SelectTrigger className="h-7 w-24 text-xs">
                      <SelectValue />
                    </SelectTrigger>
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
                {isAdmin && member.userId !== user?.id && (
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
                          onClick={() => onRemove(member.userId)}
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ project }) {
  const navigate = useNavigate();
  const updateProject = useUpdateProject(project.id);
  const deleteProject = useDeleteProject();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: { name: project.name, description: project.description ?? '' },
  });

  const onSave = async (data) => {
    try {
      await updateProject.mutateAsync(data);
      toast.success('Project updated');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update project');
    }
  };

  const onDelete = async () => {
    try {
      await deleteProject.mutateAsync(project.id);
      toast.success('Project deleted');
      navigate('/projects');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete project');
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
              Description{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Textarea {...register('description')} rows={3} />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
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
                This action cannot be undone. All tasks and member associations will be permanently
                deleted.
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

function DetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="flex gap-2 mt-6">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
      </div>
      <div className="space-y-3 mt-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading, isError } = useProject(id);

  if (isLoading) return <DetailSkeleton />;

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load project.</p>
          <Button variant="outline" onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to projects
          </Button>
        </div>
      </div>
    );
  }

  const isAdmin = project?.myRole === 'ADMIN';

  const tabs = [
    { value: 'tasks', label: 'Tasks' },
    { value: 'members', label: 'Members' },
    ...(isAdmin ? [{ value: 'settings', label: 'Settings' }] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-8">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to projects
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <Badge variant={isAdmin ? 'default' : 'secondary'}>{project.myRole}</Badge>
          </div>
          {project.description && (
            <p className="text-muted-foreground text-sm">{project.description}</p>
          )}
        </div>

        <Tabs defaultValue="tasks">
          <TabsList className="mb-6">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="tasks">
            <KanbanBoard projectId={id} project={project} />
          </TabsContent>

          <TabsContent value="members">
            <MembersTab project={project} isAdmin={isAdmin} />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="settings">
              <SettingsTab project={project} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
