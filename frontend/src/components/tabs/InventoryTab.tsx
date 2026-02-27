import { useState } from 'react';
import { useGetInventoryItems, useAddInventoryItem, useUpdateInventoryItem } from '@/hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Package, Pencil, User } from 'lucide-react';
import { ItemType } from '@/backend';

const typeLabels: Record<string, string> = {
  peppers: 'Peppers',
  fertilizer: 'Fertilizer',
  pesticide: 'Pesticide',
  equipment: 'Equipment',
};

const typeColors: Record<string, 'default' | 'secondary' | 'outline'> = {
  peppers: 'default',
  fertilizer: 'secondary',
  pesticide: 'outline',
  equipment: 'outline',
};

function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(amount);
}

export default function InventoryTab() {
  const { data: items = [], isLoading } = useGetInventoryItems();
  const addItemMutation = useAddInventoryItem();
  const updateItemMutation = useUpdateInventoryItem();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const [name, setName] = useState('');
  const [itemType, setItemType] = useState<ItemType>(ItemType.peppers);
  const [quantity, setQuantity] = useState('');
  const [costPerUnit, setCostPerUnit] = useState('');

  const filtered = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || item.itemType === filterType;
    return matchSearch && matchType;
  });

  const totalValue = filtered.reduce((sum, item) => sum + item.costPerUnit * Number(item.quantity), 0);

  const resetForm = () => {
    setName('');
    setItemType(ItemType.peppers);
    setQuantity('');
    setCostPerUnit('');
    setEditingId(null);
  };

  const handleOpen = () => {
    resetForm();
    setOpen(true);
  };

  const handleEdit = (item: typeof items[0]) => {
    setEditingId(item.id);
    setName(item.name);
    setItemType(item.itemType as ItemType);
    setQuantity(item.quantity.toString());
    setCostPerUnit(item.costPerUnit.toString());
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !quantity || !costPerUnit) return;
    if (editingId !== null) {
      await updateItemMutation.mutateAsync({
        id: editingId,
        name,
        itemType,
        quantity: BigInt(quantity),
        costPerUnit: parseFloat(costPerUnit),
      });
    } else {
      await addItemMutation.mutateAsync({
        name,
        itemType,
        quantity: BigInt(quantity),
        costPerUnit: parseFloat(costPerUnit),
      });
    }
    setOpen(false);
    resetForm();
  };

  const isSaving = addItemMutation.isPending || updateItemMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Inventory</h2>
          <p className="text-muted-foreground text-sm mt-1">Manage farm inventory and stock levels</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={handleOpen}>
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId !== null ? 'Edit Inventory Item' : 'Add Inventory Item'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inv-name">Item Name</Label>
                <Input
                  id="inv-name"
                  placeholder="Enter item name..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Item Type</Label>
                <Select value={itemType} onValueChange={v => setItemType(v as ItemType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ItemType.peppers}>Peppers</SelectItem>
                    <SelectItem value={ItemType.fertilizer}>Fertilizer</SelectItem>
                    <SelectItem value={ItemType.pesticide}>Pesticide</SelectItem>
                    <SelectItem value={ItemType.equipment}>Equipment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-qty">Quantity</Label>
                <Input
                  id="inv-qty"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-cost">Cost Per Unit (₦)</Label>
                <Input
                  id="inv-cost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={costPerUnit}
                  onChange={e => setCostPerUnit(e.target.value)}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : editingId !== null ? 'Update Item' : 'Add Item'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Card */}
      <div className="bg-secondary/30 border border-secondary/40 rounded-xl p-4 flex items-center gap-4">
        <div className="bg-secondary/50 rounded-full p-3">
          <Package className="h-6 w-6 text-secondary-foreground" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Inventory Value (filtered)</p>
          <p className="text-2xl font-bold text-foreground">{formatNaira(totalValue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value={ItemType.peppers}>Peppers</SelectItem>
            <SelectItem value={ItemType.fertilizer}>Fertilizer</SelectItem>
            <SelectItem value={ItemType.pesticide}>Pesticide</SelectItem>
            <SelectItem value={ItemType.equipment}>Equipment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Cost/Unit (₦)</TableHead>
                <TableHead className="text-right">Total Value (₦)</TableHead>
                <TableHead>
                  <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />Entered By</span>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading inventory...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No inventory items found.</TableCell>
                </TableRow>
              ) : (
                filtered.map(item => (
                  <TableRow key={item.id.toString()} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant={typeColors[item.itemType] ?? 'outline'}>
                        {typeLabels[item.itemType] ?? item.itemType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{item.quantity.toString()}</TableCell>
                    <TableCell className="text-right">{formatNaira(item.costPerUnit)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatNaira(item.costPerUnit * Number(item.quantity))}</TableCell>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {item.enteredBy || 'Unknown'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(item)} title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
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
