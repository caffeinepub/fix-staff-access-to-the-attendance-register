import type { FarmTimeEntry } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  useAddFarmTimeEntry,
  useDeleteFarmTimeEntry,
  useGetFarmTimeEntries,
  useGetWorkers,
  useIsCallerAdmin,
  useUpdateFarmTimeEntry,
} from "@/hooks/useQueries";
import { generateMonthGrid } from "@/utils/farmTime";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Pencil,
  Trash2,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-NG", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatDateStr(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function calcHours(arrival: string, departure: string): string {
  const [ah, am] = arrival.split(":").map(Number);
  const [dh, dm] = departure.split(":").map(Number);
  const totalMins = dh * 60 + dm - (ah * 60 + am);
  if (totalMins <= 0) return "—";
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function FarmTimeTab() {
  const { data: workers = [] } = useGetWorkers();
  const { data: allEntries = [], isLoading } = useGetFarmTimeEntries();
  const { data: isAdmin } = useIsCallerAdmin();
  const addMutation = useAddFarmTimeEntry();
  const updateMutation = useUpdateFarmTimeEntry();
  const deleteMutation = useDeleteFarmTimeEntry();

  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("all");
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FarmTimeEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedWorkerForDay, setSelectedWorkerForDay] = useState<string>("");
  const [present, setPresent] = useState(true);
  const [arrivalTime, setArrivalTime] = useState("08:00");
  const [departureTime, setDepartureTime] = useState("17:00");

  const [deleteTarget, setDeleteTarget] = useState<bigint | null>(null);
  const [deleteKey, setDeleteKey] = useState("");
  const [deleteKeyError, setDeleteKeyError] = useState("");

  const monthGrid = useMemo(
    () => generateMonthGrid(currentYear, currentMonth),
    [currentYear, currentMonth],
  );

  const filteredEntries = useMemo(() => {
    let list = allEntries;
    if (selectedWorkerId !== "all") {
      list = list.filter((e) => e.workerId.toString() === selectedWorkerId);
    }
    return [...list].sort((a, b) => b.date.localeCompare(a.date));
  }, [allEntries, selectedWorkerId]);

  // Map: workerId-dateStr -> entry for calendar view
  const entryByWorkerDate = useMemo(() => {
    const map: Record<string, FarmTimeEntry> = {};
    for (const e of allEntries) {
      map[`${e.workerId}-${e.date}`] = e;
    }
    return map;
  }, [allEntries]);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else setCurrentMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else setCurrentMonth((m) => m + 1);
  };

  const openAddDialog = (date: Date) => {
    setEditTarget(null);
    setSelectedDate(date);
    setSelectedWorkerForDay(
      selectedWorkerId !== "all"
        ? selectedWorkerId
        : (workers[0]?.id.toString() ?? ""),
    );
    setPresent(true);
    setArrivalTime("08:00");
    setDepartureTime("17:00");
    setDialogOpen(true);
  };

  const openEditDialog = (entry: FarmTimeEntry) => {
    setEditTarget(entry);
    setSelectedDate(null);
    setSelectedWorkerForDay(entry.workerId.toString());
    setPresent(entry.status !== "absent");
    setArrivalTime(entry.arrivalTime ?? "08:00");
    setDepartureTime(entry.departureTime ?? "17:00");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const status = present ? "present" : "absent";
    const arriv = present ? arrivalTime : null;
    const depart = present ? departureTime : null;

    if (editTarget) {
      await updateMutation.mutateAsync({
        id: editTarget.id,
        arrivalTime: arriv,
        departureTime: depart,
        status,
      });
    } else {
      if (!selectedDate || !selectedWorkerForDay) return;
      const worker = workers.find(
        (w) => w.id.toString() === selectedWorkerForDay,
      );
      await addMutation.mutateAsync({
        workerId: BigInt(selectedWorkerForDay),
        workerName: worker?.name ?? "Unknown",
        date: toDateString(selectedDate),
        arrivalTime: arriv,
        departureTime: depart,
        status,
      });
    }
    setDialogOpen(false);
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

  const monthName = new Date(currentYear, currentMonth).toLocaleString(
    "en-NG",
    {
      month: "long",
      year: "numeric",
    },
  );
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Farm Time</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Monthly attendance calendar for all workers
          </p>
        </div>
        <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="All Workers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Workers</SelectItem>
            {workers.map((w) => (
              <SelectItem key={w.id.toString()} value={w.id.toString()}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold">{monthName}</h3>
        <Button variant="outline" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="grid grid-cols-7 bg-muted/50">
          {dayNames.map((d) => (
            <div
              key={d}
              className="text-center text-xs font-semibold text-muted-foreground py-2"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {monthGrid.map((date) => {
            const isToday = date.toDateString() === new Date().toDateString();
            const isCurrentMonth = date.getMonth() === currentMonth;
            const dateStr = toDateString(date);

            const workersToShow =
              selectedWorkerId === "all"
                ? workers
                : workers.filter((w) => w.id.toString() === selectedWorkerId);
            const dayEntries = workersToShow
              .map((w) => entryByWorkerDate[`${w.id}-${dateStr}`])
              .filter(Boolean);
            const hasPresent = dayEntries.some(
              (e) => e.status === "present" || e.status === "late",
            );
            const hasAbsent = dayEntries.some((e) => e.status === "absent");

            return (
              <button
                type="button"
                key={dateStr}
                onClick={() => isAdmin && openAddDialog(date)}
                className={`h-16 w-full text-left border-t border-border/50 p-1 transition-colors ${isAdmin ? "cursor-pointer hover:bg-primary/5" : "cursor-default"} ${isToday ? "bg-primary/10 ring-1 ring-inset ring-primary/30" : ""} ${!isCurrentMonth ? "opacity-40" : ""}`}
              >
                <div
                  className={`text-xs font-medium mb-1 ${isToday ? "text-primary" : "text-foreground"}`}
                >
                  {date.getDate()}
                </div>
                <div className="flex flex-wrap gap-0.5">
                  {hasPresent && (
                    <div
                      className="w-2 h-2 rounded-full bg-primary"
                      title="Present"
                    />
                  )}
                  {hasAbsent && (
                    <div
                      className="w-2 h-2 rounded-full bg-destructive"
                      title="Absent"
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-primary inline-block" />{" "}
          Present
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-destructive inline-block" />{" "}
          Absent
        </span>
        {isAdmin && (
          <span className="text-xs ml-auto">(Click a date to log time)</span>
        )}
      </div>

      {/* Records Table */}
      {isLoading ? (
        <div className="space-y-2">
          {["a", "b", "c"].map((k) => (
            <Skeleton key={k} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        filteredEntries.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Recent Records</h3>
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                        Worker
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                        Date
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                        Arrival
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                        Departure
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Time on Farm
                        </span>
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          Entered By
                        </span>
                      </th>
                      {isAdmin && (
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground w-20" />
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.slice(0, 25).map((entry) => {
                      const arriv = entry.arrivalTime ?? null;
                      const depart = entry.departureTime ?? null;
                      const hours =
                        entry.hoursOnFarm != null
                          ? `${entry.hoursOnFarm.toFixed(1)}h`
                          : arriv && depart
                            ? calcHours(arriv, depart)
                            : "—";
                      return (
                        <tr
                          key={entry.id.toString()}
                          className="border-b border-border/50 hover:bg-muted/30"
                        >
                          <td className="px-4 py-3">{entry.workerName}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {formatDateStr(entry.date)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                entry.status === "absent"
                                  ? "destructive"
                                  : "default"
                              }
                            >
                              {entry.status.charAt(0).toUpperCase() +
                                entry.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {arriv ?? "—"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {depart ?? "—"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {hours}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                            {entry.enteredBy.toString().slice(0, 8)}…
                          </td>
                          {isAdmin && (
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => openEditDialog(entry)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
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
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editTarget
                ? "Edit Farm Time Entry"
                : `Record Day — ${selectedDate ? formatDate(selectedDate) : ""}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editTarget && selectedWorkerId === "all" && (
              <div className="space-y-2">
                <Label>Worker</Label>
                <Select
                  value={selectedWorkerForDay}
                  onValueChange={setSelectedWorkerForDay}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select worker..." />
                  </SelectTrigger>
                  <SelectContent>
                    {workers.map((w) => (
                      <SelectItem key={w.id.toString()} value={w.id.toString()}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Switch
                checked={present}
                onCheckedChange={setPresent}
                id="present-switch"
              />
              <Label htmlFor="present-switch">
                {present ? "Present" : "Absent"}
              </Label>
            </div>
            {present && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="arrival">Arrival Time</Label>
                  <Input
                    id="arrival"
                    type="time"
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="departure">Departure Time</Label>
                  <Input
                    id="departure"
                    type="time"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setEditTarget(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={addMutation.isPending || updateMutation.isPending}
            >
              {addMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : "Save Record"}
            </Button>
          </DialogFooter>
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
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Farm Time Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. Enter the admin deletion key to
              confirm.
            </p>
            <div className="space-y-1">
              <Label htmlFor="ft-delete-key" className="text-xs">
                Deletion Key
              </Label>
              <Input
                id="ft-delete-key"
                type="password"
                placeholder="Enter key"
                value={deleteKey}
                onChange={(e) => {
                  setDeleteKey(e.target.value);
                  setDeleteKeyError("");
                }}
              />
              {deleteKeyError && (
                <p className="text-xs text-destructive">{deleteKeyError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteTarget(null);
                setDeleteKey("");
                setDeleteKeyError("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              Delete Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
