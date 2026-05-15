import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Mail, Check, X, FolderOpen } from 'lucide-react';
import { useMyInvitations, useAcceptInvitation, useDeclineInvitation } from '../features/invitations/hooks.ts';
import { Button } from '../components/ui/button.tsx';
import { Skeleton } from '../components/ui/skeleton.tsx';

export default function InvitationsPage() {
  const { data: invitations = [], isLoading } = useMyInvitations();
  const accept = useAcceptInvitation();
  const decline = useDeclineInvitation();

  const handleAccept = async (id: string, projectName: string) => {
    try {
      await accept.mutateAsync(id);
      toast.success(`Joined "${projectName}"`);
    } catch {
      toast.error('Failed to accept invitation');
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await decline.mutateAsync(id);
      toast.success('Invitation declined');
    } catch {
      toast.error('Failed to decline invitation');
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Invitations</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Project invitations waiting for your response
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && invitations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-xl">
          <Mail className="w-8 h-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No pending invitations</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            When someone invites you to a project, it will appear here.
          </p>
        </div>
      )}

      {!isLoading && invitations.length > 0 && (
        <div className="space-y-3">
          {invitations.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FolderOpen className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{inv.projectName}</p>
                  <p className="text-xs text-muted-foreground">
                    Invited by <span className="font-medium text-foreground">{inv.invitedByName}</span>
                    {' · '}expires {formatDistanceToNow(new Date(inv.expiresAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDecline(inv.id)}
                  disabled={decline.isPending}
                  className="h-8 px-3 text-xs"
                >
                  <X className="w-3 h-3 mr-1" />
                  Decline
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAccept(inv.id, inv.projectName)}
                  disabled={accept.isPending}
                  className="h-8 px-3 text-xs"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Accept
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
