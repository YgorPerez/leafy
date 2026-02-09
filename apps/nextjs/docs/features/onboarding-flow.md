# Onboarding Flow

This document describes the onboarding flow for the application, heavily inspired by MacroFactor's data-driven approach. The goal is to establish an accurate baseline for the user's metabolism (Estimated Expenditure) and set clear, achievable goals.

## MacroFactor-Inspired Flow Steps

### 1. Unit Preferences & Account Creation

- **Global Units**: Select Metric (kg, cm, kcal) vs Imperial (lbs, ft/in, kcal). This should be the first choice to avoid confusion later.
- **Initial Auth**: Sign-up via Email/Social.
- **Profile**: Username/Display Name.

### 2. Physical Characteristics (The Baseline)

To calculate BMR and initial TDEE, we need:

- **Date of Birth**: Used for age calculation in metabolic formulas (Mifflin-St Jeor or Katch-McArdle).
- **Biological Sex**: Necessary for baseline metabolic calculations.
- **Height**: CM or Feet/Inches.
- **Current Weight**: KG or Lbs.
- **Body Fat Percentage (Optional)**: If provided, use Katch-McArdle for better accuracy; otherwise, default to Mifflin-St Jeor.

### 3. Goal Setting

- **Goal Type**:
  - **Lose Weight**: Focus on caloric deficit.
  - **Maintain Weight**: Focus on energy balance.
  - **Gain Weight**: Focus on caloric surplus (often for muscle gain).
- **Target Weight**: The desired weight outcome.
- **Rate of Change**:
  - A slider (use tanstack ranger lib) or selection for how fast the user wants to progress.
  - _MacroFactor logic_: Provides "Recommended", "Sustainable", and "Aggressive" ranges (e.g., 0.2% - 1.0% of body weight per week).

### 4. Activity & Expenditure Estimation

Since we don't have historical data yet, we must estimate initial expenditure:

- **Daily Movement (NEET)**: Selection based on workday/lifestyle:
  - **Sedentary**: Desk job, very little walking.
  - **Lightly Active**: Teacher, salesperson, some walking.
  - **Moderately Active**: Waiter, construction, constant movement.
  - **Very Active**: Heavy manual labor, athlete.
- **Exercise (EAT)**: Resistance training or cardio frequency (e.g., 0-7 days/week). This affects the recommended protein and the magnitude of the "Training-Based" calorie shifts.

- **Manual**: The user sets everything; the app only tracks and provides the expenditure data.

### 6. Metabolism Seeding (The "Starting Point")

To get the Expenditure algorithm started more accurately than just BMR formulas:

- **Intake Knowledge (Optional)**: "I have no idea what I've been eating" (Default).
- **Weight Trend (Optional)**: "Stable" (Default).
- **Weight History (Optional)**: "What is your highest ever adult weight?" (Defaults to current weight).
  - **Why?** If current weight is >10% below highest weight, we apply a **3% reduction** to the BMR estimate to account for potential metabolic adaptation from significant weight loss.

### 7. Training Experience & Supplements (Optional)

If the user selects "Gain Weight" or "Maintain":

- **Experience Level**: Beginner, Intermediate (Default), Advanced lifter.
- **Creatine Use**: "Are you currently taking or planning to start taking Creatine?" (Default: No).
  - **Why?** Creatine causes an initial 1-2kg increase in water weight. Knowing this prevents the algorithm from misinterpreting the initial "gain" as fat or a surplus error.

### 8. Physiological Biofeedback (Optional)

- **Menstrual Cycle Tracking**: (If Biological Sex = Female) "Would you like to account for cycle-related weight fluctuations?" (Default: No).
  - **Why?** Significant water retention and metabolic rate changes (up to 200-300kcal/day) occur during the luteal phase.
- **Sleep & Stress**: "On average, how is your sleep quality?" (Default: Good/Neutral).
  - **Why?** Chronic poor sleep/high stress can suppress BMR and increase water retention (cortisol), which masks fat loss on the scale.

### 9. Dietary Preferences & Restrictions

Within the Coached/Collaborative paths, we define the nutritional strategy:

- **Diet Type (Optional)**: Standard (Omnivore) is default.
- **Protein Target**: Required for Coached/Collaborative.
- **Macro Distribution**: Required for Coached/Collaborative.

### 7. Calorie Shifting (Optional High/Low Days)

To improve sustainability, users can distribute their weekly calorie budget unevenly:

- **Shift Type**:
  - **Uniform**: Same calories every day.
  - **Manual Shifting**: User chooses specific days to be "High" or "Low" (e.g., eat more on weekends, less on weekdays).
  - **Training-Based**: Automatically assign higher calories to days with scheduled resistance training.
- **UI Logic**: When shifting, the app must ensure the _weekly total_ remains the same to meet the weight goal.

### 8. Lifestyle & Logistics

- **Check-in Day**: Choose which day of the week the user wants to review their progress and receive program updates.

## Technical Implementation Notes

### State Management

- Use a **Zustand store** or **React Context** to manage the multi-step form state.
- Persist partial progress to `localStorage` or `sessionStorage`.
- Only sync to the database (DB) once the final step is completed.

### UI/UX Requirements

- **Progress Bar**: Show the user how far they are in the process.
- **Dynamic Previews**: As the user moves the "Rate of Change" slider, show an estimated "Goal Completion Date".
- **Glassmorphism Theme**: Consistent with the app's premium aesthetic.
- **Micro-animations**: Use Framer Motion for smooth transitions between steps.

### Mathematical Formulas

1.  **BMR (Mifflin-St Jeor)**:
    - Men: `(10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5`
    - Women: `(10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161`
2.  **Metabolic Adaptation Multiplier**:
    - If `Current Weight < (Highest Weight * 0.9)`, multiply BMR by `0.97` (-3%).
    - If `In Deficit (Lose Weight Goal)`, multiply BMR by an additional `0.95` (-5%).
3.  **Initial TDEE**: `BMR × Metabolic Multiplier × Physical Activity Level (PAL) factor`.
4.  **Macro Allocation**:
    - Protein: 4 kcal/g
    - Carbs: 4 kcal/g
    - Fats: 9 kcal/g

## Implementation Checklist

- [ ] **Step 1: Unit Preferences & Account** - Global units and auth.
- [ ] **Step 2: Physicality Step** - Age, Sex, Height, Weight.
- [ ] **Step 4: Seeding Step** - Intake knowledge and weight trend.
- [ ] **Step 5: Biofeedback Step** - Menstrual cycle, sleep, and stress factors.
- [ ] **Step 6: Goal Selection Step** - Goal type, target weight, and training experience.
- [ ] **Step 7: Supplements Step** - Creatine and other metabolism-impacting factors.
- [ ] **Step 8: Rate of Progress Step** - Slider with sustainability feedback.
- [ ] **Step 9: Activity Level Step** - PAL (NEET) and training frequency.
- [ ] **Step 10: Strategy Step** - Coached vs Collaborative vs Manual.
- [ ] **Step 11: Dietary Preferences Step** - Diet type, protein, and macros.
- [ ] **Step 12: Calorie Shifting Step** - High/Low days.
- [ ] **Step 13: Logistics Step** - Check-in day.
- [ ] **Step 14: Review & Submit** - Final summary and DB sync.
- [ ] **Calculations Engine** - Implement Mifflin-St Jeor and TDEE logic.
- [ ] **State Machine** - Implement the multi-step form logic with persistence.
- [ ] **Quick Start Guide** - Post-onboarding interactive tutorial overlay.
