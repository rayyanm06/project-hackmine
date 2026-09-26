# Hotel Booking Demand — Exploratory Data Analysis (EDA) Report

## 1. Dataset Overview
- **Source**: Hotel Booking Demand dataset (Nuno António, Ana Almeida, and Luís Nunes).
- **Scope**: PUBLIC EXTERNAL TRAINING/RESEARCH DATASET (Separate from live Smart Resort 360 SQLite operational data).
- **Size**: 119,390 rows × 32 columns.

## 2. Columns
The dataset contains the following variables:
`hotel`, `is_canceled`, `lead_time`, `arrival_date_year`, `arrival_date_month`, `arrival_date_week_number`, `arrival_date_day_of_month`, `stays_in_weekend_nights`, `stays_in_week_nights`, `adults`, `children`, `babies`, `meal`, `country`, `market_segment`, `distribution_channel`, `is_repeated_guest`, `previous_cancellations`, `previous_bookings_not_canceled`, `reserved_room_type`, `assigned_room_type`, `booking_changes`, `deposit_type`, `agent`, `company`, `days_in_waiting_list`, `customer_type`, `adr`, `required_car_parking_spaces`, `total_of_special_requests`, `reservation_status`, `reservation_status_date`.

## 3. Missing Values
- **`company`**: 112,593 missing (94.3% missing; should likely be dropped or encoded as binary "has_company").
- **`agent`**: 16,340 missing (13.7% missing; can be encoded or imputed with 0/"No Agent").
- **`country`**: 488 missing (0.4% missing; safe to impute with mode).
- **`children`**: 4 missing (safe to drop or impute with 0).

## 4. Target Candidates & Class Balance
We evaluated the following potential targets:

1. **Booking Cancellation Prediction (`is_canceled`)** 🏆 *(Recommended)*
   - **Type**: Binary Classification
   - **Class Balance**: 
     - 0 (Not Canceled): 63.0%
     - 1 (Canceled): 37.0%
   - **Fit**: Highly actionable for Smart Resort 360. Allows the resort to flag high-risk bookings for follow-up or adjust overbooking strategies dynamically.

2. **ADR / Revenue Analysis (`adr`)**
   - **Type**: Regression
   - **Distribution**: Mean $101.83, Std $50.53, Range: -$6.38 to $5,400 (contains outliers).
   - **Fit**: Useful, but predicting ADR at booking time is often deterministic based on current pricing rules rather than purely predictive.

3. **Occupancy/Demand & Seasonal Patterns**
   - **Type**: Time-Series Forecasting
   - **Fit**: Requires aggregating the data into daily/weekly buckets, which fundamentally alters the granularity of individual guest predictions.

**Decision**: **Booking Cancellation Prediction (`is_canceled`)** is the best supported target. It leverages the rich individual guest features natively and maps perfectly to the operational Next Best Action logic.

## 5. Useful Features
- **Booking details**: `lead_time`, `deposit_type`, `days_in_waiting_list`.
- **Guest history**: `is_repeated_guest`, `previous_cancellations`.
- **Stay characteristics**: `stays_in_weekend_nights`, `stays_in_week_nights`, `adults`, `total_of_special_requests`.
- **Sourcing**: `market_segment`, `distribution_channel`.

## 6. Leakage Risks (Critical)
To predict cancellation *at the time of booking*, we must drop variables that are only known after the booking lifecycle concludes.
- **`reservation_status`**: Direct label leakage (Check-Out, Canceled, No-Show).
- **`reservation_status_date`**: Direct leakage.
- **`assigned_room_type`**: Minor leakage (often assigned at check-in; using `reserved_room_type` is safer).

## 7. Recommended Train/Test Strategy
**Time-based Split (Out-of-Time Validation)**: 
Instead of a random train/test split, we should split sequentially based on `arrival_date_year` and `arrival_date_month` (e.g., train on July 2015 – Jan 2017, test on Feb 2017 – Aug 2017). This respects the temporal nature of hotel bookings and proves the model can generalize to future, unseen seasons.

## 8. Appropriate Evaluation Metrics
Since the dataset is slightly imbalanced (63/37) and false positives (treating a good guest as a cancellation) have a different business cost than false negatives (missing a cancellation):
- **ROC-AUC**: To measure overall probability ranking.
- **F1-Score**: To balance Precision and Recall.
- **Precision**: Highly important if the Next Best Action involves costly interventions (e.g., calling the guest).
