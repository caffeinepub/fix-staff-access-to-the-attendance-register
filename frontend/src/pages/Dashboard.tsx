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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, ShieldCheck, Check } from 'lucide-react';

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
  { value: 'summary', label: 'Dashboard' },
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

  const allItems = isAdmin
    ? [...NAV_ITEMS, { value: 'verification' as TabValue, label: 'Verification' }]
    : NAV_ITEMS;

  const activeLabel = allItems.find((item) => item.value === activeTab)?.label ?? 'Dashboard';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Navigation Dropdown */}
      <div className="mb-6 flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="min-w-[180px] justify-between gap-2">
              <span className="flex items-center gap-2">
                {activeTab === 'verification' && <ShieldCheck className="w-4 h-4 text-primary" />}
                {activeLabel}
              </span>
              <ChevronDown className="w-4 h-4 opacity-60 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            {NAV_ITEMS.map((item) => (
              <DropdownMenuItem
                key={item.value}
                onClick={() => setActiveTab(item.value)}
                className="flex items-center justify-between cursor-pointer"
              >
                <span>{item.label}</span>
                {activeTab === item.value && <Check className="w-4 h-4 text-primary" />}
              </DropdownMenuItem>
            ))}
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setActiveTab('verification')}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    Verification
                  </span>
                  {activeTab === 'verification' && <Check className="w-4 h-4 text-primary" />}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="text-muted-foreground text-sm hidden sm:block">
          {activeTab === 'summary' && 'Overview of your farm finances'}
          {activeTab === 'income' && 'Track and manage income records'}
          {activeTab === 'expenses' && 'Track and manage expense records'}
          {activeTab === 'inventory' && 'Manage farm inventory and stock levels'}
          {activeTab === 'customers' && 'Manage your customer list'}
          {activeTab === 'sales' && 'Record and review sales transactions'}
          {activeTab === 'attendance' && 'Manage worker attendance'}
          {activeTab === 'farmTime' && 'Track daily farm time for workers'}
          {activeTab === 'verification' && 'Manage user verification requests'}
        </span>
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
