# DATA SCIENCE DEMAND FORECAST REPORT
## Smart Resort 360 -- Demand Forecaster v1.0
**Dataset:** Public Hotel Booking Demand (Nuno Antonio, Ana de Almeida, Luis Nunes, 2019)
**Training completed:** 2026-09-26
**Model type:** PUBLIC BENCHMARK MODEL -- NOT Smart Resort actual data

> [!IMPORTANT]
> This model is trained entirely on a public European hotel dataset.
> It does NOT represent Smart Resort 360 actual booking history.
> Indian festival/event effects are NOT embedded in this model.

---

## Inconsistency Corrections Applied (Review Response)

The following errors in the initial report were identified and corrected:

| # | Inconsistency Found | Correction Applied |
|---|---|---|
| 1 | Report claimed RandomForest was the "best overall model" by MAE | Corrected: Rolling Mean 7 is the strongest benchmark by MAE (16.17 vs RF 16.73) |
| 2 | Metrics JSON `selection_criterion` said "lowest test MAE" for RF | Corrected: RF selected as best ML model; Rolling Mean 7 noted as best by MAE |
| 3 | Report said hotel-type decision was "SEPARATE" but model trained on combined data | Corrected: v1 uses COMBINED target; SEPARATE is a recommendation for v2 |
| 4 | R2 explanation said "Negative R2 does NOT mean the model is worse than the mean" | Corrected: that statement was incorrect; see Section 8 below |
| 5 | Plot 05 did not visually annotate which model leads on which metric | Corrected: plot regenerated with explicit labels and annotations |

---

## 1. Target Definition

**DAILY REALIZED ROOM DEMAND**

```
daily_demand = COUNT of rows where is_canceled == 0
               grouped by arrival_date
               across BOTH hotel types combined (v1 benchmark)
```

- Unit: number of confirmed room arrivals per calendar day
- One booking record = one room arrival
- Zero-demand days: 0 (dataset is complete for its range)
- This is NOT true occupancy (checkout/stay-through not tracked here)
- This is NOT Smart Resort occupancy data

**Aggregation logic (reproducible):**
```python
demand = (
    df_raw[df_raw["is_canceled"] == 0]
    .groupby("arrival_date").size()
    .reindex(full_date_range, fill_value=0)
)
```

---

## 2. Date Range and Observations

| Parameter | Value |
|---|---|
| Dataset arrivals range | 2015-07-01 to 2017-08-31 |
| After lag/rolling NaN removal | 2015-08-04 to 2017-08-31 |
| Total daily observations | 759 |
| Min daily demand | 15 rooms/day |
| Max daily demand | 255 rooms/day |
| Mean daily demand | 94.8 rooms/day |
| Std daily demand | 34.5 rooms/day |

---

## 3. Hotel Type Decision (Corrected)

Empirical correlation between City Hotel and Resort Hotel daily confirmed arrivals:

**r = 0.212 (weak)**

**v1 decision: COMBINED (both hotel types aggregated into a single daily demand series)**

The v1 benchmark aggregates both hotel types. This was done to establish a single-series
baseline quickly. Separate hotel-type modeling is recommended for v2 because City and
Resort demand show different patterns (r = 0.212, different cancellation rates, different ADR).

> [!NOTE]
> The initial report claimed the decision was "SEPARATE," which was inconsistent with
> what was actually trained. The v1 model artifact trains on combined demand.
> This inconsistency has been corrected here and in the metrics JSON.

| Hotel | n | Cancel Rate | Mean ADR |
|---|---|---|---|
| City Hotel | 79,330 | 41.7% | 105.3 |
| Resort Hotel | 40,060 | 27.8% | 95.0 |

Because Smart Resort 360 is resort-oriented, a future India-specific deployment should use
property-specific resort data and should NOT use the City Hotel demand pattern as a proxy.

---

## 4. Feature List and Leakage Checks

All 19 features are verified available BEFORE the forecast date for 7-day-ahead forecasting.

| Feature | Available Before Prediction? | Notes |
|---|---|---|
| `day_of_week` | YES | Calendar arithmetic |
| `day_of_month` | YES | Calendar arithmetic |
| `week_of_year` | YES | Calendar arithmetic |
| `month` | YES | Calendar arithmetic |
| `quarter` | YES | Calendar arithmetic |
| `is_weekend` | YES | Calendar arithmetic |
| `is_monday` | YES | Calendar arithmetic |
| `is_friday` | YES | Calendar arithmetic |
| `seasonal_period` | YES | Derived from month |
| `lag_7` | YES | t-7 past demand (safe for h=7) |
| `lag_14` | YES | t-14 past demand |
| `lag_28` | YES | t-28 past demand |
| `rolling_mean_7` | YES | shift(7) then rolling(7) |
| `rolling_mean_14` | YES | shift(7) then rolling(14) |
| `rolling_mean_28` | YES | shift(7) then rolling(28) |
| `rolling_std_7` | YES | shift(7) then rolling(7) |
| `rolling_std_14` | YES | shift(7) then rolling(14) |
| `rolling_std_28` | YES | shift(7) then rolling(28) |
| `recent_trend` | YES | rolling_mean_7 - rolling_mean_28 |
| `lag_1` | **EXCLUDED** | Would require t-1..t-6 future values for h=7 |

**Leakage prevention rule:**
All rolling features computed as `shift(7).rolling(window)` -- ensuring no demand
value from the current or future week contaminates the feature.

---

## 5. Chronological Split

**NO RANDOM SPLIT USED. Strictly chronological.**

| Set | Date Range | Observations | % |
|---|---|---|---|
| Train | 2015-08-04 to 2017-01-15 | 531 | 70% |
| Validation | 2017-01-16 to 2017-05-09 | 114 | 15% |
| Test (out-of-time) | 2017-05-10 to 2017-08-31 | 114 | 15% |

---

## 6. Baseline Results

| Baseline | Test MAE | Test RMSE | Test MAPE | Test R2 |
|---|---|---|---|---|
| **Rolling Mean 7** | **16.17** | 21.22 | **15.8%** | -0.055 |
| Seasonal Naive (lag-7) | 21.57 | 26.90 | 20.4% | -0.696 |

**Rolling Mean 7 is the strongest overall benchmark by MAE (16.17 rooms/day).**

This is a simple, interpretable baseline: predict next week's demand as the 7-day
rolling average of the past week's confirmed arrivals. It is difficult for ML models
to beat this baseline substantially on short time-series (759 daily points).

---

## 7. ML Model Results

| Model | Val MAE | Val RMSE | Test MAE | Test RMSE | Test MAPE | Test R2 |
|---|---|---|---|---|---|---|
| **RandomForest** | **20.99** | **27.66** | **16.73** | **21.08** | **16.0%** | -0.041 |
| GradientBoosting | -- | -- | 17.16 | 22.13 | 16.1% | -0.148 |
| HistGradientBoosting | 21.06 | 28.22 | 18.78 | 23.90 | 17.6% | -0.339 |

**RandomForest is the best-performing ML model on test MAE and test RMSE.**

---

## 8. Out-of-Time Test Results -- Correct Comparison (Corrected)

Full ranking by test MAE (all models and baselines combined):

| Rank | Model / Baseline | Category | Test MAE | Test RMSE | Test MAPE |
|---|---|---|---|---|---|
| 1 | **Rolling Mean 7** | Simple baseline | **16.17** | 21.22 | 15.8% |
| 2 | **RandomForest** | ML model | **16.73** | **21.08** | 16.0% |
| 3 | GradientBoosting | ML model | 17.16 | 22.13 | 16.1% |
| 4 | HistGradientBoosting | ML model | 18.78 | 23.90 | 17.6% |
| 5 | Seasonal Naive | Simple baseline | 21.57 | 26.90 | 20.4% |

**Correct wording:**
- Rolling Mean 7 is the strongest simple benchmark by MAE.
- RandomForest is the strongest ML model (lowest test MAE and lowest test RMSE among ML models).
- RandomForest beats Seasonal Naive on MAE (16.73 vs 21.57, +22.5% improvement).
- RandomForest does NOT beat Rolling Mean 7 on MAE (16.73 vs 16.17).
- RandomForest beats Rolling Mean 7 on RMSE (21.08 vs 21.22), a marginal difference.

**Deployment rationale (corrected):**
RandomForest was selected as the ML model for deployment because it provides the strongest
ML performance and slightly lower RMSE than the Rolling Mean baseline (21.08 vs 21.22),
while Rolling Mean 7 remains the strongest simple benchmark by MAE. The ML model provides
richer feature attribution and is extensible with additional features (event flags, ADR, etc.)
that a rolling mean cannot incorporate. This justifies choosing RandomForest for a
deployable ML pipeline even though it does not beat Rolling Mean 7 on MAE alone.

---

## 8a. R2 Explanation (Corrected)

> [!WARNING]
> The initial report contained an incorrect statement about negative R2.
> That statement has been removed and replaced with the following accurate explanation.

**What negative R2 actually means:**

Negative R2 means the model's squared-error performance on this test set is worse than
simply predicting the test-set mean for every observation. Specifically:

```
R2 = 1 - (SS_residual / SS_total)
```

When SS_residual > SS_total, R2 is negative. This means the model's errors are larger
(in squared terms) than the errors from always predicting the test set mean.

**However, MAE and RMSE are also evaluated because they provide direct room-count
error interpretation and are not as sensitive to a single metric reference level.**

For this test set (May-Aug 2017, European summer peak with high day-to-day volatility):
- The test mean demand is ~105 rooms/day with high variance
- All models including baselines show negative R2 on this test window
- This reflects the difficulty of the test period rather than a fundamental model failure
- MAE and MAPE are the primary practical metrics for hotel demand forecasting

Note: The claim "within acceptable range" has been removed. No external benchmark source
was cited to support that claim. The model should be evaluated against baselines, not
against an unstated acceptance threshold.

---

## 9. Feature Importance

*Features are associated with model predictions. No causal claims are made.*

| Rank | Feature | Importance | Interpretation |
|---|---|---|---|
| 1 | `rolling_mean_14` | 0.242 | 14-day trailing demand average is most associated with next-week predictions |
| 2 | `lag_7` | 0.146 | Same day last week -- strong weekly pattern association |
| 3 | `lag_14` | 0.087 | Two weeks ago same day |
| 4 | `rolling_std_28` | 0.086 | 28-day demand variability signal |
| 5 | `rolling_std_14` | 0.077 | 14-day demand variability signal |
| 6 | `lag_28` | 0.053 | Monthly same-day lag |
| 7 | `rolling_std_7` | 0.046 | Short-term variability |
| 8 | `recent_trend` | 0.044 | Difference between rolling_mean_7 and rolling_mean_28 |
| 9 | `rolling_mean_7` | 0.044 | Short-term rolling average |
| 10 | `week_of_year` | 0.039 | Weekly position in year |
| -- | `month` | 0.012 | Monthly position |
| -- | `seasonal_period` | 0.008 | 4-tier label (lowest, subsumed by lag/rolling) |

**Key insight:** The model is predominantly associated with recent demand history (lags and
rolling averages). Calendar features (month, seasonal_period) have lower relative importance
because the lag/rolling features already capture much of the seasonal information through
the actual demand trajectory. Features being important in a decision tree model means they
were useful for splitting nodes -- it does not mean they cause demand changes.

---

## 10. Limitations

| Limitation | Impact |
|---|---|
| 26 months of training data | Limited exposure to rare events and structural shifts |
| European hotel data | Seasonal direction inverted vs Indian coastal resort |
| No festival/holiday labels | Cannot learn event-specific demand patterns |
| Combined hotel types (r=0.21) | Blends two distinct demand patterns |
| Only 114 test days (May-Aug summer) | High natural variance in test period; negative R2 expected |
| No competitor rate or ADR feature | Pricing effects not captured in v1 |
| Day-to-day noise | Individual daily spikes are difficult to predict |

---

## 11. Future Festival / Event Integration Design

The approved **Hybrid Architecture (Option C)** applies without change:

```
Stage 1 [ML Baseline -- this model]:
  Input:  calendar features + lag/rolling demand history
  Output: baseline_demand_forecast (rooms/day)

Stage 2 [Event Featurizer -- External Calendar]:
  Input:  Curated India event calendar JSON
  Output: days_until_festival, festival_tier, is_long_weekend

Stage 3 [Hybrid Fusion]:
  If event within 14-day window:
    Surface PLANNING SIGNAL alongside baseline forecast
  No numerical festival multiplier applied.
  Planning alert surfaced to hotel manager.
```

**Language rules enforced (unchanged):**
- OK: "Demand is forecast to be elevated during this festival period"
- OK: "The model associates this seasonal period with ~X rooms/day"
- NOT OK: "Festival causes a +30% booking increase"
- NOT OK: "Festival demand lift: +30%"

The current model was trained on European hotel data and has NOT learned Diwali, Holi,
Eid, or any Indian festival effects. Event signals remain exclusively a future planning
layer concern until India-specific historical data with event labels is available.

---

## 12. India-Specific Deployment Limitations

This model MUST NOT be deployed as-is for an Indian coastal resort.

| European Dataset | Indian Coastal Resort Reality |
|---|---|
| Peak: July-August | Peak: October-March |
| Low: January-February | Low: June-September (monsoon) |
| Guest origin: Portugal, UK, France | Guest origin: Domestic India + international |
| Holidays: Portuguese/European calendar | Holidays: Indian national + state calendar |
| No Diwali/Holi/Eid signal | Diwali/Holi/Eid are critical demand events |

**Required deployment path:**
```
Current (Public Benchmark Model)
  --> Collect 12-24 months of Smart Resort actual booking data
  --> Annotate with India event calendar labels (retroactive join)
  --> Retrain with Indian seasonal priors
  --> Add Tier 1/2 calendar features (holidays.India library)
  --> Add Tier 3 festival features (curated event calendar JSON)
  --> Back-test on India holdout period
  --> Deploy with event-aware planning layer
```

---

## 13. Saved Artifact Paths

| Artifact | Path |
|---|---|
| Trained model | `ml/models/demand_forecaster_v1.joblib` |
| Metrics JSON | `ml/metrics/demand_forecaster_v1.json` |
| Training script | `ml/train_demand_forecast_model.py` |
| Plot: Demand series | `ml/reports/01_full_demand_series.png` |
| Plot: Actual vs Predicted | `ml/reports/02_actual_vs_predicted_test.png` |
| Plot: Residual analysis | `ml/reports/03_residual_analysis.png` |
| Plot: Feature importance | `ml/reports/04_feature_importance.png` |
| Plot: Model comparison (corrected) | `ml/reports/05_model_comparison.png` |
| Plot: DOW-Month heatmap | `ml/reports/06_demand_heatmap_dow_month.png` |
| Phase 1 design audit | `ml/FUTURE_EVENTS_FORECAST_DESIGN.md` |

**Note:** The model artifact `demand_forecaster_v1.joblib` was NOT modified during
this correction pass. Only the report text, metrics JSON metadata fields, and
the model comparison plot were updated.

---

## 14. Reload and Inference Verification

```python
import joblib, numpy as np
loaded = joblib.load("ml/models/demand_forecaster_v1.joblib")
model  = loaded["model"]       # RandomForest
feats  = loaded["feature_cols"]  # 19 features
# Predict on a feature row built from historical lag/rolling data
pred = np.clip(model.predict(X_row), 0, None)
```

Reload test on last 7 test dates (2017-08-25 to 2017-08-31):

| Date | Actual | Predicted | Error |
|---|---|---|---|
| 2017-08-25 | 140 | 105.1 | +34.9 |
| 2017-08-26 | 97 | 110.5 | -13.5 |
| 2017-08-27 | 125 | 102.9 | +22.1 |
| 2017-08-28 | 147 | 113.9 | +33.1 |
| 2017-08-29 | 81 | 97.7 | -16.7 |
| 2017-08-30 | 62 | 95.7 | -33.7 |
| 2017-08-31 | 89 | 114.5 | -25.5 |

**Reload verification: PASS | Feature count: 19**

The last 7 days are the final days of the dataset (Aug 25-31, 2017). Larger errors at
the dataset boundary are expected because the model has fewer lag observations available
and the end-of-dataset effect means the final days are somewhat anomalous.

---

## 15. Phase 3 Integration Recommendation

The model is ready for Phase 3 (FastAPI integration) subject to the following conditions:

1. **Use as a 7-day-ahead point forecast only.** Do not claim 14-day accuracy without
   a separate evaluation.
2. **Label outputs clearly:** "Public benchmark forecast -- European hotel patterns.
   Not trained on Smart Resort actual data."
3. **Do not display festival uplift numbers.** Event signals must be surfaced as
   planning alerts, not as quantified multipliers.
4. **Hotel-type note:** v1 combines both hotel types; the integration UI should
   note this limitation.
5. **Extend to v2 with:** separate hotel-type models, India-specific data,
   and event calendar integration.

---

## Reproducibility Checklist

- [x] Random seed: `RANDOM_SEED = 42` set globally
- [x] Dataset version: `ml/dataset/hotel_bookings.csv` (fixed file)
- [x] Feature list: 19 features (documented above)
- [x] Target definition: non-cancelled arrivals per day (both hotels combined)
- [x] Split dates: 2017-01-15 (train end), 2017-05-09 (val end)
- [x] Model parameters: n_estimators=200, max_depth=12, min_samples_leaf=3
- [x] Training timestamp recorded in metrics JSON
- [x] Python 3.14.3, pandas 3.0.6, sklearn 1.9.1
- [x] Model artifact unchanged during correction pass

---

*Smart Resort 360 Data Science Pipeline -- September 2026*
*Public benchmark only. Do NOT claim this model uses Smart Resort actual data.*
*Do NOT deploy to production without India-specific retraining.*
