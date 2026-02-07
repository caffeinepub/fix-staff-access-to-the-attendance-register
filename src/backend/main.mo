import List "mo:core/List";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Initialize the user system state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    // Allow all authenticated users (including staff) to access their profile
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    // Restrict access to own profile unless admin
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    // Allow all authenticated users (including staff) to save their profile
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
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
  };

  public type Customer = {
    id : Nat;
    name : Text;
    contactDetails : Text;
    customerType : Text;
  };

  public type IncomeRecord = {
    id : Nat;
    amount : Float;
    date : Time.Time;
    source : IncomeSource;
    description : Text;
  };

  public type ExpenseRecord = {
    id : Nat;
    amount : Float;
    date : Time.Time;
    category : ExpenseType;
    description : Text;
  };

  public type Sale = {
    id : Nat;
    date : Time.Time;
    customerId : Nat;
    inventoryItemId : Nat;
    quantity : Nat;
    unitPrice : Float;
  };

  // New Worker type
  public type Worker = {
    id : Nat;
    name : Text;
    role : Text;
  };

  // New Attendance Record type
  public type AttendanceRecord = {
    id : Nat;
    workerId : Nat;
    date : Time.Time;
    status : { #present; #absent; #late; #onLeave };
  };

  var nextInventoryItemId = 1;
  var nextCustomerId = 1;
  var nextIncomeId = 1;
  var nextExpenseId = 1;
  var nextSaleId = 1;
  var nextWorkerId = 1;
  var nextAttendanceId = 1;

  let inventory = Map.empty<Nat, InventoryItem>();
  let customers = Map.empty<Nat, Customer>();
  let incomeRecords = Map.empty<Nat, IncomeRecord>();
  let expenseRecords = Map.empty<Nat, ExpenseRecord>();
  let sales = Map.empty<Nat, Sale>();
  let workers = Map.empty<Nat, Worker>();
  let attendanceRecords = Map.empty<Nat, AttendanceRecord>();

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

  module AttendanceRecord {
    public func compare(a : AttendanceRecord, b : AttendanceRecord) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  public shared ({ caller }) func addInventoryItem(name : Text, itemType : ItemType, quantity : Nat, costPerUnit : Float) : async Nat {
    // Admin only
    if (not AccessControl.isAdmin(accessControlState, caller)) {
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
    };
    inventory.add(id, item);
    id;
  };

  public shared ({ caller }) func updateInventoryItem(id : Nat, name : Text, itemType : ItemType, quantity : Nat, costPerUnit : Float) : async () {
    // Admin only
    if (not AccessControl.isAdmin(accessControlState, caller)) {
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
        };
        inventory.add(id, item);
      };
    };
  };

  public shared ({ caller }) func addCustomer(name : Text, contactDetails : Text, customerType : Text) : async Nat {
    // Admin only
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can add customers");
    };
    let id = nextCustomerId;
    nextCustomerId += 1;
    let customer : Customer = {
      id;
      name;
      contactDetails;
      customerType;
    };
    customers.add(id, customer);
    id;
  };

  public shared ({ caller }) func addIncome(amount : Float, date : Time.Time, source : IncomeSource, description : Text) : async Nat {
    // Admin only
    if (not AccessControl.isAdmin(accessControlState, caller)) {
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
    };
    incomeRecords.add(id, record);
    id;
  };

  public shared ({ caller }) func addExpense(amount : Float, date : Time.Time, category : ExpenseType, description : Text) : async Nat {
    // Admin only
    if (not AccessControl.isAdmin(accessControlState, caller)) {
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
    };
    expenseRecords.add(id, record);
    id;
  };

  public shared ({ caller }) func addSale(customerId : Nat, inventoryItemId : Nat, quantity : Nat, unitPrice : Float) : async Nat {
    // Admin only
    if (not AccessControl.isAdmin(accessControlState, caller)) {
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
    };
    sales.add(id, sale);

    let updatedItem : InventoryItem = {
      id = item.id;
      name = item.name;
      itemType = item.itemType;
      quantity = item.quantity - quantity;
      costPerUnit = item.costPerUnit;
    };
    inventory.add(item.id, updatedItem);

    id;
  };

  public query ({ caller }) func getInventoryItems() : async [InventoryItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view inventory items");
    };
    inventory.values().toList<InventoryItem>().toArray().sort();
  };

  public query ({ caller }) func getCustomers() : async [Customer] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view customers");
    };
    customers.values().toList<Customer>().toArray().sort();
  };

  public query ({ caller }) func getIncomeRecords() : async [IncomeRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view income records");
    };
    incomeRecords.values().toList<IncomeRecord>().toArray().sort();
  };

  public query ({ caller }) func getExpenseRecords() : async [ExpenseRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view expense records");
    };
    expenseRecords.values().toList<ExpenseRecord>().toArray().sort();
  };

  public query ({ caller }) func getSales() : async [Sale] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view sales");
    };
    sales.values().toList<Sale>().toArray().sort();
  };

  public query ({ caller }) func getCustomerPurchaseHistory(customerId : Nat) : async [Sale] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view customer purchase history");
    };
    let filteredSales = List.empty<Sale>();
    for (sale in sales.values()) {
      if (sale.customerId == customerId) {
        filteredSales.add(sale);
      };
    };
    filteredSales.toArray();
  };

  // Worker and Attendance Methods

  public shared ({ caller }) func addWorker(name : Text, role : Text) : async Nat {
    // Admin only
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can add workers");
    };
    let id = nextWorkerId;
    nextWorkerId += 1;
    let worker : Worker = {
      id;
      name;
      role;
    };
    workers.add(id, worker);
    id;
  };

  public query ({ caller }) func getWorkers() : async [Worker] {
    // Allow all authenticated users (including staff) to view workers
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view workers");
    };
    workers.values().toList<Worker>().toArray().sort();
  };

  public shared ({ caller }) func markAttendance(workerId : Nat, date : Time.Time, status : { #present; #absent; #late; #onLeave }) : async Nat {
    // Admin only
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can mark attendance");
    };

    switch (workers.get(workerId)) {
      case (null) { Runtime.trap("Worker not found") };
      case (?_) {
        let id = nextAttendanceId;
        nextAttendanceId += 1;
        let record : AttendanceRecord = {
          id;
          workerId;
          date;
          status;
        };
        attendanceRecords.add(id, record);
        id;
      };
    };
  };

  public query ({ caller }) func getAttendanceRecords() : async [AttendanceRecord] {
    // Allow all authenticated users (including staff) to view attendance records
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view attendance records");
    };
    attendanceRecords.values().toList<AttendanceRecord>().toArray().sort();
  };

  public query ({ caller }) func getWorkerAttendance(workerId : Nat) : async [AttendanceRecord] {
    // Allow all authenticated users (including staff) to view worker attendance
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view worker attendance");
    };
    let filteredRecords = List.empty<AttendanceRecord>();
    for (record in attendanceRecords.values()) {
      if (record.workerId == workerId) {
        filteredRecords.add(record);
      };
    };
    filteredRecords.toArray();
  };
};
