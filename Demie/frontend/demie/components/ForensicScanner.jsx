import React, { useState } from 'react';
import { Shield, Activity, Loader2, AlertTriangle } from 'lucide-react';

const ForensicScanner = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [result, setResult] = useState(null);

    const startAnalysis = async () => {
        setIsScanning(true);
        try {
            // Trigger the Stage 3: GAT Inference endpoint
            const response = await fetch('http://127.0.0.1:8000/api/forensics/run-gat', {
                method: 'POST',
            });
            const data = await response.json();
            setResult(data);
        } catch (error) {
            console.error("GAT Analysis failed:", error);
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="p-6 bg-slate-900 rounded-xl border border-slate-700 text-white">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Shield className="text-blue-400" /> Stage 3: GAT Integrity Analysis
                </h2>
                <Activity className={isScanning ? "animate-pulse text-green-400" : "text-slate-500"} />
            </div>

            <div className="bg-slate-800 p-4 rounded-lg mb-4 border border-slate-600">
                <p className="text-sm text-slate-300">
                    Target Dataset: <span className="text-blue-400 font-mono">9,818 Entities</span>
                </p>
                <p className="text-sm text-slate-300">
                    Model: <span className="text-blue-400 font-mono">DeMIE_GATv2 (7 Features)</span>
                </p>
            </div>

            <button
                onClick={startAnalysis}
                disabled={isScanning}
                className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${isScanning
                        ? "bg-slate-700 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20"
                    }`}
            >
                {isScanning ? (
                    <>
                        <Loader2 className="animate-spin" /> Analyzing Graph Topology...
                    </>
                ) : (
                    "Run Network Integrity Scan"
                )}
            </button>

            {result && (
                <div className="mt-4 p-3 bg-green-900/20 border border-green-700/50 rounded text-green-400 text-sm">
                    Successfully processed {result.nodes_processed} nodes. Neo4j Risk Scores updated.
                </div>
            )}
        </div>
    );
};

export default ForensicScanner;