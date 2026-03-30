import List "mo:core/List";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import UserApproval "user-approval/approval";
import Blob "mo:core/Blob";

actor {
  // Initialize the user system state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let approvalState = UserApproval.initState(accessControlState);

  public type UserProfile = {
    name : Text;
  };

  // File Attachment Types
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

  public type InventoryItem = {
    id : Nat;
    name : Text;
    itemType : ItemType;
    quantity : Nat;
    costPerUnit : Float;
    enteredBy : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // ----- Persistent State for Auto-Registered Admins -----
  var autoRegisteredAdminCount = 0;
  let autoRegisteredAdmins = Map.empty<Principal, ()>();
  let adminLimit = 4;
  var ultimateAdmin : ?Principal = null;

  // Shared endpoint to initialize admin registration
  public shared ({ caller }) func bootstrapAdminRegistration() : async () {
    if (caller.isAnonymous()) { return };
    if (autoRegisteredAdminCount < adminLimit and not autoRegisteredAdmins.containsKey(caller)) {
      autoRegisteredAdmins.add(caller, ());
      if (autoRegisteredAdminCount == 0) {
        ultimateAdmin := ?caller;
      };
      autoRegisteredAdminCount += 1;
    };
  };

  func isAdminOrAutoAdmin(caller : Principal) : Bool {
    autoRegisteredAdmins.containsKey(caller) or AccessControl.isAdmin(accessControlState, caller);
  };

  func isUltimateAdmin(caller : Principal) : Bool {
    switch (ultimateAdmin) {
      case (null) { false };
      case (?ua) { caller == ua };
    };
  };

  public query ({ caller }) func isAutoRegisteredAdmin(principal : Principal) : async Bool {
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
    arrivalTime : ?Time.Time;
    departureTime : ?Time.Time;
    timeOnFarm : ?Int;
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
  var nextFileAttachmentId = 1;

  let inventory = Map.empty<Nat, InventoryItem>();
  let customers = Map.empty<Nat, Customer>();
  let incomeRecords = Map.empty<Nat, IncomeRecord>();
  let expenseRecords = Map.empty<Nat, ExpenseRecord>();
  let sales = Map.empty<Nat, Sale>();
  let workers = Map.empty<Nat, Worker>();
  let fileAttachments = Map.empty<Nat, FileAttachment>();

  // Worker Farm Time Calendar
  let workerDailyRecords = Map.empty<Nat, WorkerDailyRecord>();

  // Department Leads and Monthly Plot Goals
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

  var nextMonthlyGoalId = 1;

  let monthlyGoals = Map.empty<Nat, {
    id : Nat;
    year : Nat;
    month : Nat;
    targetPlots : Nat;
    actualPlots : Nat;
    plotEntries : List.List<PlotEntry>;
  }>();

  let weeklyReports = List.empty<WeeklyReport>();

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

  public shared ({ caller }) func deleteInventoryItem(id : Nat) : async () {
    if (not isAdminOrAutoAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can delete inventory items");
    };
    switch (inventory.get(id)) {
      case (null) { Runtime.trap("Inventory item not found") };
      case (?_) { inventory.remove(id) };
    };
  };

  public shared ({ caller }) func addCustomer(name : Text, contactDetails : Text, customerType : Text) : async Nat {
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

  public shared ({ caller }) func updateCustomer(id : Nat, name : Text, contactDetails : Text, customerType : Text) : async () {
    if (not isAdminOrAutoAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can update customers");
    };
    switch (customers.get(id)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?existing) {
        let updated : Customer = {
          id;
          name;
          contactDetails;
          customerType;
          enteredBy = existing.enteredBy;
        };
        customers.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteCustomer(id : Nat) : async () {
    if (not isAdminOrAutoAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can delete customers");
    };
    switch (customers.get(id)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?_) { customers.remove(id) };
    };
  };

  public shared ({ caller }) func addIncome(amount : Float, date : Time.Time, source : IncomeSource, description : Text) : async Nat {
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

  public shared ({ caller }) func updateIncome(id : Nat, amount : Float, date : Time.Time, source : IncomeSource, description : Text) : async () {
    if (not isAdminOrAutoAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can update income records");
    };
    switch (incomeRecords.get(id)) {
      case (null) { Runtime.trap("Income record not found") };
      case (?existing) {
        let updated : IncomeRecord = {
          id;
          amount;
          date;
          source;
          description;
          enteredBy = existing.enteredBy;
        };
        incomeRecords.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteIncome(id : Nat) : async () {
    if (not isAdminOrAutoAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can delete income records");
    };
    switch (incomeRecords.get(id)) {
      case (null) { Runtime.trap("Income record not found") };
      case (?_) { incomeRecords.remove(id) };
    };
  };

  public shared ({ caller }) func addExpense(amount : Float, date : Time.Time, category : ExpenseType, description : Text) : async Nat {
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

  public shared ({ caller }) func deleteSale(id : Nat) : async () {
    if (not isAdminOrAutoAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can delete sales");
    };
    switch (sales.get(id)) {
      case (null) { Runtime.trap("Sale not found") };
      case (?sale) {
        // Restore inventory quantity
        switch (inventory.get(sale.inventoryItemId)) {
          case (null) {};
          case (?item) {
            let restoredItem : InventoryItem = {
              id = item.id;
              name = item.name;
              itemType = item.itemType;
              quantity = item.quantity + sale.quantity;
              costPerUnit = item.costPerUnit;
              enteredBy = item.enteredBy;
            };
            inventory.add(item.id, restoredItem);
          };
        };
        sales.remove(id);
      };
    };
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

  public shared ({ caller }) func updateWorker(id : Nat, name : Text, role : Text) : async () {
    if (not isAdminOrAutoAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can update workers");
    };
    switch (workers.get(id)) {
      case (null) { Runtime.trap("Worker not found") };
      case (?existing) {
        let updated : Worker = {
          id;
          name;
          role;
          enteredBy = existing.enteredBy;
        };
        workers.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteWorker(id : Nat) : async () {
    if (not isAdminOrAutoAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can delete workers");
    };
    switch (workers.get(id)) {
      case (null) { Runtime.trap("Worker not found") };
      case (?_) { workers.remove(id) };
    };
  };

  public query ({ caller }) func getWorkers() : async [Worker] {
    if (not (UserApproval.isApproved(approvalState, caller) or isAdminOrAutoAdmin(caller))) {
      Runtime.trap("Unauthorized: Only approved users or admins can view workers");
    };
    workers.values().toList<Worker>().toArray().sort();
  };

  public shared ({ caller }) func recordWorkerDay(workerId : Nat, date : Time.Time, present : Bool, arrivalTime : ?Time.Time, departureTime : ?Time.Time) : async () {
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

  let departments = List.fromArray<Department>([
    {
      name = "Goodnews";
      leadName = "Goodnews";
      description = "Nursery Management & Chemical/Fertilizer Application";
    },
    {
      name = "Nicholas";
      leadName = "Nicholas";
      description = "Irrigation & Watering";
    },
    {
      name = "Elvis";
      leadName = "Elvis";
      description = "Weeding & Harvesting";
    },
    {
      name = "Wisdom";
      leadName = "Wisdom";
      description = "Land Preparation, Farm Expansion & Infrastructure Projects";
    },
  ]);

  public query ({ caller }) func getDepartments() : async [Department] {
    if (not (UserApproval.isApproved(approvalState, caller) or isAdminOrAutoAdmin(caller))) {
      Runtime.trap("Unauthorized: Only approved users or admins can view departments");
    };
    departments.toArray();
  };

  public shared ({ caller }) func addMonthlyGoal(year : Nat, month : Nat, targetPlots : Nat) : async Nat {
    if (not isAdminOrAutoAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can add monthly goals");
    };

    let id = nextMonthlyGoalId;
    nextMonthlyGoalId += 1;

    let newGoal = {
      id;
      year;
      month;
      targetPlots;
      actualPlots = 0;
      plotEntries = List.empty<PlotEntry>();
    };
    monthlyGoals.add(id, newGoal);

    id;
  };

  public shared ({ caller }) func addPlotEntry(monthlyGoalId : Nat, plotName : Text, dateActivated : Time.Time, department : Text) : async () {
    if (not isAdminOrAutoAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can add plot entries");
    };

    switch (monthlyGoals.get(monthlyGoalId)) {
      case (null) { Runtime.trap("Monthly goal not found") };
      case (?goal) {
        let plotEntries = goal.plotEntries;
        let newPlotEntry = {
          plotName;
          dateActivated;
          department;
        };
        plotEntries.add(newPlotEntry);

        let updatedGoal = {
          id = goal.id;
          year = goal.year;
          month = goal.month;
          targetPlots = goal.targetPlots;
          actualPlots = plotEntries.size();
          plotEntries;
        };
        monthlyGoals.add(monthlyGoalId, updatedGoal);
      };
    };
  };

  func convertMonthlyGoalToImmutable(monthlyGoal : { id : Nat; year : Nat; month : Nat; targetPlots : Nat; actualPlots : Nat; plotEntries : List.List<PlotEntry> }) : MonthlyGoal {
    {
      id = monthlyGoal.id;
      year = monthlyGoal.year;
      month = monthlyGoal.month;
      targetPlots = monthlyGoal.targetPlots;
      actualPlots = monthlyGoal.actualPlots;
      plotEntries = monthlyGoal.plotEntries.toArray();
    };
  };

  public query ({ caller }) func getMonthlyGoals() : async [MonthlyGoal] {
    if (not (UserApproval.isApproved(approvalState, caller) or isAdminOrAutoAdmin(caller))) {
      Runtime.trap("Unauthorized: Only approved users or admins can view monthly goals");
    };
    monthlyGoals.values().toList<{ id : Nat; year : Nat; month : Nat; targetPlots : Nat; actualPlots : Nat; plotEntries : List.List<PlotEntry> }>().toArray().map(convertMonthlyGoalToImmutable);
  };

  public query ({ caller }) func getMonthlyGoal(id : Nat) : async ?MonthlyGoal {
    if (not (UserApproval.isApproved(approvalState, caller) or isAdminOrAutoAdmin(caller))) {
      Runtime.trap("Unauthorized: Only approved users or admins can view monthly goals");
    };
    switch (monthlyGoals.get(id)) {
      case (null) { null };
      case (?goal) {
        ?convertMonthlyGoalToImmutable(goal);
      };
    };
  };

  public shared ({ caller }) func submitWeeklyReport(departmentLead : Text, departmentName : Text, weekEnding : Time.Time, achievements : Text, challenges : Text, planForNextWeek : Text) : async () {
    if (not (UserApproval.isApproved(approvalState, caller) or isAdminOrAutoAdmin(caller))) {
      Runtime.trap("Unauthorized: Only approved users or admins can submit weekly reports");
    };

    let newReport : WeeklyReport = {
      departmentLead;
      departmentName;
      weekEnding;
      achievements;
      challenges;
      planForNextWeek;
    };
    weeklyReports.add(newReport);
  };

  public query ({ caller }) func getWeeklyReports() : async [WeeklyReport] {
    if (not (UserApproval.isApproved(approvalState, caller) or isAdminOrAutoAdmin(caller))) {
      Runtime.trap("Unauthorized: Only approved users or admins can view weekly reports");
    };
    weeklyReports.toArray();
  };

  public query ({ caller }) func getWeeklyReportsByDepartment(departmentName : Text) : async [WeeklyReport] {
    if (not (UserApproval.isApproved(approvalState, caller) or isAdminOrAutoAdmin(caller))) {
      Runtime.trap("Unauthorized: Only approved users or admins can view weekly reports");
    };

    let filteredReports = weeklyReports.filter(func(report) { report.departmentName == departmentName });
    filteredReports.toArray();
  };

  public query ({ caller }) func getWeeklyReportsByDateRange(startDate : Time.Time, endDate : Time.Time) : async [WeeklyReport] {
    if (not (UserApproval.isApproved(approvalState, caller) or isAdminOrAutoAdmin(caller))) {
      Runtime.trap("Unauthorized: Only approved users or admins can view weekly reports");
    };

    let filteredReports = weeklyReports.filter(
      func(report) {
        report.weekEnding >= startDate and report.weekEnding <= endDate
      }
    );
    filteredReports.toArray();
  };

  public shared ({ caller }) func initializeFixedMonthlyGoals() : async () {
    if (not isAdminOrAutoAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can initialize fixed monthly goals");
    };

    let months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    for (month in months.values()) {
      let monthlyGoal = {
        id = nextMonthlyGoalId;
        year = 2024;
        month;
        targetPlots = 2;
        actualPlots = 0;
        plotEntries = List.empty<PlotEntry>();
      };
      monthlyGoals.add(nextMonthlyGoalId, monthlyGoal);
      nextMonthlyGoalId += 1;
    };
  };

  // ---- File Attachment Functions (per inventory item) ----

  public shared ({ caller }) func uploadAttachmentToItem(inventoryItemId : Nat, filename : Text, mimeType : Text, content : Blob) : async Nat {
    if (not isAdminOrAutoAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can upload file attachments");
    };

    switch (inventory.get(inventoryItemId)) {
      case (null) { Runtime.trap("Inventory item not found") };
      case (?_) {};
    };

    let id = nextFileAttachmentId;
    nextFileAttachmentId += 1;

    let attachment : FileAttachment = {
      id;
      inventoryItemId;
      filename;
      mimeType;
      content;
    };

    fileAttachments.add(id, attachment);
    id;
  };

  public query ({ caller }) func getAttachmentsForItem(inventoryItemId : Nat) : async [FileAttachmentMetadata] {
    if (not (UserApproval.isApproved(approvalState, caller) or isAdminOrAutoAdmin(caller))) {
      Runtime.trap("Unauthorized: Only approved users or admins can view file attachments");
    };

    let result = List.empty<FileAttachmentMetadata>();
    for (att in fileAttachments.values()) {
      if (att.inventoryItemId == inventoryItemId) {
        result.add({
          id = att.id;
          inventoryItemId = att.inventoryItemId;
          filename = att.filename;
          mimeType = att.mimeType;
        });
      };
    };
    result.toArray();
  };

  public query ({ caller }) func getAttachment(id : Nat) : async ?FileAttachment {
    if (not (UserApproval.isApproved(approvalState, caller) or isAdminOrAutoAdmin(caller))) {
      Runtime.trap("Unauthorized: Only approved users or admins can retrieve file attachments");
    };
    fileAttachments.get(id);
  };

  public shared ({ caller }) func deleteAttachment(id : Nat) : async () {
    if (not isAdminOrAutoAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can delete file attachments");
    };

    if (not fileAttachments.containsKey(id)) {
      Runtime.trap("File attachment not found");
    };
    fileAttachments.remove(id);
  };

  public shared ({ caller }) func uploadFileAttachment(filename : Text, mimeType : Text, content : Blob) : async Nat {
    if (not isAdminOrAutoAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can upload file attachments");
    };

    let id = nextFileAttachmentId;
    nextFileAttachmentId += 1;

    let attachment : FileAttachment = {
      id;
      inventoryItemId = 0;
      filename;
      mimeType;
      content;
    };

    fileAttachments.add(id, attachment);
    id;
  };

  public query ({ caller }) func getFileAttachmentMetadata() : async [FileAttachmentMetadata] {
    if (not (UserApproval.isApproved(approvalState, caller) or isAdminOrAutoAdmin(caller))) {
      Runtime.trap("Unauthorized: Only approved users or admins can view file attachments");
    };
    fileAttachments.values().toList<FileAttachment>().toArray().map(
      func(att) : FileAttachmentMetadata {
        {
          id = att.id;
          inventoryItemId = att.inventoryItemId;
          filename = att.filename;
          mimeType = att.mimeType;
        };
      }
    );
  };

  public query ({ caller }) func getFileAttachment(id : Nat) : async ?FileAttachment {
    if (not (UserApproval.isApproved(approvalState, caller) or isAdminOrAutoAdmin(caller))) {
      Runtime.trap("Unauthorized: Only approved users or admins can retrieve file attachments");
    };
    fileAttachments.get(id);
  };

  public shared ({ caller }) func deleteFileAttachment(id : Nat) : async () {
    if (not isAdminOrAutoAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can delete file attachments");
    };

    if (not fileAttachments.containsKey(id)) {
      Runtime.trap("File attachment not found");
    };
    fileAttachments.remove(id);
  };
};
