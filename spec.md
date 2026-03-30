# Pepper Farm Management App

## Current State
A full-stack ICP app for pepper farm bookkeeping and operations. Has: income/expense tracking, inventory management, customer records, sales, worker attendance, farm time calendar, departmental reporting (weekly reports, monthly plot goals, department overview). Admin controls with deletion key 2642 and first-4-admin rule. File attachments on inventory items.

Missing backend operations: deleteIncome, updateIncome, deleteCustomer, updateCustomer, deleteWorker, updateWorker, deleteSale. No analytics/charts on Summary. No CSV export. No worker attendance stats.

## Requested Changes (Diff)

### Add
- Backend: deleteIncome, updateIncome, deleteCustomer, updateCustomer, deleteWorker, updateWorker, deleteSale
- Summary tab: monthly income vs expenses bar chart (last 6 months), expense breakdown by category
- Income tab: edit and delete buttons per row (admin only, delete requires key 2642)
- Customers tab: edit and delete buttons per row (admin only)
- Sales tab: delete button per row (admin only, delete requires key 2642)
- Attendance/FarmTime: worker attendance stats card showing days present, absent, attendance rate
- CSV export button on Income and Expense tabs
- Workers tab: edit and delete buttons (admin only)

### Modify
- Summary tab: add charts section below existing cards
- useQueries.ts: add hooks for all new mutations

### Remove
- Nothing removed

## Implementation Plan
1. Regenerate Motoko backend adding the 7 new CRUD functions
2. Update useQueries.ts with new hooks: useDeleteIncome, useUpdateIncome, useDeleteCustomer, useUpdateCustomer, useDeleteWorker, useUpdateWorker, useDeleteSale
3. Update SummaryTab with recharts bar chart (monthly trend) and pie/donut chart (expense categories)
4. Update IncomeTab with edit dialog + delete confirmation requiring key 2642
5. Update CustomersTab with edit + delete functionality
6. Update SalesTab with delete per row
7. Update FarmTimeTab/AttendanceTab with stats cards per worker
8. Add CSV export utility and buttons to Income/Expense tabs
9. Update AttendanceTab to allow edit/delete of workers
