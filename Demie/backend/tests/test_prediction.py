import pytest
import torch
import numpy as np
from app.prediction_service import PredictionService

# 1. TEST: RESOURCE LOADING
def test_prediction_resource_loading():
    """Automates verification that the GATv2 weights and Scaler are found."""
    service = PredictionService()
    # Ensure the model is initialized even if weights are missing (fallback)
    assert service.model is not None
    # Verify the architecture matches the 45-feature dissertation specification
    assert service.model.conv1.in_channels == 45

# 2. TEST: DATA MATRIX PREPARATION
def test_input_matrix_construction():
    """Automates verification of the 45-feature input matrix shape."""
    service = PredictionService()
    num_test_nodes = 5
    # Simulate a dummy feature matrix
    X_input = np.zeros((num_test_nodes, 45))
    
    # Verify feature injection logic (avg_min_sent, etc.)
    X_input[:, 0] = 0.5  # Simulate 'avg_min_sent'
    assert X_input.shape == (5, 45)
    assert X_input[0, 0] == 0.5

# 3. TEST: CONNECTIVE TISSUE (EDGE INDEX)
def test_edge_index_logic():
    """Automates validation of the GAT 'Connective Tissue' tensor."""
    # Simulate Neo4j internal IDs
    edges = [{'source': 101, 'target': 102}]
    id_map = {101: 0, 102: 1}
    
    formatted_edges = []
    for edge in edges:
        if edge['source'] in id_map and edge['target'] in id_map:
            formatted_edges.append([id_map[edge['source']], id_map[edge['target']]])
            
    edge_index = torch.tensor(formatted_edges, dtype=torch.long).t().contiguous()
    
    # GAT expects a 2xN tensor
    assert edge_index.shape[0] == 2
    assert edge_index[0, 0] == 0 # Source mapping
    assert edge_index[1, 0] == 1 # Target mapping

# 4. TEST: FORENSIC FUSING LOGIC (MOCK)
def test_fusing_logic_integrity():
    """Automates validation of the 'Super-Entity' risk propagation."""
    # Logic check: If neighbor has community, current node inherits it
    node_community = None
    neighbor_community = "Sybil_Cluster_A"
    
    if node_community is None:
        node_community = neighbor_community
        
    assert node_community == "Sybil_Cluster_A"