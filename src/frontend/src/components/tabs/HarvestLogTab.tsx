import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useIsCallerAdmin } from "@/hooks/useQueries";
import { Loader2, Plus, Trash2, Wheat } from "lucide-react";
import { useMemo, useState } from "react";

interface HarvestEntry {
  id: string;
  date: string;
  quantityKg: number;
  harvestedBy: string;
  plotLocation: string;
  notes: string;
}

const STORAGE_KEY = "harvestLog";

function loadEntries(): HarvestEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HarvestEntry[];
  } catch {
    return [];
  }
}

function saveEntries(entries: HarvestEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

export default function HarvestLogTab() {
  const { data: isAdmin } = useIsCallerAdmin();
  const [entries, setEntries] = useState<HarvestEntry[]>(loadEntries);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteKey, setDeleteKey] = useState("");
  const [deleteKeyError, setDeleteKeyError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formDate, setFormDate] = useState("");
  const [formQty, setFormQty] = useState("");
  const [formBy, setFormBy] = useState("");
  const [formPlot, setFormPlot] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formError, setFormError] = useState("");

  const sorted = useMemo(
    () => [...entries].sort((a, b) => b.date.localeCompare(a.date)),
    [entries],
  );

  const { start, end } = getCurrentMonthRange();

  const thisMonthEntries = useMemo(
    () =>
      entries.filter((e) => {
        const d = new Date(e.date);
        return d >= start && d <= end;
      }),
    [entries, start, end],
  );

  const totalKgThisMonth = useMemo(
    () => thisMonthEntries.reduce((sum, e) => sum + e.quantityKg, 0),
    [thisMonthEntries],
  );

  const resetForm = () => {
    setFormDate("");
    setFormQty("");
    setFormBy("");
    setFormPlot("");
    setFormNotes("");
    setFormError("");
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate || !formQty || !formBy || !formPlot) {
      setFormError("Please fill in all required fields.");
      return;
    }
    const qty = Number.parseFloat(formQty);
    if (Number.isNaN(qty) || qty <= 0) {
      setFormError("Quantity must be a positive number.");
      return;
    }
    const newEntry: HarvestEntry = {
      id: crypto.randomUUID(),
      date: formDate,
      quantityKg: qty,
      harvestedBy: formBy.trim(),
      plotLocation: formPlot.trim(),
      notes: formNotes.trim(),
    };
    const updated = [...entries, newEntry];
    saveEntries(updated);
    setEntries(updated);
    resetForm();
    setAddOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deleteKey !== "2642") {
      setDeleteKeyError("Incorrect key. Please try again.");
      return;
    }
    setIsDeleting(true);
    const updated = entries.filter((e) => e.id !== deleteTarget);
    saveEntries(updated);
    setEntries(updated);
    setDeleteTarget(null);
    setDeleteKey("");
    setDeleteKeyError("");
    setIsDeleting(false);
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
        {!isAdmin && (
          <Badge variant="secondary" className="ml-auto">
            View only — admin rights required to add/delete
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
              if (!v) resetForm();
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
              <form onSubmit={handleAdd} className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="harvest-date" className="text-xs">
                      Date *
                    </Label>
                    <Input
                      id="harvest-date"
                      data-ocid="harvest.input"
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
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
                      value={formQty}
                      onChange={(e) => setFormQty(e.target.value)}
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
                    value={formBy}
                    onChange={(e) => setFormBy(e.target.value)}
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
                    value={formPlot}
                    onChange={(e) => setFormPlot(e.target.value)}
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
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    rows={2}
                  />
                </div>
                {formError && (
                  <p
                    data-ocid="harvest.error_state"
                    className="text-xs text-destructive"
                  >
                    {formError}
                  </p>
                )}
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    data-ocid="harvest.cancel_button"
                    onClick={() => {
                      setAddOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button data-ocid="harvest.submit_button" type="submit">
                    Save Harvest
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {sorted.length === 0 ? (
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
                  {isAdmin && <TableHead className="w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((entry, idx) => (
                  <TableRow
                    key={entry.id}
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
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

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
              disabled={isDeleting}
            >
              {isDeleting ? (
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
