import List "mo:core/List";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import UserApproval "user-approval/approval";

import Text "mo:core/Text";


actor {
  // Initialize the user system state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let approvalState = UserApproval.initState(accessControlState);

  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // ----- Persistent State for Auto-Registered Admins -----
  var autoRegisteredAdminCount = 0;
  let autoRegisteredAdmins = Map.empty<Principal, ()>();
  let adminLimit = 4;

  // Shared endpoint to initialize admin registration
  public shared ({ caller }) func bootstrapAdminRegistration() : async () {
    if (caller.isAnonymous()) { return };
    if (autoRegisteredAdminCount < adminLimit and not autoRegisteredAdmins.containsKey(caller)) {
      autoRegisteredAdmins.add(caller, ());
      autoRegisteredAdminCount += 1;
    };
  };

  func isAdminOrAutoAdmin(caller : Principal) : Bool {
    autoRegisteredAdmins.containsKey(caller) or AccessControl.isAdmin(accessControlState, caller);
  };

  public query ({ caller }) func isAutoRegisteredAdmin(principal : Principal) : async Bool {
    // Any authenticated (non-anonymous) user may check admin status
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only auto-registered admins can check admin status");
    };
    autoRegisteredAdmins.containsKey(principal);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (UserApproval.isApproved(approvalState, caller) or isAdminOrAutoAdmin(caller))) {
      Runtime.trap("Unauthorized: Only approved users or admins can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not isAdminOrAutoAdmin(caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (UserApproval.isApproved(approvalState, caller) or isAdminOrAutoAdmin(caller))) {
      Runtime.trap("Unauthorized: Only approved users or admins can save profile");
    };
    userProfiles.add(caller, profile);
  };

  // Approval system functions
  public query ({ caller }) func isCallerApproved() : async Bool {
    isAdminOrAutoAdmin(caller) or UserApproval.isApproved(approvalState, caller);
  };

  public shared ({ caller }) func requestApproval() : async () {
    // Only non-anonymous callers may request approval
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous callers cannot request approval");
    };
    UserApproval.requestApproval(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not isAdminOrAutoAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.setApproval(approvalState, user, status);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not isAdminOrAutoAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can view this");
    };
    UserApproval.listApprovals(approvalState);
  };

  public query ({ caller }) func listPendingUsers() : async [UserProfile] {
    if (not isAdminOrAutoAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can view this");
    };

    let pendingUsers = List.empty<UserProfile>();

    for (user in userProfiles.entries()) {
      let (principal, profile) = user;
      // Skip auto registered admins as they are always considered Admins
      if (not autoRegisteredAdmins.containsKey(principal) and not AccessControl.isAdmin(accessControlState, principal)) {
        let isApproved = UserApproval.isApproved(approvalState, principal);
        if (not isApproved) {
          pendingUsers.add(profile);
        };
      };
    };
    pendingUsers.toArray();
  };

  public shared ({ caller }) func approveUser(user : Principal) : async () {
    if (not isAdminOrAutoAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.setApproval(approvalState, user, #approved);
  };

  public shared ({ caller }) func rejectUser(user : Principal) : async () {
    if (not isAdminOrAutoAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.setApproval(approvalState, user, #rejected);
  };

  // Application Types
  type IncomeSource = {
    #market;
    #wholesale;
    #local;
    #other;
  };

  type ExpenseType = {
    #fertilizers;
    #packaging;
    #transportation;
    #labor;
    #equipment;
    #other;
  };

  type ItemType = {
    #peppers;
    #fertilizer;
    #pesticide;
    #equipment;
  };

  public type InventoryItem = {
    id : Nat;
    name : Text;
    itemType : ItemType;
    quantity : Nat;
    costPerUnit : Float;
    enteredBy : Text;
  };

  public type Customer = {
    id : Nat;
    name : Text;
    contactDetails : Text;
    customerType : Text;
    enteredBy : Text;
  };

  public type IncomeRecord = {
    id : Nat;
    amount : Float;
    date : Time.Time;
    source : IncomeSource;
    description : Text;
    enteredBy : Text;
  };

  public type ExpenseRecord = {
    id : Nat;
    amount : Float;
    date : Time.Time;
    category : ExpenseType;
    description : Text;
    enteredBy : Text;
  };

  public type Sale = {
    id : Nat;
    date : Time.Time;
    customerId : Nat;
    inventoryItemId : Nat;
    quantity : Nat;
    unitPrice : Float;
    enteredBy : Text;
  };

  // Worker Month Calendar Types
  public type Worker = {
    id : Nat;
    name : Text;
    role : Text;
    enteredBy : Text;
  };

  public type WorkerDailyRecord = {
    workerId : Nat;
    date : Time.Time;
    present : Bool;
    arrivalTime : ?Time.Time; // NANOS
    departureTime : ?Time.Time; // NANOS
    timeOnFarm : ?Int; // NANOS
    enteredBy : Text;
  };

  // Old Attendance Types
  public type AttendanceRecord = {
    id : Nat;
    workerId : Nat;
    date : Time.Time;
    status : { #present; #absent; #late; #onLeave };
  };

  var nextAttendanceId = 1;
  let attendanceRecords = Map.empty<Nat, AttendanceRecord>();

  var nextInventoryItemId = 1;
  var nextCustomerId = 1;
  var nextIncomeId = 1;
  var nextExpenseId = 1;
  var nextSaleId = 1;
  var nextWorkerId = 1;

  let inventory = Map.empty<Nat, InventoryItem>();
  let customers = Map.empty<Nat, Customer>();
  let incomeRecords = Map.empty<Nat, IncomeRecord>();
  let expenseRecords = Map.empty<Nat, ExpenseRecord>();
  let sales = Map.empty<Nat, Sale>();
  let workers = Map.empty<Nat, Worker>();

  // New: Worker Farm Time Calendar
  let workerDailyRecords = Map.empty<Nat, WorkerDailyRecord>();

  module InventoryItem {
    public func compare(a : InventoryItem, b : InventoryItem) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  module Customer {
    public func compare(a : Customer, b : Customer) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  module IncomeRecord {
    public func compare(a : IncomeRecord, b : IncomeRecord) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  module ExpenseRecord {
    public func compare(a : ExpenseRecord, b : ExpenseRecord) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  module Sale {
    public func compare(a : Sale, b : Sale) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  module Worker {
    public func compare(a : Worker, b : Worker) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  func getCallerNameOrPrincipal(caller : Principal) : Text {
    switch (userProfiles.get(caller)) {
      case (null) { caller.toText() };
      case (?profile) { profile.name };
    };
  };

  public shared ({ caller }) func addInventoryItem(name : Text, itemType : ItemType, quantity : Nat, costPerUnit : Float) : async Nat {
    // Admin only (including auto-registered admins)
    if (not isAdminOrAutoAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can add inventory items");
    };
    let id = nextInventoryItemId;
    nextInventoryItemId += 1;
    let item : InventoryItem = {
      id;
      name;
      itemType;
      quantity;
      costPerUnit;
      enteredBy = getCallerNameOrPrincipal(caller);
    };
    inventory.add(id, item);
    id;
  };

  public shared ({ caller }) func updateInventoryItem(id : Nat, name : Text, itemType : ItemType, quantity : Nat, costPerUnit : Float) : async () {
    // Admin only (including auto-registered admins)
    if (not isAdminOrAutoAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can update inventory items");
    };
    switch (inventory.get(id)) {
      case (null) { Runtime.trap("Inventory item not found") };
      case (?_) {
        let item : InventoryItem = {
          id;
          name;
          itemType;
          quantity;
          costPerUnit;
          enteredBy = getCallerNameOrPrincipal(caller);
        };
        inventory.add(id, item);
      };
    };
  };

  public shared ({ caller }) func addCustomer(name : Text, contactDetails : Text, customerType : Text) : async Nat {
    // Admin only (including auto-registered admins)
    if (not isAdminOrAutoAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can add customers");
    };
    let id = nextCustomerId;
    nextCustomerId += 1;
    let customer : Customer = {
      id;
      name;
      contactDetails;
      customerType;
      enteredBy = getCallerNameOrPrincipal(caller);
    };
    customers.add(id, customer);
    id;
  };

  public shared ({ caller }) func addIncome(amount : Float, date : Time.Time, source : IncomeSource, description : Text) : async Nat {
    // Admin only (including auto-registered admins)
    if (not isAdminOrAutoAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can add income records");
    };

    let id = nextIncomeId;
    nextIncomeId += 1;
    let record : IncomeRecord = {
      id;
      amount;
      date;
      source;
      description;
      enteredBy = getCallerNameOrPrincipal(caller);
    };
    incomeRecords.add(id, record);
    id;
  };

  public shared ({ caller }) func addExpense(amount : Float, date : Time.Time, category : ExpenseType, description : Text) : async Nat {
    // Admin only (including auto-registered admins)
    if (not isAdminOrAutoAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can add expense records");
    };
    let id = nextExpenseId;
    nextExpenseId += 1;
    let record : ExpenseRecord = {
      id;
      amount;
      date;
      category;
      description;
      enteredBy = getCallerNameOrPrincipal(caller);
    };
    expenseRecords.add(id, record);
    id;
  };

  public shared ({ caller }) func updateExpense(id : Nat, amount : Float, date : Time.Time, category : ExpenseType, description : Text) : async () {
    // Admin only (including auto-registered admins)
    if (not isAdminOrAutoAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can update expense records");
    };
    switch (expenseRecords.get(id)) {
      case (null) { Runtime.trap("Expense record not found") };
      case (?_) {
        let updatedExpense : ExpenseRecord = {
          id;
          amount;
          date;
          category;
          description;
          enteredBy = getCallerNameOrPrincipal(caller);
        };
        expenseRecords.add(id, updatedExpense);
      };
    };
  };

  public shared ({ caller }) func deleteExpense(id : Nat) : async () {
    // Admin only (including auto-registered admins)
    if (not isAdminOrAutoAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can delete expense records");
    };
    switch (expenseRecords.get(id)) {
      case (null) { Runtime.trap("Expense record not found") };
      case (?_) {
        expenseRecords.remove(id);
      };
    };
  };

  public shared ({ caller }) func addSale(customerId : Nat, inventoryItemId : Nat, quantity : Nat, unitPrice : Float) : async Nat {
    // Admin only (including auto-registered admins)
    if (not isAdminOrAutoAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can add sales");
    };

    let item = switch (inventory.get(inventoryItemId)) {
      case (null) { Runtime.trap("Inventory item not found") };
      case (?item) { item };
    };

    if (item.quantity < quantity) {
      Runtime.trap("Not enough inventory for sale");
    };

    let id = nextSaleId;
    nextSaleId += 1;

    let sale : Sale = {
      id;
      date = Time.now();
      customerId;
      inventoryItemId;
      quantity;
      unitPrice;
      enteredBy = getCallerNameOrPrincipal(caller);
    };
    sales.add(id, sale);

    let updatedItem : InventoryItem = {
      id = item.id;
      name = item.name;
      itemType = item.itemType;
      quantity = item.quantity - quantity;
      costPerUnit = item.costPerUnit;
      enteredBy = item.enteredBy;
    };
    inventory.add(item.id, updatedItem);

    id;
  };

  public query ({ caller }) func getInventoryItems() : async [InventoryItem] {
    if (not (UserApproval.isApproved(approvalState, caller) or isAdminOrAutoAdmin(caller))) {
      Runtime.trap("Unauthorized: Only approved users or admins can view inventory");
    };
    inventory.values().toList<InventoryItem>().toArray().sort();
  };

  public query ({ caller }) func getCustomers() : async [Customer] {
    if (not (UserApproval.isApproved(approvalState, caller) or isAdminOrAutoAdmin(caller))) {
      Runtime.trap("Unauthorized: Only approved users or admins can view customers");
    };
    customers.values().toList<Customer>().toArray().sort();
  };

  public query ({ caller }) func getIncomeRecords() : async [IncomeRecord] {
    if (not (UserApproval.isApproved(approvalState, caller) or isAdminOrAutoAdmin(caller))) {
      Runtime.trap("Unauthorized: Only approved users or admins can view income records");
    };
    incomeRecords.values().toList<IncomeRecord>().toArray().sort();
  };

  public query ({ caller }) func getExpenseRecords() : async [ExpenseRecord] {
    if (not (UserApproval.isApproved(approvalState, caller) or isAdminOrAutoAdmin(caller))) {
      Runtime.trap("Unauthorized: Only approved users or admins can view expense records");
    };
    expenseRecords.values().toList<ExpenseRecord>().toArray().sort();
  };

  public query ({ caller }) func getSales() : async [Sale] {
    if (not (UserApproval.isApproved(approvalState, caller) or isAdminOrAutoAdmin(caller))) {
      Runtime.trap("Unauthorized: Only approved users or admins can view sales");
    };
    sales.values().toList<Sale>().toArray().sort();
  };

  public query ({ caller }) func getCustomerPurchaseHistory(customerId : Nat) : async [Sale] {
    if (not (UserApproval.isApproved(approvalState, caller) or isAdminOrAutoAdmin(caller))) {
      Runtime.trap("Unauthorized: Only approved users or admins can view customer purchase history");
    };
    let filteredSales = List.empty<Sale>();
    for (sale in sales.values()) {
      if (sale.customerId == customerId) {
        filteredSales.add(sale);
      };
    };
    filteredSales.toArray();
  };

  // Worker Farm Time Calendar

  public shared ({ caller }) func addWorker(name : Text, role : Text) : async Nat {
    // Admin only (including auto-registered admins)
    if (not isAdminOrAutoAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can add workers");
    };
    let id = nextWorkerId;
    nextWorkerId += 1;
    let worker : Worker = {
      id;
      name;
      role;
      enteredBy = getCallerNameOrPrincipal(caller);
    };
    workers.add(id, worker);
    id;
  };

  public query ({ caller }) func getWorkers() : async [Worker] {
    if (not (UserApproval.isApproved(approvalState, caller) or isAdminOrAutoAdmin(caller))) {
      Runtime.trap("Unauthorized: Only approved users or admins can view workers");
    };
    workers.values().toList<Worker>().toArray().sort();
  };

  public shared ({ caller }) func recordWorkerDay(workerId : Nat, date : Time.Time, present : Bool, arrivalTime : ?Time.Time, departureTime : ?Time.Time) : async () {
    // Admin only (including auto-registered admins)
    if (not isAdminOrAutoAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can record worker day");
    };

    switch (workers.get(workerId)) {
      case (null) { Runtime.trap("Worker not found") };
      case (?_) {
        let dailyRecord : WorkerDailyRecord = {
          workerId;
          date;
          present;
          arrivalTime;
          departureTime;
          timeOnFarm = calculateTimeOnFarm(arrivalTime, departureTime);
          enteredBy = getCallerNameOrPrincipal(caller);
        };
        workerDailyRecords.add(workerId, dailyRecord);
      };
    };
  };

  public query ({ caller }) func getWorkerDailyRecords() : async [WorkerDailyRecord] {
    if (not (UserApproval.isApproved(approvalState, caller) or isAdminOrAutoAdmin(caller))) {
      Runtime.trap("Unauthorized: Only approved users or admins can view worker records");
    };
    workerDailyRecords.values().toList<WorkerDailyRecord>().toArray();
  };

  public query ({ caller }) func getWorkerDailyRecordsByWorker(workerId : Nat) : async [WorkerDailyRecord] {
    if (not (UserApproval.isApproved(approvalState, caller) or isAdminOrAutoAdmin(caller))) {
      Runtime.trap("Unauthorized: Only approved users or admins can view worker records");
    };
    let filteredRecords = List.empty<WorkerDailyRecord>();
    for (record in workerDailyRecords.values()) {
      if (record.workerId == workerId) {
        filteredRecords.add(record);
      };
    };
    filteredRecords.toArray();
  };

  func calculateTimeOnFarm(arrivalTime : ?Time.Time, departureTime : ?Time.Time) : ?Int {
    switch (arrivalTime, departureTime) {
      case (null, _) { null };
      case (_, null) { null };
      case (?arrival, ?departure) {
        if (departure > arrival) {
          ?(departure - arrival);
        } else {
          null;
        };
      };
    };
  };
};

