import { useState } from 'react';
import { useGetWorkers, useAddWorker, useIsCallerAdmin } from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UserPlus, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function AttendanceTab() {
  const {
    data: workers = [],
    isLoading: workersLoading,
    error: workersError,
    refetch: refetchWorkers,
  } = useGetWorkers();
  const { data: isAdmin = false, isLoading: adminLoading } = useIsCallerAdmin();
  const addWorkerMutation = useAddWorker();

  const [addWorkerOpen, setAddWorkerOpen] = useState(false);
  const [newWorker, setNewWorker] = useState({ name: '', role: '' });

  const isLoading = workersLoading || adminLoading;
  const hasError = workersError;

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorker.name.trim() || !newWorker.role.trim()) return;

    await addWorkerMutation.mutateAsync({
      name: newWorker.name.trim(),
      role: newWorker.role.trim(),
    });

    setNewWorker({ name: '', role: '' });
    setAddWorkerOpen(false);
  };

  const handleRetry = () => {
    refetchWorkers();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <img
                src="/assets/generated/attendance-icon-transparent.dim_64x64.png"
                alt="Attendance"
                className="h-8 w-8"
              />
              Worker Attendance Register
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Unable to Load Attendance Register</AlertTitle>
              <AlertDescription className="mt-2 space-y-2">
                <p>
                  The attendance register could not be loaded. This may be due to a permission issue or connection
                  problem.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={handleRetry}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    If the problem persists, please try logging out and back in, or contact your administrator.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <img
                src="/assets/generated/attendance-icon-transparent.dim_64x64.png"
                alt="Attendance"
                className="h-8 w-8"
              />
              Worker Management
            </CardTitle>
            {isAdmin && (
              <Dialog open={addWorkerOpen} onOpenChange={setAddWorkerOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Worker
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleAddWorker}>
                    <DialogHeader>
                      <DialogTitle>Add New Worker</DialogTitle>
                      <DialogDescription>Enter the worker's details below.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="worker-name">Name</Label>
                        <Input
                          id="worker-name"
                          value={newWorker.name}
                          onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                          placeholder="Enter worker name"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="worker-role">Role</Label>
                        <Input
                          id="worker-role"
                          value={newWorker.role}
                          onChange={(e) => setNewWorker({ ...newWorker, role: e.target.value })}
                          placeholder="e.g., Farm Hand, Supervisor"
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="submit"
                        disabled={addWorkerMutation.isPending || !newWorker.name.trim() || !newWorker.role.trim()}
                      >
                        {addWorkerMutation.isPending ? 'Adding...' : 'Add Worker'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Farm Time Calendar Available</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-3">
                Track worker check-in/check-out times and daily presence using the new <strong>Farm Time</strong> tab.
                The Farm Time calendar provides a month view with detailed time tracking for each worker.
              </p>
              <Button variant="outline" size="sm" onClick={() => {
                const farmTimeTab = document.querySelector('[value="farmTime"]') as HTMLElement;
                farmTimeTab?.click();
              }}>
                Go to Farm Time Calendar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>

          {workers.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {isAdmin
                  ? 'No workers registered yet. Add your first worker to get started.'
                  : 'No workers have been registered yet.'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workers.map((worker) => (
                    <TableRow key={worker.id.toString()}>
                      <TableCell className="font-medium">{worker.name}</TableCell>
                      <TableCell>{worker.role}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
