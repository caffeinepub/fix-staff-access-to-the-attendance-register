import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type {
  UserProfile,
  InventoryItem,
  Customer,
  IncomeRecord,
  ExpenseRecord,
  Sale,
  IncomeSource,
  ExpenseType,
  ItemType,
  Worker,
  AttendanceRecord,
  Variant_onLeave_present_late_absent,
  UserRole,
} from '../backend';
import { toast } from 'sonner';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile saved successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save profile: ${error.message}`);
    },
  });
}

// Inventory Queries
export function useGetInventoryItems() {
  const { actor, isFetching } = useActor();

  return useQuery<InventoryItem[]>({
    queryKey: ['inventoryItems'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getInventoryItems();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddInventoryItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      itemType: ItemType;
      quantity: bigint;
      costPerUnit: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addInventoryItem(data.name, data.itemType, data.quantity, data.costPerUnit);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      toast.success('Inventory item added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add inventory item: ${error.message}`);
    },
  });
}

export function useUpdateInventoryItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      name: string;
      itemType: ItemType;
      quantity: bigint;
      costPerUnit: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateInventoryItem(data.id, data.name, data.itemType, data.quantity, data.costPerUnit);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      toast.success('Inventory item updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update inventory item: ${error.message}`);
    },
  });
}

// Customer Queries
export function useGetCustomers() {
  const { actor, isFetching } = useActor();

  return useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCustomers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddCustomer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; contactDetails: string; customerType: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addCustomer(data.name, data.contactDetails, data.customerType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add customer: ${error.message}`);
    },
  });
}

// Income Queries
export function useGetIncomeRecords() {
  const { actor, isFetching } = useActor();

  return useQuery<IncomeRecord[]>({
    queryKey: ['incomeRecords'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getIncomeRecords();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddIncome() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      amount: number;
      date: bigint;
      source: IncomeSource;
      description: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addIncome(data.amount, data.date, data.source, data.description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomeRecords'] });
      toast.success('Income record added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add income: ${error.message}`);
    },
  });
}

// Expense Queries
export function useGetExpenseRecords() {
  const { actor, isFetching } = useActor();

  return useQuery<ExpenseRecord[]>({
    queryKey: ['expenseRecords'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getExpenseRecords();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddExpense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      amount: number;
      date: bigint;
      category: ExpenseType;
      description: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addExpense(data.amount, data.date, data.category, data.description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseRecords'] });
      toast.success('Expense record added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add expense: ${error.message}`);
    },
  });
}

// Sales Queries
export function useGetSales() {
  const { actor, isFetching } = useActor();

  return useQuery<Sale[]>({
    queryKey: ['sales'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSales();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddSale() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      customerId: bigint;
      inventoryItemId: bigint;
      quantity: bigint;
      unitPrice: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addSale(data.customerId, data.inventoryItemId, data.quantity, data.unitPrice);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      queryClient.invalidateQueries({ queryKey: ['incomeRecords'] });
      toast.success('Sale recorded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to record sale: ${error.message}`);
    },
  });
}

export function useGetCustomerPurchaseHistory(customerId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Sale[]>({
    queryKey: ['customerPurchaseHistory', customerId?.toString()],
    queryFn: async () => {
      if (!actor || !customerId) return [];
      return actor.getCustomerPurchaseHistory(customerId);
    },
    enabled: !!actor && !isFetching && customerId !== null,
  });
}

// Worker Queries
export function useGetWorkers() {
  const { actor, isFetching } = useActor();

  return useQuery<Worker[]>({
    queryKey: ['workers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getWorkers();
    },
    enabled: !!actor && !isFetching,
    retry: 1,
  });
}

export function useAddWorker() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; role: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addWorker(data.name, data.role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      toast.success('Worker added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add worker: ${error.message}`);
    },
  });
}

// Attendance Queries
export function useGetAttendanceRecords() {
  const { actor, isFetching } = useActor();

  return useQuery<AttendanceRecord[]>({
    queryKey: ['attendanceRecords'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAttendanceRecords();
    },
    enabled: !!actor && !isFetching,
    retry: 1,
  });
}

export function useMarkAttendance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      workerId: bigint;
      date: bigint;
      status: Variant_onLeave_present_late_absent;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.markAttendance(data.workerId, data.date, data.status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendanceRecords'] });
      toast.success('Attendance marked successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to mark attendance: ${error.message}`);
    },
  });
}

export function useGetWorkerAttendance(workerId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<AttendanceRecord[]>({
    queryKey: ['workerAttendance', workerId?.toString()],
    queryFn: async () => {
      if (!actor || !workerId) return [];
      return actor.getWorkerAttendance(workerId);
    },
    enabled: !!actor && !isFetching && workerId !== null,
  });
}

// User Role Queries
export function useGetCallerUserRole() {
  const { actor, isFetching } = useActor();

  return useQuery<UserRole>({
    queryKey: ['callerUserRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
    retry: 1,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
    retry: 1,
  });
}
