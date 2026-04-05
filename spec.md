# Pepper Farm Management App

## Current State
The app is a comprehensive farm management tool with:
- Dashboard with 9 navigation tabs: Summary, Income, Expenses, Inventory, Customers, Sales, Attendance, Farm Time, Farm Operations
- Admin-only Verification tab for approving new users
- First 4 users auto-registered as admins; first user is ultimate admin
- Deletion key 2642 required for all deletes
- Departmental reporting with clickable cards (Goodnews, Nicholas, Elvis, Wisdom)
- Slide-in sheet panels per department with past reports and inline report submission form
- Weekly reports section with dialog-based submission
- Monthly plot goal tracker
- File attachments for inventory items
- Charts on Summary tab (monthly income vs expenses, expense breakdown)
- CSV export on Income and Expense tabs
- Attendance summary cards per worker
- All monetary values in Nigerian Naira (₦)
- All edit/delete buttons visible and functional

## Requested Changes (Diff)

### Add
- **Harvest Log**: New tab or sub-section to record pepper harvests (date, quantity in kg, harvested by, plot/location, notes). Viewable by all approved users, addable by admins.
- **Notifications/Reminders Panel**: A small notice on the Dashboard reminding department leads when Saturday (weekly report deadline) is approaching (within 2 days) or overdue.
- **Report Status Indicator**: On each department card in DepartmentsOverview, show a badge indicating whether that department has submitted a report for the current week ("Submitted" in green, "Pending" in amber).
- **Quick Stats on Farm Operations tab**: Show total reports submitted, reports this month, and departments with pending reports for the current week — displayed as summary cards at the top of the Farm Operations tab.

### Modify
- **Department card report status**: Add a small badge on each department card showing whether the current week's report has been submitted.
- **Summary tab**: Add a 5th card showing number of harvests this month (once harvest log is added).

### Remove
- Nothing removed.

## Implementation Plan
1. Add harvest log: frontend-only using localStorage (no backend changes needed, keeping scope minimal and build stable). HarvestLog tab renders a table of harvest entries; admins can add new entries via a form dialog with date, quantity (kg), harvested by, plot/location, notes fields.
2. Add Saturday reminder banner: computed client-side from current date; show in Dashboard above nav buttons when today is Thu/Fri/Sat (within 2 days of or on Saturday).
3. Add weekly report status badge to department cards: compute from existing `getWeeklyReports` data — check if any report for that department has weekEnding in the current ISO week.
4. Add Quick Stats cards to FarmOperationsTab header.
5. Update Summary tab to include harvest count card.

Note: Keeping all new features frontend-only (localStorage for harvests) to avoid risky backend changes that have caused deployment failures in the past.
