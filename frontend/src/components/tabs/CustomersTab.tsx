import { useState } from 'react';
import { useGetCustomers, useAddCustomer, useGetCustomerPurchaseHistory } from '@/hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Users, Eye, User } from 'lucide-react';

function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(amount);
}

function formatDate(timestamp: bigint): string {
  return new Date(Number(timestamp) / 1_000_000).toLocaleDateString('en-NG', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function PurchaseHistoryDialog({ customerId, customerName }: { customerId: bigint; customerName: string }) {
  const [open, setOpen] = useState(false);
  const { data: history = [], isLoading } = useGetCustomerPurchaseHistory(open ? customerId : null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" title="View purchase history">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Purchase History — {customerName}</DialogTitle>
        </DialogHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price (₦)</TableHead>
                <TableHead className="text-right">Total (₦)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No purchase history found.</TableCell>
                </TableRow>
              ) : (
                history.map(sale => (
                  <TableRow key={sale.id.toString()}>
                    <TableCell>{formatDate(sale.date)}</TableCell>
                    <TableCell className="text-right">{sale.quantity.toString()}</TableCell>
                    <TableCell className="text-right">{formatNaira(sale.unitPrice)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatNaira(sale.unitPrice * Number(sale.quantity))}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CustomersTab() {
  const { data: customers = [], isLoading } = useGetCustomers();
  const addCustomerMutation = useAddCustomer();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const [name, setName] = useState('');
  const [contactDetails, setContactDetails] = useState('');
  const [customerType, setCustomerType] = useState('');

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.contactDetails.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setName('');
    setContactDetails('');
    setCustomerType('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    await addCustomerMutation.mutateAsync({ name, contactDetails, customerType });
    setOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Customers</h2>
          <p className="text-muted-foreground text-sm mt-1">Manage customer relationships and purchase history</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Customer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cust-name">Name</Label>
                <Input
                  id="cust-name"
                  placeholder="Enter customer name..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cust-contact">Contact Details</Label>
                <Input
                  id="cust-contact"
                  placeholder="Phone, email, address..."
                  value={contactDetails}
                  onChange={e => setContactDetails(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cust-type">Customer Type</Label>
                <Input
                  id="cust-type"
                  placeholder="e.g. Retailer, Wholesaler, Individual..."
                  value={customerType}
                  onChange={e => setCustomerType(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
                <Button type="submit" disabled={addCustomerMutation.isPending}>
                  {addCustomerMutation.isPending ? 'Saving...' : 'Add Customer'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="bg-secondary/30 border border-secondary/40 rounded-xl p-4 flex items-center gap-4">
        <div className="bg-secondary/50 rounded-full p-3">
          <Users className="h-6 w-6 text-secondary-foreground" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Customers</p>
          <p className="text-2xl font-bold text-foreground">{customers.length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
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
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>
                  <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />Entered By</span>
                </TableHead>
                <TableHead className="text-right">History</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading customers...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No customers found.</TableCell>
                </TableRow>
              ) : (
                filtered.map(customer => (
                  <TableRow key={customer.id.toString()} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell className="text-muted-foreground">{customer.contactDetails || '—'}</TableCell>
                    <TableCell>
                      {customer.customerType ? (
                        <Badge variant="outline">{customer.customerType}</Badge>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {customer.enteredBy || 'Unknown'}
                    </TableCell>
                    <TableCell className="text-right">
                      <PurchaseHistoryDialog customerId={customer.id} customerName={customer.name} />
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
