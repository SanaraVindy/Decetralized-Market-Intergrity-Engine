import torch
import joblib
import pandas as pd
import numpy as np
import os
from app.core.gat_engine import DeMIE_GATv2 
from app.database import get_db_session

class PredictionService:
    def __init__(self):
        self.model = None
        self.scaler = None
        self._load_resources()

    def _load_resources(self):
        try:
            MODEL_PATH = "data/demie_gatv2_weights.pth"
            SCALER_PATH = "data/scaler.pkl"

            if os.path.exists(SCALER_PATH):
                self.scaler = joblib.load(SCALER_PATH)
            
            self.model = DeMIE_GATv2(num_node_features=45, hidden_channels=32, num_classes=2)
            
            if os.path.exists(MODEL_PATH):
                state_dict = torch.load(MODEL_PATH, map_location=torch.device('cpu'), weights_only=False)
                self.model.load_state_dict(state_dict)
                self.model.eval()
                print("[*] GATv2 Forensic Engine Armed & Ready.")
        except Exception as e:
            print(f"[!] Model Load Error: {e}")

async def run_forensic_analysis(self):
    async for session in get_db_session():
        # 1. FETCH NODES AND EDGES
        # We fetch addresses AND the 'SHARED_TOKEN_TYPE' or transfer relationships
        node_result = await session.run("MATCH (n:Address) RETURN n")
        edge_result = await session.run("MATCH (a:Address)-[r]->(b:Address) RETURN id(a) as source, id(b) as target")
        
        node_records = await node_result.data()
        edge_records = await edge_result.data()
        
        if not node_records: return 0
        df = pd.DataFrame([r['n'] for r in node_records])
        
        # Create a mapping of Neo4j Internal ID to Matrix Index
        id_map = {row['id']: i for i, row in df.iterrows()}

        # 2. PREPARE INPUT MATRIX (45 features)
        num_samples = len(df)
        X_input = np.zeros((num_samples, 45))
        if self.scaler is not None:
            X_input[:] = self.scaler.mean_

        def safe_get(col_name):
            if col_name in df.columns:
                return pd.to_numeric(df[col_name], errors='coerce').fillna(0).values
            return np.zeros(num_samples)

        X_input[:, 0] = safe_get('avg_min_sent')
        X_input[:, 1] = safe_get('avg_min_rec')
        X_input[:, 2] = safe_get('avg_sent_tnx')
        X_input[:, 3] = safe_get('avg_received_tnx')
        X_input[:, 4] = safe_get('tx_per_min')

        # Inject noise for feature diversity
        X_input[:, 5:] += np.random.normal(0, 0.01, (num_samples, 40))

        # 3. BUILD EDGE INDEX (The GAT "Connective Tissue")
        edges = []
        for edge in edge_records:
            if edge['source'] in id_map and edge['target'] in id_map:
                edges.append([id_map[edge['source']], id_map[edge['target']]])
        
        if edges:
            edge_index = torch.tensor(edges, dtype=torch.long).t().contiguous()
        else:
            edge_index = torch.zeros((2, 0), dtype=torch.long)

        # 4. SCALE AND PREDICT
        X_scaled = self.scaler.transform(X_input)
        x_tensor = torch.tensor(X_scaled, dtype=torch.float)

        with torch.no_grad():
            # Now the model uses edge_index to calculate Attention Weights!
            logits = self.model(x_tensor, edge_index)
            probs = torch.softmax(logits / 0.7, dim=1)
            scores = probs[:, 1].numpy()

        # 5. WRITE BACK TO NEO4J
# 5. WRITE BACK TO NEO4J & CLUSTER FUSION
        for i, row in df.iterrows():
            await session.run(
                """
                // 1. Update the Risk Score
                MATCH (n:Address {address: $addr}) 
                SET n.integrity_risk_score = $s 
                
                WITH n
                // 2. Propagate community tag from neighbors if n is missing one
                OPTIONAL MATCH (n)-[:SENT]-(neighbor:Address)
                WHERE neighbor.community IS NOT NULL AND n.community IS NULL
                WITH n, neighbor.community AS inherited_comm
                WHERE inherited_comm IS NOT NULL
                SET n.community = inherited_comm
                
                WITH n
                // 3. Find the 'Proxy' for this community (highest risk node)
                MATCH (proxy:Address)
                WHERE proxy.community = n.community
                WITH n, proxy
                ORDER BY proxy.integrity_risk_score DESC
                WITH n, head(collect(proxy)) AS main_proxy
                
                // 4. Create the physical Fusion relationship for the UI
                WHERE main_proxy <> n
                MERGE (n)-[:FUSED_TO]->(main_proxy)
                
                // 5. Update the count for the UI card
                WITH main_proxy
                MATCH (member:Address)-[:FUSED_TO]->(main_proxy)
                WITH main_proxy, count(member) + 1 AS total_size
                SET main_proxy.fused_count = total_size
                """,
                addr=row['address'], s=float(scores[i])
            )
        
        print(f"[*] GATv2 Analysis & Fusion Complete. Processed {len(df)} nodes.")
        return len(df)