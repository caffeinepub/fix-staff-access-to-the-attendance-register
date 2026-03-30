import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Target, Users } from "lucide-react";
import { useState } from "react";
import DepartmentsOverview from "./farmOperations/DepartmentsOverview";
import MonthlyPlotGoalTracker from "./farmOperations/MonthlyPlotGoalTracker";
import WeeklyReportsSection from "./farmOperations/WeeklyReportsSection";

export default function FarmOperationsTab() {
  const [activeSection, setActiveSection] = useState("departments");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-foreground">Farm Operations</h2>
        <p className="text-muted-foreground text-sm">
          Manage departments, track monthly plot goals, and review weekly
          reports.
        </p>
      </div>

      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Departments</span>
            <span className="sm:hidden">Depts</span>
          </TabsTrigger>
          <TabsTrigger value="plotGoals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Plot Goals</span>
            <span className="sm:hidden">Goals</span>
          </TabsTrigger>
          <TabsTrigger
            value="weeklyReports"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Weekly Reports</span>
            <span className="sm:hidden">Reports</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="departments">
          <DepartmentsOverview />
        </TabsContent>

        <TabsContent value="plotGoals">
          <MonthlyPlotGoalTracker />
        </TabsContent>

        <TabsContent value="weeklyReports">
          <WeeklyReportsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
