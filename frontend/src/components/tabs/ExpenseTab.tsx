import { useState } from 'react';
import { useGetExpenseRecords, useAddExpense, useUpdateExpense, useDeleteExpense } from '@/hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, TrendingDown, Pencil, Trash2, User } from 'lucide-react';
import { ExpenseType } from '@/backend';

const categoryLabels: Record<string, string> = {
  fertilizers: 'Fertilizers',
  packaging: 'Packaging',
  transportation: 'Transportation',
  labor: 'Labor',
  equipment: 'Equipment',
  other: 'Other',
};

const categoryColors: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  fertilizers: 'default',
  packaging: 'secondary',
  transportation: 'outline',
  labor: 'destructive',
  equipment: 'secondary',
  other: 'outline',
};

function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(amount);
}

function formatDate(timestamp: bigint): string {
  return new Date(Number(timestamp) / 1_000_000).toLocaleDateString('en-NG', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function toDateInputValue(timestamp: bigint): string {
  const d = new Date(Number(timestamp) / 1_000_000);
  return d.toISOString().split('T')[0];
}

export default function ExpenseTab() {
  const { data: expenseRecords = [], isLoading } = useGetExpenseRecords();
  const addExpenseMutation = useAddExpense();
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState<ExpenseType>(ExpenseType.other);
  const [description, setDescription] = useState('');

  const filtered = expenseRecords.filter(r => {
    const matchSearch = r.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'all' || r.category === filterCategory;
    return matchSearch && matchCat;
  });

  const totalExpenses = filtered.reduce((sum, r) => sum + r.amount, 0);

  const resetForm = () => {
    setAmount('');
    setDate('');
    setCategory(ExpenseType.other);
    setDescription('');
    setEditingId(null);
  };

  const handleOpen = () => {
    resetForm();
    setOpen(true);
  };

  const handleEdit = (record: typeof expenseRecords[0]) => {
    setEditingId(record.id);
    setAmount(record.amount.toString());
    setDate(toDateInputValue(record.date));
    setCategory(record.category as ExpenseType);
    setDescription(record.description);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !date) return;
    const dateMs = new Date(date).getTime();
    const dateNs = BigInt(dateMs) * 1_000_000n;
    if (editingId !== null) {
      await updateExpenseMutation.mutateAsync({
        id: editingId,
        amount: parseFloat(amount),
        date: dateNs,
        category,
        description,
      });
    } else {
      await addExpenseMutation.mutateAsync({
        amount: parseFloat(amount),
        date: dateNs,
        category,
        description,
      });
    }
    setOpen(false);
    resetForm();
  };

  const handleDelete = async (id: bigint) => {
    await deleteExpenseMutation.mutateAsync(id);
  };

  const isSaving = addExpenseMutation.isPending || updateExpenseMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Expense Records</h2>
          <p className="text-muted-foreground text-sm mt-1">Track all farm expenses</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={handleOpen}>
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId !== null ? 'Edit Expense' : 'Add Expense Record'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="exp-amount">Amount (₦)</Label>
                <Input
                  id="exp-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp-date">Date</Label>
                <Input
                  id="exp-date"
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={v => setCategory(v as ExpenseType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ExpenseType.fertilizers}>Fertilizers</SelectItem>
                    <SelectItem value={ExpenseType.packaging}>Packaging</SelectItem>
                    <SelectItem value={ExpenseType.transportation}>Transportation</SelectItem>
                    <SelectItem value={ExpenseType.labor}>Labor</SelectItem>
                    <SelectItem value={ExpenseType.equipment}>Equipment</SelectItem>
                    <SelectItem value={ExpenseType.other}>Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp-description">Description</Label>
                <Input
                  id="exp-description"
                  placeholder="Enter description..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : editingId !== null ? 'Update Expense' : 'Save Expense'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Card */}
      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-4">
        <div className="bg-destructive/20 rounded-full p-3">
          <TrendingDown className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Expenses (filtered)</p>
          <p className="text-2xl font-bold text-destructive">{formatNaira(totalExpenses)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value={ExpenseType.fertilizers}>Fertilizers</SelectItem>
            <SelectItem value={ExpenseType.packaging}>Packaging</SelectItem>
            <SelectItem value={ExpenseType.transportation}>Transportation</SelectItem>
            <SelectItem value={ExpenseType.labor}>Labor</SelectItem>
            <SelectItem value={ExpenseType.equipment}>Equipment</SelectItem>
            <SelectItem value={ExpenseType.other}>Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount (₦)</TableHead>
                <TableHead>
                  <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />Entered By</span>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading expense records...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No expense records found.</TableCell>
                </TableRow>
              ) : (
                filtered.map(record => (
                  <TableRow key={record.id.toString()} className="hover:bg-muted/30">
                    <TableCell className="whitespace-nowrap">{formatDate(record.date)}</TableCell>
                    <TableCell>
                      <Badge variant={categoryColors[record.category] ?? 'outline'}>
                        {categoryLabels[record.category] ?? record.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{record.description || '—'}</TableCell>
                    <TableCell className="text-right font-semibold text-destructive whitespace-nowrap">{formatNaira(record.amount)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {record.enteredBy || 'Unknown'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(record)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this expense record? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(record.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {deleteExpenseMutation.isPending ? 'Deleting...' : 'Delete'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
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
