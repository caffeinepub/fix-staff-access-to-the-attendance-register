import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetHarvestEntries, useGetWeeklyReports } from "@/hooks/useQueries";
import {
  AlertCircle,
  BarChart2,
  CheckCircle2,
  Download,
  FileText,
  Target,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import DepartmentsOverview from "./farmOperations/DepartmentsOverview";
import MonthlyPlotGoalTracker from "./farmOperations/MonthlyPlotGoalTracker";
import WeeklyReportsSection from "./farmOperations/WeeklyReportsSection";

const DEPT_LEADS = ["Goodnews", "Nicholas", "Elvis", "Wisdom"];

const DEPT_INFO: Record<string, string> = {
  Goodnews: "Nursery/Chemicals",
  Nicholas: "Irrigation",
  Elvis: "Weeding/Harvesting",
  Wisdom: "Land Prep/Expansion",
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

function getWeekLabel(date: Date): string {
  const start = new Date(date);
  const day = start.getDay();
  start.setDate(start.getDate() - day);
  return `${start.toLocaleDateString("en-NG", { month: "short", day: "numeric" })}`;
}

export default function FarmOperationsTab() {
  const [activeSection, setActiveSection] = useState("departments");
  const { data: allReports = [] } = useGetWeeklyReports();
  const { data: harvestEntries = [] } = useGetHarvestEntries();

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );
    const { sunday, saturday } = getCurrentWeekRange();

    const reportsThisMonth = allReports.filter((r) => {
      const ms = Number(r.weekEnding) / 1_000_000;
      const d = new Date(ms);
      return d >= currentMonthStart && d <= currentMonthEnd;
    });

    const leadsSubmittedThisWeek = DEPT_LEADS.filter((lead) =>
      allReports.some((r) => {
        const ms = Number(r.weekEnding) / 1_000_000;
        const d = new Date(ms);
        return r.departmentLead === lead && d >= sunday && d <= saturday;
      }),
    );

    return {
      total: allReports.length,
      thisMonth: reportsThisMonth.length,
      pendingThisWeek: DEPT_LEADS.length - leadsSubmittedThisWeek.length,
    };
  }, [allReports]);

  // Department performance metrics
  const deptPerformance = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );
    const { sunday, saturday } = getCurrentWeekRange();

    return DEPT_LEADS.map((lead) => {
      const deptReports = allReports.filter((r) => r.departmentLead === lead);
      const thisMonthReports = deptReports.filter((r) => {
        const d = new Date(Number(r.weekEnding) / 1_000_000);
        return d >= monthStart && d <= monthEnd;
      });
      const lastReport =
        deptReports.length > 0
          ? deptReports.reduce((latest, r) =>
              Number(r.weekEnding) > Number(latest.weekEnding) ? r : latest,
            )
          : null;
      const submittedThisWeek = deptReports.some((r) => {
        const d = new Date(Number(r.weekEnding) / 1_000_000);
        return d >= sunday && d <= saturday;
      });
      const latestAchievement = lastReport?.achievements?.slice(0, 80) ?? "—";

      return {
        lead,
        dept: DEPT_INFO[lead] ?? lead,
        reportsThisMonth: thisMonthReports.length,
        lastReportDate: lastReport
          ? new Date(
              Number(lastReport.weekEnding) / 1_000_000,
            ).toLocaleDateString("en-NG", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "—",
        submittedThisWeek,
        latestAchievement,
      };
    });
  }, [allReports]);

  // Weekly harvest activity chart (last 8 weeks)
  const weeklyHarvestData = useMemo(() => {
    const weeks: { label: string; weekStart: Date; kg: number }[] = [];
    const now = new Date();
    const day = now.getDay();
    const thisSunday = new Date(now);
    thisSunday.setDate(now.getDate() - day);
    thisSunday.setHours(0, 0, 0, 0);

    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(thisSunday);
      weekStart.setDate(thisSunday.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const kg = harvestEntries
        .filter((e) => {
          const d = new Date(e.date);
          return d >= weekStart && d <= weekEnd;
        })
        .reduce((s, e) => s + e.quantityKg, 0);

      weeks.push({ label: getWeekLabel(weekStart), weekStart, kg });
    }
    return weeks;
  }, [harvestEntries]);

  const exportDeptCSV = () => {
    const headers = [
      "Lead",
      "Department",
      "Reports This Month",
      "Last Report Date",
      "This Week Status",
    ];
    const rows = deptPerformance.map((d) => [
      d.lead,
      d.dept,
      String(d.reportsThisMonth),
      d.lastReportDate,
      d.submittedThisWeek ? "Submitted" : "Pending",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dept-performance-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-foreground">Farm Operations</h2>
        <p className="text-muted-foreground text-sm">
          Manage departments, track monthly plot goals, and review weekly
          reports.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border border-border">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-foreground">
                {stats.total}
              </span>
              <FileText className="h-4 w-4 text-muted-foreground mb-1" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-foreground">
                {stats.thisMonth}
              </span>
              <CheckCircle2 className="h-4 w-4 text-primary mb-1" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`border ${stats.pendingThisWeek > 0 ? "border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/20" : "border-border"}`}
        >
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Pending This Week
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <div className="flex items-end gap-2">
              <span
                className={`text-2xl font-bold ${stats.pendingThisWeek > 0 ? "text-amber-600 dark:text-amber-400" : "text-primary"}`}
              >
                {stats.pendingThisWeek}
              </span>
              <AlertCircle
                className={`h-4 w-4 mb-1 ${stats.pendingThisWeek > 0 ? "text-amber-600 dark:text-amber-400" : "text-primary"}`}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Departments</span>
            <span className="sm:hidden">Depts</span>
          </TabsTrigger>
          <TabsTrigger value="plotGoals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Plot Goals</span>
            <span className="sm:hidden">Goals</span>
          </TabsTrigger>
          <TabsTrigger
            value="weeklyReports"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Weekly Reports</span>
            <span className="sm:hidden">Reports</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            <span className="hidden sm:inline">Performance</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="departments">
          <DepartmentsOverview allReports={allReports} />
        </TabsContent>

        <TabsContent value="plotGoals">
          <MonthlyPlotGoalTracker />
        </TabsContent>

        <TabsContent value="weeklyReports">
          <WeeklyReportsSection />
        </TabsContent>

        <TabsContent value="performance">
          <div className="space-y-6">
            {/* Weekly Harvest Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-primary" />
                  Weekly Harvest Activity (Last 8 Weeks)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weeklyHarvestData.every((w) => w.kg === 0) ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    No harvest data recorded yet. Add harvest entries in the
                    Harvest Log tab.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={weeklyHarvestData}
                      margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="opacity-30"
                      />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} unit=" kg" width={55} />
                      <Tooltip
                        formatter={(value: number) => [
                          `${value.toFixed(1)} kg`,
                          "Harvest",
                        ]}
                        labelFormatter={(label: string) => `Week of ${label}`}
                      />
                      <Bar
                        dataKey="kg"
                        fill="var(--chart-1)"
                        radius={[4, 4, 0, 0]}
                        name="kg"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Department Performance Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Department Performance Summary
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportDeptCSV}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b border-border">
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                            Lead
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                            Department
                          </th>
                          <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                            Reports This Month
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                            Last Submission
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                            This Week
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                            Latest Achievement
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {deptPerformance.map((d) => (
                          <tr
                            key={d.lead}
                            className="border-b border-border/50 hover:bg-muted/30"
                          >
                            <td className="px-4 py-3 font-semibold">
                              {d.lead}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {d.dept}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`font-bold ${d.reportsThisMonth > 0 ? "text-primary" : "text-muted-foreground"}`}
                              >
                                {d.reportsThisMonth}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                              {d.lastReportDate}
                            </td>
                            <td className="px-4 py-3">
                              {d.submittedThisWeek ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 dark:bg-primary/20 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="h-3 w-3" /> Submitted
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-0.5 rounded-full">
                                  <AlertCircle className="h-3 w-3" /> Pending
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] truncate hidden lg:table-cell">
                              {d.latestAchievement}
                              {d.latestAchievement !== "—" &&
                              d.latestAchievement.length >= 79
                                ? "…"
                                : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
