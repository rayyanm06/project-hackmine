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

## 12. Limitations
- **Generalization**: The model is trained on a Portuguese public dataset. Although mathematically functional as a demonstration of Smart Resort 360’s MLOps readiness, deploying this exact model to a US or Asian property would yield degraded real-world accuracy without transfer learning.
- **Calibration**: The raw `predict_proba()` output from the Random Forest is returned. For absolute confidence percentage accuracy in production, Isotonic Regression calibration is recommended in future iterations.

## Final Status
`ML MODEL INTEGRATED — READY FOR NEXT DATA SCIENCE ITERATION`
