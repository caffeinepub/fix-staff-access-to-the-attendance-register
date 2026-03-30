import type { MonthlyGoal } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAddMonthlyGoal,
  useAddPlotEntry,
  useGetDepartments,
  useGetMonthlyGoals,
  useInitializeFixedMonthlyGoals,
} from "@/hooks/useQueries";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Settings,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatDate(nanos: bigint): string {
  const ms = Number(nanos) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusBadge(actual: bigint, target: bigint) {
  const a = Number(actual);
  const t = Number(target);
  if (a >= t) {
    return (
      <Badge className="bg-primary/20 text-primary border-primary/30">
        ✓ Met
      </Badge>
    );
  }
  if (a > 0) {
    return (
      <Badge variant="secondary">
        Partial ({a}/{t})
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      Not Started
    </Badge>
  );
}

interface AddPlotDialogProps {
  open: boolean;
  onClose: () => void;
  currentGoal: MonthlyGoal;
  departments: string[];
}

function AddPlotDialog({
  open,
  onClose,
  currentGoal,
  departments,
}: AddPlotDialogProps) {
  const [plotName, setPlotName] = useState("");
  const [dateActivated, setDateActivated] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [department, setDepartment] = useState("");
  const addPlotEntry = useAddPlotEntry();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plotName.trim() || !dateActivated || !department) return;

    const dateMs = new Date(dateActivated).getTime();
    const dateNanos = BigInt(dateMs) * 1_000_000n;

    await addPlotEntry.mutateAsync({
      monthlyGoalId: currentGoal.id,
      plotName: plotName.trim(),
      dateActivated: dateNanos,
      department,
    });

    setPlotName("");
    setDateActivated(new Date().toISOString().split("T")[0]);
    setDepartment("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Plot Entry</DialogTitle>
          <DialogDescription>
            Record a newly activated plot for{" "}
            {MONTH_NAMES[Number(currentGoal.month) - 1]}{" "}
            {Number(currentGoal.year)}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plotName">Plot Name / Identifier</Label>
            <Input
              id="plotName"
              placeholder="e.g. Plot A3, North Field Block 2"
              value={plotName}
              onChange={(e) => setPlotName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateActivated">Date Activated</Label>
            <Input
              id="dateActivated"
              type="date"
              value={dateActivated}
              onChange={(e) => setDateActivated(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Responsible Department</Label>
            <Select value={department} onValueChange={setDepartment} required>
              <SelectTrigger id="department">
                <SelectValue placeholder="Select department lead" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                addPlotEntry.isPending || !plotName.trim() || !department
              }
            >
              {addPlotEntry.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Add Plot
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function MonthlyPlotGoalTracker() {
  const [addPlotOpen, setAddPlotOpen] = useState(false);
  const { data: goals, isLoading: goalsLoading } = useGetMonthlyGoals();
  const { data: departments } = useGetDepartments();
  const initGoals = useInitializeFixedMonthlyGoals();
  const addMonthlyGoal = useAddMonthlyGoal();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed

  const currentGoal = goals?.find(
    (g) => Number(g.year) === currentYear && Number(g.month) === currentMonth,
  );

  const historicalGoals = (goals ?? [])
    .filter(
      (g) =>
        !(Number(g.year) === currentYear && Number(g.month) === currentMonth),
    )
    .sort((a, b) => {
      const aVal = Number(a.year) * 100 + Number(a.month);
      const bVal = Number(b.year) * 100 + Number(b.month);
      return bVal - aVal;
    });

  const deptNames = (departments ?? []).map((d) => d.leadName);

  const progressPercent = currentGoal
    ? Math.min(
        100,
        (Number(currentGoal.actualPlots) / Number(currentGoal.targetPlots)) *
          100,
      )
    : 0;

  const handleCreateCurrentMonthGoal = async () => {
    await addMonthlyGoal.mutateAsync({
      year: BigInt(currentYear),
      month: BigInt(currentMonth),
      targetPlots: 2n,
    });
  };

  if (goalsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Month Card */}
      <Card className="border-2 border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Current Month: {MONTH_NAMES[currentMonth - 1]} {currentYear}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Monthly plot cultivation target
              </p>
            </div>
            {currentGoal && (
              <Button
                size="sm"
                onClick={() => setAddPlotOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Plot
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!currentGoal ? (
            <div className="text-center py-6 space-y-3">
              <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground text-sm">
                No goal record found for this month.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreateCurrentMonthGoal}
                  disabled={addMonthlyGoal.isPending}
                >
                  {addMonthlyGoal.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Create This Month's Goal
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => initGoals.mutate()}
                  disabled={initGoals.isPending}
                >
                  {initGoals.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  <Settings className="h-4 w-4 mr-2" />
                  Initialize All 2024 Goals
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Progress: {Number(currentGoal.actualPlots)} /{" "}
                    {Number(currentGoal.targetPlots)} plots
                  </span>
                  {Number(currentGoal.actualPlots) >=
                  Number(currentGoal.targetPlots) ? (
                    <span className="flex items-center gap-1 text-primary text-sm font-semibold">
                      <CheckCircle2 className="h-4 w-4" /> Goal Met!
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      {Number(currentGoal.targetPlots) -
                        Number(currentGoal.actualPlots)}{" "}
                      remaining
                    </span>
                  )}
                </div>
                <Progress value={progressPercent} className="h-3" />
              </div>

              {/* Plot Entries Table */}
              {currentGoal.plotEntries.length > 0 ? (
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-foreground">
                    Plots Added This Month
                  </h4>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Plot Name</TableHead>
                          <TableHead>Date Activated</TableHead>
                          <TableHead>Department</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentGoal.plotEntries.map((entry) => (
                          <TableRow
                            key={`${entry.plotName}-${entry.dateActivated}`}
                          >
                            <TableCell className="font-medium">
                              {entry.plotName}
                            </TableCell>
                            <TableCell>
                              {formatDate(entry.dateActivated)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {entry.department}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg bg-muted/20">
                  No plots added yet this month. Click "Add Plot" to record a
                  new plot.
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Historical Goals */}
      {historicalGoals.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Historical Monthly Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month / Year</TableHead>
                    <TableHead className="text-center">Target</TableHead>
                    <TableHead className="text-center">Actual</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historicalGoals.map((goal) => (
                    <TableRow key={goal.id.toString()}>
                      <TableCell className="font-medium">
                        {MONTH_NAMES[Number(goal.month) - 1]}{" "}
                        {Number(goal.year)}
                      </TableCell>
                      <TableCell className="text-center">
                        {Number(goal.targetPlots)}
                      </TableCell>
                      <TableCell className="text-center">
                        {Number(goal.actualPlots)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(goal.actualPlots, goal.targetPlots)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Plot Dialog */}
      {currentGoal && (
        <AddPlotDialog
          open={addPlotOpen}
          onClose={() => setAddPlotOpen(false)}
          currentGoal={currentGoal}
          departments={deptNames}
        />
      )}
    </div>
  );
}
