# Specification

## Summary
**Goal:** Replace the flat row of navigation buttons in the Dashboard with a single dropdown menu that lists all sections.

**Planned changes:**
- Remove the individual navigation buttons (Dashboard, Income, Expenses, Inventory, Customers, Sales, Attendance, Farm Time) from the Dashboard header/nav area.
- Add a single dropdown trigger button that opens a menu listing all eight sections.
- Selecting a menu item navigates to that tab and closes the dropdown.
- Highlight the currently active section in the dropdown list.
- Ensure the dropdown is keyboard-accessible (Enter/Escape to open/close, arrow keys to navigate).
- Keep the admin-only Verification tab hidden from non-admin users as before.

**User-visible outcome:** Users see a single dropdown menu trigger instead of a row of buttons; clicking it reveals all navigation options, and selecting one switches to that section.
