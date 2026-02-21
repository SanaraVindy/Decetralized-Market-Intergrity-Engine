import React, { useState, useEffect, useMemo } from 'react';
import { X, Share2, LayoutGrid, Loader2, ArrowRightLeft } from 'lucide-react';

// Simple SVG-based graph visualization with force-directed layout
const SimpleGraphVisualization = ({ graphData, onNodeClick }) => {
    const [nodes, setNodes] = React.useState(() => {
        const width = 800;
        const height = 400;

        return graphData.nodes.map((node, idx) => ({
            ...node,
            x: Math.random() * width,
            y: Math.random() * height,
            vx: 0,
            vy: 0
        }));
    });

    // Force-directed layout simulation - run once to stabilize, then freeze
    React.useEffect(() => {
        let currentNodes = [...nodes];
        const width = 1200;
        const height = 600;
        const chargeStrength = -800; // Much stronger repulsion to spread nodes
        const linkDistance = 200; // Larger distance to push nodes further apart
        const stabilizationIterations = 150; // Optimized for performance while maintaining clarity

        // Run simulation asynchronously to prevent UI freeze
        const runSimulation = async () => {
            for (let iter = 0; iter < stabilizationIterations; iter++) {
                for (let i = 0; i < currentNodes.length; i++) {
                    let fx = 0, fy = 0;
                    const node = currentNodes[i];

                    // Repulsion from other nodes
                    for (let j = 0; j < currentNodes.length; j++) {
                        if (i !== j) {
                            const other = currentNodes[j];
                            const dx = node.x - other.x;
                            const dy = node.y - other.y;
                            const dist = Math.sqrt(dx * dx + dy * dy) || 1;

                            const force = chargeStrength / (dist * dist);
                            fx += (dx / dist) * force;
                            fy += (dy / dist) * force;
                        }
                    }

                    // Attraction to link targets
                    graphData.links.forEach(link => {
                        const target = link.source === node.id
                            ? currentNodes.find(n => n.id === link.target)
                            : link.target === node.id
                                ? currentNodes.find(n => n.id === link.source)
                                : null;

                        if (target) {
                            const dx = target.x - node.x;
                            const dy = target.y - node.y;
                            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                            const force = (dist - linkDistance) / dist;
                            fx += dx * force * 0.1;
                            fy += dy * force * 0.1;
                        }
                    });

                    // Gravity towards center
                    fx += (width / 2 - node.x) * 0.01;
                    fy += (height / 2 - node.y) * 0.01;

                    // Update position (no velocity, just direct movement for quick stabilization)
                    node.x += fx * 0.1;
                    node.y += fy * 0.1;

                    // Boundary constraints
                    node.x = Math.max(10, Math.min(width - 10, node.x));
                    node.y = Math.max(10, Math.min(height - 10, node.y));
                }

                // Allow browser to render every 10 iterations
                if (iter % 10 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }

            // Set final positions and freeze
            setNodes([...currentNodes]);
        };

        runSimulation();
    }, [graphData]);

    const getLabel = (id) => {
        return id.startsWith('0x') ? `${id.slice(0, 6)}...` : id.substring(0, 8);
    };

    const [hoveredNode, setHoveredNode] = React.useState(null);

    return (
        <svg width="100%" height="100%" viewBox="0 0 1200 600" className="bg-slate-950 cursor-pointer">
            {/* Draw links */}
            {graphData.links.map((link, idx) => {
                const sourceNode = nodes.find(n => n.id === link.source);
                const targetNode = nodes.find(n => n.id === link.target);
                const strokeWidth = Math.sqrt(link.value || 0.1) + 1; // Thicker lines for higher values
                return sourceNode && targetNode ? (
                    <g key={`link-${idx}`}>
                        <line x1={sourceNode.x} y1={sourceNode.y} x2={targetNode.x} y2={targetNode.y} stroke="#1e293b" strokeWidth={strokeWidth} opacity="0.6" />
                        {/* Value label on link */}
                        {link.value > 0 && (
                            <text
                                x={(sourceNode.x + targetNode.x) / 2}
                                y={(sourceNode.y + targetNode.y) / 2 - 5}
                                fontSize="9"
                                fill="#60a5fa"
                                textAnchor="middle"
                                pointerEvents="none"
                            >
                                {link.value.toFixed(2)}
                            </text>
                        )}
                    </g>
                ) : null;
            })}

            {/* Draw nodes */}
            {nodes.map(node => (
                <g key={node.id} onClick={() => onNodeClick(node)} onMouseEnter={() => setHoveredNode(node.id)} onMouseLeave={() => setHoveredNode(null)} style={{ cursor: 'pointer' }}>
                    <circle cx={node.x} cy={node.y} r="8" fill={node.color} opacity={hoveredNode === node.id ? 1 : 0.8} style={{ transition: 'opacity 0.2s' }} />
                    {/* Only show label on hover or for target node */}
                    {(hoveredNode === node.id || node.id.includes('Target')) && (
                        <text x={node.x} y={node.y + 20} fontSize="10" fill="#94a3b8" textAnchor="middle" fontWeight="600" pointerEvents="none" style={{ background: '#1e293b', padding: '2px 4px' }}>
                            {getLabel(node.id)}
                        </text>
                    )}
                </g>
            ))}
        </svg>
    );
};

const EntityDetailModal = ({ entity, onClose }) => {
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('table'); // Default to table
    const [expandingNode, setExpandingNode] = useState(null);

    useEffect(() => {
        const fetchNeighbors = async () => {
            try {
                const res = await fetch(`http://127.0.0.1:8000/api/neighbors/${entity.id}`);
                const data = await res.json();
                setConnections(data);
            } catch (err) {
                console.error("Graph fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        if (entity?.id) fetchNeighbors();
    }, [entity.id]);

    // Handle click on a node to expand its neighbors
    const handleNodeClick = async (node) => {
        // Don't expand if it's the target node itself
        if (node.id === entity.id) return;

        setExpandingNode(node.id);
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/neighbors/${node.id}`);
            const newNeighbors = await res.json();

            // Filter out duplicates and the central entity
            const existingIds = new Set(connections.map(c => c.id));
            const uniqueNeighbors = newNeighbors.filter(
                n => !existingIds.has(n.id) && n.id !== entity.id
            );

            // Merge new neighbors into connections
            setConnections(prev => [...prev, ...uniqueNeighbors]);
        } catch (err) {
            console.error("Error expanding node:", err);
        } finally {
            setExpandingNode(null);
        }
    };

    // Format the Neo4j data for the graph
    const graphData = useMemo(() => {
        const nodes = [
            { id: entity.id, name: 'Target', color: '#3b82f6', size: 8 },
            ...connections.map(c => ({
                id: c.id,
                name: c.id,
                color: c.risk === 'Critical' ? '#ef4444' : '#94a3b8',
                size: 4
            }))
        ];
        const links = connections.map(c => ({
            source: entity.id,
            target: c.id,
            // Parse the amount string (e.g., "3.9994 ETH") back to a number
            value: parseFloat(c.amount) || 0
        }));
        return { nodes, links };
    }, [connections, entity.id]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl h-[85vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl">

                {/* Header & Toggle */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                    <div className="flex items-center gap-6">
                        <div>
                            <h2 className="text-xl font-bold text-white">Path Analysis</h2>
                            <p className="text-xs text-slate-500 font-mono">{entity.id}</p>
                        </div>
                        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'table' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}
                            >
                                <LayoutGrid size={14} /> Table
                            </button>
                            <button
                                onClick={() => setViewMode('graph')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'graph' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}
                            >
                                <Share2 size={14} /> Network Map
                            </button>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><X size={20} /></button>
                </div>

                {/* Content Area */}
                <div className="flex-1 relative bg-slate-950 overflow-hidden">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-500 gap-3">
                            <Loader2 className="animate-spin text-blue-500" size={32} />
                            <span>Loading Graph...</span>
                        </div>
                    ) : viewMode === 'graph' ? (
                        <div className="relative w-full h-full">
                            <SimpleGraphVisualization graphData={graphData} onNodeClick={handleNodeClick} />
                            {expandingNode && (
                                <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2">
                                    <Loader2 size={12} className="animate-spin" />
                                    Expanding...
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-8 overflow-y-auto h-full">
                            {/* Transaction Flow Table */}
                            <div className="mb-8">
                                <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                                    <ArrowRightLeft size={16} className="text-blue-400" />
                                    Transaction Details
                                </h3>

                                <div className="bg-slate-950/50 rounded-2xl border border-slate-800 overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-800/50 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                                            <tr>
                                                <th className="px-6 py-4">Counterparty Address</th>
                                                <th className="px-6 py-4">Direction</th>
                                                <th className="px-6 py-4">Value</th>
                                                <th className="px-6 py-4">Risk Level</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800 text-slate-300">
                                            {connections.map((conn, idx) => (
                                                <tr key={idx} className="hover:bg-blue-600/5 transition-colors">
                                                    <td className="px-6 py-4 font-mono text-xs">{conn.id}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={conn.flow === "IN" ? "text-green-400" : "text-blue-400"}>
                                                            {conn.flow === "IN" ? "← Received" : "Sent →"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-white">{conn.amount}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded text-[10px] ${conn.risk === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'}`}>{conn.risk}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EntityDetailModal;