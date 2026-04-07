import type { HarvestEntry } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  useAddHarvestEntry,
  useDeleteHarvestEntry,
  useGetHarvestEntries,
  useIsCallerAdmin,
  useUpdateHarvestEntry,
} from "@/hooks/useQueries";
import { Loader2, Pencil, Plus, Trash2, Wheat } from "lucide-react";
import { useMemo, useState } from "react";

function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

function parseEntryDate(dateStr: string): Date {
  return new Date(dateStr);
}

interface HarvestFormProps {
  initial?: HarvestEntry;
  onSubmit: (data: {
    date: string;
    quantityKg: number;
    harvestedBy: string;
    plotLocation: string;
    notes: string;
  }) => void;
  onCancel: () => void;
  isPending: boolean;
  title: string;
}

function HarvestForm({
  initial,
  onSubmit,
  onCancel,
  isPending,
  title,
}: HarvestFormProps) {
  const [date, setDate] = useState(initial?.date ?? "");
  const [qty, setQty] = useState(initial ? String(initial.quantityKg) : "");
  const [by, setBy] = useState(initial?.harvestedBy ?? "");
  const [plot, setPlot] = useState(initial?.plotLocation ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !qty || !by || !plot) {
      setError("Please fill in all required fields.");
      return;
    }
    const quantityKg = Number.parseFloat(qty);
    if (Number.isNaN(quantityKg) || quantityKg <= 0) {
      setError("Quantity must be a positive number.");
      return;
    }
    onSubmit({
      date,
      quantityKg,
      harvestedBy: by.trim(),
      plotLocation: plot.trim(),
      notes: notes.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="harvest-date" className="text-xs">
            Date *
          </Label>
          <Input
            id="harvest-date"
            data-ocid="harvest.input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="harvest-qty" className="text-xs">
            Quantity (kg) *
          </Label>
          <Input
            id="harvest-qty"
            data-ocid="harvest.input"
            type="number"
            min="0.1"
            step="0.1"
            placeholder="e.g. 12.5"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="harvest-by" className="text-xs">
          Harvested By *
        </Label>
        <Input
          id="harvest-by"
          data-ocid="harvest.input"
          placeholder="Worker name"
          value={by}
          onChange={(e) => setBy(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="harvest-plot" className="text-xs">
          Plot / Location *
        </Label>
        <Input
          id="harvest-plot"
          data-ocid="harvest.input"
          placeholder="e.g. Plot A3, North Field"
          value={plot}
          onChange={(e) => setPlot(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="harvest-notes" className="text-xs">
          Notes (optional)
        </Label>
        <Textarea
          id="harvest-notes"
          data-ocid="harvest.textarea"
          placeholder="Pepper variety, quality notes…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>
      {error && (
        <p data-ocid="harvest.error_state" className="text-xs text-destructive">
          {error}
        </p>
      )}
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          data-ocid="harvest.cancel_button"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          data-ocid="harvest.submit_button"
          type="submit"
          disabled={isPending}
        >
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {title}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function HarvestLogTab() {
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: entries = [], isLoading } = useGetHarvestEntries();
  const addMutation = useAddHarvestEntry();
  const updateMutation = useUpdateHarvestEntry();
  const deleteMutation = useDeleteHarvestEntry();

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<HarvestEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<bigint | null>(null);
  const [deleteKey, setDeleteKey] = useState("");
  const [deleteKeyError, setDeleteKeyError] = useState("");

  const sorted = useMemo(
    () => [...entries].sort((a, b) => b.date.localeCompare(a.date)),
    [entries],
  );

  const { start, end } = getCurrentMonthRange();

  const thisMonthEntries = useMemo(
    () =>
      entries.filter((e) => {
        const d = parseEntryDate(e.date);
        return d >= start && d <= end;
      }),
    [entries, start, end],
  );

  const totalKgThisMonth = useMemo(
    () => thisMonthEntries.reduce((sum, e) => sum + e.quantityKg, 0),
    [thisMonthEntries],
  );

  const totalKgAllTime = useMemo(
    () => entries.reduce((sum, e) => sum + e.quantityKg, 0),
    [entries],
  );

  const handleAdd = async (data: {
    date: string;
    quantityKg: number;
    harvestedBy: string;
    plotLocation: string;
    notes: string;
  }) => {
    await addMutation.mutateAsync(data);
    setAddOpen(false);
  };

  const handleUpdate = async (data: {
    date: string;
    quantityKg: number;
    harvestedBy: string;
    plotLocation: string;
    notes: string;
  }) => {
    if (!editTarget) return;
    await updateMutation.mutateAsync({ id: editTarget.id, ...data });
    setEditTarget(null);
  };

  const handleDeleteConfirm = async () => {
    if (deleteKey !== "2642") {
      setDeleteKeyError("Incorrect key. Please try again.");
      return;
    }
    if (deleteTarget === null) return;
    await deleteMutation.mutateAsync(deleteTarget);
    setDeleteTarget(null);
    setDeleteKey("");
    setDeleteKeyError("");
  };

  const monthLabel = new Date().toLocaleString("en-NG", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Wheat className="h-6 w-6 text-primary" />
          Harvest Log
        </h2>
        <p className="text-muted-foreground text-sm">
          Track harvests by date, quantity, plot, and harvester.
        </p>
      </div>

      {/* Monthly Summary */}
      <div
        data-ocid="harvest.section"
        className="rounded-lg border border-primary/30 bg-primary/5 px-5 py-3 flex flex-wrap gap-6 items-center"
      >
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Harvests in {monthLabel}
          </p>
          <p className="text-2xl font-bold text-foreground">
            {thisMonthEntries.length}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Total kg this month
          </p>
          <p className="text-2xl font-bold text-primary">
            {totalKgThisMonth.toFixed(1)} kg
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            All-time total
          </p>
          <p className="text-2xl font-bold text-foreground">
            {totalKgAllTime.toFixed(1)} kg
          </p>
        </div>
        {!isAdmin && (
          <Badge variant="secondary" className="ml-auto">
            View only — admin rights required to add/edit/delete
          </Badge>
        )}
      </div>

      {/* Add Button + Table */}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-base text-foreground">
          All Harvest Entries
        </h3>
        {isAdmin && (
          <Dialog
            open={addOpen}
            onOpenChange={(v) => {
              setAddOpen(v);
            }}
          >
            <DialogTrigger asChild>
              <Button
                data-ocid="harvest.primary_button"
                className="gap-2"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add Harvest
              </Button>
            </DialogTrigger>
            <DialogContent data-ocid="harvest.dialog" className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Record Harvest</DialogTitle>
              </DialogHeader>
              <HarvestForm
                onSubmit={handleAdd}
                onCancel={() => setAddOpen(false)}
                isPending={addMutation.isPending}
                title="Save Harvest"
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {["a", "b", "c"].map((k) => (
            <Skeleton key={k} className="h-12 w-full" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div
          data-ocid="harvest.empty_state"
          className="rounded-lg border border-dashed border-border bg-muted/30 py-12 text-center text-sm text-muted-foreground"
        >
          <Wheat className="h-8 w-8 mx-auto mb-2 opacity-30" />
          No harvests recorded yet. Add the first one!
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table data-ocid="harvest.table">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Quantity (kg)</TableHead>
                  <TableHead>Harvested By</TableHead>
                  <TableHead>Plot / Location</TableHead>
                  <TableHead>Notes</TableHead>
                  {isAdmin && <TableHead className="w-20" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((entry, idx) => (
                  <TableRow
                    key={entry.id.toString()}
                    data-ocid={`harvest.item.${idx + 1}`}
                  >
                    <TableCell className="font-medium">
                      {new Date(entry.date).toLocaleDateString("en-NG", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="font-semibold text-primary">
                      {entry.quantityKg.toFixed(1)} kg
                    </TableCell>
                    <TableCell>{entry.harvestedBy}</TableCell>
                    <TableCell>{entry.plotLocation}</TableCell>
                    <TableCell className="text-muted-foreground text-xs max-w-[160px] truncate">
                      {entry.notes || "—"}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            data-ocid={`harvest.edit_button.${idx + 1}`}
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => setEditTarget(entry)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            data-ocid={`harvest.delete_button.${idx + 1}`}
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setDeleteTarget(entry.id);
                              setDeleteKey("");
                              setDeleteKeyError("");
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={editTarget !== null}
        onOpenChange={(v) => {
          if (!v) setEditTarget(null);
        }}
      >
        <DialogContent data-ocid="harvest.dialog" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Harvest Entry</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <HarvestForm
              initial={editTarget}
              onSubmit={handleUpdate}
              onCancel={() => setEditTarget(null)}
              isPending={updateMutation.isPending}
              title="Update Harvest"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(v) => {
          if (!v) {
            setDeleteTarget(null);
            setDeleteKey("");
            setDeleteKeyError("");
          }
        }}
      >
        <DialogContent data-ocid="harvest.dialog" className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Harvest Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. Please enter the admin deletion key
              to confirm.
            </p>
            <div className="space-y-1">
              <Label htmlFor="delete-key" className="text-xs">
                Deletion Key
              </Label>
              <Input
                id="delete-key"
                data-ocid="harvest.input"
                type="password"
                placeholder="Enter key"
                value={deleteKey}
                onChange={(e) => {
                  setDeleteKey(e.target.value);
                  setDeleteKeyError("");
                }}
              />
              {deleteKeyError && (
                <p
                  data-ocid="harvest.error_state"
                  className="text-xs text-destructive"
                >
                  {deleteKeyError}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="harvest.cancel_button"
              onClick={() => {
                setDeleteTarget(null);
                setDeleteKey("");
                setDeleteKeyError("");
              }}
            >
              Cancel
            </Button>
            <Button
              data-ocid="harvest.confirm_button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
