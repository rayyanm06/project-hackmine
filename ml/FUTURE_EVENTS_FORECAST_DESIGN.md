# Future Events, Festivals & Holidays — Forecasting Design Audit
**Smart Resort 360 · Data Science Design Report**
**Dataset:** Public Hotel Booking Demand (Nuno António et al., 2015–2017)
**Scope:** Feature design for a future demand forecasting model (not yet implemented)

---

## Executive Summary

The Hotel Booking Demand dataset covers arrivals from **July 2015 to August 2017** at two European hotels (Portugal-based). It contains **119,390 bookings** and carries strong, measurable seasonality and day-of-week effects — but **contains zero explicit festival, holiday, or event labels**.

Any future-event feature must therefore be **externally supplied** at inference time, not learned from the dataset itself. This audit defines which features are defensible, which require external calendar data, and the correct architecture for a future-aware forecasting system.

---

## Part 1 — Dataset Temporal Signals (What We Actually Have)

### 1.1 Date Coverage

| Parameter | Value |
|---|---|
| Earliest arrival | 2015-07-01 |
| Latest arrival | 2017-08-31 |
| Span | ~26 months |
| Years represented | 2015, 2016, 2017 |

### 1.2 Available Temporal Columns (Raw)

| Column | Type | Use for Forecasting |
|---|---|---|
| `arrival_date_year` | int | Yes — trend baseline |
| `arrival_date_month` | str (12 levels) | Yes — strong seasonal signal |
| `arrival_date_week_number` | int (1-53) | Yes — weekly seasonality |
| `arrival_date_day_of_month` | int (1-31) | Limited — day effects within month |
| `stays_in_weekend_nights` | int | Yes — leisure proxy |
| `stays_in_week_nights` | int | Yes — business/length-of-stay |
| `lead_time` | int | Yes — booking horizon |

**What is NOT in the dataset:**
- No `is_holiday` column
- No `is_festival` column
- No event labels of any kind
- No school holiday markers
- No long-weekend flags

### 1.3 Measurable Seasonality

**Monthly demand (confirmed bookings):**

| Month | Confirmed | Mean ADR | Cancellation Rate |
|---|---|---|---|
| August | 8,638 | 142.1 | 37.8% |
| July | 7,919 | 129.3 | 37.5% |
| May | 7,114 | 104.8 | 39.7% |
| October | 6,914 | 86.8 | 38.0% |
| March | 6,645 | 77.3 | 32.2% |
| April | 6,565 | 97.9 | 40.8% |
| September | 6,392 | 107.3 | 39.2% |
| June | 6,404 | 114.6 | 41.5% |
| November | 4,672 | 70.5 | 31.2% |
| January | 4,122 | 67.0 | 30.5% |
| December | 4,409 | 78.9 | 35.0% |
| February | 5,372 | 72.4 | 33.4% |

**Key observation:** Peak demand is July-August (summer in Europe). Slowest months are January-February and November-December. This reflects the **European travel calendar**, not an Indian hospitality calendar.

**Lead time by arrival month:**

| Month | Mean Lead Time |
|---|---|
| September | 137 days |
| July | 136 days |
| June | 128 days |
| August | 121 days |
| February | 48 days |
| January | 45 days |

Guests booking peak months plan 4-5 months ahead. Off-peak months see same-week bookings.

**Day of week arrivals (confirmed, non-cancelled):**

| Day | Confirmed |
|---|---|
| Monday | 11,976 |
| Friday | 11,653 |
| Thursday | 11,327 |
| Saturday | 10,926 |
| Wednesday | 10,308 |
| Sunday | 9,577 |
| Tuesday | 9,399 |

Monday and Friday arrivals are highest, suggesting a mixed business + leisure guest profile.

**ADR: Leisure vs Business proxy:**

| Stay Type | Mean ADR |
|---|---|
| Includes weekend nights | 102.4 |
| Weekday-only stays | 96.8 |

Weekend-including stays command ~6% ADR premium, consistent with leisure demand.

---

## Part 2 — Holiday/Event Signal Audit on the Dataset

### 2.1 Can Holiday Effects Be Learned from This Data?

Empirical test: 12 Portuguese public holidays in 2016 vs surrounding days:

| Holiday | Confirmed Arrivals | Context |
|---|---|---|
| New Year 2016-01-01 | 33 | Day-1: 86, Day+1: 119 — sharp drop on the day |
| Labour Day 2016-05-01 | 61 | Day-1: 145, Day+1: 181 — deep dip on the day |
| Immaculate Conception 2016-12-08 | 154 | Day-1: 72, Day+1: 69 — spike vs surrounding |
| Portugal Day 2016-06-10 | 136 | Day-1: 111, Day+1: 81 — above average |
| Good Friday 2016-04-14 | 79 | Flat; day-1: 112 — arrival dip |
| Christmas 2016-12-25 | 54 | Day-1: 86, Day+1: 71 — below average |

**Conclusion:** Holiday effects exist in the data but are **inconsistent**. Some holidays see arrival spikes (long-weekend departure days), others see dips (guests already checked in). With only 2-3 years of data and no holiday label column, the signal-to-noise ratio is too low to learn reliable holiday effects via supervised ML.

> [!WARNING]
> The dataset is too small and lacks holiday labels to reliably learn festival/holiday effects via ML. A model trained on this data and applied to an Indian resort context MUST NOT claim it learned festival effects from this dataset.

### 2.2 What the Cancellation Model v1.0 Learned vs Did NOT Learn

The existing `cancellation_predictor_v1.joblib` (RandomForestClassifier, ROC-AUC: 0.8813) uses:
- `arrival_date_month` — encodes aggregate seasonal signal
- `arrival_date_week_number` — coarse week-of-year seasonality
- `lead_time` — booking urgency

It did **NOT** learn:
- Any specific holiday or festival effect (no such column exists)
- Any festival demand lift
- Any India-specific seasonal event pattern

The month/week signals carry blended seasonal effects, not attributable to any discrete event.

---

## Part 3 — Future Event Feature Design

### 3.1 Feature Evaluation Matrix

| Feature | Justified from Dataset? | Requires External Calendar? | Leakage Risk | Verdict |
|---|---|---|---|---|
| `is_public_holiday` | No — not labeled | YES — curated calendar | None if pre-supplied | Include in future model |
| `is_long_weekend` | Partially (DOW available) | Partial — holiday dates needed | None | Include — derivable |
| `is_festival` | No | YES — India calendar | None if pre-supplied | Include with caveat |
| `days_until_event` | No | YES | None if pre-supplied | Include (top 3 upcoming) |
| `days_since_event` | No | YES | None if pre-supplied | Include (shoulder period) |
| `event_importance` | No | YES — domain knowledge | None | Include with documented scale |
| `event_duration` | No | YES | None | Include |
| `event_overlap` | No | YES | None | Include for multi-day events |
| `seasonal_period` | YES — derivable from months | No | None | Include — 4-tier derivable |
| `event_category` | No | YES | None | Include (limited vocabulary) |

### 3.2 Recommended Feature Tiers

#### Tier 1 — Fully Derivable (No External Data Needed)

These are computable from `arrival_date` alone and are safe to use immediately:

```python
is_weekend          = arrival_date.dayofweek >= 5          # Saturday/Sunday
is_monday           = arrival_date.dayofweek == 0          # Monday spike confirmed
week_of_year        = arrival_date.isocalendar().week      # 1-53
month_of_year       = arrival_date.month                   # 1-12
quarter             = arrival_date.quarter                  # 1-4
seasonal_period     = derive_seasonal_period(arrival_date)  # See below
```

**`seasonal_period` (4-tier label):**
- `peak` — Q3 (Jul-Sep) for European data; Oct-Mar for Indian coastal resort
- `shoulder_high` — Q2 (Apr-Jun) and Q4 shoulder (Oct) for European data
- `shoulder_low` — Mar, Nov
- `low` — Jan-Feb, Dec (for Portugal context; inverted for India)

> [!IMPORTANT]
> For an Indian coastal resort (e.g., Goa, Kerala), seasonality is INVERTED vs this European dataset. October-March is peak season; June-September is monsoon/low. The ML model must be retrained on India-specific data before `seasonal_period` can carry correct Indian priors.

#### Tier 2 — Derivable from a Curated Public Holiday Calendar

These require a list of public holiday dates but no proprietary data:

```python
is_public_holiday       # bool: exact holiday date
is_day_before_holiday   # bool: high checkout / low check-in friction day
is_day_after_holiday    # bool: shoulder return demand
is_long_weekend         # bool: holiday adjacent to Friday or Monday
long_weekend_length     # int: 3, 4, or 5 days
```

**Source for India:**
```python
import holidays
india_holidays = holidays.India(state='GA', years=2026)  # Goa-specific
```

Also available: Government of India official holiday gazette (published annually).

#### Tier 3 — Requires a Curated Event Calendar (Structured Domain Data)

These cannot be derived from the public dataset and require a maintained calendar file:

```python
is_festival              # bool: named festival period
festival_name            # str: "Diwali", "Holi", "Eid", "Christmas", etc.
festival_tier            # int: 1=national major, 2=regional, 3=local
days_until_festival      # int: 0-30 (look-ahead proximity window)
days_since_festival      # int: 0-7 (post-event shoulder period)
festival_duration        # int: duration of festival in days
event_overlap_fraction   # float: fraction of stay overlapping an event

# Segment-specific signals
is_conference_period     # bool: major regional/national conference nearby
is_wedding_season        # bool: regional wedding season (groups segment)
is_school_holiday        # bool: major school break period
school_holiday_tier      # int: 1=national exam holiday, 2=summer, 3=winter
```

### 3.3 India-Specific Calendar Signals

| Event / Period | Approx Dates | Type | Demand Direction (Hypothesis) |
|---|---|---|---|
| Diwali | Oct-Nov (lunar, varies) | National festival | Higher leisure demand |
| Holi | Mar (lunar, varies) | National festival | Higher domestic travel |
| Eid al-Fitr | Varies (lunar) | National | Regional travel spikes |
| Christmas-New Year | Dec 24 - Jan 2 | National + tourism | Critical peak for coastal resorts |
| Navratri / Durga Puja | Sep-Oct | Regional (East/West) | Regional demand surge |
| Long weekends (general) | Monthly | Calendar-derived | +15-30% leisure demand (hypothesis only) |
| IPL Cricket | Mar-May | Sports event | Urban hotel demand primarily |
| Summer school holidays | May-Jun | School calendar | Family room demand |
| Winter school holidays | Dec | School calendar | Family + leisure demand |
| Monsoon season (Goa) | Jun-Sep | Seasonal | LOW season — rate compression |
| Goa Carnival | Feb-Mar | Local | Short burst demand |
| Wedding season | Nov-Feb (Goa/South) | Social | Group booking spike |

> [!CAUTION]
> Do NOT assign numerical demand lift percentages (e.g., "+30% during Diwali") to any of these events without supporting historical data from the actual property. The table above documents hypotheses and planning guidance ONLY. These effects must be measured, not assumed.

---

## Part 4 — Historical vs Future Data: Strict Separation

### 4.1 Data Boundary Rule

```
HISTORICAL TRAINING DATA (Public Dataset 2015-2017)
├── Learns: seasonality, week-of-year patterns, lead-time effects
├── Learns: customer segment behavior (Online TA, Groups, Corporate)
├── Learns: deposit type -> cancellation risk correlation
└── Does NOT learn: specific festival/holiday effects (no event labels)

FUTURE INFERENCE DATA (Supplied at Forecast Time)
├── Known future calendar events (curated, pre-published calendar)
├── Forward-looking occupancy from Smart Resort's own reservation DB
├── Seasonal_period for the target forecast date
└── Event proximity signals (days_until_festival, etc.)
```

### 4.2 Leakage Prevention Rules

| Risk | Rule |
|---|---|
| Using event outcomes ("Diwali caused +40% lift") | FORBIDDEN — use only calendar signals, not measured outcomes |
| Using booking counts from after the forecast date | FORBIDDEN — use only bookings made before forecast date |
| Using `reservation_status` as a feature | Already excluded from cancellation model v1.0 |
| Using event labels not available at booking time | FORBIDDEN — only use pre-published calendar events |
| Applying India festival dates to European training data | FLAG as domain mismatch — requires India property retraining |

**The leakage test:**
> "Would a hotel manager have known this specific piece of information on the forecast date, before the stay occurred?"

If YES — safe to use as a feature.
If NO — it is data leakage and must be excluded.

---

## Part 5 — Model Architecture Design

### 5.1 Three Options Evaluated

**Option A: Single ML Model with Direct Event Features**

Include all event signals as columns in one unified forecasting model.

Pros: Model learns feature interactions; single inference call  
Cons: Requires labeled historical event data (not in current dataset); festival effects confounded with other seasonal factors; retraining required when event calendar changes

**Option B: Two-Stage Baseline + Event Adjustment Layer**

```
Stage 1: Time-series baseline (learns seasonality, DOW, trend)
Stage 2: Event adjustment (festival_tier x importance -> multiplier)
Final:   Baseline x Event_Adjustment = Forecast
```

Pros: Works without labeled event training data; transparent and auditable; event rules updatable without retraining  
Cons: Adjustment multipliers require domain calibration; interaction effects not captured

**Option C: Hybrid (Recommended)**

```
Stage 1: ML Baseline Model
  Input features: week_of_year, seasonal_period, lead_time,
                  is_weekend, is_public_holiday, is_long_weekend,
                  school_holiday_tier
  Output: baseline_demand_forecast

Stage 2: Event Signal Featurizer
  Input: Curated event calendar JSON for forecast horizon
  Output: days_until_festival, festival_tier, event_overlap_fraction

Stage 3: Hybrid Fusion
  If event within 14-day window: add event features to Stage 1 input
  Else: use Stage 1 baseline only
  Optional: rule-based adjustment for Tier-1 festivals pending property data

Final Output: Demand Forecast + Confidence Interval + Event Attribution
```

Pros: ML handles learned patterns; rules handle novel/sparse events; auditable event influence; no leakage; avoids false causal claims  
Cons: Two systems to maintain; multiplier calibration still required for Tier 3 events

**Recommendation: Option C (Hybrid)**

Rationale: The current public dataset has insufficient event labels to train a pure ML event model reliably. A two-stage hybrid is statistically defensible at this stage. The event layer remains interpretable and can be calibrated as Smart Resort collects its own property data.

### 5.2 Proposed Feature Importance Hierarchy

```
Tier 1 (Highest priority):  seasonal_period, week_of_year, month_of_year
Tier 2 (High priority):     is_long_weekend, is_public_holiday, is_weekend
Tier 3 (Medium priority):   days_until_festival, festival_tier, school_holiday_tier
Tier 4 (Low / TBD):         event_overlap_fraction, is_conference_period
Tier 5 (Context / segment): is_wedding_season (Groups segment only)
```

---

## Part 6 — India / Local Context

### 6.1 Calendar Domain Mismatch Warning

> [!IMPORTANT]
> The training dataset is European (Portugal-based). Peak season in the dataset (Jul-Aug) corresponds to European summer holidays. For a Goa or Kerala coastal resort, peak season is October-March (post-monsoon). Any forecasting model transferred from this dataset MUST be recalibrated with India property-specific data before production use.

### 6.2 Recommended India Event Calendar Sources

| Source | Format | Coverage | Update Frequency |
|---|---|---|---|
| `holidays` Python library (country=IN) | Code | National + state public holidays | Annual |
| Ministry of Tourism, India | PDF/CSV | National tourism festivals | Annual |
| State Tourism Board (e.g., Goa Tourism) | Website | Local events (Goa Carnival, etc.) | Monthly |
| Local Event Scraping (structured) | JSON/API | Weddings, conferences, exhibitions | On-demand |

### 6.3 Proposed Event Calendar Data Structure

```json
{
  "calendar_version": "2026-2027",
  "property_region": "goa",
  "events": [
    {
      "name": "Diwali",
      "start_date": "2026-10-20",
      "end_date": "2026-10-24",
      "tier": 1,
      "category": "national_festival",
      "is_public_holiday": true,
      "expected_demand_direction": "high",
      "evidence_basis": "calendar_known",
      "notes": "Highest domestic travel event. Pre-Diwali travel peaks 2 days before."
    },
    {
      "name": "Goa Carnival",
      "start_date": "2027-02-20",
      "end_date": "2027-02-23",
      "tier": 2,
      "category": "local_event",
      "is_public_holiday": false,
      "expected_demand_direction": "high",
      "evidence_basis": "historical_occupancy_data_needed",
      "notes": "Strong local demand signal. Quantitative effect requires Goa property data."
    },
    {
      "name": "Monsoon Season",
      "start_date": "2027-06-01",
      "end_date": "2027-09-30",
      "tier": 1,
      "category": "seasonal_low",
      "is_public_holiday": false,
      "expected_demand_direction": "low",
      "evidence_basis": "regional_climate_calendar",
      "notes": "Goa monsoon. Historically lowest occupancy period for coastal resorts."
    }
  ]
}
```

### 6.4 Wedding Season Rule

For Indian resorts, wedding season is a critical group booking driver. Recommended as a segment-specific rule only:

```python
def is_wedding_season(date, region="goa"):
    month = date.month
    if region in ["goa", "kerala", "south"]:
        return month in [10, 11, 12, 1, 2]
    elif region in ["north", "delhi", "mumbai"]:
        return month in [11, 12, 1, 2]
    return False
```

> [!NOTE]
> The `is_wedding_season` flag should only influence the Groups market segment forecast path, not transient/OTA bookings. Conflating the two introduces incorrect demand signals.

---

## Part 7 — Example 7-Day Forecast Containing an Upcoming Event

**Design example only — the forecasting model is not yet trained.**

```
Forecast Date: 2026-10-20 (Tuesday)
Property:      Smart Resort 360, Goa
Horizon:       7 days ahead

Day 1 — Oct 20 (Tue)
  seasonal_period:     peak (Oct = Goa post-monsoon opening)
  is_public_holiday:   False
  days_until_festival: 2 (Diwali = Oct 22)
  festival_tier:       1 (National)
  forecast_direction:  ELEVATED — pre-festival domestic travel surge

Day 2 — Oct 21 (Wed)
  is_public_holiday:   False
  days_until_festival: 1
  forecast_direction:  ELEVATED — final-approach day; high check-ins expected

Day 3 — Oct 22 (Thu)  [Diwali]
  is_public_holiday:   True
  is_festival:         True
  festival_name:       "Diwali"
  days_until_festival: 0
  festival_tier:       1
  is_long_weekend:     True (Thu-Sun = 4-day long weekend)
  forecast_direction:  HIGH — peak arrival day
  Language note:       "The model associates Diwali + Oct peak season with
                        elevated demand. Effect size estimated from seasonal
                        patterns. No causal claim is made from current data."

Day 4 — Oct 23 (Fri)
  is_public_holiday:   True (Diwali holiday continued)
  is_long_weekend:     True
  days_since_festival: 1
  forecast_direction:  HIGH — long-weekend peak

Day 5 — Oct 24 (Sat)
  is_weekend:          True
  days_since_festival: 2
  forecast_direction:  HIGH — peak weekend

Day 6 — Oct 25 (Sun)
  is_weekend:          True
  days_since_festival: 3
  forecast_direction:  MODERATE — checkout day, shoulder demand

Day 7 — Oct 26 (Mon)
  is_weekend:          False
  days_since_festival: 4
  forecast_direction:  RETURNING TO BASELINE — post-event shoulder
```

**Language Rules Applied:**
- CORRECT: "The model associates Diwali with elevated demand in this period"
- CORRECT: "Demand is forecast to be higher during this event window"
- INCORRECT: "Diwali causes bookings to increase by 30%"
- INCORRECT: "Festival demand lift: +30%"

---

## Part 8 — Limitations

| Limitation | Impact | Mitigation |
|---|---|---|
| No event labels in training data | Cannot learn festival effects directly via supervised ML | Two-stage hybrid architecture |
| European hotel context vs Indian resort | Seasonality direction inverted; peak months differ | Retrain on India property data |
| Only 26 months of history | Insufficient to measure rare event effects statistically | Supplement with domain knowledge rules |
| Portugal holidays in training set | Not applicable to India context | Use `holidays.India` library |
| Festival dates are lunar/variable | Date lookup must be pre-computed each year | Annual calendar curation process |
| No occupancy data directly in dataset | Only arrival booking counts, not actual occupancy | Supplement with Smart Resort's reservation DB |
| Wedding/conference data absent | No group event labels in public dataset | Requires Smart Resort's own booking history |
| No competitor pricing events | Cannot model demand substitution effect | Future external data integration |
| Summer demand anomaly weeks | Top demand weeks (wk 32-34 = Aug) are summer-driven, not discrete events | Cannot separate European summer vs specific events |
| Small effect sizes | Holiday effects on individual days are inconsistent across 2-3 years | Aggregate weekly/monthly instead of daily holiday flags |

---

## Part 9 — Signal Availability Summary

| Signal | Available Now? | Source | Leakage-Safe? |
|---|---|---|---|
| Week/month seasonality | YES | Training dataset | YES |
| Day-of-week effects | YES | Training dataset | YES |
| `is_weekend` | YES | Derivable from date | YES |
| `is_long_weekend` | PARTIAL | Needs holiday date list | YES if pre-supplied |
| `is_public_holiday` (India) | NEEDS CALENDAR | `holidays` Python library | YES if pre-supplied |
| `is_festival` | NOT IN DATASET | Curated calendar JSON | YES if pre-supplied |
| `days_until_festival` | NOT IN DATASET | Curated calendar JSON | YES if pre-supplied |
| Festival demand effect sizes | NOT LEARNABLE from this data | Requires India property history | N/A |
| `is_school_holiday` | NOT IN DATASET | State education calendar | YES if pre-supplied |
| `is_wedding_season` | NOT IN DATASET | Regional domain knowledge | YES — rule-based |
| `is_conference_period` | NOT IN DATASET | Event scraping / CRM | YES if pre-supplied |

> [!NOTE]
> **Architecture Recommendation: Hybrid (Option C)**
> The statistically defensible design is a two-stage hybrid: an ML baseline model trained on historical seasonality + Tier 1-2 calendar features, combined with a separately maintained event-adjustment layer for Tier 3 festival/event signals. This avoids forcing underdetermined festival effects into an ML model that lacks the training evidence to support them.

---

## Part 10 — Recommended Next Steps

**Phase 1 (Design — No Training)**
- [x] This audit document — establishes the design contract
- [ ] Create `ml/calendars/india_events_2026_2027.json` — structured event calendar stub
- [ ] Define `EventFeaturizer` class schema — transforms calendar JSON into model-ready row features

**Phase 2 (Before Forecast Model Training)**
- [ ] Collect 12-24 months of Smart Resort's own booking history (actual property data)
- [ ] Retroactively annotate historical bookings with event labels via calendar join
- [ ] Train a baseline demand forecasting model (LightGBM or Facebook Prophet) on Smart Resort data

**Phase 3 (Event-Aware Forecasting)**
- [ ] Add Tier 1 and 2 event features to the forecasting model
- [ ] Implement two-stage hybrid (baseline + event adjustment layer)
- [ ] Validate with back-testing on holdout months (walk-forward validation)
- [ ] Integrate 7-day demand forecast output into Smart Resort 360 UI

---

*Generated by Smart Resort 360 Data Science Pipeline — September 2026*
*Based on: Public Hotel Booking Demand dataset (Nuno Antonio, Ana de Almeida, Luis Nunes)*
*This document MUST NOT be used to assert festival-demand causality without supporting property-specific historical data.*
