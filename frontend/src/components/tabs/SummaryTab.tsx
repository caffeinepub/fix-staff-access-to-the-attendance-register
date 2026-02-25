import { useMemo } from 'react';
import { useGetIncomeRecords, useGetExpenseRecords, useGetInventoryItems, useGetSales } from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Package, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function SummaryTab() {
  const { data: incomeRecords = [], isLoading: incomeLoading } = useGetIncomeRecords();
  const { data: expenseRecords = [], isLoading: expenseLoading } = useGetExpenseRecords();
  const { data: inventoryItems = [], isLoading: inventoryLoading } = useGetInventoryItems();
  const { data: sales = [], isLoading: salesLoading } = useGetSales();

  const isLoading = incomeLoading || expenseLoading || inventoryLoading || salesLoading;

  const summary = useMemo(() => {
    const totalIncome = incomeRecords.reduce((sum, record) => sum + record.amount, 0);
    const totalExpenses = expenseRecords.reduce((sum, record) => sum + record.amount, 0);
    const netProfit = totalIncome - totalExpenses;
    const inventoryValue = inventoryItems.reduce(
      (sum, item) => sum + Number(item.quantity) * item.costPerUnit,
      0
    );
    const lowStockItems = inventoryItems.filter((item) => Number(item.quantity) < 10);

    return {
      totalIncome,
      totalExpenses,
      netProfit,
      inventoryValue,
      lowStockItems,
    };
  }, [incomeRecords, expenseRecords, inventoryItems]);

  const recentTransactions = useMemo(() => {
    const allTransactions = [
      ...incomeRecords.map((r) => ({ ...r, type: 'income' as const })),
      ...expenseRecords.map((r) => ({ ...r, type: 'expense' as const })),
    ]
      .sort((a, b) => Number(b.date - a.date))
      .slice(0, 5);

    return allTransactions;
  }, [incomeRecords, expenseRecords]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₦{summary.totalIncome.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{incomeRecords.length} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₦{summary.totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{expenseRecords.length} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₦{summary.netProfit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.netProfit >= 0 ? 'Profitable' : 'Loss'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{summary.inventoryValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{inventoryItems.length} items</p>
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
              <p className="text-sm text-muted-foreground">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div key={`${transaction.type}-${transaction.id}`} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(Number(transaction.date) / 1000000).toLocaleDateString()}
                      </p>
                    </div>
                    <div
                      className={`text-sm font-semibold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}₦{transaction.amount.toFixed(2)}
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
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary.lowStockItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">All items are well stocked</p>
            ) : (
              <div className="space-y-3">
                {summary.lowStockItems.map((item) => (
                  <div key={item.id.toString()} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{item.itemType}</p>
                    </div>
                    <div className="text-sm font-semibold text-yellow-600">{Number(item.quantity)} left</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
