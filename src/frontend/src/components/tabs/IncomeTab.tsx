import { IncomeSource } from "@/backend";
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
import { Badge } from "@/components/ui/badge";
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
  useAddIncome,
  useDeleteIncome,
  useGetIncomeRecords,
  useIsCallerAdmin,
  useUpdateIncome,
} from "@/hooks/useQueries";
import {
  Download,
  Pencil,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  User,
} from "lucide-react";
import { useState } from "react";

const sourceLabels: Record<string, string> = {
  market: "Market",
  wholesale: "Wholesale",
  local: "Local",
  other: "Other",
};

const sourceColors: Record<string, "default" | "secondary" | "outline"> = {
  market: "default",
  wholesale: "secondary",
  local: "outline",
  other: "outline",
};

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

function toDateInputValue(timestamp: bigint): string {
  const d = new Date(Number(timestamp) / 1_000_000);
  return d.toISOString().split("T")[0];
}

function exportCSV(
  records: {
    date: bigint;
    source: string;
    description: string;
    amount: number;
    enteredBy: string;
  }[],
) {
  const header = "Date,Source,Description,Amount,Entered By";
  const rows = records.map((r) =>
    [
      formatDate(r.date),
      r.source,
      `"${r.description.replace(/"/g, '""')}"`,
      r.amount.toFixed(2),
      r.enteredBy,
    ].join(","),
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `income-records-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function IncomeTab() {
  const { data: incomeRecords = [], isLoading } = useGetIncomeRecords();
  const { data: isAdmin } = useIsCallerAdmin();
  const addIncomeMutation = useAddIncome();
  const updateIncomeMutation = useUpdateIncome();
  const deleteIncomeMutation = useDeleteIncome();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [deleteKey, setDeleteKey] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<bigint | null>(null);

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [source, setSource] = useState<IncomeSource>(IncomeSource.market);
  const [description, setDescription] = useState("");

  const filtered = incomeRecords.filter((r) => {
    const matchSearch = r.description
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchSource = filterSource === "all" || r.source === filterSource;
    return matchSearch && matchSource;
  });

  const totalIncome = filtered.reduce((sum, r) => sum + r.amount, 0);

  const resetForm = () => {
    setAmount("");
    setDate("");
    setSource(IncomeSource.market);
    setDescription("");
    setEditingId(null);
  };

  const handleEdit = (record: (typeof incomeRecords)[0]) => {
    setEditingId(record.id);
    setAmount(record.amount.toString());
    setDate(toDateInputValue(record.date));
    setSource(record.source as IncomeSource);
    setDescription(record.description);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !date) return;
    const dateMs = new Date(date).getTime();
    const dateNs = BigInt(dateMs) * 1_000_000n;
    if (editingId !== null) {
      await updateIncomeMutation.mutateAsync({
        id: editingId,
        amount: Number.parseFloat(amount),
        date: dateNs,
        source,
        description,
      });
    } else {
      await addIncomeMutation.mutateAsync({
        amount: Number.parseFloat(amount),
        date: dateNs,
        source,
        description,
      });
    }
    setOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (deleteKey !== "2642" || deleteTargetId === null) return;
    await deleteIncomeMutation.mutateAsync(deleteTargetId);
    setDeleteTargetId(null);
    setDeleteKey("");
  };

  const isSaving =
    addIncomeMutation.isPending || updateIncomeMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Income Records</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Track all farm income sources
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => exportCSV(filtered)}
            data-ocid="income.export_button"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Dialog
            open={open}
            onOpenChange={(v) => {
              if (!v) resetForm();
              setOpen(v);
            }}
          >
            <DialogTrigger asChild>
              <Button
                className="gap-2"
                onClick={() => {
                  resetForm();
                  setOpen(true);
                }}
                data-ocid="income.open_modal_button"
              >
                <Plus className="h-4 w-4" />
                Add Income
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingId !== null ? "Edit Income" : "Add Income Record"}
                </DialogTitle>
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
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    data-ocid="income.input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select
                    value={source}
                    onValueChange={(v) => setSource(v as IncomeSource)}
                  >
                    <SelectTrigger data-ocid="income.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={IncomeSource.market}>
                        Market
                      </SelectItem>
                      <SelectItem value={IncomeSource.wholesale}>
                        Wholesale
                      </SelectItem>
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
                    onChange={(e) => setDescription(e.target.value)}
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
                    data-ocid="income.cancel_button"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    data-ocid="income.submit_button"
                  >
                    {isSaving
                      ? "Saving..."
                      : editingId !== null
                        ? "Update Income"
                        : "Save Income"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-4">
        <div className="bg-primary/20 rounded-full p-3">
          <TrendingUp className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">
            Total Income (filtered)
          </p>
          <p className="text-2xl font-bold text-primary">
            {formatNaira(totalIncome)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-ocid="income.search_input"
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
                    colSpan={isAdmin ? 6 : 5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Loading income records...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isAdmin ? 6 : 5}
                    className="text-center py-8 text-muted-foreground"
                    data-ocid="income.empty_state"
                  >
                    No income records found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((record, idx) => (
                  <TableRow
                    key={record.id.toString()}
                    className="hover:bg-muted/30"
                    data-ocid={`income.item.${idx + 1}`}
                  >
                    <TableCell className="whitespace-nowrap">
                      {formatDate(record.date)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={sourceColors[record.source] ?? "outline"}>
                        {sourceLabels[record.source] ?? record.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {record.description || "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary whitespace-nowrap">
                      {formatNaira(record.amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {record.enteredBy || "Unknown"}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(record)}
                            title="Edit"
                            data-ocid={`income.edit_button.${idx + 1}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog
                            open={deleteTargetId === record.id}
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
                                onClick={() => setDeleteTargetId(record.id)}
                                data-ocid={`income.delete_button.${idx + 1}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent data-ocid="income.dialog">
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Income Record
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Enter the deletion key to confirm. This action
                                  cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <Input
                                type="password"
                                placeholder="Enter deletion key..."
                                value={deleteKey}
                                onChange={(e) => setDeleteKey(e.target.value)}
                                data-ocid="income.input"
                              />
                              <AlertDialogFooter>
                                <AlertDialogCancel data-ocid="income.cancel_button">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDelete}
                                  disabled={
                                    deleteKey !== "2642" ||
                                    deleteIncomeMutation.isPending
                                  }
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  data-ocid="income.confirm_button"
                                >
                                  {deleteIncomeMutation.isPending
                                    ? "Deleting..."
                                    : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
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
