import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  DollarSign,
  Package,
  Target,
  TrendingDown,
  TrendingUp,
  Wheat,
} from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  useGetExpenseRecords,
  useGetHarvestEntries,
  useGetIncomeRecords,
  useGetInventoryItems,
  useGetMonthlyGoals,
  useGetSales,
} from "../../hooks/useQueries";

const MONTH_NAMES = [
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

const CATEGORY_COLORS: Record<string, string> = {
  fertilizers: "var(--chart-1)",
  packaging: "var(--chart-2)",
  transportation: "var(--chart-3)",
  labor: "var(--chart-4)",
  equipment: "var(--chart-5)",
  other: "var(--chart-6, oklch(0.55 0.02 240))",
};

const CATEGORY_LABELS: Record<string, string> = {
  fertilizers: "Fertilizers",
  packaging: "Packaging",
  transportation: "Transportation",
  labor: "Labor",
  equipment: "Equipment",
  other: "Other",
};

function formatNaira(amount: number): string {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(0)}K`;
  return `₦${amount.toFixed(0)}`;
}

export default function SummaryTab() {
  const { data: incomeRecords = [], isLoading: incomeLoading } =
    useGetIncomeRecords();
  const { data: expenseRecords = [], isLoading: expenseLoading } =
    useGetExpenseRecords();
  const { data: inventoryItems = [], isLoading: inventoryLoading } =
    useGetInventoryItems();
  const { isLoading: salesLoading } = useGetSales();
  const { data: harvestEntries = [], isLoading: harvestLoading } =
    useGetHarvestEntries();
  const { data: monthlyGoals = [] } = useGetMonthlyGoals();

  const isLoading =
    incomeLoading ||
    expenseLoading ||
    inventoryLoading ||
    salesLoading ||
    harvestLoading;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const harvestStats = useMemo(() => {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );
    const thisMonth = harvestEntries.filter((e) => {
      const d = new Date(e.date);
      return d >= monthStart && d <= monthEnd;
    });
    const yearTotal = harvestEntries.reduce((s, e) => s + e.quantityKg, 0);
    const monthKg = thisMonth.reduce((s, e) => s + e.quantityKg, 0);
    return { count: thisMonth.length, monthKg, yearTotal };
  }, [harvestEntries, now]);

  const plotStats = useMemo(() => {
    const currentGoal = monthlyGoals.find(
      (g) => Number(g.year) === currentYear && Number(g.month) === currentMonth,
    );
    const yearTotal = monthlyGoals
      .filter((g) => Number(g.year) === currentYear)
      .reduce((s, g) => s + Number(g.actualPlots), 0);
    return {
      actual: currentGoal ? Number(currentGoal.actualPlots) : 0,
      target: currentGoal ? Number(currentGoal.targetPlots) : 2,
      yearTotal,
    };
  }, [monthlyGoals, currentYear, currentMonth]);

  const summary = useMemo(() => {
    const totalIncome = incomeRecords.reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = expenseRecords.reduce((sum, r) => sum + r.amount, 0);
    const netProfit = totalIncome - totalExpenses;
    const inventoryValue = inventoryItems.reduce(
      (sum, item) => sum + Number(item.quantity) * item.costPerUnit,
      0,
    );
    const lowStockItems = inventoryItems.filter(
      (item) => Number(item.quantity) < 10,
    );
    return {
      totalIncome,
      totalExpenses,
      netProfit,
      inventoryValue,
      lowStockItems,
    };
  }, [incomeRecords, expenseRecords, inventoryItems]);

  const recentTransactions = useMemo(() => {
    return [
      ...incomeRecords.map((r) => ({ ...r, type: "income" as const })),
      ...expenseRecords.map((r) => ({ ...r, type: "expense" as const })),
    ]
      .sort((a, b) => Number(b.date - a.date))
      .slice(0, 5);
  }, [incomeRecords, expenseRecords]);

  const monthlyChartData = useMemo(() => {
    const months: {
      key: string;
      label: string;
      income: number;
      expenses: number;
    }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: MONTH_NAMES[d.getMonth()],
        income: 0,
        expenses: 0,
      });
    }
    const monthMap = Object.fromEntries(months.map((m) => [m.key, m]));
    for (const r of incomeRecords) {
      const d = new Date(Number(r.date) / 1_000_000);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (monthMap[key]) monthMap[key].income += r.amount;
    }
    for (const r of expenseRecords) {
      const d = new Date(Number(r.date) / 1_000_000);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (monthMap[key]) monthMap[key].expenses += r.amount;
    }
    return months;
  }, [incomeRecords, expenseRecords, now]);

  const expenseCategoryData = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const r of expenseRecords) {
      totals[r.category] = (totals[r.category] ?? 0) + r.amount;
    }
    const total = Object.values(totals).reduce((a, b) => a + b, 0);
    return Object.entries(totals)
      .map(([cat, amount]) => ({
        category: cat,
        label: CATEGORY_LABELS[cat] ?? cat,
        amount,
        pct: total > 0 ? Math.round((amount / total) * 100) : 0,
        color: CATEGORY_COLORS[cat] ?? "#6b7280",
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenseRecords]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {["a", "b", "c", "d"].map((k) => (
            <Card key={k}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const monthLabel = now.toLocaleString("en-NG", {
    month: "long",
    year: "numeric",
  });
  const plotProgressPct = Math.min(
    100,
    (plotStats.actual / plotStats.target) * 100,
  );

  return (
    <div className="space-y-6">
      {/* Financial Overview Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ₦{summary.totalIncome.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {incomeRecords.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              ₦{summary.totalExpenses.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {expenseRecords.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${summary.netProfit >= 0 ? "text-primary" : "text-destructive"}`}
            >
              ₦{summary.netProfit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.netProfit >= 0 ? "Profitable" : "Loss"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Inventory Value
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{summary.inventoryValue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {inventoryItems.length} items
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Farm Activity Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Harvest Summary Card */}
        <Card className="border-primary/30 bg-primary/5 dark:border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Harvest Summary
            </CardTitle>
            <Wheat className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {harvestStats.monthKg.toFixed(1)} kg
                </div>
                <p className="text-xs text-muted-foreground">
                  {harvestStats.count} harvests — {monthLabel}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-primary/80">
                  {harvestStats.yearTotal.toFixed(1)} kg
                </div>
                <p className="text-xs text-muted-foreground">
                  Year-to-date total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plot Expansion Card */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Plot Expansion — {monthLabel}
            </CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {plotStats.actual} / {plotStats.target}
                </div>
                <p className="text-xs text-muted-foreground">
                  new plots this month
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold">
                  {plotStats.yearTotal}
                </div>
                <p className="text-xs text-muted-foreground">plots this year</p>
              </div>
            </div>
            <Progress value={plotProgressPct} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {plotStats.actual >= plotStats.target
                ? "🎉 Monthly target reached!"
                : `${plotStats.target - plotStats.actual} more plot${plotStats.target - plotStats.actual !== 1 ? "s" : ""} needed to reach target`}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No transactions yet
              </p>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div
                    key={`${transaction.type}-${transaction.id}`}
                    className="flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(
                          Number(transaction.date) / 1000000,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div
                      className={`text-sm font-semibold ml-3 ${transaction.type === "income" ? "text-primary" : "text-destructive"}`}
                    >
                      {transaction.type === "income" ? "+" : "-"}₦
                      {transaction.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary.lowStockItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                All items are well stocked
              </p>
            ) : (
              <div className="space-y-3">
                {summary.lowStockItems.map((item) => (
                  <div
                    key={item.id.toString()}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {item.itemType}
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-destructive">
                      {Number(item.quantity)} left
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Income vs Expenses Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Monthly Income vs Expenses (Last 6 Months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyChartData.every((m) => m.income === 0 && m.expenses === 0) ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No data for the last 6 months
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={monthlyChartData}
                margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={formatNaira}
                  tick={{ fontSize: 11 }}
                  width={60}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    new Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency: "NGN",
                    }).format(value),
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
          <div className="flex gap-4 mt-2 justify-center">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="inline-block w-3 h-3 rounded-sm bg-primary" />{" "}
              Income
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="inline-block w-3 h-3 rounded-sm bg-destructive" />{" "}
              Expenses
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Expense Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-destructive" />
            Expense Breakdown by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expenseCategoryData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No expense data yet
            </p>
          ) : (
            <div className="space-y-3">
              {expenseCategoryData.map(
                ({ category, label, amount, pct, color }) => (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium flex items-center gap-2">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        {label}
                      </span>
                      <span className="text-muted-foreground">
                        {new Intl.NumberFormat("en-NG", {
                          style: "currency",
                          currency: "NGN",
                        }).format(amount)}{" "}
                        <span className="text-xs">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
