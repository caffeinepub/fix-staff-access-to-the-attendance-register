import { useState, useMemo } from 'react';
import { useGetSales, useAddSale, useGetCustomers, useGetInventoryItems } from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search } from 'lucide-react';

export default function SalesTab() {
  const { data: sales = [], isLoading: salesLoading } = useGetSales();
  const { data: customers = [] } = useGetCustomers();
  const { data: inventoryItems = [] } = useGetInventoryItems();
  const addSale = useAddSale();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    customerId: '',
    inventoryItemId: '',
    quantity: '',
    unitPrice: '',
  });

  const salesWithDetails = useMemo(() => {
    return sales.map((sale) => {
      const customer = customers.find((c) => c.id === sale.customerId);
      const item = inventoryItems.find((i) => i.id === sale.inventoryItemId);
      return {
        ...sale,
        customerName: customer?.name || 'Unknown',
        itemName: item?.name || 'Unknown',
      };
    });
  }, [sales, customers, inventoryItems]);

  const filteredSales = useMemo(() => {
    return salesWithDetails.filter(
      (sale) =>
        sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.itemName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [salesWithDetails, searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSale.mutate(
      {
        customerId: BigInt(formData.customerId),
        inventoryItemId: BigInt(formData.inventoryItemId),
        quantity: BigInt(formData.quantity),
        unitPrice: parseFloat(formData.unitPrice),
      },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
          setFormData({ customerId: '', inventoryItemId: '', quantity: '', unitPrice: '' });
        },
      }
    );
  };

  const totalSales = filteredSales.reduce((sum, sale) => sum + Number(sale.quantity) * sale.unitPrice, 0);

  const pepperItems = inventoryItems.filter((item) => item.itemType === 'peppers');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Sales Records</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Record Sale
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record New Sale</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer">Customer</Label>
                    <Select value={formData.customerId} onValueChange={(value) => setFormData({ ...formData, customerId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id.toString()} value={customer.id.toString()}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item">Pepper Type</Label>
                    <Select
                      value={formData.inventoryItemId}
                      onValueChange={(value) => setFormData({ ...formData, inventoryItemId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select pepper" />
                      </SelectTrigger>
                      <SelectContent>
                        {pepperItems.map((item) => (
                          <SelectItem key={item.id.toString()} value={item.id.toString()}>
                            {item.name} (Available: {Number(item.quantity)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitPrice">Unit Price (₦)</Label>
                    <Input
                      id="unitPrice"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.unitPrice}
                      onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={addSale.isPending}>
                    {addSale.isPending ? 'Recording...' : 'Record Sale'}
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
              placeholder="Search sales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="mb-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
            <p className="text-sm text-muted-foreground">Total Sales Revenue (filtered)</p>
            <p className="text-2xl font-bold text-green-600">₦{totalSales.toFixed(2)}</p>
          </div>

          {salesLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading sales...</p>
          ) : filteredSales.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No sales records found</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price (₦)</TableHead>
                    <TableHead className="text-right">Total (₦)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale.id.toString()}>
                      <TableCell>{new Date(Number(sale.date) / 1000000).toLocaleDateString()}</TableCell>
                      <TableCell>{sale.customerName}</TableCell>
                      <TableCell>{sale.itemName}</TableCell>
                      <TableCell className="text-right">{Number(sale.quantity)}</TableCell>
                      <TableCell className="text-right">₦{sale.unitPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        ₦{(Number(sale.quantity) * sale.unitPrice).toFixed(2)}
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
