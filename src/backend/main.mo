import List "mo:core/List";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Migration "migration";

(with migration = Migration.run)
actor {
  // ----- User Profiles -----
  public type UserProfile = {
    name : Text;
  };

  // ----- File Attachment Types -----
  public type FileAttachment = {
    id : Nat;
    inventoryItemId : Nat;
    filename : Text;
    mimeType : Text;
    content : Blob;
  };

  public type FileAttachmentMetadata = {
    id : Nat;
    inventoryItemId : Nat;
    filename : Text;
    mimeType : Text;
  };

  // ----- Application Types -----
  public type ItemType = {
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

  type IncomeSource = {
    #market;
    #wholesale;
    #local;
    #other;
  };

  public type IncomeRecord = {
    id : Nat;
    amount : Float;
    date : Time.Time;
    source : IncomeSource;
    description : Text;
    enteredBy : Text;
  };

  type ExpenseType = {
    #fertilizers;
    #packaging;
    #transportation;
    #labor;
    #equipment;
    #other;
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
    arrivalTime : ?Time.Time;
    departureTime : ?Time.Time;
    timeOnFarm : ?Int;
    enteredBy : Text;
  };

  public type AttendanceRecord = {
    id : Nat;
    workerId : Nat;
    date : Time.Time;
    status : { #present; #absent; #late; #onLeave };
  };

  public type Department = {
    name : Text;
    leadName : Text;
    description : Text;
  };

  public type PlotEntry = {
    plotName : Text;
    dateActivated : Time.Time;
    department : Text;
  };

  public type MonthlyGoal = {
    id : Nat;
    year : Nat;
    month : Nat;
    targetPlots : Nat;
    actualPlots : Nat;
    plotEntries : [PlotEntry];
  };

  public type WeeklyReport = {
    departmentLead : Text;
    departmentName : Text;
    weekEnding : Time.Time;
    achievements : Text;
    challenges : Text;
    planForNextWeek : Text;
  };

  // ----- Harvest Log Types -----
  public type HarvestEntry = {
    id : Nat;
    date : Text;
    quantityKg : Float;
    harvestedBy : Text;
    plotLocation : Text;
    notes : Text;
    enteredBy : Principal;
    timestamp : Int;
  };

  // ----- Farm Time Types -----
  public type FarmTimeEntry = {
    id : Nat;
    workerId : Nat;
    workerName : Text;
    date : Text;
    arrivalTime : ?Text;
    departureTime : ?Text;
    status : Text;
    hoursOnFarm : ?Float;
    enteredBy : Principal;
    timestamp : Int;
  };

  // ----- Approval Types -----
  public type ApprovalStatus = { #pending; #approved; #rejected };
  public type UserApprovalInfo = { principal : Principal; status : ApprovalStatus };

  // ----- State -----
  let userProfiles = Map.empty<Principal, UserProfile>();

  // First 4 users become admins; first user is ultimate admin
  var autoRegisteredAdminCount = 0;
  let autoRegisteredAdmins = Map.empty<Principal, ()>();
  let adminLimit = 4;
  var ultimateAdmin : ?Principal = null;

  // Approval state
  let approvalMap = Map.empty<Principal, ApprovalStatus>();

  var nextAttendanceId = 1;
  let attendanceRecords = Map.empty<Nat, AttendanceRecord>();

  var nextInventoryItemId = 1;
  var nextCustomerId = 1;
  var nextIncomeId = 1;
  var nextExpenseId = 1;
  var nextSaleId = 1;
  var nextWorkerId = 1;
  var nextFileAttachmentId = 1;
  var nextHarvestEntryId = 1;
  var nextFarmTimeEntryId = 1;
  var nextMonthlyGoalId = 1;

  let inventory = Map.empty<Nat, InventoryItem>();
  let customers = Map.empty<Nat, Customer>();
  let incomeRecords = Map.empty<Nat, IncomeRecord>();
  let expenseRecords = Map.empty<Nat, ExpenseRecord>();
  let sales = Map.empty<Nat, Sale>();
  let workers = Map.empty<Nat, Worker>();
  let fileAttachments = Map.empty<Nat, FileAttachment>();
  let workerDailyRecords = Map.empty<Nat, WorkerDailyRecord>();
  let harvestEntries = Map.empty<Nat, HarvestEntry>();
  let farmTimeEntries = Map.empty<Nat, FarmTimeEntry>();

  let monthlyGoals = Map.empty<Nat, {
    id : Nat;
    year : Nat;
    month : Nat;
    targetPlots : Nat;
    actualPlots : Nat;
    plotEntries : List.List<PlotEntry>;
  }>();

  let weeklyReports = List.empty<WeeklyReport>();

  // ----- Sort modules -----
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

  module HarvestEntry {
    public func compare(a : HarvestEntry, b : HarvestEntry) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  module FarmTimeEntry {
    public func compare(a : FarmTimeEntry, b : FarmTimeEntry) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  // ----- Auth Helpers -----
  func isAdmin(caller : Principal) : Bool {
    autoRegisteredAdmins.containsKey(caller);
  };

  func isApproved(caller : Principal) : Bool {
    switch (approvalMap.get(caller)) {
      case (? #approved) { true };
      case _ { false };
    };
  };

  func isApprovedOrAdmin(caller : Principal) : Bool {
    isAdmin(caller) or isApproved(caller);
  };

  func getCallerNameOrPrincipal(caller : Principal) : Text {
    switch (userProfiles.get(caller)) {
      case (null) { caller.toText() };
      case (?profile) { profile.name };
    };
  };

  // ----- Admin Bootstrap -----
  public shared ({ caller }) func bootstrapAdminRegistration() : async () {
    if (caller.isAnonymous()) { return };
    if (autoRegisteredAdminCount < adminLimit and not autoRegisteredAdmins.containsKey(caller)) {
      autoRegisteredAdmins.add(caller, ());
      if (autoRegisteredAdminCount == 0) {
        ultimateAdmin := ?caller;
      };
      autoRegisteredAdminCount += 1;
      // Auto-approve admins
      approvalMap.add(caller, #approved);
    };
  };

  public query ({ caller }) func isAutoRegisteredAdmin(principal : Principal) : async Bool {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized");
    };
    autoRegisteredAdmins.containsKey(principal);
  };

  // ----- User Profiles -----
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users or admins can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not Principal.equal(caller, user) and not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users or admins can save profile");
    };
    userProfiles.add(caller, profile);
  };

  // ----- Approval System -----
  public query ({ caller }) func isCallerApproved() : async Bool {
    isApprovedOrAdmin(caller);
  };

  public shared ({ caller }) func requestApproval() : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous callers cannot request approval");
    };
    switch (approvalMap.get(caller)) {
      case (null) { approvalMap.add(caller, #pending) };
      case (?_) {};
    };
  };

  public shared ({ caller }) func setApproval(user : Principal, status : ApprovalStatus) : async () {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    approvalMap.add(user, status);
  };

  public query ({ caller }) func listApprovals() : async [UserApprovalInfo] {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can view this");
    };
    let result = List.empty<UserApprovalInfo>();
    for ((principal, status) in approvalMap.entries()) {
      result.add({ principal; status });
    };
    result.toArray();
  };

  public query ({ caller }) func listPendingUsers() : async [UserProfile] {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can view this");
    };
    let pendingUsers = List.empty<UserProfile>();
    for ((principal, profile) in userProfiles.entries()) {
      if (not autoRegisteredAdmins.containsKey(principal)) {
        switch (approvalMap.get(principal)) {
          case (? #approved) {};
          case _ {
            pendingUsers.add(profile);
          };
        };
      };
    };
    pendingUsers.toArray();
  };

  public shared ({ caller }) func approveUser(user : Principal) : async () {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    approvalMap.add(user, #approved);
  };

  public shared ({ caller }) func rejectUser(user : Principal) : async () {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    approvalMap.add(user, #rejected);
  };

  // ----- Inventory -----
  public shared ({ caller }) func addInventoryItem(name : Text, itemType : ItemType, quantity : Nat, costPerUnit : Float) : async Nat {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can add inventory items");
    };
    let id = nextInventoryItemId;
    nextInventoryItemId += 1;
    inventory.add(id, { id; name; itemType; quantity; costPerUnit; enteredBy = getCallerNameOrPrincipal(caller) });
    id;
  };

  public shared ({ caller }) func updateInventoryItem(id : Nat, name : Text, itemType : ItemType, quantity : Nat, costPerUnit : Float) : async () {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can update inventory items");
    };
    switch (inventory.get(id)) {
      case (null) { Runtime.trap("Inventory item not found") };
      case (?_) {
        inventory.add(id, { id; name; itemType; quantity; costPerUnit; enteredBy = getCallerNameOrPrincipal(caller) });
      };
    };
  };

  public shared ({ caller }) func deleteInventoryItem(id : Nat) : async () {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can delete inventory items");
    };
    switch (inventory.get(id)) {
      case (null) { Runtime.trap("Inventory item not found") };
      case (?_) { inventory.remove(id) };
    };
  };

  public query ({ caller }) func getInventoryItems() : async [InventoryItem] {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users or admins can view inventory");
    };
    inventory.values().toList<InventoryItem>().toArray().sort();
  };

  // ----- Customers -----
  public shared ({ caller }) func addCustomer(name : Text, contactDetails : Text, customerType : Text) : async Nat {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can add customers");
    };
    let id = nextCustomerId;
    nextCustomerId += 1;
    customers.add(id, { id; name; contactDetails; customerType; enteredBy = getCallerNameOrPrincipal(caller) });
    id;
  };

  public shared ({ caller }) func updateCustomer(id : Nat, name : Text, contactDetails : Text, customerType : Text) : async () {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can update customers");
    };
    switch (customers.get(id)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?existing) {
        customers.add(id, { id; name; contactDetails; customerType; enteredBy = existing.enteredBy });
      };
    };
  };

  public shared ({ caller }) func deleteCustomer(id : Nat) : async () {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can delete customers");
    };
    switch (customers.get(id)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?_) { customers.remove(id) };
    };
  };

  public query ({ caller }) func getCustomers() : async [Customer] {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users or admins can view customers");
    };
    customers.values().toList<Customer>().toArray().sort();
  };

  // ----- Income -----
  public shared ({ caller }) func addIncome(amount : Float, date : Time.Time, source : IncomeSource, description : Text) : async Nat {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can add income records");
    };
    let id = nextIncomeId;
    nextIncomeId += 1;
    incomeRecords.add(id, { id; amount; date; source; description; enteredBy = getCallerNameOrPrincipal(caller) });
    id;
  };

  public shared ({ caller }) func updateIncome(id : Nat, amount : Float, date : Time.Time, source : IncomeSource, description : Text) : async () {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can update income records");
    };
    switch (incomeRecords.get(id)) {
      case (null) { Runtime.trap("Income record not found") };
      case (?existing) {
        incomeRecords.add(id, { id; amount; date; source; description; enteredBy = existing.enteredBy });
      };
    };
  };

  public shared ({ caller }) func deleteIncome(id : Nat) : async () {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can delete income records");
    };
    switch (incomeRecords.get(id)) {
      case (null) { Runtime.trap("Income record not found") };
      case (?_) { incomeRecords.remove(id) };
    };
  };

  public query ({ caller }) func getIncomeRecords() : async [IncomeRecord] {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users or admins can view income records");
    };
    incomeRecords.values().toList<IncomeRecord>().toArray().sort();
  };

  // ----- Expenses -----
  public shared ({ caller }) func addExpense(amount : Float, date : Time.Time, category : ExpenseType, description : Text) : async Nat {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can add expense records");
    };
    let id = nextExpenseId;
    nextExpenseId += 1;
    expenseRecords.add(id, { id; amount; date; category; description; enteredBy = getCallerNameOrPrincipal(caller) });
    id;
  };

  public shared ({ caller }) func updateExpense(id : Nat, amount : Float, date : Time.Time, category : ExpenseType, description : Text) : async () {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can update expense records");
    };
    switch (expenseRecords.get(id)) {
      case (null) { Runtime.trap("Expense record not found") };
      case (?_) {
        expenseRecords.add(id, { id; amount; date; category; description; enteredBy = getCallerNameOrPrincipal(caller) });
      };
    };
  };

  public shared ({ caller }) func deleteExpense(id : Nat) : async () {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can delete expense records");
    };
    switch (expenseRecords.get(id)) {
      case (null) { Runtime.trap("Expense record not found") };
      case (?_) { expenseRecords.remove(id) };
    };
  };

  public query ({ caller }) func getExpenseRecords() : async [ExpenseRecord] {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users or admins can view expense records");
    };
    expenseRecords.values().toList<ExpenseRecord>().toArray().sort();
  };

  // ----- Sales -----
  public shared ({ caller }) func addSale(customerId : Nat, inventoryItemId : Nat, quantity : Nat, unitPrice : Float) : async Nat {
    if (not isAdmin(caller)) {
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
    sales.add(id, { id; date = Time.now(); customerId; inventoryItemId; quantity; unitPrice; enteredBy = getCallerNameOrPrincipal(caller) });
    inventory.add(item.id, { item with quantity = item.quantity - quantity });
    id;
  };

  public shared ({ caller }) func deleteSale(id : Nat) : async () {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can delete sales");
    };
    switch (sales.get(id)) {
      case (null) { Runtime.trap("Sale not found") };
      case (?sale) {
        switch (inventory.get(sale.inventoryItemId)) {
          case (null) {};
          case (?item) {
            inventory.add(item.id, { item with quantity = item.quantity + sale.quantity });
          };
        };
        sales.remove(id);
      };
    };
  };

  public query ({ caller }) func getSales() : async [Sale] {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users or admins can view sales");
    };
    sales.values().toList<Sale>().toArray().sort();
  };

  public query ({ caller }) func getCustomerPurchaseHistory(customerId : Nat) : async [Sale] {
    if (not isApprovedOrAdmin(caller)) {
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

  // ----- Workers -----
  public shared ({ caller }) func addWorker(name : Text, role : Text) : async Nat {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can add workers");
    };
    let id = nextWorkerId;
    nextWorkerId += 1;
    workers.add(id, { id; name; role; enteredBy = getCallerNameOrPrincipal(caller) });
    id;
  };

  public shared ({ caller }) func updateWorker(id : Nat, name : Text, role : Text) : async () {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can update workers");
    };
    switch (workers.get(id)) {
      case (null) { Runtime.trap("Worker not found") };
      case (?existing) {
        workers.add(id, { id; name; role; enteredBy = existing.enteredBy });
      };
    };
  };

  public shared ({ caller }) func deleteWorker(id : Nat) : async () {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can delete workers");
    };
    switch (workers.get(id)) {
      case (null) { Runtime.trap("Worker not found") };
      case (?_) { workers.remove(id) };
    };
  };

  public query ({ caller }) func getWorkers() : async [Worker] {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users or admins can view workers");
    };
    workers.values().toList<Worker>().toArray().sort();
  };

  public shared ({ caller }) func recordWorkerDay(workerId : Nat, date : Time.Time, present : Bool, arrivalTime : ?Time.Time, departureTime : ?Time.Time) : async () {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can record worker day");
    };
    switch (workers.get(workerId)) {
      case (null) { Runtime.trap("Worker not found") };
      case (?_) {
        workerDailyRecords.add(workerId, {
          workerId; date; present; arrivalTime; departureTime;
          timeOnFarm = calculateTimeOnFarm(arrivalTime, departureTime);
          enteredBy = getCallerNameOrPrincipal(caller);
        });
      };
    };
  };

  public query ({ caller }) func getWorkerDailyRecords() : async [WorkerDailyRecord] {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users or admins can view worker records");
    };
    workerDailyRecords.values().toList<WorkerDailyRecord>().toArray();
  };

  public query ({ caller }) func getWorkerDailyRecordsByWorker(workerId : Nat) : async [WorkerDailyRecord] {
    if (not isApprovedOrAdmin(caller)) {
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
        if (departure > arrival) { ?(departure - arrival) } else { null };
      };
    };
  };

  // ----- Departments -----
  let departments = List.fromArray<Department>([
    { name = "Goodnews"; leadName = "Goodnews"; description = "Nursery Management & Chemical/Fertilizer Application" },
    { name = "Nicholas"; leadName = "Nicholas"; description = "Irrigation & Watering" },
    { name = "Elvis"; leadName = "Elvis"; description = "Weeding & Harvesting" },
    { name = "Wisdom"; leadName = "Wisdom"; description = "Land Preparation, Farm Expansion & Infrastructure Projects" },
  ]);

  public query ({ caller }) func getDepartments() : async [Department] {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users or admins can view departments");
    };
    departments.toArray();
  };

  // ----- Monthly Goals -----
  public shared ({ caller }) func addMonthlyGoal(year : Nat, month : Nat, targetPlots : Nat) : async Nat {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can add monthly goals");
    };
    let id = nextMonthlyGoalId;
    nextMonthlyGoalId += 1;
    monthlyGoals.add(id, { id; year; month; targetPlots; actualPlots = 0; plotEntries = List.empty<PlotEntry>() });
    id;
  };

  public shared ({ caller }) func addPlotEntry(monthlyGoalId : Nat, plotName : Text, dateActivated : Time.Time, department : Text) : async () {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can add plot entries");
    };
    switch (monthlyGoals.get(monthlyGoalId)) {
      case (null) { Runtime.trap("Monthly goal not found") };
      case (?goal) {
        let plotEntries = goal.plotEntries;
        plotEntries.add({ plotName; dateActivated; department });
        monthlyGoals.add(monthlyGoalId, { goal with actualPlots = plotEntries.size(); plotEntries });
      };
    };
  };

  func convertMonthlyGoalToImmutable(goal : { id : Nat; year : Nat; month : Nat; targetPlots : Nat; actualPlots : Nat; plotEntries : List.List<PlotEntry> }) : MonthlyGoal {
    { id = goal.id; year = goal.year; month = goal.month; targetPlots = goal.targetPlots; actualPlots = goal.actualPlots; plotEntries = goal.plotEntries.toArray() };
  };

  public query ({ caller }) func getMonthlyGoals() : async [MonthlyGoal] {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users or admins can view monthly goals");
    };
    monthlyGoals.values().toList<{ id : Nat; year : Nat; month : Nat; targetPlots : Nat; actualPlots : Nat; plotEntries : List.List<PlotEntry> }>().toArray().map(convertMonthlyGoalToImmutable);
  };

  public query ({ caller }) func getMonthlyGoal(id : Nat) : async ?MonthlyGoal {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users or admins can view monthly goals");
    };
    switch (monthlyGoals.get(id)) {
      case (null) { null };
      case (?goal) { ?convertMonthlyGoalToImmutable(goal) };
    };
  };

  public shared ({ caller }) func initializeFixedMonthlyGoals() : async () {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can initialize fixed monthly goals");
    };
    for (month in [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].values()) {
      monthlyGoals.add(nextMonthlyGoalId, { id = nextMonthlyGoalId; year = 2024; month; targetPlots = 2; actualPlots = 0; plotEntries = List.empty<PlotEntry>() });
      nextMonthlyGoalId += 1;
    };
  };

  // ----- Weekly Reports -----
  public shared ({ caller }) func submitWeeklyReport(departmentLead : Text, departmentName : Text, weekEnding : Time.Time, achievements : Text, challenges : Text, planForNextWeek : Text) : async () {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users or admins can submit weekly reports");
    };
    weeklyReports.add({ departmentLead; departmentName; weekEnding; achievements; challenges; planForNextWeek });
  };

  public query ({ caller }) func getWeeklyReports() : async [WeeklyReport] {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users or admins can view weekly reports");
    };
    weeklyReports.toArray();
  };

  public query ({ caller }) func getWeeklyReportsByDepartment(departmentName : Text) : async [WeeklyReport] {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users or admins can view weekly reports");
    };
    weeklyReports.filter(func(report) { report.departmentName == departmentName }).toArray();
  };

  public query ({ caller }) func getWeeklyReportsByDateRange(startDate : Time.Time, endDate : Time.Time) : async [WeeklyReport] {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users or admins can view weekly reports");
    };
    weeklyReports.filter(func(report) { report.weekEnding >= startDate and report.weekEnding <= endDate }).toArray();
  };

  // ----- File Attachments -----
  public shared ({ caller }) func uploadAttachmentToItem(inventoryItemId : Nat, filename : Text, mimeType : Text, content : Blob) : async Nat {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can upload file attachments");
    };
    switch (inventory.get(inventoryItemId)) {
      case (null) { Runtime.trap("Inventory item not found") };
      case (?_) {};
    };
    let id = nextFileAttachmentId;
    nextFileAttachmentId += 1;
    fileAttachments.add(id, { id; inventoryItemId; filename; mimeType; content });
    id;
  };

  public query ({ caller }) func getAttachmentsForItem(inventoryItemId : Nat) : async [FileAttachmentMetadata] {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users or admins can view file attachments");
    };
    let result = List.empty<FileAttachmentMetadata>();
    for (att in fileAttachments.values()) {
      if (att.inventoryItemId == inventoryItemId) {
        result.add({ id = att.id; inventoryItemId = att.inventoryItemId; filename = att.filename; mimeType = att.mimeType });
      };
    };
    result.toArray();
  };

  public query ({ caller }) func getAttachment(id : Nat) : async ?FileAttachment {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users or admins can retrieve file attachments");
    };
    fileAttachments.get(id);
  };

  public shared ({ caller }) func deleteAttachment(id : Nat) : async () {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can delete file attachments");
    };
    if (not fileAttachments.containsKey(id)) {
      Runtime.trap("File attachment not found");
    };
    fileAttachments.remove(id);
  };

  public shared ({ caller }) func uploadFileAttachment(filename : Text, mimeType : Text, content : Blob) : async Nat {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can upload file attachments");
    };
    let id = nextFileAttachmentId;
    nextFileAttachmentId += 1;
    fileAttachments.add(id, { id; inventoryItemId = 0; filename; mimeType; content });
    id;
  };

  public query ({ caller }) func getFileAttachmentMetadata() : async [FileAttachmentMetadata] {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users or admins can view file attachments");
    };
    fileAttachments.values().toList<FileAttachment>().toArray().map(
      func(att : FileAttachment) : FileAttachmentMetadata {
        { id = att.id; inventoryItemId = att.inventoryItemId; filename = att.filename; mimeType = att.mimeType };
      }
    );
  };

  public query ({ caller }) func getFileAttachment(id : Nat) : async ?FileAttachment {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users or admins can retrieve file attachments");
    };
    fileAttachments.get(id);
  };

  public shared ({ caller }) func deleteFileAttachment(id : Nat) : async () {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can delete file attachments");
    };
    if (not fileAttachments.containsKey(id)) {
      Runtime.trap("File attachment not found");
    };
    fileAttachments.remove(id);
  };

  // ----- Harvest Log -----
  public shared ({ caller }) func addHarvestEntry(date : Text, quantityKg : Float, harvestedBy : Text, plotLocation : Text, notes : Text) : async HarvestEntry {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can add harvest entries");
    };
    let id = nextHarvestEntryId;
    nextHarvestEntryId += 1;
    let entry : HarvestEntry = { id; date; quantityKg; harvestedBy; plotLocation; notes; enteredBy = caller; timestamp = Time.now() };
    harvestEntries.add(id, entry);
    entry;
  };

  public shared ({ caller }) func updateHarvestEntry(id : Nat, date : Text, quantityKg : Float, harvestedBy : Text, plotLocation : Text, notes : Text) : async ?HarvestEntry {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can update harvest entries");
    };
    switch (harvestEntries.get(id)) {
      case (null) { null };
      case (?existing) {
        let updated : HarvestEntry = { existing with date; quantityKg; harvestedBy; plotLocation; notes };
        harvestEntries.add(id, updated);
        ?updated;
      };
    };
  };

  public shared ({ caller }) func deleteHarvestEntry(id : Nat) : async Bool {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can delete harvest entries");
    };
    if (harvestEntries.containsKey(id)) {
      harvestEntries.remove(id);
      true;
    } else {
      false;
    };
  };

  public query ({ caller }) func getHarvestEntries() : async [HarvestEntry] {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users or admins can view harvest entries");
    };
    harvestEntries.values().toList<HarvestEntry>().toArray().sort();
  };

  // ----- Farm Time -----
  func computeHoursOnFarm(arrivalTime : ?Text, departureTime : ?Text) : ?Float {
    switch (arrivalTime, departureTime) {
      case (?arr, ?dep) {
        let arrParts = arr.split(#char ':').toList().toArray();
        let depParts = dep.split(#char ':').toList().toArray();
        if (arrParts.size() == 2 and depParts.size() == 2) {
          switch (Nat.fromText(arrParts[0]), Nat.fromText(arrParts[1]), Nat.fromText(depParts[0]), Nat.fromText(depParts[1])) {
            case (?ah, ?am, ?dh, ?dm) {
              let arrMins : Int = ah * 60 + am;
              let depMins : Int = dh * 60 + dm;
              let diffMins = depMins - arrMins;
              if (diffMins > 0) {
                ?(diffMins.toFloat() / 60.0);
              } else { null };
            };
            case _ { null };
          };
        } else { null };
      };
      case _ { null };
    };
  };

  public shared ({ caller }) func addFarmTimeEntry(workerId : Nat, workerName : Text, date : Text, arrivalTime : ?Text, departureTime : ?Text, status : Text) : async FarmTimeEntry {
    let id = nextFarmTimeEntryId;
    nextFarmTimeEntryId += 1;
    let entry : FarmTimeEntry = {
      id; workerId; workerName; date; arrivalTime; departureTime; status;
      hoursOnFarm = computeHoursOnFarm(arrivalTime, departureTime);
      enteredBy = caller;
      timestamp = Time.now();
    };
    farmTimeEntries.add(id, entry);
    entry;
  };

  public shared ({ caller }) func updateFarmTimeEntry(id : Nat, arrivalTime : ?Text, departureTime : ?Text, status : Text) : async ?FarmTimeEntry {
    switch (farmTimeEntries.get(id)) {
      case (null) { null };
      case (?existing) {
        let updated : FarmTimeEntry = {
          existing with arrivalTime; departureTime; status;
          hoursOnFarm = computeHoursOnFarm(arrivalTime, departureTime);
        };
        farmTimeEntries.add(id, updated);
        ?updated;
      };
    };
  };

  public shared ({ caller }) func deleteFarmTimeEntry(id : Nat) : async Bool {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can delete farm time entries");
    };
    if (farmTimeEntries.containsKey(id)) {
      farmTimeEntries.remove(id);
      true;
    } else {
      false;
    };
  };

  public query ({ caller }) func getFarmTimeEntries() : async [FarmTimeEntry] {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users or admins can view farm time entries");
    };
    farmTimeEntries.values().toList<FarmTimeEntry>().toArray().sort();
  };

  public query ({ caller }) func getFarmTimeEntriesByWorker(workerId : Nat) : async [FarmTimeEntry] {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users or admins can view farm time entries");
    };
    let result = List.empty<FarmTimeEntry>();
    for (entry in farmTimeEntries.values()) {
      if (entry.workerId == workerId) {
        result.add(entry);
      };
    };
    result.toArray().sort();
  };
};
