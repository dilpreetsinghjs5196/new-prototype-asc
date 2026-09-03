import React, { useState, Fragment } from 'react';
import { Upload, Settings, Play, CheckCircle, FileSpreadsheet, Bot, ChevronRight, BarChart, CalendarDays, ChevronDown, ChevronUp } from 'lucide-react';
import { parseCaseLogExcel } from '../utils/excelParser';
import { generateOptimizationModels } from '../services/OptimizationEngine';

export default function CaseLogScheduler({ surgeonsList = [] }) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [normalizedData, setNormalizedData] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  
  const [config, setConfig] = useState({
    activeORs: 1,
    operatingDays: 5,
    dailyMinutes: 480,
    targetUtilization: 80,
    maxSurgeonDays: 2,
    overtimeAllowed: false,
    optimizationObjective: 'High Utilization'
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState([]);
  const [results, setResults] = useState(null);

  // Load saved state on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('caseLogSchedulerState');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.normalizedData && parsed.normalizedData.length > 0) {
          setNormalizedData(parsed.normalizedData);
          if (parsed.results) {
            setResults(parsed.results);
            setStep(3); // Go straight to results if they exist
          } else {
            setStep(2); // Go to config if we have data but no results
          }
        }
      }
    } catch (e) {
      console.error("Failed to load saved scheduler state", e);
    }
  }, []);

  // Save state when important things change
  React.useEffect(() => {
    if (normalizedData.length > 0) {
      localStorage.setItem('caseLogSchedulerState', JSON.stringify({
        normalizedData,
        results
      }));
    }
  }, [normalizedData, results]);

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      try {
        const data = await parseCaseLogExcel(uploadedFile, surgeonsList);
        setNormalizedData(data);
        setStep(2);
      } catch (err) {
        alert("Error parsing excel file.");
      }
    }
  };

  const handleConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
    }));
  };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationProgress([]);
    
    const steps = [
      'Analyzing Case Log...',
      'Analyzing Surgeons...',
      'Analyzing Procedures...',
      'Calculating OR Capacity...',
      'Generating Scheduling Models...',
      'Validating Constraints...',
      'Ranking Models...',
      'Generating AI Recommendation...'
    ];

    for (const msg of steps) {
      setGenerationProgress(prev => [...prev, msg]);
      await delay(600); // Simulate processing time
    }

    const optimizationResults = generateOptimizationModels(normalizedData, config);
    setResults(optimizationResults);
    setIsGenerating(false);
    setStep(3);
  };

  const renderStep1 = () => (
    <div className="dashboard-card" style={{ padding: '40px', textAlign: 'center' }}>
      <FileSpreadsheet size={48} style={{ color: 'var(--color-blue)', margin: '0 auto 20px' }} />
      <h2 style={{ marginBottom: '10px' }}>Upload ASC Case Log</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Upload historical case logs (Excel) to generate AI-optimized OR schedules.
      </p>
      
      <div style={{ border: '2px dashed var(--border-light)', padding: '40px', borderRadius: '8px', cursor: 'pointer' }}>
        <input 
          type="file" 
          accept=".xlsx, .xls" 
          onChange={handleFileUpload} 
          style={{ display: 'none' }} 
          id="file-upload" 
        />
        <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <Upload size={32} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontWeight: '600' }}>Click to upload or drag and drop</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>XLSX or XLS files only</span>
        </label>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="dashboard-card" style={{ padding: '24px' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <Settings size={20} /> Configure ASC Parameters
      </h2>
      
      {normalizedData.length > 0 && (
        <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '6px', marginBottom: '24px', fontSize: '0.85rem' }}>
          ✅ Successfully parsed <strong>{normalizedData.length}</strong> historical cases.
          <button className="btn-header" style={{ marginLeft: '10px' }} onClick={() => { 
            setStep(1); 
            setFile(null); 
            setNormalizedData([]); 
            setResults(null); 
            localStorage.removeItem('caseLogSchedulerState');
          }}>
            Upload Different File
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        <div>
          <label className="styled-label">Active ORs</label>
          <input type="number" name="activeORs" className="date-range-selector" style={{ width: '100%', height: '36px', padding: '0 10px' }} value={config.activeORs} onChange={handleConfigChange} />
        </div>
        <div>
          <label className="styled-label">Operating Days / Week</label>
          <input type="number" name="operatingDays" className="date-range-selector" style={{ width: '100%', height: '36px', padding: '0 10px' }} value={config.operatingDays} onChange={handleConfigChange} />
        </div>
        <div>
          <label className="styled-label">Daily Minutes per OR</label>
          <input type="number" name="dailyMinutes" className="date-range-selector" style={{ width: '100%', height: '36px', padding: '0 10px' }} value={config.dailyMinutes} onChange={handleConfigChange} />
        </div>
        <div>
          <label className="styled-label">Target Utilization (%)</label>
          <select name="targetUtilization" className="date-range-selector" style={{ width: '100%', height: '36px', padding: '0 10px' }} value={config.targetUtilization} onChange={handleConfigChange}>
            <option value={60}>60%</option>
            <option value={70}>70%</option>
            <option value={80}>80%</option>
            <option value={90}>90%</option>
          </select>
        </div>
        <div>
          <label className="styled-label">Max Days Per Surgeon</label>
          <input type="number" name="maxSurgeonDays" className="date-range-selector" style={{ width: '100%', height: '36px', padding: '0 10px' }} value={config.maxSurgeonDays} onChange={handleConfigChange} />
        </div>
        <div>
          <label className="styled-label">Optimization Objective</label>
          <select name="optimizationObjective" className="date-range-selector" style={{ width: '100%', height: '36px', padding: '0 10px' }} value={config.optimizationObjective} onChange={handleConfigChange}>
            <option value="Balanced">Balanced</option>
            <option value="High Utilization">High Utilization</option>
            <option value="Conservative">Conservative</option>
            <option value="Revenue Optimized">Revenue Optimized</option>
            <option value="Surgeon Balanced">Surgeon Balanced</option>
          </select>
        </div>
      </div>
      
      <div style={{ marginTop: '30px', display: 'flex', gap: '12px' }}>
        <button className="btn-header" onClick={() => setStep(1)} disabled={isGenerating}>Back</button>
        <button className="btn-primary" onClick={handleGenerate} disabled={isGenerating} style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '8px' }}>
          {isGenerating ? <Bot size={18} className="spin" /> : <Play size={18} />}
          {isGenerating ? 'Optimizing Schedules...' : 'Generate AI Schedules'}
        </button>
      </div>

      {isGenerating && (
        <div style={{ marginTop: '24px', backgroundColor: 'var(--bg-input)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
          <h4 style={{ fontSize: '0.85rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>AI Agent Progress</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', fontFamily: 'monospace' }}>
            {generationProgress.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: idx === generationProgress.length - 1 ? 'var(--color-blue)' : 'var(--text-muted)' }}>
                {idx === generationProgress.length - 1 ? <ChevronRight size={14} /> : <CheckCircle size={14} />}
                {msg}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => {
    if (!results) return null;
    const { recommendedModel, models, sourceData, capacity } = results;

    const toggleRow = (idx) => {
      setExpandedRows(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Dashboard Summary Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div className="dashboard-card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Source Cases</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{sourceData.totalCases}</div>
          </div>
          <div className="dashboard-card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Available Surgeons</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{sourceData.surgeons}</div>
          </div>
          <div className="dashboard-card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Scheduled Cases</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{recommendedModel?.scheduledCases || 0}</div>
          </div>
          <div className="dashboard-card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Scheduled Minutes</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{recommendedModel?.scheduledMinutes || 0}</div>
          </div>
          <div className="dashboard-card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Available Minutes</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{capacity.weeklyAvailableMinutes}</div>
          </div>
          <div className="dashboard-card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Target vs Projected Utilization</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-blue)' }}>{config.targetUtilization}% / {recommendedModel?.utilization || 0}%</div>
          </div>
        </div>
        
        {/* Recommendation Header */}
        <div className="dashboard-card" style={{ padding: '24px', border: '2px solid var(--color-blue)', backgroundColor: 'rgba(59, 130, 246, 0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ backgroundColor: 'var(--color-blue)', padding: '12px', borderRadius: '12px', color: 'white' }}>
              <Bot size={32} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>AI Recommended Schedule</h2>
              <div style={{ display: 'flex', gap: '24px', fontSize: '0.9rem', marginBottom: '16px' }}>
                <div>Recommended Model: <strong>{recommendedModel.name}</strong></div>
                <div>Overall Score: <strong>{recommendedModel.score} / 100</strong></div>
                <div>Projected OR Utilization: <strong>{recommendedModel.utilization}%</strong></div>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                "{recommendedModel.name} is recommended because it achieves the highest overall score ({recommendedModel.score}) while maintaining the target OR utilization ({config.targetUtilization}%) and respecting surgeon availability and OR capacity. It also aligns well with historical surgeon case patterns while maintaining reasonable unused capacity."
              </p>
            </div>
          </div>
        </div>

        {/* Timetable */}
        <div className="dashboard-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarDays size={18} /> Recommended Weekly Timetable
          </h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>OR</th>
                  <th>Surgeon</th>
                  <th>Specialty</th>
                  <th>Cases</th>
                  <th>Minutes</th>
                  <th>Utilization</th>
                </tr>
              </thead>
              <tbody>
                {recommendedModel.schedule.map((row, idx) => (
                  <Fragment key={idx}>
                    <tr onClick={() => toggleRow(idx)} style={{ cursor: 'pointer', backgroundColor: expandedRows[idx] ? 'rgba(255,255,255,0.05)' : 'transparent' }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {expandedRows[idx] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          {row.day}
                        </div>
                      </td>
                      <td><span className="badge badge-info">{row.or}</span></td>
                      <td style={{ fontWeight: '600' }}>{row.surgeon}</td>
                      <td>{row.specialty}</td>
                      <td>{row.cases}</td>
                      <td>{row.minutes}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '60px', height: '6px', backgroundColor: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${row.utilization}%`, backgroundColor: row.utilization >= config.targetUtilization ? 'var(--color-green)' : 'var(--color-blue)' }}></div>
                          </div>
                          <span style={{ fontSize: '0.75rem' }}>{row.utilization}%</span>
                        </div>
                      </td>
                    </tr>
                    {expandedRows[idx] && (
                      <tr>
                        <td colSpan="7" style={{ padding: 0, border: 'none' }}>
                          <div style={{ padding: '16px 24px', backgroundColor: 'var(--bg-card)', borderLeft: '3px solid var(--color-blue)' }}>
                            <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>Assigned Cases</h4>
                            <table className="data-table" style={{ fontSize: '0.85rem' }}>
                              <thead>
                                <tr>
                                  <th>Time</th>
                                  <th>Case ID</th>
                                  <th>CPT</th>
                                  <th>Procedure</th>
                                  <th>Duration</th>
                                  <th>Source</th>
                                </tr>
                              </thead>
                              <tbody>
                                {row.casesList && row.casesList.map(c => (
                                  <tr key={c.caseId}>
                                    <td style={{ fontWeight: '600' }}>{c.startTime} - {c.endTime}</td>
                                    <td><span className="badge" style={{ backgroundColor: 'var(--bg-input)' }}>{c.caseId}</span></td>
                                    <td>{c.cptCode}</td>
                                    <td>{c.procedureName}</td>
                                    <td>{c.caseDurationMinutes}m</td>
                                    <td><span style={{ color: c.durationSource === 'estimated' ? 'var(--color-orange)' : 'var(--text-secondary)' }}>{c.durationSource}</span></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
                {recommendedModel.schedule.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                      No schedules could be generated within the constraints.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Model Comparison */}
        <div className="dashboard-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart size={18} /> Model Comparison
          </h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Utilization</th>
                  <th>Score</th>
                  <th>Risk</th>
                  <th>Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {models.map((m, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: m.name === recommendedModel.name ? '700' : 'normal' }}>{m.name}</td>
                    <td>{m.utilization}%</td>
                    <td>{m.score}</td>
                    <td>
                      <span className={`badge ${m.risk === 'Very Low' || m.risk === 'Low' ? 'badge-success' : m.risk === 'Medium' ? 'badge-warning' : 'badge-danger'}`}>
                        {m.risk}
                      </span>
                    </td>
                    <td>
                      {m.name === recommendedModel.name ? (
                        <span style={{ color: 'var(--color-orange)', fontWeight: '700' }}>⭐ Recommended</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Good</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <button className="btn-header" onClick={() => setStep(2)}>Back to Configuration</button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px', padding: '0 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: step >= 1 ? 'var(--color-blue)' : 'var(--bg-input)', color: step >= 1 ? 'white' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', marginBottom: '8px' }}>1</div>
          <span style={{ fontSize: '0.8rem', fontWeight: step >= 1 ? '600' : 'normal', color: step >= 1 ? 'var(--text-primary)' : 'var(--text-muted)' }}>Upload</span>
        </div>
        <div style={{ flex: 1, height: '2px', backgroundColor: step >= 2 ? 'var(--color-blue)' : 'var(--border-light)' }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: step >= 2 ? 'var(--color-blue)' : 'var(--bg-input)', color: step >= 2 ? 'white' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', marginBottom: '8px' }}>2</div>
          <span style={{ fontSize: '0.8rem', fontWeight: step >= 2 ? '600' : 'normal', color: step >= 2 ? 'var(--text-primary)' : 'var(--text-muted)' }}>Configure</span>
        </div>
        <div style={{ flex: 1, height: '2px', backgroundColor: step >= 3 ? 'var(--color-blue)' : 'var(--border-light)' }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: step >= 3 ? 'var(--color-blue)' : 'var(--bg-input)', color: step >= 3 ? 'white' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', marginBottom: '8px' }}>3</div>
          <span style={{ fontSize: '0.8rem', fontWeight: step >= 3 ? '600' : 'normal', color: step >= 3 ? 'var(--text-primary)' : 'var(--text-muted)' }}>Results</span>
        </div>
      </div>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </div>
  );
}
