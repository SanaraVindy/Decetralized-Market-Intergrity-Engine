import pandas as pd
import joblib
import os
from sklearn.preprocessing import StandardScaler

# 1. Load your training dataset
DATA_PATH = 'transaction_dataset.csv'
SCALER_PATH = 'data/scaler.pkl'

if not os.path.exists(DATA_PATH):
    print(f"[!] Error: {DATA_PATH} not found in the current directory.")
else:
    df = pd.read_csv(DATA_PATH)

    # 2. Define columns to exclude (Metadata and non-numeric)
    # This leaves exactly 45 numeric features for the model
    exclude = [
        'Unnamed: 0', 'Index', 'Address', 'FLAG', 
        ' ERC20 most sent token type', ' ERC20_most_rec_token_type'
    ]
    
    # Drop columns and ensure we are only using numeric data
    feature_df = df.drop(columns=[c for c in exclude if c in df.columns])
    
    # 3. Fit the Scaler
    print(f"[*] Training scaler on {feature_df.shape[1]} features...")
    scaler = StandardScaler()
    
    # Fill missing values with 0 to match typical GNN training preprocessing
    scaler.fit(feature_df.fillna(0))

    # 4. Save the new scaler
    os.makedirs('data', exist_ok=True)
    joblib.dump(scaler, SCALER_PATH)
    
    print(f"[*] SUCCESS: New 45-feature scaler saved to {SCALER_PATH}")
    print(f"[*] Feature Order: {list(feature_df.columns)}")