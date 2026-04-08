import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  useGetExpenseRecords,
  useGetHarvestEntries,
  useGetIncomeRecords,
  useGetMonthlyGoals,
  useGetSales,
  useGetWeeklyReports,
  useGetWorkerDailyRecords,
  useGetWorkers,
} from "../../hooks/useQueries";

// ── helpers ──────────────────────────────────────────────────────────────────

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
const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatNairaShort(amount: number): string {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(0)}K`;
  return `₦${amount.toFixed(0)}`;
}

function inMonth(dateStr: string, year: number, month: number): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d.getFullYear() === year && d.getMonth() + 1 === month;
}

function inYear(dateStr: string, year: number): boolean {
  if (!dateStr) return false;
  return new Date(dateStr).getFullYear() === year;
}

// For bigint nanosecond timestamps (IncomeRecord, ExpenseRecord, Sale, WorkerDailyRecord)
function nsInMonth(ns: bigint, year: number, month: number): boolean {
  const d = new Date(Number(ns) / 1_000_000);
  return d.getFullYear() === year && d.getMonth() + 1 === month;
}

function nsInYear(ns: bigint, year: number): boolean {
  return new Date(Number(ns) / 1_000_000).getFullYear() === year;
}

function weekEndingInMonth(ns: bigint, year: number, month: number): boolean {
  const d = new Date(Number(ns) / 1_000_000);
  return d.getFullYear() === year && d.getMonth() + 1 === month;
}

function weekEndingInYear(ns: bigint, year: number): boolean {
  return new Date(Number(ns) / 1_000_000).getFullYear() === year;
}

const DEPARTMENTS = [
  {
    lead: "Goodnews",
    name: "Nursery Management & Chemical/Fertilizer Application",
  },
  { lead: "Nicholas", name: "Irrigation & Watering" },
  { lead: "Elvis", name: "Weeding & Harvesting" },
  { lead: "Wisdom", name: "Land Preparation, Farm Expansion & Infrastructure" },
];

const EXPENSE_LABELS: Record<string, string> = {
  fertilizers: "Fertilizers",
  packaging: "Packaging",
  transportation: "Transportation",
  labor: "Labor",
  equipment: "Equipment",
  other: "Other",
};

const INCOME_LABELS: Record<string, string> = {
  market: "Market",
  wholesale: "Wholesale",
  local: "Local",
  other: "Other",
};

// ── CSV helpers ───────────────────────────────────────────────────────────────

function downloadCsv(filename: string, rows: string[][]): void {
  const csv = rows
    .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Month-End Report ──────────────────────────────────────────────────────────

interface MonthReportData {
  year: number;
  month: number;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  incomeBySource: Record<string, number>;
  expenseByCategory: Record<string, number>;
  harvestKg: number;
  harvestCount: number;
  plotsActivated: number;
  plotsTarget: number;
  plotNames: string[];
  deptReports: {
    lead: string;
    shortName: string;
    count: number;
    achievements: string[];
  }[];
  salesRevenue: number;
  workerAttendance: { name: string; daysPresent: number }[];
}

function useMonthReport(
  year: number,
  month: number,
): { data: MonthReportData; isLoading: boolean } {
  const { data: income = [], isLoading: il } = useGetIncomeRecords();
  const { data: expenses = [], isLoading: el } = useGetExpenseRecords();
  const { data: harvest = [], isLoading: hl } = useGetHarvestEntries();
  const { data: goals = [], isLoading: gl } = useGetMonthlyGoals();
  const { data: reports = [], isLoading: rl } = useGetWeeklyReports();
  const { data: sales = [], isLoading: sl } = useGetSales();
  const { data: workers = [], isLoading: wl } = useGetWorkers();
  const { data: dailyRecords = [], isLoading: dl } = useGetWorkerDailyRecords();

  const isLoading = il || el || hl || gl || rl || sl || wl || dl;

  const data = useMemo<MonthReportData>(() => {
    const monthIncome = income.filter((r) => nsInMonth(r.date, year, month));
    const monthExpenses = expenses.filter((r) =>
      nsInMonth(r.date, year, month),
    );
    const monthHarvest = harvest.filter((r) => inMonth(r.date, year, month));
    const monthGoal = goals.find(
      (g) => Number(g.year) === year && Number(g.month) === month,
    );
    const monthReports = reports.filter((r) =>
      weekEndingInMonth(r.weekEnding, year, month),
    );
    const monthSales = sales.filter((r) => nsInMonth(r.date, year, month));

    const totalIncome = monthIncome.reduce((s, r) => s + r.amount, 0);
    const totalExpenses = monthExpenses.reduce((s, r) => s + r.amount, 0);

    const incomeBySource: Record<string, number> = {};
    for (const r of monthIncome) {
      const key =
        typeof r.source === "object"
          ? Object.keys(r.source)[0]
          : String(r.source);
      incomeBySource[key] = (incomeBySource[key] ?? 0) + r.amount;
    }

    const expenseByCategory: Record<string, number> = {};
    for (const r of monthExpenses) {
      const key =
        typeof r.category === "object"
          ? Object.keys(r.category)[0]
          : String(r.category);
      expenseByCategory[key] = (expenseByCategory[key] ?? 0) + r.amount;
    }

    const deptReports = DEPARTMENTS.map((dept) => {
      const dReports = monthReports.filter(
        (r) => r.departmentLead === dept.lead,
      );
      return {
        lead: dept.lead,
        shortName: dept.name.split("&")[0].trim(),
        count: dReports.length,
        achievements: dReports.map((r) => r.achievements).filter(Boolean),
      };
    });

    const workerAttendance = workers.map((w) => {
      const days = dailyRecords.filter(
        (r) =>
          r.workerId === w.id && r.present && nsInMonth(r.date, year, month),
      );
      return { name: w.name, daysPresent: days.length };
    });

    return {
      year,
      month,
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      incomeBySource,
      expenseByCategory,
      harvestKg: monthHarvest.reduce((s, r) => s + r.quantityKg, 0),
      harvestCount: monthHarvest.length,
      plotsActivated: monthGoal ? Number(monthGoal.actualPlots) : 0,
      plotsTarget: monthGoal ? Number(monthGoal.targetPlots) : 2,
      plotNames: monthGoal?.plotEntries?.map((p) => p.plotName) ?? [],
      deptReports,
      salesRevenue: monthSales.reduce(
        (s, r) => s + r.unitPrice * Number(r.quantity),
        0,
      ),
      workerAttendance,
    };
  }, [
    income,
    expenses,
    harvest,
    goals,
    reports,
    sales,
    workers,
    dailyRecords,
    year,
    month,
  ]);

  return { data, isLoading };
}

function downloadMonthCsv(d: MonthReportData) {
  const monthLabel = `${MONTH_NAMES[d.month - 1]} ${d.year}`;
  const rows: string[][] = [
    [`Pepper Farm Operations — Month-End Report: ${monthLabel}`],
    [],
    ["FINANCIAL SUMMARY"],
    ["Metric", "Amount (₦)"],
    ["Total Income", d.totalIncome.toFixed(2)],
    ["Total Expenses", d.totalExpenses.toFixed(2)],
    ["Net Profit/Loss", d.netProfit.toFixed(2)],
    [],
    ["INCOME BY SOURCE"],
    ["Source", "Amount (₦)"],
    ...Object.entries(d.incomeBySource).map(([k, v]) => [
      INCOME_LABELS[k] ?? k,
      v.toFixed(2),
    ]),
    [],
    ["EXPENSE BY CATEGORY"],
    ["Category", "Amount (₦)"],
    ...Object.entries(d.expenseByCategory).map(([k, v]) => [
      EXPENSE_LABELS[k] ?? k,
      v.toFixed(2),
    ]),
    [],
    ["HARVEST SUMMARY"],
    ["Total kg Harvested", d.harvestKg.toFixed(1)],
    ["Number of Harvest Entries", String(d.harvestCount)],
    [],
    ["PLOT EXPANSION"],
    ["Plots Activated", String(d.plotsActivated)],
    ["Target", String(d.plotsTarget)],
    ["Plot Names", d.plotNames.join("; ")],
    [],
    ["DEPARTMENT ACTIVITY"],
    ["Department Lead", "Reports Submitted", "Key Achievements"],
    ...d.deptReports.map((dep) => [
      dep.lead,
      String(dep.count),
      dep.achievements.join(" | "),
    ]),
    [],
    ["SALES SUMMARY"],
    ["Total Sales Revenue", d.salesRevenue.toFixed(2)],
    [],
    ["ATTENDANCE"],
    ["Worker", "Days Present"],
    ...d.workerAttendance.map((w) => [w.name, String(w.daysPresent)]),
  ];
  downloadCsv(
    `pepper-farm-report-${d.year}-${String(d.month).padStart(2, "0")}.csv`,
    rows,
  );
}

function MonthEndReport() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const { data: d, isLoading } = useMonthReport(year, month);

  const currentYear = now.getFullYear();
  const years = [
    currentYear - 2,
    currentYear - 1,
    currentYear,
    currentYear + 1,
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <select
          data-ocid="reports.month_select"
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {MONTH_NAMES.map((name, i) => (
            <option key={name} value={i + 1}>
              {name}
            </option>
          ))}
        </select>
        <select
          data-ocid="reports.year_select"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <button
          type="button"
          data-ocid="reports.print_month_button"
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          🖨️ Print Report
        </button>
        <button
          type="button"
          data-ocid="reports.download_month_button"
          onClick={() => downloadMonthCsv(d)}
          className="flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          ⬇️ Download CSV
        </button>
      </div>

      {/* Print-only header */}
      <div className="hidden print:block print-report-header">
        <h1 className="text-2xl font-bold">Pepper Farm Operations Report</h1>
        <p className="text-lg text-muted-foreground">
          {monthLabel} — Month-End Summary
        </p>
        <hr className="my-2 border-border" />
      </div>

      {/* Financial Summary */}
      <section className="report-section print-break-avoid">
        <h2 className="mb-3 text-lg font-semibold text-foreground border-b border-border pb-2">
          💰 Financial Summary
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Income</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">
                {formatNaira(d.totalIncome)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-destructive">
                {formatNaira(d.totalExpenses)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Net Profit / Loss</CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-2xl font-bold ${d.netProfit >= 0 ? "text-primary" : "text-destructive"}`}
              >
                {formatNaira(d.netProfit)}
              </p>
              <p className="text-xs text-muted-foreground">
                {d.netProfit >= 0 ? "Profit" : "Loss"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {/* Income by source */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Income by Source</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(d.incomeBySource).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No income records this month
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-1">Source</th>
                      <th className="text-right py-1">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(d.incomeBySource).map(([k, v]) => (
                      <tr
                        key={k}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="py-1 capitalize">
                          {INCOME_LABELS[k] ?? k}
                        </td>
                        <td className="py-1 text-right font-medium text-primary">
                          {formatNaira(v)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {/* Expense by category */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(d.expenseByCategory).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No expense records this month
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-1">Category</th>
                      <th className="text-right py-1">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(d.expenseByCategory).map(([k, v]) => (
                      <tr
                        key={k}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="py-1 capitalize">
                          {EXPENSE_LABELS[k] ?? k}
                        </td>
                        <td className="py-1 text-right font-medium text-destructive">
                          {formatNaira(v)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Harvest Summary */}
      <section className="report-section print-break-avoid">
        <h2 className="mb-3 text-lg font-semibold text-foreground border-b border-border pb-2">
          🌾 Harvest Summary
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Harvested</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">
                {d.harvestKg.toFixed(1)} kg
              </p>
              <p className="text-xs text-muted-foreground">
                {d.harvestCount} harvest entries
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Sales Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">
                {formatNaira(d.salesRevenue)}
              </p>
              <p className="text-xs text-muted-foreground">
                from sales this month
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Plot Expansion */}
      <section className="report-section print-break-avoid">
        <h2 className="mb-3 text-lg font-semibold text-foreground border-b border-border pb-2">
          🗺️ Plot Expansion
        </h2>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-4 mb-3">
              <div>
                <span
                  className={`text-3xl font-bold ${d.plotsActivated >= d.plotsTarget ? "text-primary" : "text-destructive"}`}
                >
                  {d.plotsActivated}
                </span>
                <span className="text-muted-foreground text-lg">
                  {" "}
                  / {d.plotsTarget} plots
                </span>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  d.plotsActivated >= d.plotsTarget
                    ? "bg-primary/10 text-primary"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {d.plotsActivated >= d.plotsTarget
                  ? "✓ Target Met"
                  : "Behind Target"}
              </span>
            </div>
            {d.plotNames.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1">Plots Activated:</p>
                <div className="flex flex-wrap gap-2">
                  {d.plotNames.map((name) => (
                    <span
                      key={name}
                      className="rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary font-medium"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Department Activity */}
      <section className="report-section">
        <h2 className="mb-3 text-lg font-semibold text-foreground border-b border-border pb-2">
          👥 Department Activity
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {d.deptReports.map((dept) => (
            <Card
              key={dept.lead}
              className={dept.count > 0 ? "border-primary/30" : "border-border"}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>
                    {dept.lead} — {dept.shortName}
                  </span>
                  <span
                    className={`text-xs rounded-full px-2 py-0.5 ${
                      dept.count > 0
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {dept.count} report{dept.count !== 1 ? "s" : ""}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dept.achievements.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No reports submitted this month
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {dept.achievements.map((ach) => (
                      <li
                        key={`${dept.lead}-${ach.slice(0, 30)}`}
                        className="text-xs text-foreground leading-relaxed border-l-2 border-primary/40 pl-2"
                      >
                        {ach}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Attendance */}
      <section className="report-section print-break-avoid">
        <h2 className="mb-3 text-lg font-semibold text-foreground border-b border-border pb-2">
          📋 Worker Attendance
        </h2>
        <Card>
          <CardContent className="pt-4">
            {d.workerAttendance.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No workers registered
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-1 font-medium">Worker</th>
                    <th className="text-right py-1 font-medium">
                      Days Present
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {d.workerAttendance.map((w) => (
                    <tr
                      key={w.name}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="py-1.5">{w.name}</td>
                      <td className="py-1.5 text-right font-semibold text-primary">
                        {w.daysPresent}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// ── Year-End Report ───────────────────────────────────────────────────────────

interface YearReportData {
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  monthlyFinancials: {
    month: number;
    label: string;
    income: number;
    expenses: number;
    net: number;
  }[];
  totalHarvestKg: number;
  totalHarvestEntries: number;
  monthlyHarvest: {
    month: number;
    label: string;
    kg: number;
    entries: number;
  }[];
  monthsHitTarget: number;
  totalPlotsActivated: number;
  annualTarget: number;
  monthlyPlots: {
    month: number;
    label: string;
    activated: number;
    target: number;
  }[];
  deptAnnual: {
    lead: string;
    shortName: string;
    totalReports: number;
    achievements: string[];
  }[];
  totalSalesRevenue: number;
  monthlySales: { month: number; label: string; revenue: number }[];
  workerAnnualAttendance: { name: string; daysPresent: number }[];
}

function useYearReport(year: number): {
  data: YearReportData;
  isLoading: boolean;
} {
  const { data: income = [], isLoading: il } = useGetIncomeRecords();
  const { data: expenses = [], isLoading: el } = useGetExpenseRecords();
  const { data: harvest = [], isLoading: hl } = useGetHarvestEntries();
  const { data: goals = [], isLoading: gl } = useGetMonthlyGoals();
  const { data: reports = [], isLoading: rl } = useGetWeeklyReports();
  const { data: sales = [], isLoading: sl } = useGetSales();
  const { data: workers = [], isLoading: wl } = useGetWorkers();
  const { data: dailyRecords = [], isLoading: dl } = useGetWorkerDailyRecords();

  const isLoading = il || el || hl || gl || rl || sl || wl || dl;

  const data = useMemo<YearReportData>(() => {
    const yearIncome = income.filter((r) => nsInYear(r.date, year));
    const yearExpenses = expenses.filter((r) => nsInYear(r.date, year));
    const yearHarvest = harvest.filter((r) => inYear(r.date, year));
    const yearGoals = goals.filter((g) => Number(g.year) === year);
    const yearReports = reports.filter((r) =>
      weekEndingInYear(r.weekEnding, year),
    );
    const yearSales = sales.filter((r) => nsInYear(r.date, year));

    const monthlyFinancials = MONTH_SHORT.map((label, i) => {
      const m = i + 1;
      const inc = yearIncome
        .filter((r) => nsInMonth(r.date, year, m))
        .reduce((s, r) => s + r.amount, 0);
      const exp = yearExpenses
        .filter((r) => nsInMonth(r.date, year, m))
        .reduce((s, r) => s + r.amount, 0);
      return { month: m, label, income: inc, expenses: exp, net: inc - exp };
    });

    const monthlyHarvest = MONTH_SHORT.map((label, i) => {
      const m = i + 1;
      const entries = yearHarvest.filter((r) => inMonth(r.date, year, m));
      return {
        month: m,
        label,
        kg: entries.reduce((s, r) => s + r.quantityKg, 0),
        entries: entries.length,
      };
    });

    const monthlyPlots = MONTH_SHORT.map((label, i) => {
      const m = i + 1;
      const g = yearGoals.find((gl) => Number(gl.month) === m);
      return {
        month: m,
        label,
        activated: g ? Number(g.actualPlots) : 0,
        target: g ? Number(g.targetPlots) : 2,
      };
    });

    const deptAnnual = DEPARTMENTS.map((dept) => {
      const dReports = yearReports.filter(
        (r) => r.departmentLead === dept.lead,
      );
      return {
        lead: dept.lead,
        shortName: dept.name.split("&")[0].trim(),
        totalReports: dReports.length,
        achievements: dReports.map((r) => r.achievements).filter(Boolean),
      };
    });

    const workerAnnualAttendance = workers.map((w) => {
      const days = dailyRecords.filter(
        (r) => r.workerId === w.id && r.present && nsInYear(r.date, year),
      );
      return { name: w.name, daysPresent: days.length };
    });

    const monthlySales = MONTH_SHORT.map((label, i) => {
      const m = i + 1;
      const rev = yearSales
        .filter((r) => nsInMonth(r.date, year, m))
        .reduce((s, r) => s + r.unitPrice * Number(r.quantity), 0);
      return { month: m, label, revenue: rev };
    });

    const totalPlots = monthlyPlots.reduce((s, m) => s + m.activated, 0);
    const monthsHitTarget = monthlyPlots.filter(
      (m) => m.activated >= m.target,
    ).length;

    return {
      year,
      totalIncome: yearIncome.reduce((s, r) => s + r.amount, 0),
      totalExpenses: yearExpenses.reduce((s, r) => s + r.amount, 0),
      netProfit:
        yearIncome.reduce((s, r) => s + r.amount, 0) -
        yearExpenses.reduce((s, r) => s + r.amount, 0),
      monthlyFinancials,
      totalHarvestKg: yearHarvest.reduce((s, r) => s + r.quantityKg, 0),
      totalHarvestEntries: yearHarvest.length,
      monthlyHarvest,
      monthsHitTarget,
      totalPlotsActivated: totalPlots,
      annualTarget: 24,
      monthlyPlots,
      deptAnnual,
      totalSalesRevenue: yearSales.reduce(
        (s, r) => s + r.unitPrice * Number(r.quantity),
        0,
      ),
      monthlySales,
      workerAnnualAttendance,
    };
  }, [
    income,
    expenses,
    harvest,
    goals,
    reports,
    sales,
    workers,
    dailyRecords,
    year,
  ]);

  return { data, isLoading };
}

function downloadYearCsv(d: YearReportData) {
  const rows: string[][] = [
    [`Pepper Farm Operations — Year-End Report: ${d.year}`],
    [],
    ["ANNUAL FINANCIAL SUMMARY"],
    ["Metric", "Amount (₦)"],
    ["Total Income", d.totalIncome.toFixed(2)],
    ["Total Expenses", d.totalExpenses.toFixed(2)],
    ["Net Profit/Loss", d.netProfit.toFixed(2)],
    [],
    ["MONTHLY FINANCIAL BREAKDOWN"],
    ["Month", "Income (₦)", "Expenses (₦)", "Net (₦)"],
    ...d.monthlyFinancials.map((m) => [
      m.label,
      m.income.toFixed(2),
      m.expenses.toFixed(2),
      m.net.toFixed(2),
    ]),
    [],
    ["HARVEST SUMMARY"],
    ["Total kg", d.totalHarvestKg.toFixed(1)],
    ["Total Entries", String(d.totalHarvestEntries)],
    [],
    ["MONTHLY HARVEST"],
    ["Month", "kg Harvested", "Entries"],
    ...d.monthlyHarvest.map((m) => [
      m.label,
      m.kg.toFixed(1),
      String(m.entries),
    ]),
    [],
    ["PLOT EXPANSION"],
    ["Total Plots Activated", String(d.totalPlotsActivated)],
    ["Annual Target", String(d.annualTarget)],
    ["Months Hitting Target", String(d.monthsHitTarget)],
    [],
    ["MONTHLY PLOT PROGRESS"],
    ["Month", "Activated", "Target"],
    ...d.monthlyPlots.map((m) => [
      m.label,
      String(m.activated),
      String(m.target),
    ]),
    [],
    ["DEPARTMENT PERFORMANCE"],
    ["Lead", "Reports Submitted", "Achievements"],
    ...d.deptAnnual.map((dep) => [
      dep.lead,
      String(dep.totalReports),
      dep.achievements.join(" | "),
    ]),
    [],
    ["ANNUAL SALES REVENUE"],
    ["Total Revenue", d.totalSalesRevenue.toFixed(2)],
    [],
    ["MONTHLY SALES"],
    ["Month", "Revenue (₦)"],
    ...d.monthlySales.map((m) => [m.label, m.revenue.toFixed(2)]),
    [],
    ["ANNUAL ATTENDANCE"],
    ["Worker", "Days Present"],
    ...d.workerAnnualAttendance.map((w) => [w.name, String(w.daysPresent)]),
  ];
  downloadCsv(`pepper-farm-annual-report-${d.year}.csv`, rows);
}

function YearEndReport() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const { data: d, isLoading } = useYearReport(year);

  const currentYear = now.getFullYear();
  const years = [
    currentYear - 2,
    currentYear - 1,
    currentYear,
    currentYear + 1,
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <select
          data-ocid="reports.year_end_select"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <button
          type="button"
          data-ocid="reports.print_year_button"
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          🖨️ Print Report
        </button>
        <button
          type="button"
          data-ocid="reports.download_year_button"
          onClick={() => downloadYearCsv(d)}
          className="flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          ⬇️ Download CSV
        </button>
      </div>

      {/* Print-only header */}
      <div className="hidden print:block print-report-header">
        <h1 className="text-2xl font-bold">Pepper Farm Operations Report</h1>
        <p className="text-lg text-muted-foreground">
          Year-End Summary — {year}
        </p>
        <hr className="my-2 border-border" />
      </div>

      {/* Annual Financial Summary */}
      <section className="report-section print-break-avoid">
        <h2 className="mb-3 text-lg font-semibold text-foreground border-b border-border pb-2">
          💰 Annual Financial Summary
        </h2>
        <div className="grid gap-3 sm:grid-cols-3 mb-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Income</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">
                {formatNaira(d.totalIncome)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-destructive">
                {formatNaira(d.totalExpenses)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Net Profit / Loss</CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-2xl font-bold ${d.netProfit >= 0 ? "text-primary" : "text-destructive"}`}
              >
                {formatNaira(d.netProfit)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly breakdown chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Monthly Income vs Expenses — {year}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {d.monthlyFinancials.every(
              (m) => m.income === 0 && m.expenses === 0,
            ) ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No financial data for {year}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={d.monthlyFinancials}
                  margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis
                    tickFormatter={formatNairaShort}
                    tick={{ fontSize: 10 }}
                    width={58}
                  />
                  <Tooltip
                    formatter={(v: number, name: string) => [
                      formatNaira(v),
                      name === "income" ? "Income" : "Expenses",
                    ]}
                  />
                  <Bar
                    dataKey="income"
                    fill="var(--chart-1)"
                    radius={[4, 4, 0, 0]}
                    name="income"
                  />
                  <Bar
                    dataKey="expenses"
                    fill="var(--chart-4)"
                    radius={[4, 4, 0, 0]}
                    name="expenses"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Monthly table */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm">Monthly Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-1.5 pr-4">Month</th>
                    <th className="text-right py-1.5 pr-4">Income</th>
                    <th className="text-right py-1.5 pr-4">Expenses</th>
                    <th className="text-right py-1.5">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {d.monthlyFinancials.map((m) => (
                    <tr
                      key={m.month}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="py-1.5 pr-4 font-medium">{m.label}</td>
                      <td className="py-1.5 pr-4 text-right text-primary">
                        {formatNaira(m.income)}
                      </td>
                      <td className="py-1.5 pr-4 text-right text-destructive">
                        {formatNaira(m.expenses)}
                      </td>
                      <td
                        className={`py-1.5 text-right font-semibold ${m.net >= 0 ? "text-primary" : "text-destructive"}`}
                      >
                        {formatNaira(m.net)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Annual Harvest */}
      <section className="report-section print-break-avoid">
        <h2 className="mb-3 text-lg font-semibold text-foreground border-b border-border pb-2">
          🌾 Annual Harvest Summary
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 mb-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Harvested</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">
                {d.totalHarvestKg.toFixed(1)} kg
              </p>
              <p className="text-xs text-muted-foreground">
                {d.totalHarvestEntries} harvest entries
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Annual Sales Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">
                {formatNaira(d.totalSalesRevenue)}
              </p>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Monthly Harvest Table</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-1.5 pr-4">Month</th>
                    <th className="text-right py-1.5 pr-4">kg Harvested</th>
                    <th className="text-right py-1.5">Entries</th>
                  </tr>
                </thead>
                <tbody>
                  {d.monthlyHarvest.map((m) => (
                    <tr
                      key={m.month}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="py-1.5 pr-4 font-medium">{m.label}</td>
                      <td className="py-1.5 pr-4 text-right text-primary font-semibold">
                        {m.kg.toFixed(1)}
                      </td>
                      <td className="py-1.5 text-right text-muted-foreground">
                        {m.entries}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Plot Expansion */}
      <section className="report-section print-break-avoid">
        <h2 className="mb-3 text-lg font-semibold text-foreground border-b border-border pb-2">
          🗺️ Annual Plot Expansion Progress
        </h2>
        <div className="grid gap-3 sm:grid-cols-3 mb-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Plots Activated</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">
                {d.totalPlotsActivated}
              </p>
              <p className="text-xs text-muted-foreground">
                Annual target: {d.annualTarget}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Months Hitting Target</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">
                {d.monthsHitTarget} / 12
              </p>
              <p className="text-xs text-muted-foreground">
                months at ≥2 plots
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Progress vs Target</CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-2xl font-bold ${d.totalPlotsActivated >= d.annualTarget ? "text-primary" : "text-destructive"}`}
              >
                {Math.round((d.totalPlotsActivated / d.annualTarget) * 100)}%
              </p>
              <p className="text-xs text-muted-foreground">
                {d.totalPlotsActivated} of {d.annualTarget} target
              </p>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Monthly Plot Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-1.5 pr-4">Month</th>
                    <th className="text-right py-1.5 pr-4">Activated</th>
                    <th className="text-right py-1.5 pr-4">Target</th>
                    <th className="text-right py-1.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {d.monthlyPlots.map((m) => (
                    <tr
                      key={m.month}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="py-1.5 pr-4 font-medium">{m.label}</td>
                      <td className="py-1.5 pr-4 text-right font-semibold">
                        {m.activated}
                      </td>
                      <td className="py-1.5 pr-4 text-right text-muted-foreground">
                        {m.target}
                      </td>
                      <td className="py-1.5 text-right">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            m.activated >= m.target
                              ? "bg-primary/10 text-primary"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {m.activated >= m.target ? "✓ Met" : "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Department Performance */}
      <section className="report-section">
        <h2 className="mb-3 text-lg font-semibold text-foreground border-b border-border pb-2">
          👥 Department Performance
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {d.deptAnnual.map((dept) => (
            <Card key={dept.lead}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>
                    {dept.lead} — {dept.shortName}
                  </span>
                  <span className="text-xs rounded-full bg-primary/10 text-primary px-2 py-0.5">
                    {dept.totalReports} reports
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dept.achievements.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No reports in {year}
                  </p>
                ) : (
                  <ul className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {dept.achievements.map((ach) => (
                      <li
                        key={`${dept.lead}-year-${ach.slice(0, 30)}`}
                        className="text-xs text-foreground leading-relaxed border-l-2 border-primary/40 pl-2"
                      >
                        {ach}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Annual Attendance */}
      <section className="report-section print-break-avoid">
        <h2 className="mb-3 text-lg font-semibold text-foreground border-b border-border pb-2">
          📋 Annual Worker Attendance
        </h2>
        <Card>
          <CardContent className="pt-4">
            {d.workerAnnualAttendance.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No workers registered
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-1 font-medium">Worker</th>
                    <th className="text-right py-1 font-medium">
                      Total Days Present
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {d.workerAnnualAttendance.map((w) => (
                    <tr
                      key={w.name}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="py-1.5">{w.name}</td>
                      <td className="py-1.5 text-right font-semibold text-primary">
                        {w.daysPresent}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// ── Main ReportsTab ───────────────────────────────────────────────────────────

type ReportView = "month" | "year";

export default function ReportsTab() {
  const [view, setView] = useState<ReportView>("month");

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex items-center gap-2 print:hidden">
        <button
          type="button"
          data-ocid="reports.month_tab"
          onClick={() => setView("month")}
          className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
            view === "month"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Month-End Report
        </button>
        <button
          type="button"
          data-ocid="reports.year_tab"
          onClick={() => setView("year")}
          className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
            view === "year"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Year-End Report
        </button>
      </div>

      {view === "month" ? <MonthEndReport /> : <YearEndReport />}
    </div>
  );
}
