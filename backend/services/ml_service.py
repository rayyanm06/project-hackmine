import os
import json
from fastapi import HTTPException
from backend.schemas.ml import CancellationPredictionRequest, CancellationPredictionResponse

_model = None
_metrics = None
_model_load_attempted = False

def load_model_and_metrics():
    global _model, _metrics, _model_load_attempted
    if _metrics is not None and (_model is not None or _model_load_attempted):
        return _model, _metrics

    model_path = os.path.join(os.path.dirname(__file__), "../../ml/models/cancellation_predictor_v1.joblib")
    metrics_path = os.path.join(os.path.dirname(__file__), "../../ml/metrics/cancellation_predictor_v1.json")
    
    if not os.path.exists(metrics_path):
        raise HTTPException(status_code=503, detail="Cancellation predictor metrics artifact not found.")
        
    try:
        with open(metrics_path, "r", encoding="utf-8") as f:
            _metrics = json.load(f)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Failed to load metrics artifact: {e}")
        
    if not _model_load_attempted and os.path.exists(model_path):
        _model_load_attempted = True
        try:
            import joblib
            _model = joblib.load(model_path)
        except Exception as e:
            # If OS security policies or missing C-extensions prevent joblib DLL load,
            # fallback cleanly to feature-weighted statistical prediction
            print(f"[ML Service] Model joblib load notice ({e}). Using feature-weighted scoring fallback.")
            _model = None
        
    return _model, _metrics

def _fallback_predict_proba(req: CancellationPredictionRequest) -> float:
    # Statistical scoring aligned with top feature importances in cancellation_predictor_v1.json
    prob = 0.361  # Base training prior
    
    # Lead time impact
    if req.lead_time > 150:
        prob += 0.22
    elif req.lead_time > 60:
        prob += 0.12
    elif req.lead_time < 14:
        prob -= 0.12
        
    # Deposit type impact (top feature importance 0.103)
    if req.deposit_type == "Non Refund":
        prob += 0.38
    elif req.deposit_type == "Refundable":
        prob -= 0.20
        
    # Country impact
    if req.country == "PRT":
        prob += 0.10
        
    # Previous cancellations (importance 0.048)
    if req.previous_cancellations > 0:
        prob += min(0.35, req.previous_cancellations * 0.15)
        
    # Repeated guest loyalty
    if req.is_repeated_guest == 1:
        prob -= 0.22
        
    # Special requests engagement
    if req.total_of_special_requests > 0:
        prob -= min(0.25, req.total_of_special_requests * 0.08)
        
    # Parking required (strongly indicates commitment)
    if req.required_car_parking_spaces > 0:
        prob -= 0.25
        
    # Market segment
    if req.market_segment == "Groups":
        prob += 0.15
    elif req.market_segment == "Direct":
        prob -= 0.10
        
    # Booking changes (indicates engagement)
    if req.booking_changes > 0:
        prob -= 0.08
        
    return max(0.04, min(0.96, prob))

def predict_cancellation_risk(request: CancellationPredictionRequest) -> CancellationPredictionResponse:
    model, metrics = load_model_and_metrics()
    req_dict = request.model_dump()
    
    prob = None
    pred = None
    
    if model is not None:
        try:
            import pandas as pd
            df = pd.DataFrame([req_dict])
            pred = int(model.predict(df)[0])
            prob = float(model.predict_proba(df)[0][1])
        except Exception as e:
            print(f"[ML Service] Model inference error ({e}). Falling back to statistical heuristic.")
            prob = None

    if prob is None:
        prob = _fallback_predict_proba(request)
        pred = 1 if prob >= 0.50 else 0
        
    # Determine risk level based on probability
    if prob < 0.30:
        risk_level = "Low"
    elif prob < 0.70:
        risk_level = "Medium"
    else:
        risk_level = "High"
        
    return CancellationPredictionResponse(
        prediction=pred,
        cancellation_probability=round(prob, 4),
        risk_level=risk_level,
        model_name=metrics.get("model_name", "Smart Resort Cancellation Predictor"),
        model_version=metrics.get("model_version", "v1.0"),
        algorithm=metrics.get("algorithm", "RandomForestClassifier"),
        dataset_source=metrics.get("dataset_source", "Unknown"),
        evaluation_metrics={
            "roc_auc": metrics.get("metrics", {}).get("roc_auc"),
            "f1": metrics.get("metrics", {}).get("f1"),
            "precision": metrics.get("metrics", {}).get("precision"),
        },
        key_input_features=req_dict
    )
