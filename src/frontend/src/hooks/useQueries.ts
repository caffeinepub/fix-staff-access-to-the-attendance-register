import type { Principal } from "@dfinity/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type {
  ApprovalStatus,
  Customer,
  Department,
  ExpenseRecord,
  ExpenseType,
  FarmTimeEntry,
  FileAttachment,
  FileAttachmentMetadata,
  HarvestEntry,
  IncomeRecord,
  IncomeSource,
  InventoryItem,
  ItemType,
  MonthlyGoal,
  Sale,
  UserApprovalInfo,
  UserProfile,
  WeeklyReport,
  Worker,
  WorkerDailyRecord,
} from "../backend";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

// Bootstrap hook to trigger auto-admin registration via update call
export function useBootstrapAuthRegistration() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const [bootstrapComplete, setBootstrapComplete] = useState(false);

  useEffect(() => {
    const runBootstrap = async () => {
      if (!actor || isFetching || !identity || bootstrapComplete) return;

      try {
        await actor.bootstrapAdminRegistration();
        setBootstrapComplete(true);
      } catch (error) {
        console.error("Bootstrap error:", error);
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
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
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
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      toast.success("Profile saved successfully");
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
    queryKey: ["isCallerApproved"],
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
      if (!actor) throw new Error("Actor not available");
      return actor.requestApproval();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isCallerApproved"] });
      toast.success("Approval request submitted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to request approval: ${error.message}`);
    },
  });
}

export function useListApprovals(enabled = true) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserApprovalInfo[]>({
    queryKey: ["listApprovals"],
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
      if (!actor) throw new Error("Actor not available");
      return actor.setApproval(data.user, data.status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listApprovals"] });
      toast.success("User approval status updated");
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
    queryKey: ["inventoryItems"],
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
      if (!actor) throw new Error("Actor not available");
      return actor.addInventoryItem(
        data.name,
        data.itemType,
        data.quantity,
        data.costPerUnit,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
      toast.success("Inventory item added successfully");
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
      if (!actor) throw new Error("Actor not available");
      return actor.updateInventoryItem(
        data.id,
        data.name,
        data.itemType,
        data.quantity,
        data.costPerUnit,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
      toast.success("Inventory item updated successfully");
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
    queryKey: ["customers"],
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
    mutationFn: async (data: {
      name: string;
      contactDetails: string;
      customerType: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addCustomer(
        data.name,
        data.contactDetails,
        data.customerType,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer added successfully");
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
    queryKey: ["incomeRecords"],
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
      if (!actor) throw new Error("Actor not available");
      return actor.addIncome(
        data.amount,
        data.date,
        data.source,
        data.description,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomeRecords"] });
      toast.success("Income record added successfully");
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
    queryKey: ["expenseRecords"],
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
      if (!actor) throw new Error("Actor not available");
      return actor.addExpense(
        data.amount,
        data.date,
        data.category,
        data.description,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenseRecords"] });
      toast.success("Expense record added successfully");
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
      if (!actor) throw new Error("Actor not available");
      return actor.updateExpense(
        data.id,
        data.amount,
        data.date,
        data.category,
        data.description,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenseRecords"] });
      toast.success("Expense record updated successfully");
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
      if (!actor) throw new Error("Actor not available");
      return actor.deleteExpense(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenseRecords"] });
      toast.success("Expense record deleted successfully");
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
    queryKey: ["sales"],
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
      if (!actor) throw new Error("Actor not available");
      return actor.addSale(
        data.customerId,
        data.inventoryItemId,
        data.quantity,
        data.unitPrice,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
      queryClient.invalidateQueries({ queryKey: ["incomeRecords"] });
      toast.success("Sale recorded successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to record sale: ${error.message}`);
    },
  });
}

export function useGetCustomerPurchaseHistory(customerId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Sale[]>({
    queryKey: ["customerPurchaseHistory", customerId?.toString()],
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
    queryKey: ["workers"],
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
      if (!actor) throw new Error("Actor not available");
      return actor.addWorker(data.name, data.role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
      toast.success("Worker added successfully");
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
    queryKey: ["workerDailyRecords"],
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
    queryKey: ["workerDailyRecordsByWorker", workerId?.toString()],
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
      if (!actor) throw new Error("Actor not available");
      return actor.recordWorkerDay(
        data.workerId,
        data.date,
        data.present,
        data.arrivalTime,
        data.departureTime,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workerDailyRecords"] });
      queryClient.invalidateQueries({
        queryKey: ["workerDailyRecordsByWorker"],
      });
      toast.success("Worker day recorded successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to record worker day: ${error.message}`);
    },
  });
}

// User Role Queries
export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor || !identity) return false;
      const principal = identity.getPrincipal();
      return actor.isAutoRegisteredAdmin(principal);
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useGetCallerUserRole() {
  // Not available in current backend — returns undefined
  return useQuery<undefined>({
    queryKey: ["callerUserRole"],
    queryFn: async () => undefined,
    enabled: false,
  });
}

export function useAssignCallerUserRole() {
  // Stub — not in backend
  return useMutation({
    mutationFn: async (_data: { user: Principal; role: unknown }) => {
      throw new Error("Not implemented");
    },
  });
}

// ─── Farm Operations Queries ───────────────────────────────────────────────

export function useGetDepartments() {
  const { actor, isFetching } = useActor();

  return useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDepartments();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMonthlyGoals() {
  const { actor, isFetching } = useActor();

  return useQuery<MonthlyGoal[]>({
    queryKey: ["monthlyGoals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMonthlyGoals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddMonthlyGoal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      year: bigint;
      month: bigint;
      targetPlots: bigint;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addMonthlyGoal(data.year, data.month, data.targetPlots);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthlyGoals"] });
      toast.success("Monthly goal created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create monthly goal: ${error.message}`);
    },
  });
}

export function useAddPlotEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      monthlyGoalId: bigint;
      plotName: string;
      dateActivated: bigint;
      department: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addPlotEntry(
        data.monthlyGoalId,
        data.plotName,
        data.dateActivated,
        data.department,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthlyGoals"] });
      toast.success("Plot entry added successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to add plot entry: ${error.message}`);
    },
  });
}

export function useGetWeeklyReports() {
  const { actor, isFetching } = useActor();

  return useQuery<WeeklyReport[]>({
    queryKey: ["weeklyReports"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getWeeklyReports();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubmitWeeklyReport() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      departmentLead: string;
      departmentName: string;
      weekEnding: bigint;
      achievements: string;
      challenges: string;
      planForNextWeek: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.submitWeeklyReport(
        data.departmentLead,
        data.departmentName,
        data.weekEnding,
        data.achievements,
        data.challenges,
        data.planForNextWeek,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weeklyReports"] });
      toast.success("Weekly report submitted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit weekly report: ${error.message}`);
    },
  });
}

export function useInitializeFixedMonthlyGoals() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.initializeFixedMonthlyGoals();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthlyGoals"] });
      toast.success("Monthly goals initialized successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to initialize monthly goals: ${error.message}`);
    },
  });
}

// ─── File Attachment Queries (Inventory Items) ─────────────────────────────

export function useGetAttachmentsForItem(inventoryItemId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<FileAttachmentMetadata[]>({
    queryKey: ["attachmentsForItem", inventoryItemId?.toString()],
    queryFn: async () => {
      if (!actor || inventoryItemId === null) return [];
      return actor.getAttachmentsForItem(inventoryItemId);
    },
    enabled: !!actor && !isFetching && inventoryItemId !== null,
  });
}

export function useGetAttachment(attachmentId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<FileAttachment | null>({
    queryKey: ["attachment", attachmentId?.toString()],
    queryFn: async () => {
      if (!actor || attachmentId === null) return null;
      return actor.getAttachment(attachmentId);
    },
    enabled: !!actor && !isFetching && attachmentId !== null,
  });
}

export function useUploadAttachmentToItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      inventoryItemId: bigint;
      filename: string;
      mimeType: string;
      content: Uint8Array;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.uploadAttachmentToItem(
        data.inventoryItemId,
        data.filename,
        data.mimeType,
        data.content,
      );
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["attachmentsForItem", variables.inventoryItemId.toString()],
      });
      toast.success("File uploaded successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload file: ${error.message}`);
    },
  });
}

export function useDeleteAttachment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: bigint; inventoryItemId: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteAttachment(data.id);
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["attachmentsForItem", variables.inventoryItemId.toString()],
      });
      // Also remove any cached full attachment content
      queryClient.removeQueries({
        queryKey: ["attachment", variables.id.toString()],
      });
      toast.success("Attachment deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete attachment: ${error.message}`);
    },
  });
}

// Income mutations
export function useDeleteIncome() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteIncome(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomeRecords"] });
      toast.success("Income record deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete income: ${error.message}`);
    },
  });
}

export function useUpdateIncome() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      amount: number;
      date: bigint;
      source: IncomeSource;
      description: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateIncome(
        data.id,
        data.amount,
        data.date,
        data.source,
        data.description,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomeRecords"] });
      toast.success("Income record updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update income: ${error.message}`);
    },
  });
}

// Customer mutations
export function useDeleteCustomer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteCustomer(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete customer: ${error.message}`);
    },
  });
}

export function useUpdateCustomer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      name: string;
      contactDetails: string;
      customerType: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateCustomer(
        data.id,
        data.name,
        data.contactDetails,
        data.customerType,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update customer: ${error.message}`);
    },
  });
}

// Worker mutations
export function useDeleteWorker() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteWorker(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
      toast.success("Worker deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete worker: ${error.message}`);
    },
  });
}

export function useUpdateWorker() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: bigint; name: string; role: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateWorker(data.id, data.name, data.role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
      toast.success("Worker updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update worker: ${error.message}`);
    },
  });
}

// Sale mutations
export function useDeleteSale() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteSale(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
      toast.success("Sale deleted and inventory restored");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete sale: ${error.message}`);
    },
  });
}

// Inventory mutations
export function useDeleteInventoryItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteInventoryItem(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
      toast.success("Inventory item deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete inventory item: ${error.message}`);
    },
  });
}

// ─── Harvest Entry Queries ─────────────────────────────────────────────────

export function useGetHarvestEntries() {
  const { actor, isFetching } = useActor();

  return useQuery<HarvestEntry[]>({
    queryKey: ["harvestEntries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getHarvestEntries();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddHarvestEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      date: string;
      quantityKg: number;
      harvestedBy: string;
      plotLocation: string;
      notes: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addHarvestEntry(
        data.date,
        data.quantityKg,
        data.harvestedBy,
        data.plotLocation,
        data.notes,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["harvestEntries"] });
      toast.success("Harvest entry recorded successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to record harvest: ${error.message}`);
    },
  });
}

export function useUpdateHarvestEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      date: string;
      quantityKg: number;
      harvestedBy: string;
      plotLocation: string;
      notes: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateHarvestEntry(
        data.id,
        data.date,
        data.quantityKg,
        data.harvestedBy,
        data.plotLocation,
        data.notes,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["harvestEntries"] });
      toast.success("Harvest entry updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update harvest entry: ${error.message}`);
    },
  });
}

export function useDeleteHarvestEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteHarvestEntry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["harvestEntries"] });
      toast.success("Harvest entry deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete harvest entry: ${error.message}`);
    },
  });
}

// ─── Farm Time Entry Queries ───────────────────────────────────────────────

export function useGetFarmTimeEntries() {
  const { actor, isFetching } = useActor();

  return useQuery<FarmTimeEntry[]>({
    queryKey: ["farmTimeEntries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFarmTimeEntries();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetFarmTimeEntriesByWorker(workerId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<FarmTimeEntry[]>({
    queryKey: ["farmTimeEntriesByWorker", workerId?.toString()],
    queryFn: async () => {
      if (!actor || workerId === null) return [];
      return actor.getFarmTimeEntriesByWorker(workerId);
    },
    enabled: !!actor && !isFetching && workerId !== null,
  });
}

export function useAddFarmTimeEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      workerId: bigint;
      workerName: string;
      date: string;
      arrivalTime: string | null;
      departureTime: string | null;
      status: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addFarmTimeEntry(
        data.workerId,
        data.workerName,
        data.date,
        data.arrivalTime,
        data.departureTime,
        data.status,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmTimeEntries"] });
      queryClient.invalidateQueries({ queryKey: ["farmTimeEntriesByWorker"] });
      toast.success("Farm time entry recorded successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to record farm time: ${error.message}`);
    },
  });
}

export function useUpdateFarmTimeEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      arrivalTime: string | null;
      departureTime: string | null;
      status: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateFarmTimeEntry(
        data.id,
        data.arrivalTime,
        data.departureTime,
        data.status,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmTimeEntries"] });
      queryClient.invalidateQueries({ queryKey: ["farmTimeEntriesByWorker"] });
      toast.success("Farm time entry updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update farm time entry: ${error.message}`);
    },
  });
}

export function useDeleteFarmTimeEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteFarmTimeEntry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmTimeEntries"] });
      queryClient.invalidateQueries({ queryKey: ["farmTimeEntriesByWorker"] });
      toast.success("Farm time entry deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete farm time entry: ${error.message}`);
    },
  });
}
