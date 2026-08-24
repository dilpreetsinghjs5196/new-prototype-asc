import React, { useState, useEffect, useMemo } from 'react';
import { formatCurrency } from '../utils/hospitalUtils';
import { buildCPTProfiles, buildSurgeonProfiles } from '../services/aiOperations/HistoricalIntelligence';
import { getUniqueSurgeons } from '../services/aiOperations/SurgeonIntelligence';
import { getUniqueCategories, filterCptCodes } from '../services/aiOperations/CPTIntelligence';
import { estimateFinancials } from '../services/aiOperations/FinancialEngine';
import { calculateMultiObjectiveScore } from '../services/aiOperations/ScoreCalculator';
import { optimizeSchedule } from '../services/aiOperations/OptimizationEngine';
import { generateRecommendation } from '../services/aiOperations/ScenarioGenerator';
import { predictDuration } from '../services/aiOperations/PredictionEngine';
import { generateScheduleExplanation } from '../services/aiOperations/GeminiExplanation';
import './AIOperationsAnalyst.css';
import MultiAgentConsole from './MultiAgentConsole';

const OPTIMIZATION_STRATEGIES = {
    'plan_a': {
        name: 'Plan A - Maximum Profit',
        weights: { profit: 0.8, utilization: 0.2 }
    },
    'plan_b': {
        name: 'Plan B - Balanced',
        weights: { profit: 0.3, utilization: 0.2, frequency: 0.15, preference: 0.1, accuracy: 0.1, cancellationRisk: 0.05, suppliesCost: 0.05, confidence: 0.05 }
    },
    'plan_c': {
        name: 'Plan C - Maximum Utilization',
        weights: { utilization: 0.7, profit: 0.1, accuracy: 0.2 }
    },
    'plan_d': {
        name: 'Plan D - Maximum Patients',
        weights: { volume: 0.7, frequency: 0.2, utilization: 0.1 }
    },
    'plan_e': {
        name: 'Plan E - Lowest Cost',
        weights: { suppliesCost: 0.4, implantCost: 0.4, cancellationRisk: 0.2 }
    }
};

// Simple Markdown Parser for the AI Explanation
const renderMarkdown = (text) => {
    if (!text) return { __html: '' };
    
    let html = text
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/!\[(.*?)\]\((.*?)\)/gim, "<img alt='$1' src='$2' />")
        .replace(/\[(.*?)\]\((.*?)\)/gim, "<a href='$2'>$1</a>")
        .replace(/\n$/gim, '<br />');

    // Handle bullet points
    html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/<li>(.*?)<\/li>/gim, '<ul><li>$1</li></ul>');
    html = html.replace(/<\/ul>\n<ul>/gim, '');

    return { __html: html };
};

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, info: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, info) {
        console.error("ErrorBoundary caught an error", error, info);
        this.setState({ info });
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', background: 'red', color: 'white', overflow: 'auto' }}>
                    <h2>Something went wrong in AIOperationsAnalyst.</h2>
                    <pre>{this.state.error && this.state.error.toString()}</pre>
                    <pre>{this.state.info && this.state.info.componentStack}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}

const AIOperationsAnalystInner = ({ surgeries, cptCodes, settings }) => {
    const safeSurgeries = Array.isArray(surgeries) ? surgeries : [];
    const safeCptCodes = Array.isArray(cptCodes) ? cptCodes : [];
    const safeSettings = settings || {};

    const [analystMode, setAnalystMode] = useState('scheduler_optimize');
    const [selectedStrategy, setSelectedStrategy] = useState('plan_b');
    const [utilizationTarget, setUtilizationTarget] = useState(80);
    const [numberOfORs, setNumberOfORs] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedSurgeon, setSelectedSurgeon] = useState('All');
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [recommendation, setRecommendation] = useState(null);
    const [explanation, setExplanation] = useState('');
    const [errorMsg, setErrorMsg] = useState(null);

    const categories = useMemo(() => getUniqueCategories(safeCptCodes), [safeCptCodes]);
    const surgeonsList = useMemo(() => getUniqueSurgeons(safeSurgeries), [safeSurgeries]);

    const handleOptimize = async () => {
        setIsOptimizing(true);
        setErrorMsg(null);
        setExplanation('');
        setRecommendation(null);

        setTimeout(async () => {
            try {
                const cptProfiles = buildCPTProfiles(safeCptCodes, safeSurgeries);
                const surgeonProfiles = buildSurgeonProfiles(surgeonsList, safeSurgeries);
                const filteredCptCodes = filterCptCodes(safeCptCodes, safeSurgeries, selectedCategory, selectedSurgeon);
                let baseCandidatePool = [];
                
                filteredCptCodes.forEach((cpt) => {
                    const profile = cptProfiles[cpt.code] || {};
                    const duration = predictDuration(cpt, { [cpt.code]: profile.averageDuration || 60 });
                    const avgSuppliesCost = profile.averageSuppliesCost || 200;
                    const avgImplantCost = profile.averageImplantCost || 0;
                    const financials = estimateFinancials(cpt, duration, avgSuppliesCost, avgImplantCost);
                    
                    const historicalFrequency = profile.casesPerformed || 1;
                    
                    let surgeonPreference = 5;
                    let cancellationRisk = profile.cancellationRate || 5;
                    
                    if (selectedSurgeon !== 'All' && surgeonProfiles[selectedSurgeon]) {
                        const sProf = surgeonProfiles[selectedSurgeon];
                        const count = sProf.historicalCptDistribution[cpt.code] || 0;
                        surgeonPreference = Math.min(10, 5 + count);
                        cancellationRisk = sProf.cancellationPercentage || cancellationRisk;
                    }

                    const durationAccuracy = profile.confidenceScore || 80;
                    const confidenceScore = profile.confidenceScore || 80;
                    const instancesToGenerate = Math.max(1, Math.min(5, Math.ceil(historicalFrequency / 5)));

                    for (let i = 0; i < instancesToGenerate; i++) {
                        baseCandidatePool.push({
                            ...cpt,
                            id: `${cpt.code}-${i}`,
                            duration,
                            ...financials,
                            historicalFrequency,
                            surgeonPreference,
                            durationAccuracy,
                            cancellationRisk,
                            confidenceScore,
                            implantCost: avgImplantCost
                        });
                    }
                });

                const MINUTES_PER_OR = 480; 
                const totalAvailableMinutes = MINUTES_PER_OR * numberOfORs;
                const targetMinutes = (utilizationTarget / 100) * totalAvailableMinutes;

                const strategy = OPTIMIZATION_STRATEGIES[selectedStrategy];
                const scoredPool = baseCandidatePool.map(c => ({
                    ...c,
                    optimizationScore: calculateMultiObjectiveScore(c, strategy.weights)
                }));
                
                const optResult = optimizeSchedule(scoredPool, targetMinutes, numberOfORs);
                
                const rec = generateRecommendation(
                    optResult,
                    safeSettings,
                    numberOfORs,
                    totalAvailableMinutes,
                    selectedCategory
                );
                rec.strategyName = strategy.name;

                setRecommendation(rec);

                // Generate Explanation (Gemini)
                const exp = await generateScheduleExplanation(rec);
                setExplanation(exp);

            } catch (err) {
                console.error("Optimization error:", err);
                setErrorMsg(err.message || String(err));
            } finally {
                setIsOptimizing(false);
            }
        }, 1500);
    };

    return (
        <div className="management-container fade-in">
            <div className="management-header" style={{ marginBottom: '20px' }}>
                <h2 className="management-title">Executive Optimization & Agent Dashboard</h2>
            </div>

            <div className="tab-container" style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
                <button 
                    className={`btn-tab ${analystMode === 'scheduler_optimize' ? 'active' : ''}`}
                    onClick={() => setAnalystMode('scheduler_optimize')}
                    style={{
                        padding: '8px 16px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        backgroundColor: analystMode === 'scheduler_optimize' ? 'var(--color-blue)' : 'transparent',
                        color: analystMode === 'scheduler_optimize' ? '#fff' : 'var(--text-secondary)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '6px',
                        cursor: 'pointer'
                    }}
                >
                    OR Schedule Optimizer
                </button>
                <button 
                    className={`btn-tab ${analystMode === 'multi_agent_sim' ? 'active' : ''}`}
                    onClick={() => setAnalystMode('multi_agent_sim')}
                    style={{
                        padding: '8px 16px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        backgroundColor: analystMode === 'multi_agent_sim' ? 'var(--color-blue)' : 'transparent',
                        color: analystMode === 'multi_agent_sim' ? '#fff' : 'var(--text-secondary)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '6px',
                        cursor: 'pointer'
                    }}
                >
                    Multi-Agent Analyst Simulation
                </button>
            </div>

            {analystMode === 'scheduler_optimize' ? (
                <div className="content-card fade-in">
                <div className="optimization-controls">
                    <div className="control-row">
                        <div className="control-group">
                            <label>Optimization Strategy</label>
                            <select
                                value={selectedStrategy}
                                onChange={(e) => setSelectedStrategy(e.target.value)}
                                className="styled-select"
                            >
                                {Object.entries(OPTIMIZATION_STRATEGIES).map(([key, strat]) => (
                                    <option key={key} value={key}>{strat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="control-group">
                            <label>Number of ORs</label>
                            <select
                                value={numberOfORs}
                                onChange={(e) => setNumberOfORs(parseInt(e.target.value))}
                                className="styled-select"
                            >
                                <option value="1">1 OR</option>
                                <option value="2">2 ORs</option>
                                <option value="3">3 ORs</option>
                                <option value="4">4 ORs</option>
                            </select>
                        </div>
                        <div className="control-group">
                            <label>Surgeon</label>
                            <select
                                value={selectedSurgeon}
                                onChange={(e) => setSelectedSurgeon(e.target.value)}
                                className="styled-select"
                            >
                                {surgeonsList.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div className="control-group">
                            <label>Surgery Category</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="styled-select"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div className="control-group">
                            <label>Target OR Utilization</label>
                            <div className="slider-container">
                                <input
                                    type="range"
                                    min="50"
                                    max="100"
                                    value={utilizationTarget}
                                    onChange={(e) => setUtilizationTarget(e.target.value)}
                                    className="utilization-slider"
                                />
                                <span className="utilization-value">{utilizationTarget}%</span>
                            </div>
                        </div>
                        <button
                            className="btn-primary"
                            onClick={handleOptimize}
                            disabled={isOptimizing}
                            style={{ height: '42px', padding: '0 20px', alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            {isOptimizing ? 'Generating Dashboard...' : 'Generate Dashboard'}
                        </button>
                    </div>
                </div>

                {isOptimizing ? (
                    <div className="ai-loading-container">
                        <div className="spinner"></div>
                        <p>Simulating optimization engine and generating AI summary...</p>
                    </div>
                ) : recommendation ? (
                    <div className="dashboard-results fade-in">
                        
                        <div className="dashboard-kpi-grid">
                            <div className="kpi-card">
                                <span className="kpi-label">Strategy</span>
                                <span className="kpi-value text-primary">{recommendation.strategyName}</span>
                            </div>
                            <div className="kpi-card">
                                <span className="kpi-label">Projected Revenue</span>
                                <span className="kpi-value">{formatCurrency(recommendation.totalRevenue)}</span>
                            </div>
                            <div className="kpi-card">
                                <span className="kpi-label">Net Profit</span>
                                <span className="kpi-value text-green">{formatCurrency(recommendation.totalProfit)}</span>
                            </div>
                            <div className="kpi-card">
                                <span className="kpi-label">Margin</span>
                                <span className="kpi-value">{recommendation.profitMargin}%</span>
                            </div>
                            <div className="kpi-card">
                                <span className="kpi-label">Utilization</span>
                                <span className="kpi-value">{recommendation.utilization}%</span>
                            </div>
                            <div className="kpi-card">
                                <span className="kpi-label">Total Cases</span>
                                <span className="kpi-value">{recommendation.totalCases}</span>
                            </div>
                            <div className="kpi-card">
                                <span className="kpi-label">Idle Time</span>
                                <span className="kpi-value">{recommendation.idleTime} mins</span>
                            </div>
                            <div className="kpi-card">
                                <span className="kpi-label">Overtime</span>
                                <span className={`kpi-value ${recommendation.overtime > 0 ? 'text-red' : ''}`}>{recommendation.overtime} mins</span>
                            </div>
                            <div className="kpi-card">
                                <span className="kpi-label">Confidence</span>
                                <span className="kpi-value text-green">{recommendation.avgConfidence}%</span>
                            </div>
                            <div className="kpi-card">
                                <span className="kpi-label">Risk</span>
                                <span className={`kpi-value ${recommendation.avgRisk > 10 ? 'text-red' : 'text-green'}`}>{recommendation.avgRisk}%</span>
                            </div>
                        </div>

                        <div className="dashboard-main-content">
                            <div className="dashboard-schedule-panel">
                                <h3>Recommended Schedule</h3>
                                <div className="schedule-list">
                                    {recommendation.surgeries.map((surg, idx) => (
                                        <div key={idx} className="schedule-item">
                                            <div className="surg-header">
                                                <span className="surg-quantity">{surg.quantity}x</span>
                                                <span className="surg-code">CPT {surg.code}</span>
                                            </div>
                                            <div className="surg-desc">{surg.description}</div>
                                            <div className="surg-metrics">
                                                <span>Profit: <strong className="text-green">{formatCurrency(surg.estimatedProfit)}/ea</strong></span>
                                                <span>Duration: <strong>{surg.duration} min</strong></span>
                                                <span>Risk: <strong>{surg.cancellationRisk}%</strong></span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="dashboard-summary-panel">
                                <h3><span className="ai-icon-large" style={{fontSize:'1.2rem', marginRight:'8px'}}>✨</span>AI Executive Summary</h3>
                                {explanation ? (
                                    <div className="ai-markdown-content" dangerouslySetInnerHTML={renderMarkdown(explanation)} />
                                ) : (
                                    <div className="spinner-small" style={{margin:'20px auto'}}></div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="ai-empty-state">
                        {errorMsg && (
                            <div className="error-banner">
                                <strong>Error during optimization:</strong> {errorMsg}
                            </div>
                        )}
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Select your parameters above and click "Generate Dashboard" to view deep strategic insights.
                        </p>
                    </div>
                )}
                </div>
            ) : (
                <MultiAgentConsole surgeries={safeSurgeries} cptCodes={safeCptCodes} />
            )}
        </div>
    );
};

const AIOperationsAnalyst = (props) => (
    <ErrorBoundary>
        <AIOperationsAnalystInner {...props} />
    </ErrorBoundary>
);

export default AIOperationsAnalyst;
