import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
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
  UserRole,
  WorkerDailyRecord,
  UserApprovalInfo,
  ApprovalStatus,
} from '../backend';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { Principal } from '@dfinity/principal';

// Bootstrap hook to trigger auto-admin registration via update call
export function useBootstrapAuthRegistration() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const [bootstrapComplete, setBootstrapComplete] = useState(false);

  useEffect(() => {
    const runBootstrap = async () => {
      if (!actor || isFetching || !identity || bootstrapComplete) return;
      
      try {
        // Call the update method to trigger auto-admin registration
        await actor.bootstrapAdminRegistration();
        setBootstrapComplete(true);
      } catch (error) {
        console.error('Bootstrap error:', error);
        // Still mark as complete to allow app to proceed
        setBootstrapComplete(true);
      }
    };

    runBootstrap();
  }, [actor, isFetching, identity, bootstrapComplete]);

  return {
    isBootstrapping: !bootstrapComplete && !!identity && !!actor,
    bootstrapComplete,
  };
}

// User Profile Queries
export function useGetCallerUserProfile(enabled = true) {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching && enabled,
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

// Approval Queries
export function useIsCallerApproved(enabled = true) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerApproved'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerApproved();
    },
    enabled: !!actor && !actorFetching && enabled,
    retry: false,
  });
}

export function useRequestApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.requestApproval();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isCallerApproved'] });
      toast.success('Approval request submitted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to request approval: ${error.message}`);
    },
  });
}

export function useListApprovals(enabled = true) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserApprovalInfo[]>({
    queryKey: ['listApprovals'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listApprovals();
    },
    enabled: !!actor && !actorFetching && enabled,
  });
}

export function useSetApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { user: Principal; status: ApprovalStatus }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setApproval(data.user, data.status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listApprovals'] });
      toast.success('User approval status updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update approval: ${error.message}`);
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

export function useUpdateExpense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      amount: number;
      date: bigint;
      category: ExpenseType;
      description: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateExpense(data.id, data.amount, data.date, data.category, data.description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseRecords'] });
      toast.success('Expense record updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update expense: ${error.message}`);
    },
  });
}

export function useDeleteExpense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteExpense(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseRecords'] });
      toast.success('Expense record deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete expense: ${error.message}`);
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

// Worker Daily Records (Farm Time Calendar)
export function useGetWorkerDailyRecords() {
  const { actor, isFetching } = useActor();

  return useQuery<WorkerDailyRecord[]>({
    queryKey: ['workerDailyRecords'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getWorkerDailyRecords();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetWorkerDailyRecordsByWorker(workerId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<WorkerDailyRecord[]>({
    queryKey: ['workerDailyRecordsByWorker', workerId?.toString()],
    queryFn: async () => {
      if (!actor || workerId === null) return [];
      return actor.getWorkerDailyRecordsByWorker(workerId);
    },
    enabled: !!actor && !isFetching && workerId !== null,
  });
}

export function useRecordWorkerDay() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      workerId: bigint;
      date: bigint;
      present: boolean;
      arrivalTime: bigint | null;
      departureTime: bigint | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.recordWorkerDay(
        data.workerId,
        data.date,
        data.present,
        data.arrivalTime,
        data.departureTime
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workerDailyRecords'] });
      queryClient.invalidateQueries({ queryKey: ['workerDailyRecordsByWorker'] });
      toast.success('Worker day recorded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to record worker day: ${error.message}`);
    },
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
  });
}

export function useAssignCallerUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { user: string; role: UserRole }) => {
      if (!actor) throw new Error('Actor not available');
      const principal = { toText: () => data.user } as any;
      return actor.assignCallerUserRole(principal, data.role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callerUserRole'] });
      queryClient.invalidateQueries({ queryKey: ['isCallerAdmin'] });
      toast.success('User role assigned successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign user role: ${error.message}`);
    },
  });
}
