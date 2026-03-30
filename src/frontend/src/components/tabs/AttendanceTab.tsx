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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAddWorker,
  useDeleteWorker,
  useGetWorkerDailyRecords,
  useGetWorkers,
  useIsCallerAdmin,
  useUpdateWorker,
} from "@/hooks/useQueries";
import { Info, Pencil, Plus, Trash2, User, Users } from "lucide-react";
import { useMemo, useState } from "react";

export default function AttendanceTab() {
  const { data: workers = [], isLoading } = useGetWorkers();
  const { data: dailyRecords = [] } = useGetWorkerDailyRecords();
  const { data: isAdmin } = useIsCallerAdmin();
  const addWorkerMutation = useAddWorker();
  const updateWorkerMutation = useUpdateWorker();
  const deleteWorkerMutation = useDeleteWorker();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<bigint | null>(null);
  const [deleteKey, setDeleteKey] = useState("");

  const resetForm = () => {
    setName("");
    setRole("");
    setEditingId(null);
  };

  const handleEdit = (worker: (typeof workers)[0]) => {
    setEditingId(worker.id);
    setName(worker.name);
    setRole(worker.role);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role) return;
    if (editingId !== null) {
      await updateWorkerMutation.mutateAsync({ id: editingId, name, role });
    } else {
      await addWorkerMutation.mutateAsync({ name, role });
    }
    setOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (deleteKey !== "2642" || deleteTargetId === null) return;
    await deleteWorkerMutation.mutateAsync(deleteTargetId);
    setDeleteTargetId(null);
    setDeleteKey("");
  };

  const attendanceSummary = useMemo(() => {
    return workers.map((worker) => {
      const records = dailyRecords.filter((r) => r.workerId === worker.id);
      const totalDays = records.length;
      const daysPresent = records.filter((r) => r.present).length;
      const daysAbsent = totalDays - daysPresent;
      const rate =
        totalDays > 0 ? Math.round((daysPresent / totalDays) * 100) : 0;
      return { worker, totalDays, daysPresent, daysAbsent, rate };
    });
  }, [workers, dailyRecords]);

  const isSaving =
    addWorkerMutation.isPending || updateWorkerMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Workers</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage farm workers and their roles
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            if (!v) resetForm();
            setOpen(v);
          }}
        >
          <DialogTrigger asChild>
            <Button
              className="gap-2"
              onClick={() => {
                resetForm();
                setOpen(true);
              }}
              data-ocid="workers.open_modal_button"
            >
              <Plus className="h-4 w-4" />
              Add Worker
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId !== null ? "Edit Worker" : "Add Worker"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="worker-name">Name</Label>
                <Input
                  id="worker-name"
                  placeholder="Enter worker name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  data-ocid="workers.input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="worker-role">Role</Label>
                <Input
                  id="worker-role"
                  placeholder="e.g. Harvester, Irrigator..."
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    resetForm();
                  }}
                  data-ocid="workers.cancel_button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  data-ocid="workers.submit_button"
                >
                  {isSaving
                    ? "Saving..."
                    : editingId !== null
                      ? "Update Worker"
                      : "Add Worker"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Banner */}
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">
            Attendance Tracking
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Use the <strong>Farm Time</strong> tab to record daily attendance,
            check-in/out times, and view the monthly calendar for each worker.
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-secondary/30 border border-secondary/40 rounded-xl p-4 flex items-center gap-4">
        <div className="bg-secondary/50 rounded-full p-3">
          <Users className="h-6 w-6 text-secondary-foreground" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Workers</p>
          <p className="text-2xl font-bold text-foreground">{workers.length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    Entered By
                  </span>
                </TableHead>
                {isAdmin && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={isAdmin ? 5 : 4}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Loading workers...
                  </TableCell>
                </TableRow>
              ) : workers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isAdmin ? 5 : 4}
                    className="text-center py-8 text-muted-foreground"
                    data-ocid="workers.empty_state"
                  >
                    No workers added yet.
                  </TableCell>
                </TableRow>
              ) : (
                workers.map((worker, idx) => (
                  <TableRow
                    key={worker.id.toString()}
                    className="hover:bg-muted/30"
                    data-ocid={`workers.item.${idx + 1}`}
                  >
                    <TableCell className="text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-medium">{worker.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{worker.role}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {worker.enteredBy || "Unknown"}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(worker)}
                            title="Edit"
                            data-ocid={`workers.edit_button.${idx + 1}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog
                            open={deleteTargetId === worker.id}
                            onOpenChange={(v) => {
                              if (!v) {
                                setDeleteTargetId(null);
                                setDeleteKey("");
                              }
                            }}
                          >
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeleteTargetId(worker.id)}
                                data-ocid={`workers.delete_button.${idx + 1}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent data-ocid="workers.dialog">
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Worker
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Enter the deletion key to confirm. This will
                                  also remove all attendance records for this
                                  worker.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <Input
                                type="password"
                                placeholder="Enter deletion key..."
                                value={deleteKey}
                                onChange={(e) => setDeleteKey(e.target.value)}
                                data-ocid="workers.input"
                              />
                              <AlertDialogFooter>
                                <AlertDialogCancel data-ocid="workers.cancel_button">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDelete}
                                  disabled={
                                    deleteKey !== "2642" ||
                                    deleteWorkerMutation.isPending
                                  }
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  data-ocid="workers.confirm_button"
                                >
                                  {deleteWorkerMutation.isPending
                                    ? "Deleting..."
                                    : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Attendance Summary */}
      {workers.length > 0 && dailyRecords.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            Attendance Summary
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {attendanceSummary.map(
              ({ worker, totalDays, daysPresent, daysAbsent, rate }) => (
                <Card key={worker.id.toString()} data-ocid="workers.card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {worker.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {worker.role}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-bold text-foreground">
                          {totalDays}
                        </p>
                        <p className="text-xs text-muted-foreground">Logged</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-green-600">
                          {daysPresent}
                        </p>
                        <p className="text-xs text-muted-foreground">Present</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-red-500">
                          {daysAbsent}
                        </p>
                        <p className="text-xs text-muted-foreground">Absent</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          Attendance Rate
                        </span>
                        <span className="font-medium">{rate}%</span>
                      </div>
                      <Progress value={rate} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
