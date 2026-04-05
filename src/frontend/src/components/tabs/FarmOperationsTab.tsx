import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetWeeklyReports } from "@/hooks/useQueries";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Target,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import DepartmentsOverview from "./farmOperations/DepartmentsOverview";
import MonthlyPlotGoalTracker from "./farmOperations/MonthlyPlotGoalTracker";
import WeeklyReportsSection from "./farmOperations/WeeklyReportsSection";

const DEPT_LEADS = ["Goodnews", "Nicholas", "Elvis", "Wisdom"];

function getCurrentWeekRange(): { sunday: Date; saturday: Date } {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - day);
  sunday.setHours(0, 0, 0, 0);
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  saturday.setHours(23, 59, 59, 999);
  return { sunday, saturday };
}

export default function FarmOperationsTab() {
  const [activeSection, setActiveSection] = useState("departments");
  const { data: allReports = [] } = useGetWeeklyReports();

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

    const pendingThisWeek = DEPT_LEADS.length - leadsSubmittedThisWeek.length;

    return {
      total: allReports.length,
      thisMonth: reportsThisMonth.length,
      pendingThisWeek,
    };
  }, [allReports]);

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
              <CheckCircle2 className="h-4 w-4 text-green-600 mb-1" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`border ${
            stats.pendingThisWeek > 0
              ? "border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/20"
              : "border-border"
          }`}
        >
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Pending This Week
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <div className="flex items-end gap-2">
              <span
                className={`text-2xl font-bold ${
                  stats.pendingThisWeek > 0
                    ? "text-amber-600"
                    : "text-green-600"
                }`}
              >
                {stats.pendingThisWeek}
              </span>
              <AlertCircle
                className={`h-4 w-4 mb-1 ${
                  stats.pendingThisWeek > 0
                    ? "text-amber-600"
                    : "text-green-600"
                }`}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
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
      </Tabs>
    </div>
  );
}
