import { useState } from 'react';
import { useGetIncomeRecords, useAddIncome } from '@/hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, TrendingUp, User } from 'lucide-react';
import { IncomeSource } from '@/backend';

const sourceLabels: Record<string, string> = {
  market: 'Market',
  wholesale: 'Wholesale',
  local: 'Local',
  other: 'Other',
};

const sourceColors: Record<string, 'default' | 'secondary' | 'outline'> = {
  market: 'default',
  wholesale: 'secondary',
  local: 'outline',
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

export default function IncomeTab() {
  const { data: incomeRecords = [], isLoading } = useGetIncomeRecords();
  const addIncomeMutation = useAddIncome();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterSource, setFilterSource] = useState<string>('all');

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [source, setSource] = useState<IncomeSource>(IncomeSource.market);
  const [description, setDescription] = useState('');

  const filtered = incomeRecords.filter(r => {
    const matchSearch = r.description.toLowerCase().includes(search.toLowerCase());
    const matchSource = filterSource === 'all' || r.source === filterSource;
    return matchSearch && matchSource;
  });

  const totalIncome = filtered.reduce((sum, r) => sum + r.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !date) return;
    const dateMs = new Date(date).getTime();
    const dateNs = BigInt(dateMs) * 1_000_000n;
    await addIncomeMutation.mutateAsync({
      amount: parseFloat(amount),
      date: dateNs,
      source,
      description,
    });
    setOpen(false);
    setAmount('');
    setDate('');
    setSource(IncomeSource.market);
    setDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Income Records</h2>
          <p className="text-muted-foreground text-sm mt-1">Track all farm income sources</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Income
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Income Record</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₦)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Source</Label>
                <Select value={source} onValueChange={v => setSource(v as IncomeSource)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={IncomeSource.market}>Market</SelectItem>
                    <SelectItem value={IncomeSource.wholesale}>Wholesale</SelectItem>
                    <SelectItem value={IncomeSource.local}>Local</SelectItem>
                    <SelectItem value={IncomeSource.other}>Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Enter description..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={addIncomeMutation.isPending}>
                  {addIncomeMutation.isPending ? 'Saving...' : 'Save Income'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Card */}
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-4">
        <div className="bg-primary/20 rounded-full p-3">
          <TrendingUp className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Income (filtered)</p>
          <p className="text-2xl font-bold text-primary">{formatNaira(totalIncome)}</p>
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
        <Select value={filterSource} onValueChange={setFilterSource}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value={IncomeSource.market}>Market</SelectItem>
            <SelectItem value={IncomeSource.wholesale}>Wholesale</SelectItem>
            <SelectItem value={IncomeSource.local}>Local</SelectItem>
            <SelectItem value={IncomeSource.other}>Other</SelectItem>
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
                <TableHead>Source</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount (₦)</TableHead>
                <TableHead>
                  <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />Entered By</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading income records...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No income records found.</TableCell>
                </TableRow>
              ) : (
                filtered.map(record => (
                  <TableRow key={record.id.toString()} className="hover:bg-muted/30">
                    <TableCell className="whitespace-nowrap">{formatDate(record.date)}</TableCell>
                    <TableCell>
                      <Badge variant={sourceColors[record.source] ?? 'outline'}>
                        {sourceLabels[record.source] ?? record.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{record.description || '—'}</TableCell>
                    <TableCell className="text-right font-semibold text-primary whitespace-nowrap">{formatNaira(record.amount)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {record.enteredBy || 'Unknown'}
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
