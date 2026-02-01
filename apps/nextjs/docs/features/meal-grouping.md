# Meal Grouping and DIASS

- [ ] Timestamp foods.
- [ ] Group foods logged close together into a meal.
- [ ] Enable dietary functionalities like DIASS for the meal.

## What needs to be done

### 1. Data Structure Updates

- [ ] Ensure all food logs have a precise `logged_at` timestamp.
- [ ] Implement logic to automatically group items logged within a 30-60 minute window.

### 2. DIASS Calculation

- [ ] Implement the Digestible Indispensable Amino Acid Score (DIASS) formula.
- [ ] Sum the amino acid profiles of all foods in a grouped "meal" before calculating the score.

### 3. UI Display

- [ ] In the "Today's Food" view, visually wrap grouped items into a single card with a total calorie/macro count for that meal.
