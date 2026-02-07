import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SummaryTab from '../components/tabs/SummaryTab';
import IncomeTab from '../components/tabs/IncomeTab';
import ExpenseTab from '../components/tabs/ExpenseTab';
import InventoryTab from '../components/tabs/InventoryTab';
import CustomersTab from '../components/tabs/CustomersTab';
import SalesTab from '../components/tabs/SalesTab';
import AttendanceTab from '../components/tabs/AttendanceTab';

export default function Dashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="summary" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7">
          <TabsTrigger value="summary">Dashboard</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
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
      </Tabs>
    </div>
  );
}
