import { X } from "lucide-react";
import { useState } from "react";
import AttendanceTab from "../components/tabs/AttendanceTab";
import CustomersTab from "../components/tabs/CustomersTab";
import ExpenseTab from "../components/tabs/ExpenseTab";
import FarmOperationsTab from "../components/tabs/FarmOperationsTab";
import FarmTimeTab from "../components/tabs/FarmTimeTab";
import HarvestLogTab from "../components/tabs/HarvestLogTab";
import IncomeTab from "../components/tabs/IncomeTab";
import InventoryTab from "../components/tabs/InventoryTab";
import ReportsTab from "../components/tabs/ReportsTab";
import SalesTab from "../components/tabs/SalesTab";
import SummaryTab from "../components/tabs/SummaryTab";
import VerificationTab from "../components/tabs/VerificationTab";
import { useIsCallerAdmin } from "../hooks/useQueries";

type TabValue =
  | "summary"
  | "income"
  | "expenses"
  | "inventory"
  | "customers"
  | "sales"
  | "attendance"
  | "farmTime"
  | "farmOperations"
  | "harvestLog"
  | "reports"
  | "verification";

const NAV_ITEMS: { value: TabValue; label: string }[] = [
  { value: "summary", label: "Summary" },
  { value: "income", label: "Income" },
  { value: "expenses", label: "Expenses" },
  { value: "inventory", label: "Inventory" },
  { value: "customers", label: "Customers" },
  { value: "sales", label: "Sales" },
  { value: "attendance", label: "Attendance" },
  { value: "farmTime", label: "Farm Time" },
  { value: "farmOperations", label: "Farm Operations" },
  { value: "harvestLog", label: "Harvest Log" },
  { value: "reports", label: "Reports" },
];

function ReportReminderBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const day = new Date().getDay(); // 0=Sun,1=Mon,...,6=Sat
  if (day !== 4 && day !== 5 && day !== 6) return null;

  const isSaturday = day === 6;

  return (
    <div
      data-ocid="report_reminder.section"
      className={`mb-4 flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
        isSaturday
          ? "border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-700 dark:bg-orange-950/30 dark:text-orange-200"
          : "border-yellow-300 bg-yellow-50 text-yellow-900 dark:border-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-200"
      }`}
    >
      <div className="flex items-start gap-2">
        <span className="text-base leading-none mt-0.5">
          {isSaturday ? "🚨" : "⏰"}
        </span>
        <p className="leading-relaxed">
          {isSaturday
            ? "Today is Saturday — weekly report submission day! Department leads, please submit your updates now."
            : "Weekly reports are due Saturday. Department leads, please prepare your updates."}
        </p>
      </div>
      <button
        type="button"
        aria-label="Dismiss reminder"
        data-ocid="report_reminder.close_button"
        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity mt-0.5"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function Dashboard() {
  const { data: isAdmin } = useIsCallerAdmin();
  const [activeTab, setActiveTab] = useState<TabValue>("summary");

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Saturday/Near-Saturday Report Reminder */}
      <ReportReminderBanner />

      {/* Navigation Buttons */}
      <div className="mb-6 flex flex-wrap gap-2">
        {NAV_ITEMS.map((item) => (
          <button
            type="button"
            key={item.value}
            data-ocid={`nav.${item.value}.link`}
            onClick={() => setActiveTab(item.value)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === item.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {item.label}
          </button>
        ))}
        {isAdmin && (
          <button
            type="button"
            data-ocid="nav.verification.link"
            onClick={() => setActiveTab("verification")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "verification"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Verification
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "summary" && <SummaryTab />}
        {activeTab === "income" && <IncomeTab />}
        {activeTab === "expenses" && <ExpenseTab />}
        {activeTab === "inventory" && <InventoryTab />}
        {activeTab === "customers" && <CustomersTab />}
        {activeTab === "sales" && <SalesTab />}
        {activeTab === "attendance" && <AttendanceTab />}
        {activeTab === "farmTime" && <FarmTimeTab />}
        {activeTab === "farmOperations" && <FarmOperationsTab />}
        {activeTab === "harvestLog" && <HarvestLogTab />}
        {activeTab === "reports" && <ReportsTab />}
        {isAdmin && activeTab === "verification" && <VerificationTab />}
      </div>
    </div>
  );
}
