import { useState } from 'react';
import { useGetSales, useAddSale, useGetCustomers, useGetInventoryItems } from '@/hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Search, ShoppingCart, User } from 'lucide-react';

function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(amount);
}

function formatDate(timestamp: bigint): string {
  return new Date(Number(timestamp) / 1_000_000).toLocaleDateString('en-NG', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export default function SalesTab() {
  const { data: sales = [], isLoading } = useGetSales();
  const { data: customers = [] } = useGetCustomers();
  const { data: inventoryItems = [] } = useGetInventoryItems();
  const addSaleMutation = useAddSale();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const [customerId, setCustomerId] = useState('');
  const [inventoryItemId, setInventoryItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');

  const customerMap = Object.fromEntries(customers.map(c => [c.id.toString(), c.name]));
  const inventoryMap = Object.fromEntries(inventoryItems.map(i => [i.id.toString(), i.name]));

  const filtered = sales.filter(s => {
    const customerName = customerMap[s.customerId.toString()] ?? '';
    const itemName = inventoryMap[s.inventoryItemId.toString()] ?? '';
    return (
      customerName.toLowerCase().includes(search.toLowerCase()) ||
      itemName.toLowerCase().includes(search.toLowerCase())
    );
  });

  const totalRevenue = filtered.reduce((sum, s) => sum + s.unitPrice * Number(s.quantity), 0);

  const resetForm = () => {
    setCustomerId('');
    setInventoryItemId('');
    setQuantity('');
    setUnitPrice('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !inventoryItemId || !quantity || !unitPrice) return;
    await addSaleMutation.mutateAsync({
      customerId: BigInt(customerId),
      inventoryItemId: BigInt(inventoryItemId),
      quantity: BigInt(quantity),
      unitPrice: parseFloat(unitPrice),
    });
    setOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Sales Records</h2>
          <p className="text-muted-foreground text-sm mt-1">Track all farm sales transactions</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Record Sale
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record New Sale</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(c => (
                      <SelectItem key={c.id.toString()} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Inventory Item</Label>
                <Select value={inventoryItemId} onValueChange={setInventoryItemId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select item..." />
                  </SelectTrigger>
                  <SelectContent>
                    {inventoryItems.map(i => (
                      <SelectItem key={i.id.toString()} value={i.id.toString()}>
                        {i.name} (qty: {i.quantity.toString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sale-qty">Quantity</Label>
                <Input
                  id="sale-qty"
                  type="number"
                  min="1"
                  placeholder="0"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sale-price">Unit Price (₦)</Label>
                <Input
                  id="sale-price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={unitPrice}
                  onChange={e => setUnitPrice(e.target.value)}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
                <Button type="submit" disabled={addSaleMutation.isPending}>
                  {addSaleMutation.isPending ? 'Saving...' : 'Record Sale'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Card */}
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-4">
        <div className="bg-primary/20 rounded-full p-3">
          <ShoppingCart className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Revenue (filtered)</p>
          <p className="text-2xl font-bold text-primary">{formatNaira(totalRevenue)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by customer or item..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price (₦)</TableHead>
                <TableHead className="text-right">Total (₦)</TableHead>
                <TableHead>
                  <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />Entered By</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading sales...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No sales records found.</TableCell>
                </TableRow>
              ) : (
                filtered.map(sale => (
                  <TableRow key={sale.id.toString()} className="hover:bg-muted/30">
                    <TableCell className="whitespace-nowrap">{formatDate(sale.date)}</TableCell>
                    <TableCell>{customerMap[sale.customerId.toString()] ?? `Customer #${sale.customerId}`}</TableCell>
                    <TableCell>{inventoryMap[sale.inventoryItemId.toString()] ?? `Item #${sale.inventoryItemId}`}</TableCell>
                    <TableCell className="text-right">{sale.quantity.toString()}</TableCell>
                    <TableCell className="text-right">{formatNaira(sale.unitPrice)}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">{formatNaira(sale.unitPrice * Number(sale.quantity))}</TableCell>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {sale.enteredBy || 'Unknown'}
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
