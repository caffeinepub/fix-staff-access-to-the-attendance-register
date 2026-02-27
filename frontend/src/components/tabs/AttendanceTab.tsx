import { useState } from 'react';
import { useGetWorkers, useAddWorker } from '@/hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Info, User } from 'lucide-react';

export default function AttendanceTab() {
  const { data: workers = [], isLoading } = useGetWorkers();
  const addWorkerMutation = useAddWorker();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');

  const resetForm = () => {
    setName('');
    setRole('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role) return;
    await addWorkerMutation.mutateAsync({ name, role });
    setOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Workers</h2>
          <p className="text-muted-foreground text-sm mt-1">Manage farm workers and their roles</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Worker
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Worker</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="worker-name">Name</Label>
                <Input
                  id="worker-name"
                  placeholder="Enter worker name..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="worker-role">Role</Label>
                <Input
                  id="worker-role"
                  placeholder="e.g. Harvester, Irrigator..."
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
                <Button type="submit" disabled={addWorkerMutation.isPending}>
                  {addWorkerMutation.isPending ? 'Saving...' : 'Add Worker'}
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
          <p className="text-sm font-medium text-foreground">Attendance Tracking</p>
          <p className="text-sm text-muted-foreground mt-1">
            Use the <strong>Farm Time</strong> tab to record daily attendance, check-in/out times, and view the monthly calendar for each worker.
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
                  <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />Entered By</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading workers...</TableCell>
                </TableRow>
              ) : workers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No workers added yet.</TableCell>
                </TableRow>
              ) : (
                workers.map((worker, idx) => (
                  <TableRow key={worker.id.toString()} className="hover:bg-muted/30">
                    <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{worker.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{worker.role}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {worker.enteredBy || 'Unknown'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
