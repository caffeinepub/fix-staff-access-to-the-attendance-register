import { useState, useMemo } from 'react';
import { useGetIncomeRecords, useAddIncome } from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search } from 'lucide-react';
import { IncomeSource } from '../../backend';

export default function IncomeTab() {
  const { data: incomeRecords = [], isLoading } = useGetIncomeRecords();
  const addIncome = useAddIncome();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState<string>('all');

  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    source: 'market' as keyof typeof IncomeSource,
    description: '',
  });

  const filteredRecords = useMemo(() => {
    return incomeRecords.filter((record) => {
      const matchesSearch =
        record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.amount.toString().includes(searchTerm);
      const matchesSource = filterSource === 'all' || record.source === filterSource;
      return matchesSearch && matchesSource;
    });
  }, [incomeRecords, searchTerm, filterSource]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateInNanoseconds = BigInt(new Date(formData.date).getTime()) * BigInt(1000000);
    addIncome.mutate(
      {
        amount: parseFloat(formData.amount),
        date: dateInNanoseconds,
        source: IncomeSource[formData.source],
        description: formData.description,
      },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
          setFormData({
            amount: '',
            date: new Date().toISOString().split('T')[0],
            source: 'market',
            description: '',
          });
        },
      }
    );
  };

  const totalIncome = filteredRecords.reduce((sum, record) => sum + record.amount, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Income Records</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
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
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="source">Source</Label>
                    <Select
                      value={formData.source}
                      onValueChange={(value) => setFormData({ ...formData, source: value as keyof typeof IncomeSource })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="market">Market</SelectItem>
                        <SelectItem value="wholesale">Wholesale</SelectItem>
                        <SelectItem value="local">Local</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={addIncome.isPending}>
                    {addIncome.isPending ? 'Adding...' : 'Add Income'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search income records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="market">Market</SelectItem>
                <SelectItem value="wholesale">Wholesale</SelectItem>
                <SelectItem value="local">Local</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mb-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
            <p className="text-sm text-muted-foreground">Total Income (filtered)</p>
            <p className="text-2xl font-bold text-green-600">₦{totalIncome.toFixed(2)}</p>
          </div>

          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading income records...</p>
          ) : filteredRecords.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No income records found</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Amount (₦)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id.toString()}>
                      <TableCell>{new Date(Number(record.date) / 1000000).toLocaleDateString()}</TableCell>
                      <TableCell>{record.description}</TableCell>
                      <TableCell className="capitalize">{record.source}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        ₦{record.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
