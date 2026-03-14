import pytest
import torch
from app.core.gat_engine import DeMIE_GATv2

# 1. TEST: ARCHITECTURE INTEGRITY
def test_gat_initialization():
    """Automates verification of the GATv2 layer dimensions."""
    in_channels = 45
    hidden_channels = 32
    out_channels = 2
    heads = 4
    
    model = DeMIE_GATv2(in_channels, hidden_channels, out_channels, heads)
    
    # Verify the first layer output dimension (hidden * heads)
    assert model.conv1.out_channels == hidden_channels
    assert model.conv1.heads == heads

# 2. TEST: FORWARD PASS & ATTENTION WEIGHTS
def test_gat_forward_pass():
    """Automates verification of prediction output and attention weight extraction."""
    in_channels = 45
    model = DeMIE_GATv2(in_channels=in_channels, hidden_channels=32, out_channels=2)
    model.eval()

    # Create dummy graph data (3 nodes, 2 edges)
    x = torch.randn((3, in_channels))
    edge_index = torch.tensor([[0, 1, 1, 2], [1, 0, 2, 1]], dtype=torch.long)

    with torch.no_grad():
        out, alpha = model(x, edge_index)

    # Output should be (num_nodes, out_channels)
    assert out.shape == (3, 2)
    
    # alpha should contain (edge_index, weights)
    # The weights tensor should match the number of edges
    assert alpha[1].shape[0] == edge_index.shape[1]
    print("[*] GATv2 Forward Pass and Attention Weights Verified.")

# 3. TEST: NUMERICAL STABILITY
def test_gat_output_probabilities():
    """Automates check for log_softmax validity."""
    model = DeMIE_GATv2(in_channels=45, hidden_channels=16, out_channels=2)
    x = torch.randn((2, 45))
    edge_index = torch.tensor([[0, 1], [1, 0]], dtype=torch.long)
    
    out, _ = model(x, edge_index)
    
    # log_softmax values should be <= 0
    assert torch.all(out <= 0)