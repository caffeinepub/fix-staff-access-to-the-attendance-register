# Specification

## Summary
**Goal:** Fix staff (non-admin) access to the Attendance Register so staff can view attendance data without authorization failures, while keeping admin-only actions restricted.

**Planned changes:**
- Update backend authorization so authenticated non-admin staff principals can call Attendance read/profile endpoints (e.g., getWorkers, getAttendanceRecords, getWorkerAttendance, getCallerUserProfile, saveCallerUserProfile) while preserving anonymous denial and admin-only restrictions.
- Ensure the frontend Dashboard/Attendance tab loads and renders correctly for staff users (no blank screen or infinite loading) and can fetch/display workers and attendance records (or existing empty states).
- Add a clear error state in the Attendance tab when attendance-related queries fail (e.g., authorization), with guidance to re-login and/or contact an admin; do not replace the normal empty-state when queries succeed but data is empty.
- Preserve existing admin behavior: admins continue to view data and perform admin-only actions (Add Worker, Mark Attendance), while these controls remain hidden/disabled for non-admin staff.

**User-visible outcome:** Staff users can open the Attendance tab and reliably view workers and attendance records (or an empty state). If loading fails, they see a clear error with next steps. Admin users keep full Attendance functionality.
