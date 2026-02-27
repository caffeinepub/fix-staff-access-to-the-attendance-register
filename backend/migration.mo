import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Text "mo:core/Text";

module {
  type OldInventoryItem = {
    id : Nat;
    name : Text;
    itemType : { #peppers; #fertilizer; #pesticide; #equipment };
    quantity : Nat;
    costPerUnit : Float;
  };

  type OldCustomer = {
    id : Nat;
    name : Text;
    contactDetails : Text;
    customerType : Text;
  };

  type OldIncomeRecord = {
    id : Nat;
    amount : Float;
    date : Time.Time;
    source : { #market; #wholesale; #local; #other };
    description : Text;
  };

  type OldExpenseRecord = {
    id : Nat;
    amount : Float;
    date : Time.Time;
    category : { #fertilizers; #packaging; #transportation; #labor; #equipment; #other };
    description : Text;
  };

  type OldSale = {
    id : Nat;
    date : Time.Time;
    customerId : Nat;
    inventoryItemId : Nat;
    quantity : Nat;
    unitPrice : Float;
  };

  type OldWorker = {
    id : Nat;
    name : Text;
    role : Text;
  };

  type OldWorkerDailyRecord = {
    workerId : Nat;
    date : Time.Time;
    present : Bool;
    arrivalTime : ?Time.Time;
    departureTime : ?Time.Time;
    timeOnFarm : ?Int;
  };

  type OldActor = {
    inventory : Map.Map<Nat, OldInventoryItem>;
    customers : Map.Map<Nat, OldCustomer>;
    incomeRecords : Map.Map<Nat, OldIncomeRecord>;
    expenseRecords : Map.Map<Nat, OldExpenseRecord>;
    sales : Map.Map<Nat, OldSale>;
    workers : Map.Map<Nat, OldWorker>;
    workerDailyRecords : Map.Map<Nat, OldWorkerDailyRecord>;
  };

  // New Types with enteredBy field
  type NewInventoryItem = OldInventoryItem and { enteredBy : Text };
  type NewCustomer = OldCustomer and { enteredBy : Text };
  type NewIncomeRecord = OldIncomeRecord and { enteredBy : Text };
  type NewExpenseRecord = OldExpenseRecord and { enteredBy : Text };
  type NewSale = OldSale and { enteredBy : Text };
  type NewWorker = OldWorker and { enteredBy : Text };
  type NewWorkerDailyRecord = OldWorkerDailyRecord and { enteredBy : Text };

  type NewActor = {
    inventory : Map.Map<Nat, NewInventoryItem>;
    customers : Map.Map<Nat, NewCustomer>;
    incomeRecords : Map.Map<Nat, NewIncomeRecord>;
    expenseRecords : Map.Map<Nat, NewExpenseRecord>;
    sales : Map.Map<Nat, NewSale>;
    workers : Map.Map<Nat, NewWorker>;
    workerDailyRecords : Map.Map<Nat, NewWorkerDailyRecord>;
  };

  public func run(old : OldActor) : NewActor {
    {
      inventory = old.inventory.map<Nat, OldInventoryItem, NewInventoryItem>(
        func(_id, oldItem) { { oldItem with enteredBy = "unknown" } }
      );
      customers = old.customers.map<Nat, OldCustomer, NewCustomer>(
        func(_id, oldCustomer) { { oldCustomer with enteredBy = "unknown" } }
      );
      incomeRecords = old.incomeRecords.map<Nat, OldIncomeRecord, NewIncomeRecord>(
        func(_id, oldRecord) { { oldRecord with enteredBy = "unknown" } }
      );
      expenseRecords = old.expenseRecords.map<Nat, OldExpenseRecord, NewExpenseRecord>(
        func(_id, oldRecord) { { oldRecord with enteredBy = "unknown" } }
      );
      sales = old.sales.map<Nat, OldSale, NewSale>(
        func(_id, oldSale) { { oldSale with enteredBy = "unknown" } }
      );
      workers = old.workers.map<Nat, OldWorker, NewWorker>(
        func(_id, oldWorker) { { oldWorker with enteredBy = "unknown" } }
      );
      workerDailyRecords = old.workerDailyRecords.map<Nat, OldWorkerDailyRecord, NewWorkerDailyRecord>(
        func(_id, oldRecord) { { oldRecord with enteredBy = "unknown" } }
      );
    };
  };
};
