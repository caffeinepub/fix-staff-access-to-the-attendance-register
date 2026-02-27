# Specification

## Summary
**Goal:** Fix all non-functional and invisible buttons introduced in the latest version across every tab of the application, and ensure the "Entered By" field is fully wired to the backend.

**Planned changes:**
- Audit and fix button visibility across all tabs (VerificationTab, InventoryTab, IncomeTab, ExpenseTab, SalesTab, CustomersTab, AttendanceTab, FarmTimeTab, SummaryTab, and Dashboard) so every button has proper background color, text color, and contrast in both light and dark mode.
- Audit and fix all button onClick handlers across every tab to ensure approve/reject, add/edit/delete, and other actions correctly trigger their intended operations (dialog opens, form submissions, or backend mutations) without console errors.
- Verify and wire the "Entered By" column and its UI controls in InventoryTab, IncomeTab, ExpenseTab, and SalesTab so the `enteredBy` field is saved with the current user's name on new records and displayed correctly in all relevant data tables.

**User-visible outcome:** All buttons across every tab are visually distinct and fully functional when clicked, and the "Entered By" column correctly shows who entered each record.
