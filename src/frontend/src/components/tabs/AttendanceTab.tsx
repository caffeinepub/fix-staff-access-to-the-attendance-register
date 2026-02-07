import { useState, useMemo } from 'react';
import {
  useGetWorkers,
  useAddWorker,
  useGetAttendanceRecords,
  useMarkAttendance,
  useIsCallerAdmin,
} from '../../hooks/useQueries';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UserPlus, Calendar, Search, AlertCircle, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Variant_onLeave_present_late_absent } from '../../backend';

export default function AttendanceTab() {
  const {
    data: workers = [],
    isLoading: workersLoading,
    error: workersError,
    refetch: refetchWorkers,
  } = useGetWorkers();
  const {
    data: attendanceRecords = [],
    isLoading: attendanceLoading,
    error: attendanceError,
    refetch: refetchAttendance,
  } = useGetAttendanceRecords();
  const { data: isAdmin = false, isLoading: adminLoading } = useIsCallerAdmin();
  const addWorkerMutation = useAddWorker();
  const markAttendanceMutation = useMarkAttendance();

  const [addWorkerOpen, setAddWorkerOpen] = useState(false);
  const [markAttendanceOpen, setMarkAttendanceOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [newWorker, setNewWorker] = useState({ name: '', role: '' });
  const [attendanceForm, setAttendanceForm] = useState({
    workerId: '',
    date: new Date().toISOString().split('T')[0],
    status: Variant_onLeave_present_late_absent.present,
  });

  const isLoading = workersLoading || attendanceLoading || adminLoading;
  const hasError = workersError || attendanceError;

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

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendanceForm.workerId) return;

    const dateObj = new Date(attendanceForm.date);
    const nanoSeconds = BigInt(dateObj.getTime()) * BigInt(1000000);

    await markAttendanceMutation.mutateAsync({
      workerId: BigInt(attendanceForm.workerId),
      date: nanoSeconds,
      status: attendanceForm.status,
    });

    setAttendanceForm({
      workerId: '',
      date: new Date().toISOString().split('T')[0],
      status: Variant_onLeave_present_late_absent.present,
    });
    setMarkAttendanceOpen(false);
  };

  const handleRetry = () => {
    refetchWorkers();
    refetchAttendance();
  };

  const enrichedAttendance = useMemo(() => {
    return attendanceRecords.map((record) => {
      const worker = workers.find((w) => w.id === record.workerId);
      return {
        ...record,
        workerName: worker?.name || 'Unknown',
        workerRole: worker?.role || 'Unknown',
      };
    });
  }, [attendanceRecords, workers]);

  const filteredAttendance = useMemo(() => {
    return enrichedAttendance
      .filter((record) => {
        const matchesSearch =
          record.workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.workerRole.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => Number(b.date - a.date));
  }, [enrichedAttendance, searchTerm, filterStatus]);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      present: { variant: 'default' as const, label: 'Present' },
      absent: { variant: 'destructive' as const, label: 'Absent' },
      late: { variant: 'secondary' as const, label: 'Late' },
      onLeave: { variant: 'outline' as const, label: 'On Leave' },
    };
    const config = statusMap[status as keyof typeof statusMap] || statusMap.present;
    return <Badge variant={config.variant}>{config.label}</Badge>;
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
              Worker Attendance Register
            </CardTitle>
            {isAdmin && (
              <div className="flex gap-2">
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

                <Dialog open={markAttendanceOpen} onOpenChange={setMarkAttendanceOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Calendar className="mr-2 h-4 w-4" />
                      Mark Attendance
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleMarkAttendance}>
                      <DialogHeader>
                        <DialogTitle>Mark Attendance</DialogTitle>
                        <DialogDescription>Record worker attendance for a specific date.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="attendance-worker">Worker</Label>
                          <Select
                            value={attendanceForm.workerId}
                            onValueChange={(value) =>
                              setAttendanceForm({ ...attendanceForm, workerId: value })
                            }
                          >
                            <SelectTrigger id="attendance-worker">
                              <SelectValue placeholder="Select worker" />
                            </SelectTrigger>
                            <SelectContent>
                              {workers.map((worker) => (
                                <SelectItem key={worker.id.toString()} value={worker.id.toString()}>
                                  {worker.name} - {worker.role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="attendance-date">Date</Label>
                          <Input
                            id="attendance-date"
                            type="date"
                            value={attendanceForm.date}
                            onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="attendance-status">Status</Label>
                          <Select
                            value={attendanceForm.status}
                            onValueChange={(value) =>
                              setAttendanceForm({
                                ...attendanceForm,
                                status: value as Variant_onLeave_present_late_absent,
                              })
                            }
                          >
                            <SelectTrigger id="attendance-status">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={Variant_onLeave_present_late_absent.present}>Present</SelectItem>
                              <SelectItem value={Variant_onLeave_present_late_absent.absent}>Absent</SelectItem>
                              <SelectItem value={Variant_onLeave_present_late_absent.late}>Late</SelectItem>
                              <SelectItem value={Variant_onLeave_present_late_absent.onLeave}>On Leave</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="submit"
                          disabled={markAttendanceMutation.isPending || !attendanceForm.workerId}
                        >
                          {markAttendanceMutation.isPending ? 'Marking...' : 'Mark Attendance'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by worker name or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value={Variant_onLeave_present_late_absent.present}>Present</SelectItem>
                <SelectItem value={Variant_onLeave_present_late_absent.absent}>Absent</SelectItem>
                <SelectItem value={Variant_onLeave_present_late_absent.late}>Late</SelectItem>
                <SelectItem value={Variant_onLeave_present_late_absent.onLeave}>On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredAttendance.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {attendanceRecords.length === 0
                  ? isAdmin
                    ? 'No attendance records yet. Start by marking attendance for your workers.'
                    : 'No attendance records available yet.'
                  : 'No attendance records match your search criteria.'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendance.map((record) => (
                    <TableRow key={record.id.toString()}>
                      <TableCell className="font-medium">{record.workerName}</TableCell>
                      <TableCell>{record.workerRole}</TableCell>
                      <TableCell>
                        {new Date(Number(record.date) / 1000000).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {workers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Registered Workers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Total Records</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workers.map((worker) => {
                    const workerRecords = attendanceRecords.filter((r) => r.workerId === worker.id);
                    return (
                      <TableRow key={worker.id.toString()}>
                        <TableCell className="font-medium">{worker.name}</TableCell>
                        <TableCell>{worker.role}</TableCell>
                        <TableCell className="text-right">{workerRecords.length}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
