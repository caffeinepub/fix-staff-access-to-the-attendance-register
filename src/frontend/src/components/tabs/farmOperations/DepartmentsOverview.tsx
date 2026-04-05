import type { Department, WeeklyReport } from "@/backend";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useGetDepartments, useSubmitWeeklyReport } from "@/hooks/useQueries";
import {
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Droplets,
  Info,
  Loader2,
  PlusCircle,
  Scissors,
  Shovel,
  Sprout,
} from "lucide-react";
import { useMemo, useState } from "react";

const DEPT_ICONS: Record<string, React.ReactNode> = {
  Goodnews: <Sprout className="h-6 w-6 text-primary" />,
  Nicholas: <Droplets className="h-6 w-6 text-primary" />,
  Elvis: <Scissors className="h-6 w-6 text-primary" />,
  Wisdom: <Shovel className="h-6 w-6 text-primary" />,
};

const DEPT_COLORS: Record<string, string> = {
  Goodnews:
    "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800",
  Nicholas:
    "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
  Elvis:
    "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
  Wisdom:
    "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800",
};

function getCurrentWeekRange(): { sunday: Date; saturday: Date } {
  const now = new Date();
  const day = now.getDay();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - day);
  sunday.setHours(0, 0, 0, 0);
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  saturday.setHours(23, 59, 59, 999);
  return { sunday, saturday };
}

function useWeeklySubmissionStatus(allReports: WeeklyReport[]) {
  return useMemo(() => {
    const { sunday, saturday } = getCurrentWeekRange();
    const submitted = new Set<string>();
    for (const r of allReports) {
      const ms = Number(r.weekEnding) / 1_000_000;
      const d = new Date(ms);
      if (d >= sunday && d <= saturday) {
        submitted.add(r.departmentLead);
      }
    }
    return submitted;
  }, [allReports]);
}

function DepartmentCard({
  dept,
  onClick,
  ocid,
  submittedThisWeek,
}: {
  dept: Department;
  onClick: () => void;
  ocid: string;
  submittedThisWeek: boolean;
}) {
  const icon = DEPT_ICONS[dept.leadName] ?? (
    <Sprout className="h-6 w-6 text-primary" />
  );
  const colorClass = DEPT_COLORS[dept.leadName] ?? "";

  return (
    <Card
      data-ocid={ocid}
      className={`border-2 ${colorClass} transition-all hover:shadow-md hover:scale-[1.01] cursor-pointer active:scale-[0.99]`}
      onClick={onClick}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-background/80 shadow-sm">
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg font-bold">
                {dept.leadName}
              </CardTitle>
              <div className="flex flex-wrap gap-1.5 mt-1">
                <Badge variant="secondary" className="text-xs">
                  Department Lead
                </Badge>
                {submittedThisWeek ? (
                  <Badge
                    className="text-xs bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700"
                    variant="outline"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Submitted ✓
                  </Badge>
                ) : (
                  <Badge
                    className="text-xs bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700"
                    variant="outline"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm text-foreground/80 font-medium leading-relaxed">
          {dept.description}
        </CardDescription>
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <ClipboardList className="h-3 w-3" />
          Click to view reports &amp; submit updates
        </p>
      </CardContent>
    </Card>
  );
}

function DepartmentCardSkeleton() {
  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4 mt-2" />
      </CardContent>
    </Card>
  );
}

function formatWeekEnding(nanoseconds: bigint): string {
  const ms = Number(nanoseconds / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString("en-NG", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function DepartmentSheet({
  dept,
  open,
  onClose,
  allReports,
}: {
  dept: Department | null;
  open: boolean;
  onClose: () => void;
  allReports: WeeklyReport[];
}) {
  const submitReport = useSubmitWeeklyReport();

  const [showForm, setShowForm] = useState(false);
  const [weekEnding, setWeekEnding] = useState("");
  const [achievements, setAchievements] = useState("");
  const [challenges, setChallenges] = useState("");
  const [plan, setPlan] = useState("");

  if (!dept) return null;

  const deptReports = allReports.filter((r) => r.departmentName === dept.name);

  const resetForm = () => {
    setWeekEnding("");
    setAchievements("");
    setChallenges("");
    setPlan("");
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weekEnding || !achievements || !challenges || !plan) return;
    const date = new Date(weekEnding);
    const ns = BigInt(date.getTime()) * BigInt(1_000_000);
    await submitReport.mutateAsync({
      departmentLead: dept.leadName,
      departmentName: dept.name,
      weekEnding: ns,
      achievements,
      challenges,
      planForNextWeek: plan,
    });
    resetForm();
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          resetForm();
          onClose();
        }
      }}
    >
      <SheetContent
        data-ocid="dept.sheet"
        className="w-full sm:max-w-lg flex flex-col p-0"
        side="right"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              {DEPT_ICONS[dept.leadName] ?? (
                <Sprout className="h-6 w-6 text-primary" />
              )}
            </div>
            <div>
              <SheetTitle className="text-lg">{dept.leadName}</SheetTitle>
              <SheetDescription className="text-sm">
                {dept.name}
              </SheetDescription>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {dept.description}
          </p>
          <Button
            data-ocid="dept.submit_button"
            className="mt-3 w-full gap-2"
            onClick={() => setShowForm((v) => !v)}
            variant={showForm ? "outline" : "default"}
          >
            <PlusCircle className="h-4 w-4" />
            {showForm ? "Cancel Report" : "Submit Weekly Report"}
          </Button>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          {/* Inline submit form */}
          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="mb-6 space-y-4 rounded-lg border border-primary/30 bg-primary/5 p-4"
            >
              <h3 className="font-semibold text-sm text-foreground">
                New Weekly Report
              </h3>

              <div className="space-y-1">
                <Label htmlFor="week-ending" className="text-xs">
                  Week Ending Date
                </Label>
                <Input
                  id="week-ending"
                  data-ocid="dept.week_ending.input"
                  type="date"
                  value={weekEnding}
                  onChange={(e) => setWeekEnding(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="achievements" className="text-xs">
                  Achievements This Week
                </Label>
                <Textarea
                  id="achievements"
                  data-ocid="dept.achievements.textarea"
                  placeholder="Key tasks completed, measurable outputs…"
                  value={achievements}
                  onChange={(e) => setAchievements(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="challenges" className="text-xs">
                  Challenges Encountered
                </Label>
                <Textarea
                  id="challenges"
                  data-ocid="dept.challenges.textarea"
                  placeholder="Constraints, delays, obstacles…"
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="plan" className="text-xs">
                  Plan for Coming Week
                </Label>
                <Textarea
                  id="plan"
                  data-ocid="dept.plan.textarea"
                  placeholder="Priorities, targets, required support…"
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <Button
                data-ocid="dept.report.submit_button"
                type="submit"
                className="w-full"
                disabled={submitReport.isPending}
              >
                {submitReport.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  "Submit Report"
                )}
              </Button>
            </form>
          )}

          {/* Reports list */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              Previous Reports
              <Badge variant="secondary" className="ml-auto">
                {deptReports.length}
              </Badge>
            </h3>

            {deptReports.length === 0 ? (
              <div
                data-ocid="dept.empty_state"
                className="rounded-lg border border-dashed border-border bg-muted/30 py-10 text-center text-sm text-muted-foreground"
              >
                No reports submitted yet — be the first to add one.
              </div>
            ) : (
              <Accordion type="multiple" className="space-y-2">
                {deptReports.map((report, idx) => (
                  <AccordionItem
                    key={`${report.departmentName}-${report.weekEnding.toString()}-${idx}`}
                    value={`report-${idx}`}
                    className="border border-border rounded-lg overflow-hidden"
                  >
                    <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline hover:bg-muted/50">
                      <span className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-normal">
                          Week ending:
                        </span>
                        {formatWeekEnding(report.weekEnding)}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                          Achievements
                        </p>
                        <p className="text-sm text-foreground/80 leading-relaxed">
                          {report.achievements}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-destructive uppercase tracking-wide mb-1">
                          Challenges
                        </p>
                        <p className="text-sm text-foreground/80 leading-relaxed">
                          {report.challenges}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">
                          Plan for Next Week
                        </p>
                        <p className="text-sm text-foreground/80 leading-relaxed">
                          {report.planForNextWeek}
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export default function DepartmentsOverview({
  allReports,
}: {
  allReports: WeeklyReport[];
}) {
  const { data: departments, isLoading, isError } = useGetDepartments();
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const submittedLeads = useWeeklySubmissionStatus(allReports);

  return (
    <div className="space-y-6">
      {/* Collective Responsibility Banner */}
      <Alert className="border-primary/30 bg-primary/5">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle className="font-semibold text-primary">
          Collective Responsibility
        </AlertTitle>
        <AlertDescription className="text-sm mt-1 space-y-1">
          <p>
            All team members are expected to support farm-wide activities and
            assist colleagues when required. No task should be ignored or
            deferred with the justification that &ldquo;it belongs to another
            department.&rdquo;
          </p>
          <p className="font-medium mt-2">
            The designated lead remains primarily accountable for the
            performance and outcomes of their department.
          </p>
        </AlertDescription>
      </Alert>

      {/* Monthly Goal Reminder */}
      <div className="rounded-lg bg-primary/10 border border-primary/20 px-4 py-3 flex items-center gap-3">
        <span className="text-2xl">🌶️</span>
        <div>
          <p className="font-semibold text-foreground text-sm">
            Monthly Cultivation Goal
          </p>
          <p className="text-muted-foreground text-xs">
            Target: <span className="font-bold text-primary">2 new plots</span>{" "}
            under active cultivation every month through end of year.
          </p>
        </div>
      </div>

      {/* Department Cards */}
      <div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          Departmental Leadership Structure
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Click a department card to view reports and submit weekly updates.
        </p>
        {isError && (
          <p className="text-destructive text-sm">
            Failed to load departments. Please try again.
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading
            ? ["a", "b", "c", "d"].map((k) => (
                <DepartmentCardSkeleton key={k} />
              ))
            : (departments ?? []).map((dept, idx) => (
                <DepartmentCard
                  key={dept.name}
                  dept={dept}
                  onClick={() => setSelectedDept(dept)}
                  ocid={`dept.card.button.${idx + 1}`}
                  submittedThisWeek={submittedLeads.has(dept.leadName)}
                />
              ))}
        </div>
      </div>

      {/* Reporting Reminder */}
      <Card className="border border-border bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            📋 Weekly Reporting Requirement
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>
            Every department lead must submit a brief written update{" "}
            <strong>every Saturday</strong> (or the last working day of the
            week) covering:
          </p>
          <ol className="list-decimal list-inside space-y-1 mt-2 ml-2">
            <li>
              <strong>Achievements this week</strong> – Key tasks completed and
              measurable outputs
            </li>
            <li>
              <strong>Challenges encountered</strong> – Constraints, delays, or
              obstacles faced
            </li>
            <li>
              <strong>Plan for the coming week</strong> – Priorities, targets,
              and required support
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Department Sheet */}
      <DepartmentSheet
        dept={selectedDept}
        open={selectedDept !== null}
        onClose={() => setSelectedDept(null)}
        allReports={allReports}
      />
    </div>
  );
}
