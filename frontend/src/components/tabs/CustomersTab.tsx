import { useState, useMemo } from 'react';
import { useGetCustomers, useAddCustomer, useGetCustomerPurchaseHistory } from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Eye } from 'lucide-react';
import type { Customer } from '../../backend';

export default function CustomersTab() {
  const { data: customers = [], isLoading } = useGetCustomers();
  const addCustomer = useAddCustomer();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: purchaseHistory = [] } = useGetCustomerPurchaseHistory(selectedCustomer?.id || null);

  const [formData, setFormData] = useState({
    name: '',
    contactDetails: '',
    customerType: '',
  });

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.contactDetails.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.customerType.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCustomer.mutate(formData, {
      onSuccess: () => {
        setIsAddDialogOpen(false);
        setFormData({ name: '', contactDetails: '', customerType: '' });
      },
    });
  };

  const openHistoryDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsHistoryDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Customer Management</CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Customer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Customer</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Customer Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactDetails">Contact Details</Label>
                    <Input
                      id="contactDetails"
                      value={formData.contactDetails}
                      onChange={(e) => setFormData({ ...formData, contactDetails: e.target.value })}
                      placeholder="Phone, email, or address"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerType">Customer Type</Label>
                    <Input
                      id="customerType"
                      value={formData.customerType}
                      onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
                      placeholder="e.g., Retail, Wholesale, Restaurant"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={addCustomer.isPending}>
                    {addCustomer.isPending ? 'Adding...' : 'Add Customer'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading customers...</p>
          ) : filteredCustomers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No customers found</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact Details</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id.toString()}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.contactDetails}</TableCell>
                      <TableCell>{customer.customerType}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openHistoryDialog(customer)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View History
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Purchase History - {selectedCustomer?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {purchaseHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No purchase history</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead className="text-right">Unit Price (₦)</TableHead>
                      <TableHead className="text-right">Total (₦)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseHistory.map((sale) => (
                      <TableRow key={sale.id.toString()}>
                        <TableCell>{new Date(Number(sale.date) / 1000000).toLocaleDateString()}</TableCell>
                        <TableCell>{Number(sale.quantity)}</TableCell>
                        <TableCell className="text-right">₦{sale.unitPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          ₦{(Number(sale.quantity) * sale.unitPrice).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
