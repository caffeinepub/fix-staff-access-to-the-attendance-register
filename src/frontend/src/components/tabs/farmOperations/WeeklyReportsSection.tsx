import type { Department, WeeklyReport } from "@/backend";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useGetDepartments,
  useGetWeeklyReports,
  useSubmitWeeklyReport,
} from "@/hooks/useQueries";
import {
  AlertTriangle,
  CalendarDays,
  FileText,
  Loader2,
  Plus,
  Trophy,
} from "lucide-react";
import { useState } from "react";

function formatDate(nanos: bigint): string {
  const ms = Number(nanos) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Returns the next Saturday from today */
function getNextSaturday(): string {
  const today = new Date();
  const day = today.getDay(); // 0=Sun, 6=Sat
  const daysUntilSat = day === 6 ? 0 : 6 - day;
  const sat = new Date(today);
  sat.setDate(today.getDate() + daysUntilSat);
  return sat.toISOString().split("T")[0];
}

interface SubmitReportDialogProps {
  open: boolean;
  onClose: () => void;
  departments: Department[];
}

function SubmitReportDialog({
  open,
  onClose,
  departments,
}: SubmitReportDialogProps) {
  const [departmentName, setDepartmentName] = useState("");
  const [departmentLead, setDepartmentLead] = useState("");
  const [weekEnding, setWeekEnding] = useState(getNextSaturday());
  const [achievements, setAchievements] = useState("");
  const [challenges, setChallenges] = useState("");
  const [planForNextWeek, setPlanForNextWeek] = useState("");
  const submitReport = useSubmitWeeklyReport();

  const handleDepartmentChange = (value: string) => {
    setDepartmentName(value);
    const dept = departments.find((d) => d.name === value);
    if (dept) setDepartmentLead(dept.leadName);
  };

  const handleClose = () => {
    setDepartmentName("");
    setDepartmentLead("");
    setWeekEnding(getNextSaturday());
    setAchievements("");
    setChallenges("");
    setPlanForNextWeek("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !departmentName ||
      !departmentLead ||
      !weekEnding ||
      !achievements ||
      !challenges ||
      !planForNextWeek
    )
      return;

    const dateMs = new Date(weekEnding).getTime();
    const dateNanos = BigInt(dateMs) * 1_000_000n;

    await submitReport.mutateAsync({
      departmentLead,
      departmentName,
      weekEnding: dateNanos,
      achievements,
      challenges,
      planForNextWeek,
    });

    handleClose();
  };

  const isValid =
    departmentName &&
    departmentLead &&
    weekEnding &&
    achievements.trim() &&
    challenges.trim() &&
    planForNextWeek.trim();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Weekly Report</DialogTitle>
          <DialogDescription>
            Complete all three sections of your weekly update for the
            department.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dept-select">Department</Label>
              <Select
                value={departmentName}
                onValueChange={handleDepartmentChange}
                required
              >
                <SelectTrigger id="dept-select">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.name} value={d.name}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept-lead">Department Lead</Label>
              <Input
                id="dept-lead"
                value={departmentLead}
                onChange={(e) => setDepartmentLead(e.target.value)}
                placeholder="Auto-filled from department"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="week-ending">Week Ending Date</Label>
            <Input
              id="week-ending"
              type="date"
              value={weekEnding}
              onChange={(e) => setWeekEnding(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="achievements" className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              1. Achievements This Week
            </Label>
            <Textarea
              id="achievements"
              placeholder="Include measurable outputs such as beds prepared, seedlings transplanted, area weeded/harvested, produce volume, etc."
              value={achievements}
              onChange={(e) => setAchievements(e.target.value)}
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              Include measurable outputs: beds prepared, seedlings transplanted,
              area weeded/harvested, volume of produce, etc.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="challenges" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              2. Challenges Encountered This Week
            </Label>
            <Textarea
              id="challenges"
              placeholder="Any constraints, delays, equipment issues, weather impacts, labour shortages, input problems, or other obstacles..."
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-blue-500" />
              3. Plan for the Coming Week
            </Label>
            <Textarea
              id="plan"
              placeholder="Specific priorities, targets, required support/resources, and any anticipated risks..."
              value={planForNextWeek}
              onChange={(e) => setPlanForNextWeek(e.target.value)}
              rows={3}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitReport.isPending || !isValid}>
              {submitReport.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Submit Report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ReportCard({
  report,
  index,
}: { report: WeeklyReport; index: number }) {
  return (
    <AccordionItem
      value={`report-${index}`}
      className="border rounded-lg px-0 overflow-hidden"
    >
      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 [&[data-state=open]]:bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-left w-full pr-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary shrink-0" />
            <span className="font-semibold text-sm">
              {report.departmentName}
            </span>
          </div>
          <Badge variant="secondary" className="w-fit text-xs">
            {report.departmentLead}
          </Badge>
          <span className="text-xs text-muted-foreground sm:ml-auto">
            Week ending: {formatDate(report.weekEnding)}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 pt-2">
        <div className="space-y-4">
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-1">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-primary">
              <Trophy className="h-4 w-4" /> Achievements This Week
            </h4>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {report.achievements}
            </p>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800 p-3 space-y-1">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" /> Challenges Encountered This
              Week
            </h4>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {report.challenges}
            </p>
          </div>
          <div className="rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-800 p-3 space-y-1">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <CalendarDays className="h-4 w-4" /> Plan for the Coming Week
            </h4>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {report.planForNextWeek}
            </p>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export default function WeeklyReportsSection() {
  const [submitOpen, setSubmitOpen] = useState(false);
  const { data: reports, isLoading: reportsLoading } = useGetWeeklyReports();
  const { data: departments } = useGetDepartments();

  const sortedReports = [...(reports ?? [])].sort(
    (a, b) => Number(b.weekEnding) - Number(a.weekEnding),
  );

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Weekly Department Reports
          </h3>
          <p className="text-sm text-muted-foreground">
            Submit every Saturday — achievements, challenges, and next week's
            plan.
          </p>
        </div>
        <Button
          onClick={() => setSubmitOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Submit Report
        </Button>
      </div>

      {/* Reports List */}
      {reportsLoading ? (
        <div className="space-y-3">
          {["a", "b", "c"].map((k) => (
            <Skeleton key={k} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : sortedReports.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">
              No weekly reports submitted yet.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Department leads should submit their first report by this
              Saturday.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setSubmitOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Submit First Report
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="space-y-2">
          {sortedReports.map((report, idx) => (
            <ReportCard
              key={`${report.departmentName}-${report.weekEnding}`}
              report={report}
              index={idx}
            />
          ))}
        </Accordion>
      )}

      {/* Submit Dialog */}
      <SubmitReportDialog
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        departments={departments ?? []}
      />
    </div>
  );
}
