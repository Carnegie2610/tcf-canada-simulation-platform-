# Feature Specification: Extended Revenue Analysis (65% Stream)

## 1. Overview

The current dashboard only displays 35% of total revenue. This feature adds a new "Secondary Revenue Stream" section to allow users to view, filter, and analyze the remaining 65% of revenue data.

## 2. Functional Requirements

- **Data Visualization:** Create a dedicated dashboard component to visualize the 65% revenue stream, separate from the primary 35% display.
- **Date Range Filtering:**
    - Implement a calendar-based picker allowing users to select a single date OR a custom date range.
    - **Default State:** If no range is selected, default to a sensible timeframe (e.g., current month).
    - **Dynamic Updating:** The 65% revenue total and associated charts must recalculate and refresh immediately upon range selection.
- **Period Analysis:** The view must support granular reporting (e.g., selecting "1st June to 6th June") to show generated revenue within that specific window.

## 3. UI/UX Requirements

- **Component Location:** Add a new card or tab titled "Secondary Revenue (65%)" within the existing Revenue workspace.
- **Interaction:**
    - User clicks the Calendar icon to open a date range selector.
    - The selector supports "From [Date]" and "To [Date]" inputs.
    - A "Clear" or "Reset" button should be available to revert the view.
- **Visual Style:** Maintain the existing design system (Slate/Crimson palette) used in the `Objectif4C2Report` style guide.

## 4. Technical Guidelines for AI Agent

- **Date Handling:** Use a robust library like `date-fns` or `dayjs` to handle range calculations safely.
- **State Management:** Use local React state or URL search parameters to track the active date range.
- **Data Fetching:**
    - Create a memoized selector or hook to fetch the filtered 65% revenue data based on the chosen range.
    - Ensure the data fetch triggers loading states while the range is being updated.
- **Performance:** Ensure the dynamic filtering handles large datasets efficiently without UI stuttering.

## 5. Definition of Done

- [ ]  Secondary revenue dashboard is visible alongside the primary 35% view.
- [ ]  Calendar picker correctly identifies start/end dates.
- [ ]  Revenue figures dynamically update based on the selection.
- [ ]  Validated empty states (e.g., no revenue for selected dates) are gracefully handled.
- [ ]  Design matches the "Objectif 4C2" aesthetic (Slate/Crimson theme).