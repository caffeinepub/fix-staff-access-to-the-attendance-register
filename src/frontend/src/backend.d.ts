import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface InventoryItem {
    id: bigint;
    costPerUnit: number;
    name: string;
    itemType: ItemType;
    quantity: bigint;
}
export type Time = bigint;
export interface IncomeRecord {
    id: bigint;
    source: IncomeSource;
    date: Time;
    description: string;
    amount: number;
}
export interface ExpenseRecord {
    id: bigint;
    date: Time;
    description: string;
    category: ExpenseType;
    amount: number;
}
export interface AttendanceRecord {
    id: bigint;
    status: Variant_onLeave_present_late_absent;
    workerId: bigint;
    date: Time;
}
export interface Sale {
    id: bigint;
    inventoryItemId: bigint;
    date: Time;
    quantity: bigint;
    customerId: bigint;
    unitPrice: number;
}
export interface Worker {
    id: bigint;
    name: string;
    role: string;
}
export interface UserProfile {
    name: string;
}
export interface Customer {
    id: bigint;
    customerType: string;
    name: string;
    contactDetails: string;
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
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_onLeave_present_late_absent {
    onLeave = "onLeave",
    present = "present",
    late = "late",
    absent = "absent"
}
export interface backendInterface {
    addCustomer(name: string, contactDetails: string, customerType: string): Promise<bigint>;
    addExpense(amount: number, date: Time, category: ExpenseType, description: string): Promise<bigint>;
    addIncome(amount: number, date: Time, source: IncomeSource, description: string): Promise<bigint>;
    addInventoryItem(name: string, itemType: ItemType, quantity: bigint, costPerUnit: number): Promise<bigint>;
    addSale(customerId: bigint, inventoryItemId: bigint, quantity: bigint, unitPrice: number): Promise<bigint>;
    addWorker(name: string, role: string): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAttendanceRecords(): Promise<Array<AttendanceRecord>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCustomerPurchaseHistory(customerId: bigint): Promise<Array<Sale>>;
    getCustomers(): Promise<Array<Customer>>;
    getExpenseRecords(): Promise<Array<ExpenseRecord>>;
    getIncomeRecords(): Promise<Array<IncomeRecord>>;
    getInventoryItems(): Promise<Array<InventoryItem>>;
    getSales(): Promise<Array<Sale>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWorkerAttendance(workerId: bigint): Promise<Array<AttendanceRecord>>;
    getWorkers(): Promise<Array<Worker>>;
    isCallerAdmin(): Promise<boolean>;
    markAttendance(workerId: bigint, date: Time, status: Variant_onLeave_present_late_absent): Promise<bigint>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateInventoryItem(id: bigint, name: string, itemType: ItemType, quantity: bigint, costPerUnit: number): Promise<void>;
}
