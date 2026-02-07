import { useState, useMemo } from 'react';
import { useGetInventoryItems, useAddInventoryItem, useUpdateInventoryItem } from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Edit } from 'lucide-react';
import { ItemType, type InventoryItem } from '../../backend';

export default function InventoryTab() {
  const { data: inventoryItems = [], isLoading } = useGetInventoryItems();
  const addInventoryItem = useAddInventoryItem();
  const updateInventoryItem = useUpdateInventoryItem();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    itemType: 'peppers' as keyof typeof ItemType,
    quantity: '',
    costPerUnit: '',
  });

  const filteredItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || item.itemType === filterType;
      return matchesSearch && matchesType;
    });
  }, [inventoryItems, searchTerm, filterType]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addInventoryItem.mutate(
      {
        name: formData.name,
        itemType: ItemType[formData.itemType],
        quantity: BigInt(formData.quantity),
        costPerUnit: parseFloat(formData.costPerUnit),
      },
      {
        onSuccess: () => {
          setIsAddDialogOpen(false);
          setFormData({ name: '', itemType: 'peppers', quantity: '', costPerUnit: '' });
        },
      }
    );
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    updateInventoryItem.mutate(
      {
        id: editingItem.id,
        name: formData.name,
        itemType: ItemType[formData.itemType],
        quantity: BigInt(formData.quantity),
        costPerUnit: parseFloat(formData.costPerUnit),
      },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false);
          setEditingItem(null);
          setFormData({ name: '', itemType: 'peppers', quantity: '', costPerUnit: '' });
        },
      }
    );
  };

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      itemType: item.itemType as keyof typeof ItemType,
      quantity: item.quantity.toString(),
      costPerUnit: item.costPerUnit.toString(),
    });
    setIsEditDialogOpen(true);
  };

  const totalValue = filteredItems.reduce((sum, item) => sum + Number(item.quantity) * item.costPerUnit, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Inventory Management</CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Inventory Item</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Item Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="itemType">Item Type</Label>
                    <Select
                      value={formData.itemType}
                      onValueChange={(value) => setFormData({ ...formData, itemType: value as keyof typeof ItemType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="peppers">Peppers</SelectItem>
                        <SelectItem value="fertilizer">Fertilizer</SelectItem>
                        <SelectItem value="pesticide">Pesticide</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
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
                    <Label htmlFor="costPerUnit">Cost Per Unit (₦)</Label>
                    <Input
                      id="costPerUnit"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.costPerUnit}
                      onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={addInventoryItem.isPending}>
                    {addInventoryItem.isPending ? 'Adding...' : 'Add Item'}
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
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="peppers">Peppers</SelectItem>
                <SelectItem value="fertilizer">Fertilizer</SelectItem>
                <SelectItem value="pesticide">Pesticide</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mb-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground">Total Inventory Value (filtered)</p>
            <p className="text-2xl font-bold text-primary">₦{totalValue.toFixed(2)}</p>
          </div>

          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading inventory...</p>
          ) : filteredItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No inventory items found</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Cost/Unit (₦)</TableHead>
                    <TableHead className="text-right">Total Value (₦)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id.toString()}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="capitalize">{item.itemType}</TableCell>
                      <TableCell className="text-right">{Number(item.quantity)}</TableCell>
                      <TableCell className="text-right">₦{item.costPerUnit.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        ₦{(Number(item.quantity) * item.costPerUnit).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)}>
                          <Edit className="w-4 h-4" />
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Item Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-itemType">Item Type</Label>
              <Select
                value={formData.itemType}
                onValueChange={(value) => setFormData({ ...formData, itemType: value as keyof typeof ItemType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="peppers">Peppers</SelectItem>
                  <SelectItem value="fertilizer">Fertilizer</SelectItem>
                  <SelectItem value="pesticide">Pesticide</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-quantity">Quantity</Label>
              <Input
                id="edit-quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-costPerUnit">Cost Per Unit (₦)</Label>
              <Input
                id="edit-costPerUnit"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.costPerUnit}
                onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={updateInventoryItem.isPending}>
              {updateInventoryItem.isPending ? 'Updating...' : 'Update Item'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
