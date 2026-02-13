# Design Guidelines - HaulageTracker

## Table Standards
- **Standardized Filtering**: Every table MUST include a standardized search filter bar. This should be consistent across the entire project in terms of placement (part of `DataTable` toolbar), styling, and behavior.
- **Primary Actions**: All primary page-level actions (e.g., "Add User", "Add Cluster", "Add Site") must be positioned at the **Right Hand Side (RHS)** of the page header.
- **Row Actions**: Table-level actions (Edit, Delete, Deactivate, etc.) should be displayed as **Direct Inline Icons/Buttons** rather than hidden in dropdowns. This ensures better accessibility and a more user-centric, responsive experience. They should be sleek, correctly colored, and have subtle backgrounds on hover.

## Destructive Actions
- **Confirmation Required**: Any destructive action, specifically **Deleting** any record, MUST trigger a confirmation dialog.
- **Confirmation Message**: The dialog must clearly state what is being deleted and ask for explicit confirmation before proceeding.

## Aesthetics
- Maintain a clean, professional, and high-end aesthetic.
- Use consistent iconography and spacing across all modules.
