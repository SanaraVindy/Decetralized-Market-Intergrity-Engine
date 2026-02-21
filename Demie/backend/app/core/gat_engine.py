# app/models/gat_model.py
import torch
import torch.nn.functional as F
from torch_geometric.nn import GATv2Conv, BatchNorm

class DeMIE_GATv2(torch.nn.Module):
    def __init__(self, in_channels, hidden_channels, out_channels, heads=4):
        super(DeMIE_GATv2, self).__init__()
        self.conv1 = GATv2Conv(in_channels, hidden_channels, heads=heads, dropout=0.2)
        self.bn1 = BatchNorm(hidden_channels * heads)
        # Head count on conv2 should likely be 1 for final prediction 
        # unless you are concatenating.
        self.conv2 = GATv2Conv(hidden_channels * heads, hidden_channels, heads=1, dropout=0.2)
        self.out = torch.nn.Linear(hidden_channels, out_channels)

    def forward(self, x, edge_index):
        # We return alpha (attention weights) for the UI to highlight edges
        x, (edge_index, alpha) = self.conv1(x, edge_index, return_attention_weights=True)
        x = self.bn1(x)
        x = F.leaky_relu(x)
        x = self.conv2(x, edge_index)
        x = F.leaky_relu(x)
        return F.log_softmax(self.out(x), dim=1), alpha