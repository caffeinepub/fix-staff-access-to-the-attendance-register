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
import { Switch } from "@/components/ui/switch";
import {
  useGetWorkerDailyRecords,
  useGetWorkers,
  useRecordWorkerDay,
} from "@/hooks/useQueries";
import {
  dateToNanos,
  formatDuration,
  formatNanosToTime,
  generateMonthGrid,
  nanosToDate,
  parseTimeToNanos,
} from "@/utils/farmTime";
import { ChevronLeft, ChevronRight, Clock, User } from "lucide-react";
import { useMemo, useState } from "react";

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-NG", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function FarmTimeTab() {
  const { data: workers = [] } = useGetWorkers();
  const { data: allRecords = [] } = useGetWorkerDailyRecords();
  const recordWorkerDayMutation = useRecordWorkerDay();

  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("all");
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedWorkerForDay, setSelectedWorkerForDay] = useState<string>("");
  const [present, setPresent] = useState(true);
  const [arrivalTime, setArrivalTime] = useState("08:00");
  const [departureTime, setDepartureTime] = useState("17:00");

  const monthGrid = useMemo(
    () => generateMonthGrid(currentYear, currentMonth),
    [currentYear, currentMonth],
  );

  const filteredRecords = useMemo(() => {
    if (selectedWorkerId === "all") return allRecords;
    return allRecords.filter((r) => r.workerId.toString() === selectedWorkerId);
  }, [allRecords, selectedWorkerId]);

  const recordsByDateWorker = useMemo(() => {
    const map: Record<string, (typeof allRecords)[0]> = {};
    for (const r of allRecords) {
      const d = nanosToDate(r.date);
      const key = `${r.workerId}-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      map[key] = r;
    }
    return map;
  }, [allRecords]);

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

  const handleDayClick = (date: Date) => {
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

  const handleSave = async () => {
    if (!selectedDate || !selectedWorkerForDay) return;
    const dateNs = dateToNanos(selectedDate);
    const arrivalNs = present
      ? parseTimeToNanos(selectedDate, arrivalTime)
      : null;
    const departureNs = present
      ? parseTimeToNanos(selectedDate, departureTime)
      : null;
    await recordWorkerDayMutation.mutateAsync({
      workerId: BigInt(selectedWorkerForDay),
      date: dateNs,
      present,
      arrivalTime: arrivalNs,
      departureTime: departureNs,
    });
    setDialogOpen(false);
  };

  const monthName = new Date(currentYear, currentMonth).toLocaleString(
    "en-NG",
    { month: "long", year: "numeric" },
  );
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getWorkerName = (id: bigint) =>
    workers.find((w) => w.id === id)?.name ?? `Worker #${id}`;

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
            const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

            const workersToShow =
              selectedWorkerId === "all"
                ? workers
                : workers.filter((w) => w.id.toString() === selectedWorkerId);
            const dayRecords = workersToShow
              .map((w) => {
                const key = `${w.id}-${dateKey}`;
                return recordsByDateWorker[key];
              })
              .filter(Boolean);

            const hasPresent = dayRecords.some((r) => r.present);
            const hasAbsent = dayRecords.some((r) => !r.present);

            return (
              <button
                type="button"
                key={dateKey}
                onClick={() => handleDayClick(date)}
                className={`h-16 w-full text-left border-t border-border/50 p-1 cursor-pointer transition-colors hover:bg-primary/5 ${
                  isToday
                    ? "bg-primary/10 ring-1 ring-inset ring-primary/30"
                    : ""
                } ${!isCurrentMonth ? "opacity-40" : ""}`}
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
      </div>

      {/* Records Table */}
      {filteredRecords.length > 0 && (
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
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords
                    .slice()
                    .reverse()
                    .slice(0, 20)
                    .map((record) => (
                      <tr
                        key={`${record.workerId}-${record.date}`}
                        className="border-b border-border/50 hover:bg-muted/30"
                      >
                        <td className="px-4 py-3">
                          {getWorkerName(record.workerId)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatDate(nanosToDate(record.date))}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={record.present ? "default" : "destructive"}
                          >
                            {record.present ? "Present" : "Absent"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {record.arrivalTime != null
                            ? formatNanosToTime(record.arrivalTime)
                            : "—"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {record.departureTime != null
                            ? formatNanosToTime(record.departureTime)
                            : "—"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {record.timeOnFarm != null
                            ? formatDuration(record.timeOnFarm)
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {record.enteredBy || "Unknown"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Day Editor Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Record Day — {selectedDate ? formatDate(selectedDate) : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedWorkerId === "all" && (
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={recordWorkerDayMutation.isPending}
            >
              {recordWorkerDayMutation.isPending ? "Saving..." : "Save Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
