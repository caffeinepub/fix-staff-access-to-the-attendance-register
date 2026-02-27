import { useState } from 'react';
import { useListApprovals, useSetApproval } from '@/hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Shield, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { ApprovalStatus } from '@/backend';
import { useQueryClient } from '@tanstack/react-query';

const statusColors: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pending: 'secondary',
  approved: 'default',
  rejected: 'destructive',
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3.5 w-3.5" />,
  approved: <CheckCircle className="h-3.5 w-3.5" />,
  rejected: <XCircle className="h-3.5 w-3.5" />,
};

export default function VerificationTab() {
  const { data: approvals = [], isLoading, refetch } = useListApprovals();
  const setApprovalMutation = useSetApproval();
  const queryClient = useQueryClient();
  const [processingPrincipal, setProcessingPrincipal] = useState<string | null>(null);

  const pending = approvals.filter(a => a.status === ApprovalStatus.pending);
  const others = approvals.filter(a => a.status !== ApprovalStatus.pending);

  const handleApprove = async (principal: string) => {
    setProcessingPrincipal(principal);
    try {
      const { Principal } = await import('@dfinity/principal');
      await setApprovalMutation.mutateAsync({
        user: Principal.fromText(principal),
        status: ApprovalStatus.approved,
      });
      await queryClient.invalidateQueries({ queryKey: ['approvals'] });
    } finally {
      setProcessingPrincipal(null);
    }
  };

  const handleReject = async (principal: string) => {
    setProcessingPrincipal(principal);
    try {
      const { Principal } = await import('@dfinity/principal');
      await setApprovalMutation.mutateAsync({
        user: Principal.fromText(principal),
        status: ApprovalStatus.rejected,
      });
      await queryClient.invalidateQueries({ queryKey: ['approvals'] });
    } finally {
      setProcessingPrincipal(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">User Verification</h2>
          <p className="text-muted-foreground text-sm mt-1">Manage user access and approval requests</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 self-start sm:self-auto">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Pending Requests */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Pending Requests</h3>
          {pending.length > 0 && (
            <Badge variant="secondary" className="ml-1">{pending.length}</Badge>
          )}
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Principal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Loading approval requests...</TableCell>
                  </TableRow>
                ) : pending.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle className="h-8 w-8 text-primary/40" />
                        <span>No pending approval requests</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  pending.map(approval => {
                    const principalStr = approval.principal.toString();
                    const isProcessing = processingPrincipal === principalStr;
                    return (
                      <TableRow key={principalStr} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-xs break-all max-w-xs">{principalStr}</TableCell>
                        <TableCell>
                          <Badge variant={statusColors[approval.status] ?? 'outline'} className="gap-1">
                            {statusIcons[approval.status]}
                            {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {/* Approve */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="default" disabled={isProcessing} className="gap-1">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  Approve
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Approve User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Grant access to this user? They will be able to view all farm data.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleApprove(principalStr)} disabled={isProcessing}>
                                    {isProcessing ? 'Processing...' : 'Approve'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            {/* Reject */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive" disabled={isProcessing} className="gap-1">
                                  <XCircle className="h-3.5 w-3.5" />
                                  Reject
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reject User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Deny access to this user? They will see a rejection message when they log in.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleReject(principalStr)}
                                    disabled={isProcessing}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {isProcessing ? 'Processing...' : 'Reject'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* All Users */}
      {others.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">All Users</h3>
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Principal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {others.map(approval => {
                    const principalStr = approval.principal.toString();
                    const isProcessing = processingPrincipal === principalStr;
                    return (
                      <TableRow key={principalStr} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-xs break-all max-w-xs">{principalStr}</TableCell>
                        <TableCell>
                          <Badge variant={statusColors[approval.status] ?? 'outline'} className="gap-1">
                            {statusIcons[approval.status]}
                            {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {approval.status !== ApprovalStatus.approved && (
                              <Button
                                size="sm"
                                variant="default"
                                disabled={isProcessing}
                                className="gap-1"
                                onClick={() => handleApprove(principalStr)}
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                Approve
                              </Button>
                            )}
                            {approval.status !== ApprovalStatus.rejected && (
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={isProcessing}
                                className="gap-1"
                                onClick={() => handleReject(principalStr)}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Reject
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
