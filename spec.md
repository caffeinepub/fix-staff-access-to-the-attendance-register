# Specification

## Summary
**Goal:** Complete the admin approval workflow and add an "Entered By" column to all entry tables across the application.

**Planned changes:**
- Add a backend query to list all users with pending approval status
- Ensure approve and reject functions correctly update and persist user approval status
- Migrate existing users without an approval status to an appropriate default in `migration.mo`
- Update the VerificationTab to fetch and display pending users with their name, ID, status, and Approve/Reject buttons
- Add an `enteredBy` field to all entry record types (Income, Expenses, Inventory, Sales, Attendance, Customers), automatically set to the caller's principal on creation
- Handle existing records without `enteredBy` gracefully (display "Unknown")
- Add an "Entered By" column to the tables in IncomeTab, ExpenseTab, InventoryTab, SalesTab, AttendanceTab, and CustomersTab

**User-visible outcome:** Admins can view, approve, and reject pending user registrations from the VerificationTab, and all entry tables now show which user created each record in a dedicated "Entered By" column.
