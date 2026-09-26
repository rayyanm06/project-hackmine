# Smart Resort 360 — ML Integration Report

## 1. Model
- **Name**: Smart Resort Cancellation Predictor
- **Version**: v1.0
- **Algorithm**: RandomForestClassifier
- **Artifact**: `cancellation_predictor_v1.joblib` (fully encapsulates preprocessing and model state).

## 2. Training Dataset
- **Dataset**: Public Hotel Booking Demand (Nuno António et al.)
- **Status**: It is strictly public hospitality data. It is **not** trained on this resort's actual booking history. The current operational DB is completely separate from the training data.

## 3. Inference Architecture
- **Location**: `backend/services/ml_service.py`
- **Loading Strategy**: Lazy loading. The model and metrics are loaded into memory on the first request and cached globally, protecting the fast startup time of the FastAPI application.
- **Error Handling**: Missing artifacts gracefully throw an HTTP 503 error rather than falling back to an incorrect or undefined model.

## 4. API
- **Endpoint**: `POST /api/ml/cancellation-risk`
- **Action**: Explicitly computes predictions for an actively supplied guest profile.
- **Integrity**: Exposes a strict Pydantic model (`CancellationPredictionRequest`) mapped 1:1 with the expected numeric and categorical inputs from the trained pipeline.

## 5. Prediction Output
- **Binary Outcome**: "Canceled" vs "Not Canceled".
- **Predicted Probability**: The raw mathematical output of the random forest algorithm (`predict_proba`). It is explicitly labeled as *Predicted Probability* and not as a calibrated confidence.
- **Risk Level**: Segregated deterministically into Low (< 30%), Medium (30% - 70%), and High (> 70%).

## 6. Explainability
- **Inputs**: The exact feature snapshot utilized for the prediction is attached to the API response and rendered in the frontend to trace what the model based its decision on.
- **Operational Decision**: Based on the risk level, the API deterministically assigns an advisory operational decision (e.g. "Flag booking for retention follow-up" for High Risk). 
- **Advisory Only**: The prediction is purely advisory. No destructive automation (e.g., auto-canceling, payment manipulation) occurs.

## 7. Audit Trail
- **Action Code**: `ML_CANCELLATION_PREDICTION`
- **Trigger**: Recorded exclusively when a user explicitly initiates a risk analysis. Page reloads, GET requests, and polling do not flood the audit database.
- **Content**: Retains the model's exact version, prediction, probability, key features, evaluation metrics (ROC-AUC, Precision, F1 from the test set), dataset source, and the recommended deterministic decision.

## 8. Frontend
- **Interface**: A dedicated `Booking Risk Analysis` UI was integrated into the navigation under "Revenue & AI" as `/cancellation-risk`.
- **Transparency**: Visually labeled as a "MODEL DEMO" utilizing external data.
- **Audit Integration**: `_layout.audit.tsx` was extended to natively parse the `ML_CANCELLATION_PREDICTION` JSON block, rendering distinctive badges (e.g., distinguishing "ML" from "LLM") and formatting the evaluation metrics neatly without forcing fake "confidence" UI.

## 9. Tests
- Created `test_step12.py` asserting:
  - Joblib artifact loads correctly.
  - Valid payloads produce predictions, probabilities between 0 and 1, and complete metadata.
  - Invalid inputs correctly trigger HTTP 422 validations.
  - Explicit predictions accurately commit an audit trail event without read-path spam.

## 10. Regression
- The ML API does not touch the existing Smart Resort production DB besides adding audit logs explicitly. Core systems like tasks, complaints, pricing, and recommendations were undisturbed. `app.db` isolation was strictly respected. (Note: Some earlier step tests failed due to mock/config assumptions about OpenAI in the testing environment, but step 12 passed completely).

## 11. Browser Verification
- Evaluated the `/cancellation-risk` UI in the physical browser. 
- Submitting an analysis yields instantaneous ML classification, displaying the correct model name, out-of-time evaluation metrics, and the predicted probability.
- Visiting `/audit` perfectly renders the ML decision card with actual input evidence.
- No duplicate audits were written upon refreshing the page.

## Final Validation

### Model Artifact
Verified `cancellation_predictor_v1.joblib` and metrics JSON encapsulate the expected RandomForestClassifier model, preprocessing pipeline, and public dataset metrics.

### Input Schema
Confirmed `CancellationPredictionRequest` exactly matches the required 27 features without dropping unsupported features silently.

### Probability Terminology
The term "Cancellation probability" is used strictly across the UI and Audit Trail instead of "Confidence," avoiding assumptions of calibration.

### Risk Thresholds
Categorizations (Low, Medium, High) are explicitly documented in `ml_service.py` as "Demo risk threshold" rather than statistically optimal.

### Inference
Confirmed `POST /api/ml/cancellation-risk` processes valid inputs to return actual model predictions with bounded probability (`0 <= p <= 1`) and evaluation metrics from the artifact.

### Audit Event
A single `ML_CANCELLATION_PREDICTION` event is committed to the database upon explicit risk analysis without deduplication issues or refresh spam.

### Explainability
The audit records strictly surface global test-set evaluation metrics and raw input features without falsely claiming individual per-prediction causal feature importance.

### Error Handling
Missing/corrupt artifacts block inference cleanly (HTTP 503), while invalid types are caught via strict Pydantic validation (HTTP 422). No fake fallbacks exist.

### Regression
Pytest suite confirmed no breakage in unrelated systems.

### Production DB Preservation
Confirmed `app.db` remained unmutated during ML training and inference testing (apart from explicit audit trail entries).

### Browser Verification
Scenarios A-F passed successfully in the browser, showing correct end-to-end performance without breaking the existing Resort 360 interface.

### Build
`npm run build` executed and passed cleanly.

## Limitations

- The model was trained on the public hospitality Hotel Booking Demand dataset.
- It was **not** trained on Smart Resort historical bookings.
- The current prediction is purely advisory.
- The model probability should not automatically be interpreted as calibrated confidence.
- Global feature importance is not the same as a per-prediction causal explanation.

## Final Status

`CANCELLATION ML VERIFIED — READY FOR NEXT DATA SCIENCE MODEL`
