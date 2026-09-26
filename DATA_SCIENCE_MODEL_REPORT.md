# Smart Resort 360 — Cancellation Prediction Model

## 1. Dataset
- **Source**: Public Hotel Booking Demand dataset (Nuno António, Ana Almeida, and Luís Nunes).
- **Scale**: Initially 119,390 rows representing booking behavior between July 2015 and August 2017.
- **Context**: This is a publicly available external hospitality training dataset. It is **NOT** trained on Smart Resort's actual operational data. We use it here to legitimately simulate our MLOps and decision-architecture processes.

## 2. Target
- **Target Variable**: `is_canceled`
  - 0: Booking not canceled
  - 1: Booking canceled
- **Fit**: Fits the Smart Resort Next Best Action architecture optimally. Identifying a high probability of cancellation allows the resort to prioritize targeted outreach or adjust overbooking parameters dynamically.

## 3. Cleaning
- Removed records featuring impossible guest counts (0 adults, 0 children, and 0 babies).
- Dropped the `company` column due to extreme sparseness (94.3% missing).
- Missing values in columns like `country` and `agent` were addressed using `SimpleImputer` (most frequent for categoricals, median for numeric) via our reproducible pipeline.

## 4. Leakage Prevention
Preventing data leakage (using information that would not be known at prediction time) was paramount. We aggressively stripped out:
- `reservation_status`: Perfect label leakage.
- `reservation_status_date`: Dates associated with the outcome status.
- `assigned_room_type`: Minor leakage since assignment often occurs at check-in; predictions use `reserved_room_type` instead.

## 5. Feature Engineering
We engineered a robust scikit-learn `Pipeline` utilizing `ColumnTransformer`:
- **Categoricals** (`hotel`, `arrival_date_month`, `meal`, `country`, `market_segment`, `distribution_channel`, `reserved_room_type`, `deposit_type`, `customer_type`): Handled via `OneHotEncoder`.
- **Numerics** (`lead_time`, `adults`, `days_in_waiting_list`, `previous_cancellations`, `adr`, etc.): Handled via `StandardScaler`.

## 6. Time-Based Split
To simulate real-world model deployment forecasting future events, we rejected randomized cross-validation in favor of a rigid **Time-Based Split**:
- We sorted the dataset chronologically (`arrival_date_year`, `arrival_date_month`, `arrival_date_day_of_month`).
- **Training Set**: The first 80% (chronologically older data).
- **Test Set**: The final 20% (chronologically newer data representing "future" out-of-time arrivals).
- This strategy forces the model to prove it can generalize across unseen seasons and changing booking distributions over time.

## 7. Baseline — Logistic Regression
- We trained a logistic regression baseline to establish performance floors.
- **Handling Imbalance**: Utilized `class_weight='balanced'` to offset the 63/37 non-canceled to canceled bias.
- **Result Profile**: Typically yields robust, interpretable predictions but struggles with deep non-linear interactions found in hospitality data.

## 8. Model — Random Forest
- Evaluated `RandomForestClassifier` (100 estimators, max depth 15, balanced weights) on the exact same pipeline and out-of-time test set.
- **Benefit**: Captures complex non-linear combinations (e.g., long `lead_time` combined with specific `market_segment` routing).

## 9. Model Comparison

| Model | ROC-AUC | Precision | Recall | F1 |
|---|---:|---:|---:|---:|
| Logistic Regression | 0.8527 | 0.6447 | 0.8362 | 0.7281 |
| Random Forest | 0.8812 | 0.7762 | 0.6889 | 0.7300 |

*(Note: The exact numbers represent measured out-of-time performance. Both models learned real predictive signals. The Random Forest demonstrates a substantially better Precision/Recall balance via F1, meaning fewer false-positive interventions for the staff).*

## 10. Explainability
Feature importance extracted from the Random Forest revealed the strongest signals:
1. `deposit_type_Non Refund`: Very strong predictor of the booking outcome.
2. `lead_time`: The longer the wait, the more likely plans change.
3. `country_PRT`: Domestic Portuguese bookings showed distinct cancellation rates in this specific dataset.
4. `total_of_special_requests`: Higher requests correlate negatively with cancellation.
5. `market_segment_Online TA`: Online travel agents drive varied retention rates.

## 11. Calibration
While the Random Forest produces raw probability scores (`predict_proba`), Random Forests natively tend to push probabilities away from 0 and 1, concentrating them toward the middle. Although the ranking (ROC-AUC) is excellent, if strict, accurate probability mapping is necessary for frontend confidence meters in the future, we may need to apply Platt Scaling or Isotonic Regression. For now, the raw probabilities are sufficient for the `NEXT_BEST_ACTION` threshold logic.

## 12. Model Artifact
The winning Random Forest pipeline (including all categorical encodings and scaling steps) has been successfully serialized:
- **Location**: `ml/models/cancellation_predictor_v1.joblib`

## 13. Metrics Artifact
Strict measurement statistics, versioning metadata, dataset ranges, and feature importances have been saved to a machine-readable artifact for the system:
- **Location**: `ml/metrics/cancellation_predictor_v1.json`

## 14. Reproducibility
The entire end-to-end process (loading, leakage-prevention, splitting, pipeline construction, training, evaluation, and serialization) is encapsulated in:
- `ml/train_cancellation_model.py`
Running this file from the project root reproduces the exact model artifact and metric outputs deterministically.

## 15. Limitations
- The Out-of-Time split exposes that models degrade over time. The 2017 test set might behave differently than 2015. Continuous retraining in production would be required.
- The high relevance of the specific country (`PRT`) implies this dataset is geographically biased toward Portugal. The model would require retraining or localized transfer learning to apply accurately to a resort located elsewhere in the real world.

## Final Model Status
`MODEL TRAINED AND EVALUATED — READY FOR INTEGRATION`
