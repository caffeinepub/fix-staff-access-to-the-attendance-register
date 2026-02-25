import { useState, useMemo } from 'react';
import {
  useGetWorkers,
  useGetWorkerDailyRecords,
  useRecordWorkerDay,
} from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ChevronLeft, ChevronRight, AlertCircle, RefreshCw, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { WorkerDailyRecord } from '../../backend';
import {
  generateMonthGrid,
  isInMonth,
  isSameDay,
  formatMonthYear,
  formatDateShort,
  getStartOfDayNanos,
  parseTimeToNanos,
  formatNanosToTime,
  formatDuration,
} from '../../utils/farmTime';

export default function FarmTimeTab() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [dayForm, setDayForm] = useState({
    present: true,
    arrivalTime: '',
    departureTime: '',
  });
  const [validationError, setValidationError] = useState<string>('');

  const {
    data: workers = [],
    isLoading: workersLoading,
    error: workersError,
    refetch: refetchWorkers,
  } = useGetWorkers();

  const {
    data: allDailyRecords = [],
    isLoading: recordsLoading,
    error: recordsError,
    refetch: refetchRecords,
  } = useGetWorkerDailyRecords();

  const recordWorkerDayMutation = useRecordWorkerDay();

  const isLoading = workersLoading || recordsLoading;
  const hasError = workersError || recordsError;

  // Filter records by selected worker
  const dailyRecords = useMemo(() => {
    if (!selectedWorkerId) return [];
    const workerIdBigInt = BigInt(selectedWorkerId);
    return allDailyRecords.filter((record) => record.workerId === workerIdBigInt);
  }, [allDailyRecords, selectedWorkerId]);

  const monthGrid = useMemo(() => {
    return generateMonthGrid(currentDate.getFullYear(), currentDate.getMonth());
  }, [currentDate]);

  const recordsMap = useMemo(() => {
    const map = new Map<string, WorkerDailyRecord>();
    dailyRecords.forEach((record) => {
      const date = new Date(Number(record.date / BigInt(1000000)));
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      map.set(key, record);
    });
    return map;
  }, [dailyRecords]);

  const getRecordForDate = (date: Date): WorkerDailyRecord | undefined => {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return recordsMap.get(key);
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (date: Date) => {
    if (!selectedWorkerId) return;
    
    setSelectedDate(date);
    const existingRecord = getRecordForDate(date);
    
    if (existingRecord) {
      setDayForm({
        present: existingRecord.present,
        arrivalTime: existingRecord.arrivalTime ? formatNanosToTime(existingRecord.arrivalTime) : '',
        departureTime: existingRecord.departureTime ? formatNanosToTime(existingRecord.departureTime) : '',
      });
    } else {
      setDayForm({
        present: true,
        arrivalTime: '',
        departureTime: '',
      });
    }
    
    setValidationError('');
    setDialogOpen(true);
  };

  const handleSaveDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedWorkerId) return;

    setValidationError('');

    let arrivalNanos: bigint | null = null;
    let departureNanos: bigint | null = null;

    if (dayForm.arrivalTime) {
      arrivalNanos = parseTimeToNanos(selectedDate, dayForm.arrivalTime);
      if (arrivalNanos === null) {
        setValidationError('Invalid arrival time format. Use HH:MM (e.g., 08:30)');
        return;
      }
    }

    if (dayForm.departureTime) {
      departureNanos = parseTimeToNanos(selectedDate, dayForm.departureTime);
      if (departureNanos === null) {
        setValidationError('Invalid departure time format. Use HH:MM (e.g., 17:30)');
        return;
      }
    }

    if (arrivalNanos && departureNanos && departureNanos <= arrivalNanos) {
      setValidationError('Departure time must be after arrival time');
      return;
    }

    try {
      await recordWorkerDayMutation.mutateAsync({
        workerId: BigInt(selectedWorkerId),
        date: getStartOfDayNanos(selectedDate),
        present: dayForm.present,
        arrivalTime: arrivalNanos,
        departureTime: departureNanos,
      });

      setDialogOpen(false);
      setSelectedDate(null);
    } catch (error: any) {
      setValidationError(error.message || 'Failed to save record');
    }
  };

  const handleRetry = () => {
    refetchWorkers();
    refetchRecords();
  };

  const computeTimeSpent = (): string | null => {
    if (!dayForm.arrivalTime || !dayForm.departureTime || !selectedDate) return null;

    const arrivalNanos = parseTimeToNanos(selectedDate, dayForm.arrivalTime);
    const departureNanos = parseTimeToNanos(selectedDate, dayForm.departureTime);

    if (!arrivalNanos || !departureNanos || departureNanos <= arrivalNanos) {
      return null;
    }

    const duration = departureNanos - arrivalNanos;
    return formatDuration(duration);
  };

  const timeSpent = computeTimeSpent();

  if (hasError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Farm Time Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>
                {workersError
                  ? `Failed to load workers: ${workersError.message}`
                  : `Failed to load records: ${recordsError?.message}`}
              </span>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Farm Time Calendar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Worker Selection */}
          <div className="space-y-2">
            <Label htmlFor="worker-select">Select Worker</Label>
            <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
              <SelectTrigger id="worker-select">
                <SelectValue placeholder="Choose a worker..." />
              </SelectTrigger>
              <SelectContent>
                {workers.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">No workers available</div>
                ) : (
                  workers.map((worker) => (
                    <SelectItem key={worker.id.toString()} value={worker.id.toString()}>
                      {worker.name} - {worker.role}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {!selectedWorkerId && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Worker Selected</AlertTitle>
              <AlertDescription>
                Please select a worker to view and manage their farm time calendar.
              </AlertDescription>
            </Alert>
          )}

          {selectedWorkerId && (
            <>
              {/* Month Navigation */}
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-lg font-semibold">{formatMonthYear(currentDate)}</h3>
                <Button variant="outline" size="sm" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Calendar Grid */}
              <div className="border rounded-lg overflow-hidden">
                {/* Day Headers */}
                <div className="grid grid-cols-7 bg-muted">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div
                      key={day}
                      className="p-2 text-center text-sm font-medium border-r last:border-r-0"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7">
                  {monthGrid.map((date, index) => {
                    const isCurrentMonth = isInMonth(
                      date,
                      currentDate.getMonth(),
                      currentDate.getFullYear()
                    );
                    const isToday = isSameDay(date, new Date());
                    const record = getRecordForDate(date);

                    return (
                      <button
                        key={index}
                        onClick={() => handleDayClick(date)}
                        disabled={!isCurrentMonth}
                        className={`
                          min-h-[80px] p-2 border-r border-b last:border-r-0
                          ${!isCurrentMonth ? 'bg-muted/30 text-muted-foreground cursor-not-allowed' : 'hover:bg-accent cursor-pointer'}
                          ${isToday ? 'bg-primary/10' : ''}
                          transition-colors
                        `}
                      >
                        <div className="flex flex-col items-start h-full">
                          <span
                            className={`text-sm font-medium ${isToday ? 'text-primary font-bold' : ''}`}
                          >
                            {date.getDate()}
                          </span>
                          {record && isCurrentMonth && (
                            <div className="mt-1 w-full">
                              {record.present ? (
                                <div className="space-y-1">
                                  <div className="text-xs font-medium text-green-600 dark:text-green-400">
                                    Present
                                  </div>
                                  {record.timeOnFarm && (
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatDuration(record.timeOnFarm)}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-xs font-medium text-red-600 dark:text-red-400">
                                  Absent
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Day Editor Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDate ? formatDateShort(selectedDate) : 'Edit Day'}
            </DialogTitle>
            <DialogDescription>
              Record presence and time spent on the farm for this day.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveDay} className="space-y-4">
            {/* Status Selection */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={dayForm.present ? 'present' : 'absent'}
                onValueChange={(value) => setDayForm({ ...dayForm, present: value === 'present' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time Inputs (only when present) */}
            {dayForm.present && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="arrival-time">Arrival Time (HH:MM)</Label>
                  <Input
                    id="arrival-time"
                    type="text"
                    placeholder="08:00"
                    value={dayForm.arrivalTime}
                    onChange={(e) => setDayForm({ ...dayForm, arrivalTime: e.target.value })}
                    pattern="[0-9]{2}:[0-9]{2}"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="departure-time">Departure Time (HH:MM)</Label>
                  <Input
                    id="departure-time"
                    type="text"
                    placeholder="17:00"
                    value={dayForm.departureTime}
                    onChange={(e) => setDayForm({ ...dayForm, departureTime: e.target.value })}
                    pattern="[0-9]{2}:[0-9]{2}"
                  />
                </div>

                {/* Time Spent Display */}
                {timeSpent && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertTitle>Time Spent</AlertTitle>
                    <AlertDescription className="text-lg font-semibold">
                      {timeSpent}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}

            {/* Validation Error */}
            {validationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={recordWorkerDayMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={recordWorkerDayMutation.isPending}>
                {recordWorkerDayMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
