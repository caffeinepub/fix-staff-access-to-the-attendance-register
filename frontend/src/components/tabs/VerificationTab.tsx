import { useState } from 'react';
import { CheckCircle, XCircle, Clock, Users, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
} from '@/components/ui/alert-dialog';
import { useListApprovals, useSetApproval } from '../../hooks/useQueries';
import { ApprovalStatus, type UserApprovalInfo } from '../../backend';
import { Principal } from '@dfinity/principal';
import { Skeleton } from '@/components/ui/skeleton';

function truncatePrincipal(principal: Principal): string {
  const text = principal.toText();
  if (text.length <= 20) return text;
  return `${text.slice(0, 10)}...${text.slice(-6)}`;
}

function StatusBadge({ status }: { status: ApprovalStatus }) {
  if (status === ApprovalStatus.approved) {
    return (
      <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
        <CheckCircle className="w-3 h-3 mr-1" />
        Approved
      </Badge>
    );
  }
  if (status === ApprovalStatus.rejected) {
    return (
      <Badge variant="destructive" className="opacity-80">
        <XCircle className="w-3 h-3 mr-1" />
        Rejected
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-amber-400 text-amber-600 dark:text-amber-400">
      <Clock className="w-3 h-3 mr-1" />
      Pending
    </Badge>
  );
}

function UserRow({ info, onApprove, onReject, isLoading }: {
  info: UserApprovalInfo;
  onApprove: (principal: Principal) => void;
  onReject: (principal: Principal) => void;
  isLoading: boolean;
}) {
  return (
    <TableRow>
      <TableCell className="font-mono text-xs text-muted-foreground">
        <span title={info.principal.toText()}>
          {truncatePrincipal(info.principal)}
        </span>
      </TableCell>
      <TableCell>
        <StatusBadge status={info.status} />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          {info.status !== ApprovalStatus.approved && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="default"
                  disabled={isLoading}
                  className="h-7 px-3 text-xs"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Approve
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Approve User</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to approve this user? They will gain full access to the farm management dashboard.
                    <br /><br />
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                      {info.principal.toText()}
                    </span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onApprove(info.principal)}>
                    Approve
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {info.status !== ApprovalStatus.rejected && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isLoading}
                  className="h-7 px-3 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Reject
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reject User</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to reject this user? They will not be able to access the farm management dashboard.
                    <br /><br />
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                      {info.principal.toText()}
                    </span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onReject(info.principal)}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Reject
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function VerificationTab() {
  const { data: approvals, isLoading, error } = useListApprovals();
  const { mutate: setApproval, isPending } = useSetApproval();
  const [processingPrincipal, setProcessingPrincipal] = useState<string | null>(null);

  const handleApprove = (principal: Principal) => {
    setProcessingPrincipal(principal.toText());
    setApproval(
      { user: principal, status: ApprovalStatus.approved },
      { onSettled: () => setProcessingPrincipal(null) }
    );
  };

  const handleReject = (principal: Principal) => {
    setProcessingPrincipal(principal.toText());
    setApproval(
      { user: principal, status: ApprovalStatus.rejected },
      { onSettled: () => setProcessingPrincipal(null) }
    );
  };

  const pendingUsers = approvals?.filter(a => a.status === ApprovalStatus.pending) ?? [];
  const otherUsers = approvals?.filter(a => a.status !== ApprovalStatus.pending) ?? [];

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">Failed to load user approvals. You may not have admin access.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>User Verification</CardTitle>
              <CardDescription>
                Review and approve new users requesting access to the farm management system.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Pending Users */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Pending Approval
              {pendingUsers.length > 0 && (
                <Badge variant="outline" className="border-amber-400 text-amber-600 dark:text-amber-400 ml-1">
                  {pendingUsers.length}
                </Badge>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No pending approval requests</p>
              <p className="text-muted-foreground/60 text-xs mt-1">
                New users who request access will appear here.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Principal ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map(info => (
                  <UserRow
                    key={info.principal.toText()}
                    info={info}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    isLoading={isPending && processingPrincipal === info.principal.toText()}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* All Users */}
      {!isLoading && otherUsers.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              All Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Principal ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {otherUsers.map(info => (
                  <UserRow
                    key={info.principal.toText()}
                    info={info}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    isLoading={isPending && processingPrincipal === info.principal.toText()}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
