import os
import sys
import shutil

def download_demie_weights():
    """
    Downloads GATv2 weights using kagglehub and syncs with the DeMIE backend.
    """
    # 1. Ensure kagglehub is installed
    try:
        import kagglehub
    except ImportError:
        print("[*] kagglehub library missing. Installing...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "kagglehub"])
        import kagglehub

    # 2. Define Final Target Path: .../backend/data
    current_file = os.path.abspath(__file__)
    backend_root = os.path.dirname(os.path.dirname(os.path.dirname(current_file)))
    target_dir = os.path.join(backend_root, "data")

    if not os.path.exists(target_dir):
        os.makedirs(target_dir)

    print("[*] Initializing kagglehub download...")
    
    try:
        # 3. Download from Kaggle
        # Framework: pyTorch | Variation: identity-resolution-core
        tmp_path = kagglehub.model_download("thevindimuhandiramge/demie-gat-v2-0/pyTorch/identity-resolution-core")
        
        print(f"[*] Download successful to temp cache: {tmp_path}")

        # 4. Sync files to project /data folder
        for filename in os.listdir(tmp_path):
            src_file = os.path.join(tmp_path, filename)
            dest_file = os.path.join(target_dir, filename)
            
            # Using copy2 to preserve model metadata 
            shutil.copy2(src_file, dest_file)
            print(f"[+] Synced: {filename} -> {target_dir}")

        # 5. Updated Integrity Check
        # The source data indicates these are the key weight files 
        required_files = ['demie_gatv2_weights.pth', 'scaler.pkl']
        existing_files = os.listdir(target_dir)
        
        print(f"\n[+] SUCCESS: Forensic engine weights synced.")
        
        missing = [f for f in required_files if f not in existing_files]
        if missing:
            print(f"[!] WARNING: Inference requires: {missing}")
            # Note: gatv2_model_weights.pt may be present instead of .pth 
            if 'gatv2_model_weights.pt' in existing_files:
                print("[*] Note: 'gatv2_model_weights.pt' found. Update MODEL_PATH in PredictionService if needed.")
        else:
            print("[+] All model artifacts present. PredictionService is ready.")

    except Exception as e:
        print(f"[!] KaggleHub Sync Failed: {e}")

if __name__ == "__main__":
    download_demie_weights()