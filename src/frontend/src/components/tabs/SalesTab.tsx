import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAddSale,
  useDeleteSale,
  useGetCustomers,
  useGetInventoryItems,
  useGetSales,
  useIsCallerAdmin,
} from "@/hooks/useQueries";
import { Plus, Search, ShoppingCart, Trash2, User } from "lucide-react";
import { useState } from "react";

function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(timestamp: bigint): string {
  return new Date(Number(timestamp) / 1_000_000).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function SalesTab() {
  const { data: sales = [], isLoading } = useGetSales();
  const { data: customers = [] } = useGetCustomers();
  const { data: inventoryItems = [] } = useGetInventoryItems();
  const { data: isAdmin } = useIsCallerAdmin();
  const addSaleMutation = useAddSale();
  const deleteSaleMutation = useDeleteSale();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<bigint | null>(null);
  const [deleteKey, setDeleteKey] = useState("");

  const [customerId, setCustomerId] = useState("");
  const [inventoryItemId, setInventoryItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");

  const customerMap = Object.fromEntries(
    customers.map((c) => [c.id.toString(), c.name]),
  );
  const inventoryMap = Object.fromEntries(
    inventoryItems.map((i) => [i.id.toString(), i.name]),
  );

  const filtered = sales.filter((s) => {
    const customerName = customerMap[s.customerId.toString()] ?? "";
    const itemName = inventoryMap[s.inventoryItemId.toString()] ?? "";
    return (
      customerName.toLowerCase().includes(search.toLowerCase()) ||
      itemName.toLowerCase().includes(search.toLowerCase())
    );
  });

  const totalRevenue = filtered.reduce(
    (sum, s) => sum + s.unitPrice * Number(s.quantity),
    0,
  );

  const resetForm = () => {
    setCustomerId("");
    setInventoryItemId("");
    setQuantity("");
    setUnitPrice("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !inventoryItemId || !quantity || !unitPrice) return;
    await addSaleMutation.mutateAsync({
      customerId: BigInt(customerId),
      inventoryItemId: BigInt(inventoryItemId),
      quantity: BigInt(quantity),
      unitPrice: Number.parseFloat(unitPrice),
    });
    setOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (deleteKey !== "2642" || deleteTargetId === null) return;
    await deleteSaleMutation.mutateAsync(deleteTargetId);
    setDeleteTargetId(null);
    setDeleteKey("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Sales Records</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Track all farm sales transactions
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            if (!v) resetForm();
            setOpen(v);
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2" data-ocid="sales.open_modal_button">
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
                  <SelectTrigger data-ocid="sales.select">
                    <SelectValue placeholder="Select customer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id.toString()} value={c.id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Inventory Item</Label>
                <Select
                  value={inventoryItemId}
                  onValueChange={setInventoryItemId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select item..." />
                  </SelectTrigger>
                  <SelectContent>
                    {inventoryItems.map((i) => (
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
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  data-ocid="sales.input"
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
                  onChange={(e) => setUnitPrice(e.target.value)}
                  required
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    resetForm();
                  }}
                  data-ocid="sales.cancel_button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addSaleMutation.isPending}
                  data-ocid="sales.submit_button"
                >
                  {addSaleMutation.isPending ? "Saving..." : "Record Sale"}
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
          <p className="text-sm text-muted-foreground">
            Total Revenue (filtered)
          </p>
          <p className="text-2xl font-bold text-primary">
            {formatNaira(totalRevenue)}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by customer or item..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-ocid="sales.search_input"
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
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    Entered By
                  </span>
                </TableHead>
                {isAdmin && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={isAdmin ? 8 : 7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Loading sales...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isAdmin ? 8 : 7}
                    className="text-center py-8 text-muted-foreground"
                    data-ocid="sales.empty_state"
                  >
                    No sales records found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((sale, idx) => (
                  <TableRow
                    key={sale.id.toString()}
                    className="hover:bg-muted/30"
                    data-ocid={`sales.item.${idx + 1}`}
                  >
                    <TableCell className="whitespace-nowrap">
                      {formatDate(sale.date)}
                    </TableCell>
                    <TableCell>
                      {customerMap[sale.customerId.toString()] ??
                        `Customer #${sale.customerId}`}
                    </TableCell>
                    <TableCell>
                      {inventoryMap[sale.inventoryItemId.toString()] ??
                        `Item #${sale.inventoryItemId}`}
                    </TableCell>
                    <TableCell className="text-right">
                      {sale.quantity.toString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNaira(sale.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {formatNaira(sale.unitPrice * Number(sale.quantity))}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {sale.enteredBy || "Unknown"}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <AlertDialog
                          open={deleteTargetId === sale.id}
                          onOpenChange={(v) => {
                            if (!v) {
                              setDeleteTargetId(null);
                              setDeleteKey("");
                            }
                          }}
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteTargetId(sale.id)}
                              data-ocid={`sales.delete_button.${idx + 1}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent data-ocid="sales.dialog">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Sale</AlertDialogTitle>
                              <AlertDialogDescription>
                                Enter the deletion key to confirm. Inventory
                                quantity will be restored.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <Input
                              type="password"
                              placeholder="Enter deletion key..."
                              value={deleteKey}
                              onChange={(e) => setDeleteKey(e.target.value)}
                              data-ocid="sales.input"
                            />
                            <AlertDialogFooter>
                              <AlertDialogCancel data-ocid="sales.cancel_button">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleDelete}
                                disabled={
                                  deleteKey !== "2642" ||
                                  deleteSaleMutation.isPending
                                }
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                data-ocid="sales.confirm_button"
                              >
                                {deleteSaleMutation.isPending
                                  ? "Deleting..."
                                  : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    )}
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
