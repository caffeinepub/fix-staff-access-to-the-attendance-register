import { useState } from 'react';
import SummaryTab from '../components/tabs/SummaryTab';
import IncomeTab from '../components/tabs/IncomeTab';
import ExpenseTab from '../components/tabs/ExpenseTab';
import InventoryTab from '../components/tabs/InventoryTab';
import CustomersTab from '../components/tabs/CustomersTab';
import SalesTab from '../components/tabs/SalesTab';
import AttendanceTab from '../components/tabs/AttendanceTab';
import FarmTimeTab from '../components/tabs/FarmTimeTab';
import VerificationTab from '../components/tabs/VerificationTab';
import { useIsCallerAdmin } from '../hooks/useQueries';

type TabValue =
  | 'summary'
  | 'income'
  | 'expenses'
  | 'inventory'
  | 'customers'
  | 'sales'
  | 'attendance'
  | 'farmTime'
  | 'verification';

const NAV_ITEMS: { value: TabValue; label: string }[] = [
  { value: 'summary', label: 'Summary' },
  { value: 'income', label: 'Income' },
  { value: 'expenses', label: 'Expenses' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'customers', label: 'Customers' },
  { value: 'sales', label: 'Sales' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'farmTime', label: 'Farm Time' },
];

export default function Dashboard() {
  const { data: isAdmin } = useIsCallerAdmin();
  const [activeTab, setActiveTab] = useState<TabValue>('summary');

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Navigation Buttons */}
      <div className="mb-6 flex flex-wrap gap-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.value}
            onClick={() => setActiveTab(item.value)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === item.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {item.label}
          </button>
        ))}
        {isAdmin && (
          <button
            onClick={() => setActiveTab('verification')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'verification'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Verification
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'summary' && <SummaryTab />}
        {activeTab === 'income' && <IncomeTab />}
        {activeTab === 'expenses' && <ExpenseTab />}
        {activeTab === 'inventory' && <InventoryTab />}
        {activeTab === 'customers' && <CustomersTab />}
        {activeTab === 'sales' && <SalesTab />}
        {activeTab === 'attendance' && <AttendanceTab />}
        {activeTab === 'farmTime' && <FarmTimeTab />}
        {isAdmin && activeTab === 'verification' && <VerificationTab />}
      </div>
    </div>
  );
}
