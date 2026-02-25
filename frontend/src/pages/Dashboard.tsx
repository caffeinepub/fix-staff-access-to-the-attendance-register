import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { ShieldCheck } from 'lucide-react';

export default function Dashboard() {
  const { data: isAdmin } = useIsCallerAdmin();

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="summary" className="space-y-6">
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-2 lg:grid-cols-9' : 'grid-cols-2 lg:grid-cols-8'}`}>
          <TabsTrigger value="summary">Dashboard</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="farmTime">Farm Time</TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="verification" className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verification
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="summary">
          <SummaryTab />
        </TabsContent>

        <TabsContent value="income">
          <IncomeTab />
        </TabsContent>

        <TabsContent value="expenses">
          <ExpenseTab />
        </TabsContent>

        <TabsContent value="inventory">
          <InventoryTab />
        </TabsContent>

        <TabsContent value="customers">
          <CustomersTab />
        </TabsContent>

        <TabsContent value="sales">
          <SalesTab />
        </TabsContent>

        <TabsContent value="attendance">
          <AttendanceTab />
        </TabsContent>

        <TabsContent value="farmTime">
          <FarmTimeTab />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="verification">
            <VerificationTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
