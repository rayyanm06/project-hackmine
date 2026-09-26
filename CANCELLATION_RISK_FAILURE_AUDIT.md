# Cancellation Risk — Failure and UX Audit

## 1. Browser Failure
When attempting to click `Analyze Cancellation Risk` in the browser, the frontend catches an error from the API request and triggers an alert popup. While the user prompt referred to "Failed to show result", the exact text triggered by the frontend code (`frontend/src/routes/_layout.cancellation-risk.tsx`) is actually `"Failed to analyze risk"`.

## 2. Network Request
- **Request URL**: `http://127.0.0.1:8000/api/ml/cancellation-risk`
- **Method**: `POST`
- **Request Payload**: The full JSON object containing 27 features (e.g. `lead_time`, `adr`, `market_segment`, etc.)
- **HTTP Status**: `404 Not Found` (Prior to diagnosis restart)
- **Response Body**: `{"detail":"Not Found"}`

## 3. Backend Endpoint
The endpoint `POST /api/ml/cancellation-risk` is correctly defined in `backend/routes/ml.py` and correctly registered in `backend/main.py` via `app.include_router(ml.router)`. It is built to receive a strict 27-feature Pydantic schema and returns a prediction, risk level, and metrics.

## 4. Model Input Schema
The `RandomForestClassifier` pipeline saved in `ml/models/cancellation_predictor_v1.joblib` natively expects a pandas DataFrame with exactly 27 columns matching the dataset structure (minus the target and leaked variables). 
The exact expected columns: `hotel`, `lead_time`, `arrival_date_year`, `arrival_date_month`, `arrival_date_week_number`, `arrival_date_day_of_month`, `stays_in_weekend_nights`, `stays_in_week_nights`, `adults`, `children`, `babies`, `meal`, `country`, `market_segment`, `distribution_channel`, `is_repeated_guest`, `previous_cancellations`, `previous_bookings_not_canceled`, `reserved_room_type`, `booking_changes`, `deposit_type`, `agent`, `days_in_waiting_list`, `customer_type`, `adr`, `required_car_parking_spaces`, `total_of_special_requests`.

## 5. Browser vs Backend Payload
| Feature | Model expects | Backend expects | Frontend sends | Match? |
|---|---|---|---|---|
| lead_time | numeric | int | number | Yes |
| country | categorical | str | string | Yes |
| market_segment | categorical | str | string | Yes |
| deposit_type | categorical | str | string | Yes |
| customer_type | categorical | str | string | Yes |
| total_of_special_requests | numeric | int | number | Yes |
| previous_cancellations | numeric | int | number | Yes |
| is_repeated_guest | categorical/binary | int | number | Yes |
| adults | numeric | int | number | Yes |
| adr | numeric | float | number | Yes |
| *Other 17 features* | mixed | mixed | exact defaults | Yes |

*Note*: The frontend passes exactly 27 properties. 10 of them are mapped to UI inputs, while the remaining 17 are passed as static defaults behind the scenes to satisfy the strict schema requirement.

## 6. Direct Model Inference
Directly calling `model.predict()` and `model.predict_proba()` on a valid Pandas DataFrame works flawlessly. The model outputs a shape of `(1,)` for `predict` (e.g. `[1]`) and `(1, 2)` for `predict_proba` (e.g. `[[0.37, 0.63]]`). The model itself is perfectly intact and functional.

## 7. Direct API Inference
Calling `POST /api/ml/cancellation-risk` via Python `requests` with the exact browser payload **succeeds** (returns `200 OK`) and returns the expected `CancellationPredictionResponse` object. 

## 8. Root Cause
The root cause of the network failure in the browser was operational: **The FastAPI backend was running in a background daemon without the `--reload` flag.** 
Because it was started *before* the ML route was added to `backend/main.py`, the running process never loaded the `/api/ml/cancellation-risk` endpoint, resulting in a `404 Not Found` when the browser made the request.

## 9. User Experience Problem
The input UI exposes technical Data Science / Dataset terminology directly to the resort manager. Fields like `Market Segment`, `Deposit Type`, and `Customer Type` are structured around the rigid Kaggle dataset schema rather than natural conversational inputs a manager would have on hand. It lacks a simplified conversational abstraction.

## 10. Current Inputs Explained
- **Lead Time**: Days between booking and arrival. Managers understand this, but "Days before check-in" is clearer.
- **Country**: Guest origin. Managers know this.
- **Market Segment**: Internal dataset taxonomy (Online TA, Offline TA/TO). Too technical for a front-desk manager.
- **Deposit Type**: Payment status (No Deposit, Non Refund). Managers know this, but it could be framed better.
- **ADR ($)**: Average Daily Rate. Industry standard, but "Nightly Rate" is more user-friendly.
- **Special Requests**: Count of guest requests. Easily understood.
- **Previous Cancellations**: Useful, but usually tucked in a guest profile, not manually typed.
- **Is Repeated Guest**: Binary flag. Better framed as "Returning Guest?".

## 11. Proposed Simplified Manager Inputs
**Booking Details**
- How far before check-in? `[ 45 days ]`
- Room price per night: `[ $105 ]`
- Booking source: `[ Online Travel Agency (Expedia/Booking.com) ]`
- Deposit paid: `[ None ]`
- Special requests count: `[ 0 ]`
- Guest History: `[ First Time Guest ]` / `[ Returning Guest ]`

*Implementation Strategy*: The frontend will map these natural language inputs back into the strict 27-feature JSON payload required by the backend schema (e.g., "Online Travel Agency" maps to `market_segment: 'Online TA'`).

## 12. Risks
Simplifying the inputs means we rely on static defaults (like `arrival_date_week_number = 27`, `children = 0`, etc.) for the remaining variables. 
**Risk**: If the static defaults heavily skew the model (e.g. defaulting to an off-season month when the booking is actually for peak season), the prediction will be completely inaccurate in real life. If we use defaults, they must be explicitly stated as "Demo assumptions" in the UI to maintain data science honesty.

## 13. Required Fix Order
1. The backend server must be restarted (Completed during diagnosis) to ensure the route is active.
2. The UI must be redesigned to hide technical dataset parameters behind a simplified form, while transparently documenting the static defaults being sent to the model.

## Final Status
`ROOT CAUSE IDENTIFIED — WAITING FOR FIX`
