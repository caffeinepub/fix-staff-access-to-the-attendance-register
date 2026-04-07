import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PlotEntry {
    dateActivated: Time;
    department: string;
    plotName: string;
}
export type Time = bigint;
export interface ExpenseRecord {
    id: bigint;
    date: Time;
    description: string;
    category: ExpenseType;
    amount: number;
    enteredBy: string;
}
export interface WeeklyReport {
    departmentLead: string;
    departmentName: string;
    planForNextWeek: string;
    achievements: string;
    weekEnding: Time;
    challenges: string;
}
export interface Sale {
    id: bigint;
    inventoryItemId: bigint;
    date: Time;
    quantity: bigint;
    customerId: bigint;
    unitPrice: number;
    enteredBy: string;
}
export interface Customer {
    id: bigint;
    customerType: string;
    name: string;
    enteredBy: string;
    contactDetails: string;
}
export interface InventoryItem {
    id: bigint;
    costPerUnit: number;
    name: string;
    itemType: ItemType;
    quantity: bigint;
    enteredBy: string;
}
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export interface MonthlyGoal {
    id: bigint;
    month: bigint;
    plotEntries: Array<PlotEntry>;
    actualPlots: bigint;
    year: bigint;
    targetPlots: bigint;
}
export interface IncomeRecord {
    id: bigint;
    source: IncomeSource;
    date: Time;
    description: string;
    amount: number;
    enteredBy: string;
}
export interface FileAttachment {
    id: bigint;
    content: Uint8Array;
    inventoryItemId: bigint;
    mimeType: string;
    filename: string;
}
export interface FarmTimeEntry {
    id: bigint;
    status: string;
    workerId: bigint;
    arrivalTime?: string;
    departureTime?: string;
    date: string;
    hoursOnFarm?: number;
    timestamp: bigint;
    workerName: string;
    enteredBy: Principal;
}
export interface Department {
    leadName: string;
    name: string;
    description: string;
}
export interface HarvestEntry {
    id: bigint;
    date: string;
    notes: string;
    timestamp: bigint;
    plotLocation: string;
    enteredBy: Principal;
    harvestedBy: string;
    quantityKg: number;
}
export interface FileAttachmentMetadata {
    id: bigint;
    inventoryItemId: bigint;
    mimeType: string;
    filename: string;
}
export interface Worker {
    id: bigint;
    name: string;
    role: string;
    enteredBy: string;
}
export interface UserProfile {
    name: string;
}
export interface WorkerDailyRecord {
    workerId: bigint;
    arrivalTime?: Time;
    present: boolean;
    departureTime?: Time;
    date: Time;
    timeOnFarm?: bigint;
    enteredBy: string;
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum ExpenseType {
    fertilizers = "fertilizers",
    transportation = "transportation",
    other = "other",
    equipment = "equipment",
    labor = "labor",
    packaging = "packaging"
}
export enum IncomeSource {
    other = "other",
    local = "local",
    market = "market",
    wholesale = "wholesale"
}
export enum ItemType {
    equipment = "equipment",
    peppers = "peppers",
    fertilizer = "fertilizer",
    pesticide = "pesticide"
}
export interface backendInterface {
    addCustomer(name: string, contactDetails: string, customerType: string): Promise<bigint>;
    addExpense(amount: number, date: Time, category: ExpenseType, description: string): Promise<bigint>;
    addFarmTimeEntry(workerId: bigint, workerName: string, date: string, arrivalTime: string | null, departureTime: string | null, status: string): Promise<FarmTimeEntry>;
    addHarvestEntry(date: string, quantityKg: number, harvestedBy: string, plotLocation: string, notes: string): Promise<HarvestEntry>;
    addIncome(amount: number, date: Time, source: IncomeSource, description: string): Promise<bigint>;
    addInventoryItem(name: string, itemType: ItemType, quantity: bigint, costPerUnit: number): Promise<bigint>;
    addMonthlyGoal(year: bigint, month: bigint, targetPlots: bigint): Promise<bigint>;
    addPlotEntry(monthlyGoalId: bigint, plotName: string, dateActivated: Time, department: string): Promise<void>;
    addSale(customerId: bigint, inventoryItemId: bigint, quantity: bigint, unitPrice: number): Promise<bigint>;
    addWorker(name: string, role: string): Promise<bigint>;
    approveUser(user: Principal): Promise<void>;
    bootstrapAdminRegistration(): Promise<void>;
    deleteAttachment(id: bigint): Promise<void>;
    deleteCustomer(id: bigint): Promise<void>;
    deleteExpense(id: bigint): Promise<void>;
    deleteFarmTimeEntry(id: bigint): Promise<boolean>;
    deleteFileAttachment(id: bigint): Promise<void>;
    deleteHarvestEntry(id: bigint): Promise<boolean>;
    deleteIncome(id: bigint): Promise<void>;
    deleteInventoryItem(id: bigint): Promise<void>;
    deleteSale(id: bigint): Promise<void>;
    deleteWorker(id: bigint): Promise<void>;
    getAttachment(id: bigint): Promise<FileAttachment | null>;
    getAttachmentsForItem(inventoryItemId: bigint): Promise<Array<FileAttachmentMetadata>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCustomerPurchaseHistory(customerId: bigint): Promise<Array<Sale>>;
    getCustomers(): Promise<Array<Customer>>;
    getDepartments(): Promise<Array<Department>>;
    getExpenseRecords(): Promise<Array<ExpenseRecord>>;
    getFarmTimeEntries(): Promise<Array<FarmTimeEntry>>;
    getFarmTimeEntriesByWorker(workerId: bigint): Promise<Array<FarmTimeEntry>>;
    getFileAttachment(id: bigint): Promise<FileAttachment | null>;
    getFileAttachmentMetadata(): Promise<Array<FileAttachmentMetadata>>;
    getHarvestEntries(): Promise<Array<HarvestEntry>>;
    getIncomeRecords(): Promise<Array<IncomeRecord>>;
    getInventoryItems(): Promise<Array<InventoryItem>>;
    getMonthlyGoal(id: bigint): Promise<MonthlyGoal | null>;
    getMonthlyGoals(): Promise<Array<MonthlyGoal>>;
    getSales(): Promise<Array<Sale>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWeeklyReports(): Promise<Array<WeeklyReport>>;
    getWeeklyReportsByDateRange(startDate: Time, endDate: Time): Promise<Array<WeeklyReport>>;
    getWeeklyReportsByDepartment(departmentName: string): Promise<Array<WeeklyReport>>;
    getWorkerDailyRecords(): Promise<Array<WorkerDailyRecord>>;
    getWorkerDailyRecordsByWorker(workerId: bigint): Promise<Array<WorkerDailyRecord>>;
    getWorkers(): Promise<Array<Worker>>;
    initializeFixedMonthlyGoals(): Promise<void>;
    isAutoRegisteredAdmin(principal: Principal): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    listPendingUsers(): Promise<Array<UserProfile>>;
    recordWorkerDay(workerId: bigint, date: Time, present: boolean, arrivalTime: Time | null, departureTime: Time | null): Promise<void>;
    rejectUser(user: Principal): Promise<void>;
    requestApproval(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    submitWeeklyReport(departmentLead: string, departmentName: string, weekEnding: Time, achievements: string, challenges: string, planForNextWeek: string): Promise<void>;
    updateCustomer(id: bigint, name: string, contactDetails: string, customerType: string): Promise<void>;
    updateExpense(id: bigint, amount: number, date: Time, category: ExpenseType, description: string): Promise<void>;
    updateFarmTimeEntry(id: bigint, arrivalTime: string | null, departureTime: string | null, status: string): Promise<FarmTimeEntry | null>;
    updateHarvestEntry(id: bigint, date: string, quantityKg: number, harvestedBy: string, plotLocation: string, notes: string): Promise<HarvestEntry | null>;
    updateIncome(id: bigint, amount: number, date: Time, source: IncomeSource, description: string): Promise<void>;
    updateInventoryItem(id: bigint, name: string, itemType: ItemType, quantity: bigint, costPerUnit: number): Promise<void>;
    updateWorker(id: bigint, name: string, role: string): Promise<void>;
    uploadAttachmentToItem(inventoryItemId: bigint, filename: string, mimeType: string, content: Uint8Array): Promise<bigint>;
    uploadFileAttachment(filename: string, mimeType: string, content: Uint8Array): Promise<bigint>;
}
