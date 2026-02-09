# Meal Grouping and DIASS

- [ ] **Timestamped Entries**: Record specific times for food entries to track meal timing and eating windows.
- [ ] Group foods logged close together into a meal automatically.
- [ ] Enable dietary functionalities like DIASS for the meal.

## What needs to be done

### 1. Data Structure & Logic Updates

- [ ] **Timestamping**: Ensure all food logs have a precise `logged_at` timestamp (ISO string or unix with timezone awareness).
- [ ] **Auto-Grouping**: Implement logic to automatically group items logged within a 30-60 minute window.
- [ ] **Meal Persistence**: Add a `meal_label` field to grouped logs or a separate `meals` table to store custom names (e.g., "Post-Workout").
- [ ] **Manual Overrides**: Implement functionality to manually "split" a meal or drag items between groups.
- [ ] **Timezone Handling**: Ensure `logged_at` correctly reflects the user's local time regardless of travel.

### 2. DIASS & Nutrition Intelligence

- [ ] **DIASS Formula**: Implement the Digestible Indispensable Amino Acid Score calculation.
- [ ] **Amino Acid Summation**: Aggregate full profiles across all foods in a meal before scoring.
- [ ] **Bottleneck Identification**: Identify and display the "Limiting Amino Acid" (the bottleneck) for each meal.
- [ ] **Complementary Suggestions**: Logic to suggest foods that would "complete" the protein profile based on the bottleneck.
- [ ] **Quality Badges**: UI indicators for "High Quality Protein" based on the final score.

### 3. UI & UX Refinements

- [ ] **Meal Cards**: Visually wrap grouped items into a single card with total calorie/macro counts for that meal.
- [ ] **Meal-Specific Charts**: Add a toggle to see a nutrient breakdown chart specifically for one meal.
- [ ] **Save as Recipe**: Add a "Save Meal as Recipe" button for quick retrieval of common food combos.
- [ ] **Eating Window Tracking**: Automatically calculate and display "Last Meal" time and "Total Fasting Duration" on the dashboard.
- [ ] **Smart Recognition**: Suggest meal names based on time of day and typical contents (e.g., suggesting "Breakfast" for oats/coffee).
