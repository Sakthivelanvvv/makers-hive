# Manufacturing ERP Improvement Plan

## Current assessment
- The application already has a strong UI foundation with route-based pages, cards, tables, and charts.
- Most business logic is still embedded directly inside route components, which makes the code harder to scale and reuse.
- The app relies on Supabase for data access, but the repository structure does not yet reflect a clean service/controller architecture.
- Role handling is minimal; admin-only sections are not consistently protected.
- Validation is mostly browser-native and not centralized.
- The dashboard and transactional flows can be improved with reusable status logic, clearer data services, and better consistency.

## Architectural gaps
1. Business logic and data access are mixed into route components.
2. There is no modular service layer for entities like products, sales, purchase, and manufacturing.
3. Reusable status and validation rules are duplicated across pages.
4. Role-based access is not fully reflected in navigation and route protection.
5. The project needs clearer domain boundaries even though the current UI is already good.

## Proposed phased improvements
### Phase 1 — Foundation
- Introduce shared domain constants and helpers for statuses, formatting, and validation.
- Add role helpers for navigation visibility.
- Keep existing screens and flows unchanged.

### Phase 2 — Service layer
- Move Supabase interaction logic into dedicated service modules for sales, purchase, manufacturing, products, and dashboard data.
- Keep route components focused on rendering and user interaction.

### Phase 3 — Validation and UX
- Add form-level validation messages for required fields, email format, positive quantities, and price checks.
- Improve empty states and consistent feedback.

### Phase 4 — Security and permissions
- Use role checks to hide unauthorized navigation sections.
- Add route-level checks for sensitive screens.

### Phase 5 — Performance and maintainability
- Centralize repeated query patterns.
- Improve query key usage and memoized UI logic where needed.
- Keep changes incremental so all current behavior remains intact.
