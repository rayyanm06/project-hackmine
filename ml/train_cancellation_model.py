import pandas as pd
import numpy as np
import os
import json
import joblib
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import roc_auc_score, precision_score, recall_score, f1_score, confusion_matrix
from sklearn.calibration import calibration_curve

def main():
    print("Loading dataset...")
    df = pd.read_csv("ml/dataset/hotel_bookings.csv")
    initial_rows = len(df)
    
    # 1. Cleaning & Leakage Prevention
    # Drop rows with impossible values (e.g. 0 adults, 0 children, 0 babies)
    df = df[~((df['adults'] == 0) & (df['children'] == 0) & (df['babies'] == 0))]
    rows_after_cleaning = len(df)
    print(f"Removed {initial_rows - rows_after_cleaning} invalid rows (0 guests).")
    
    # Target
    target = 'is_canceled'
    
    # Drop leakage features
    leakage_cols = ['reservation_status', 'reservation_status_date', 'assigned_room_type']
    df = df.drop(columns=leakage_cols)
    
    # Company is 94% missing, drop it.
    df = df.drop(columns=['company'])
    
    # 2. Time-Based Split
    # We sort by year, month, day to simulate out-of-time validation.
    # Convert month name to number for sorting
    month_map = {
        'January': 1, 'February': 2, 'March': 3, 'April': 4,
        'May': 5, 'June': 6, 'July': 7, 'August': 8,
        'September': 9, 'October': 10, 'November': 11, 'December': 12
    }
    df['month_num'] = df['arrival_date_month'].map(month_map)
    df = df.sort_values(['arrival_date_year', 'month_num', 'arrival_date_day_of_month'])
    
    # Let's split 80% train (past), 20% test (future)
    split_idx = int(len(df) * 0.8)
    train_df = df.iloc[:split_idx]
    test_df = df.iloc[split_idx:]
    
    y_train = train_df[target]
    X_train = train_df.drop(columns=[target, 'month_num'])
    y_test = test_df[target]
    X_test = test_df.drop(columns=[target, 'month_num'])
    
    train_dates = f"{train_df['arrival_date_year'].min()}-{train_df['arrival_date_month'].iloc[0]} to {train_df['arrival_date_year'].max()}-{train_df['arrival_date_month'].iloc[-1]}"
    test_dates = f"{test_df['arrival_date_year'].min()}-{test_df['arrival_date_month'].iloc[0]} to {test_df['arrival_date_year'].max()}-{test_df['arrival_date_month'].iloc[-1]}"
    
    print(f"Train rows: {len(X_train)}, Test rows: {len(X_test)}")
    
    # 3. Feature Engineering / Preprocessing
    # Define column types
    categorical_features = [
        'hotel', 'arrival_date_year', 'arrival_date_month', 'meal', 'country', 
        'market_segment', 'distribution_channel', 'reserved_room_type', 
        'deposit_type', 'customer_type'
    ]
    
    numeric_features = [
        'lead_time', 'arrival_date_week_number', 'arrival_date_day_of_month', 
        'stays_in_weekend_nights', 'stays_in_week_nights', 'adults', 'children', 
        'babies', 'is_repeated_guest', 'previous_cancellations', 
        'previous_bookings_not_canceled', 'booking_changes', 'agent', 
        'days_in_waiting_list', 'adr', 'required_car_parking_spaces', 
        'total_of_special_requests'
    ]
    
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    
    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features),
            ('cat', categorical_transformer, categorical_features)
        ])
    
    # 4. Train Logistic Regression (Baseline)
    print("Training Logistic Regression...")
    lr_model = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', LogisticRegression(max_iter=1000, class_weight='balanced'))
    ])
    lr_model.fit(X_train, y_train)
    
    # Evaluate LR
    lr_preds = lr_model.predict(X_test)
    lr_probs = lr_model.predict_proba(X_test)[:, 1]
    
    lr_metrics = {
        'roc_auc': roc_auc_score(y_test, lr_probs),
        'precision': precision_score(y_test, lr_preds),
        'recall': recall_score(y_test, lr_preds),
        'f1': f1_score(y_test, lr_preds),
        'confusion_matrix': confusion_matrix(y_test, lr_preds).tolist()
    }
    print("LR Metrics:", lr_metrics)
    
    # 5. Train Random Forest
    print("Training Random Forest...")
    rf_model = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(n_estimators=100, max_depth=15, class_weight='balanced', random_state=42, n_jobs=-1))
    ])
    rf_model.fit(X_train, y_train)
    
    # Evaluate RF
    rf_preds = rf_model.predict(X_test)
    rf_probs = rf_model.predict_proba(X_test)[:, 1]
    
    rf_metrics = {
        'roc_auc': roc_auc_score(y_test, rf_probs),
        'precision': precision_score(y_test, rf_preds),
        'recall': recall_score(y_test, rf_preds),
        'f1': f1_score(y_test, rf_preds),
        'confusion_matrix': confusion_matrix(y_test, rf_preds).tolist()
    }
    print("RF Metrics:", rf_metrics)
    
    # 6. Feature Importance (Random Forest)
    cat_encoder = rf_model.named_steps['preprocessor'].named_transformers_['cat'].named_steps['onehot']
    cat_feature_names = cat_encoder.get_feature_names_out(categorical_features).tolist()
    all_feature_names = numeric_features + cat_feature_names
    
    importances = rf_model.named_steps['classifier'].feature_importances_
    feat_imp = pd.DataFrame({'feature': all_feature_names, 'importance': importances})
    feat_imp = feat_imp.sort_values(by='importance', ascending=False).head(15)
    
    # 7. Save Model & Metrics
    os.makedirs('ml/models', exist_ok=True)
    os.makedirs('ml/metrics', exist_ok=True)
    
    model_path = 'ml/models/cancellation_predictor_v1.joblib'
    joblib.dump(rf_model, model_path)
    print(f"Model saved to {model_path}")
    
    metrics_payload = {
        "model_name": "Smart Resort Cancellation Predictor",
        "model_version": "v1.0",
        "algorithm": "RandomForestClassifier",
        "dataset_source": "Public Hotel Booking Demand (Nuno António et al.)",
        "training_rows": len(X_train),
        "test_rows": len(X_test),
        "training_date_range": train_dates,
        "test_date_range": test_dates,
        "target": target,
        "features": numeric_features + categorical_features,
        "metrics": rf_metrics,
        "top_features": feat_imp.to_dict(orient='records'),
        "class_distribution_train": y_train.value_counts(normalize=True).to_dict(),
        "class_distribution_test": y_test.value_counts(normalize=True).to_dict()
    }
    
    with open('ml/metrics/cancellation_predictor_v1.json', 'w') as f:
        json.dump(metrics_payload, f, indent=4)
        
    print("Metrics saved. Pipeline complete.")
    
    # 8. Test reload
    loaded_model = joblib.load(model_path)
    sample = X_test.iloc[[0, 10, 100]]
    sample_preds = loaded_model.predict(sample)
    sample_probs = loaded_model.predict_proba(sample)[:, 1]
    print(f"Reload test successful. Probs: {sample_probs}")

if __name__ == "__main__":
    main()
