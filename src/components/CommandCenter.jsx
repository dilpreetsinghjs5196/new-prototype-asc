import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { DollarSign, Clock, TrendingUp } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']; // Highly Profitable, Profitable, Break-even, Unprofitable

export default function CommandCenter({ surgeries = [], onTabChange, timeframe = 'Month', filterDate = new Date(), includeAdvancedCosts = false }) {

  // Filter surgeries based on timeframe and selected date
  const filteredSurgeries = useMemo(() => {
    if (timeframe === 'All') return surgeries;

    const now = filterDate || new Date();
    return surgeries.filter(s => {
      if (!s.date) return false;
      const sDate = new Date(s.date);
      if (timeframe === 'Day') {
        return sDate.toDateString() === now.toDateString();
      }
      if (timeframe === 'Week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return sDate >= oneWeekAgo && sDate <= now;
      }
      if (timeframe === 'Month') {
        return sDate.getMonth() === now.getMonth() && sDate.getFullYear() === now.getFullYear();
      }
      if (timeframe === 'Year') {
        return sDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [surgeries, timeframe]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    let totalRevenue = 0;
    let totalCosts = 0;
    let totalDurationMins = 0;
    let totalTurnoverMins = 0;
    let turnoverCount = 0;

    let totalAvailableMins = 0;

    // Assume 2 ORs, 8 hours a day.
    if (timeframe === 'Day') totalAvailableMins = 2 * 8 * 60;
    else if (timeframe === 'Week') totalAvailableMins = 2 * 8 * 5 * 60;
    else if (timeframe === 'Month') totalAvailableMins = 2 * 8 * 20 * 60;
    else if (timeframe === 'Year') totalAvailableMins = 2 * 8 * 250 * 60;
    else totalAvailableMins = 2 * 8 * 250 * 60;

    filteredSurgeries.forEach(s => {
      const revenue = parseFloat(s.expected_reimbursement) || 0;
      const roomCost = parseFloat(s.actual_room_cost) || 0;
      const laborCost = parseFloat(s.actual_labor_cost) || 0;
      const suppliesCost = parseFloat(s.supplies_cost) || 0;
      const implantsCost = parseFloat(s.implants_cost) || 0;
      const medsCost = parseFloat(s.medications_cost) || 0;
      const trayCost = parseFloat(s.tray_cost) || 0;

      const totalSurgCost = includeAdvancedCosts ? (roomCost + laborCost + suppliesCost + implantsCost + medsCost + trayCost) : 0;

      totalRevenue += revenue;
      totalCosts += totalSurgCost;

      const duration = parseFloat(s.actual_duration_minutes) || parseFloat(s.duration_minutes) || 60;
      totalDurationMins += duration;

      const turnover = parseFloat(s.turnover_time);
      if (!isNaN(turnover)) {
        totalTurnoverMins += turnover;
        turnoverCount++;
      }
    });

    const ebitda = totalRevenue - totalCosts;
    const ebitdaPercent = totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0;
    const orUtil = totalAvailableMins > 0 ? (totalDurationMins / totalAvailableMins) * 100 : 0;

    // Profitable Utilization (simplified for prototype: % of time spent on profitable cases)
    let profitableMins = 0;
    filteredSurgeries.forEach(s => {
      const revenue = parseFloat(s.expected_reimbursement) || 0;
      const totalSurgCost = includeAdvancedCosts ? ((parseFloat(s.actual_room_cost) || 0) +
        (parseFloat(s.actual_labor_cost) || 0) +
        (parseFloat(s.supplies_cost) || 0) +
        (parseFloat(s.implants_cost) || 0) +
        (parseFloat(s.medications_cost) || 0) +
        (parseFloat(s.tray_cost) || 0)
      ) : 0;
      if (revenue > totalSurgCost) {
        const duration = parseFloat(s.actual_duration_minutes) || parseFloat(s.duration_minutes) || 60;
        profitableMins += duration;
      }
    });
    const profitableUtil = totalAvailableMins > 0 ? (profitableMins / totalAvailableMins) * 100 : 0;

    const totalHours = totalDurationMins / 60;
    const revPerHour = totalHours > 0 ? totalRevenue / totalHours : 0;
    const marginPerHour = totalHours > 0 ? ebitda / totalHours : 0;
    const avgTurnover = turnoverCount > 0 ? Math.round(totalTurnoverMins / turnoverCount) : 0;

    return {
      ebitdaPercent: ebitdaPercent.toFixed(1),
      orUtil: orUtil.toFixed(1),
      profitableUtil: profitableUtil.toFixed(1),
      revPerHour: Math.round(revPerHour),
      marginPerHour: Math.round(marginPerHour),
      avgTurnover
    };
  }, [filteredSurgeries, timeframe, includeAdvancedCosts]);

  // Surgeon Performance Data
  const surgeonPerf = useMemo(() => {
    const perfMap = {};
    filteredSurgeries.forEach(s => {
      const doc = s.doctor_name || 'Unknown Surgeon';
      if (!perfMap[doc]) perfMap[doc] = { name: doc, netMargin: 0 };

      const revenue = parseFloat(s.expected_reimbursement) || 0;
      const totalSurgCost = includeAdvancedCosts ? ((parseFloat(s.actual_room_cost) || 0) +
        (parseFloat(s.actual_labor_cost) || 0) +
        (parseFloat(s.supplies_cost) || 0) +
        (parseFloat(s.implants_cost) || 0) +
        (parseFloat(s.medications_cost) || 0) +
        (parseFloat(s.tray_cost) || 0)
      ) : 0;

      perfMap[doc].netMargin += (revenue - totalSurgCost);
    });

    return Object.values(perfMap)
      .sort((a, b) => b.netMargin - a.netMargin)
      .slice(0, 10); // Top 10
  }, [filteredSurgeries, includeAdvancedCosts]);

  // Case Profitability Distribution
  const caseProfitability = useMemo(() => {
    let highlyProfitable = 0;
    let profitable = 0;
    let breakEven = 0;
    let unprofitable = 0;

    filteredSurgeries.forEach(s => {
      const revenue = parseFloat(s.expected_reimbursement) || 0;
      const totalSurgCost = includeAdvancedCosts ? ((parseFloat(s.actual_room_cost) || 0) +
        (parseFloat(s.actual_labor_cost) || 0) +
        (parseFloat(s.supplies_cost) || 0) +
        (parseFloat(s.implants_cost) || 0) +
        (parseFloat(s.medications_cost) || 0) +
        (parseFloat(s.tray_cost) || 0)
      ) : 0;

      const margin = revenue > 0 ? ((revenue - totalSurgCost) / revenue) * 100 : -100;

      if (margin >= 25) highlyProfitable++;
      else if (margin >= 10) profitable++;
      else if (margin >= 0) breakEven++;
      else unprofitable++;
    });

    return [
      { name: 'Highly Profitable', value: highlyProfitable },
      { name: 'Profitable', value: profitable },
      { name: 'Break-even', value: breakEven },
      { name: 'Unprofitable', value: unprofitable }
    ];
  }, [filteredSurgeries, includeAdvancedCosts]);

  // OR Utilization Trend (Monthly)
  const orUtilTrend = useMemo(() => {
    const trendMap = {};
    surgeries.forEach(s => {
      if (!s.date) return;
      const d = new Date(s.date);
      const monthYear = d.toLocaleString('default', { month: 'short' }) + ' ' + d.getFullYear();

      if (!trendMap[monthYear]) {
        trendMap[monthYear] = { name: monthYear, totalMins: 0, profMins: 0, dateObj: d };
      }

      const duration = parseFloat(s.actual_duration_minutes) || parseFloat(s.duration_minutes) || 60;
      trendMap[monthYear].totalMins += duration;

      const revenue = parseFloat(s.expected_reimbursement) || 0;
      const totalSurgCost = includeAdvancedCosts ? ((parseFloat(s.actual_room_cost) || 0) +
        (parseFloat(s.actual_labor_cost) || 0) +
        (parseFloat(s.supplies_cost) || 0) +
        (parseFloat(s.implants_cost) || 0) +
        (parseFloat(s.medications_cost) || 0) +
        (parseFloat(s.tray_cost) || 0)
      ) : 0;

      if (revenue > totalSurgCost) {
        trendMap[monthYear].profMins += duration;
      }
    });

    const sortedMonths = Object.values(trendMap).sort((a, b) => a.dateObj - b.dateObj).slice(-6);

    const monthlyAvailable = 2 * 8 * 20 * 60;
    return sortedMonths.map(m => ({
      name: m.name.split(' ')[0],
      util: Math.round((m.totalMins / monthlyAvailable) * 100),
      profUtil: Math.round((m.profMins / monthlyAvailable) * 100)
    }));
  }, [surgeries, includeAdvancedCosts]);


  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (percent < 0.05) return null;
    return (
      <text x={x} y={y} fill="white" fontSize={10} textAnchor="middle" dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="dashboard-content">
      {/* 6 KPI Cards Row */}
      <div className="kpi-row">
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">EBITDA Margin</span>
            <div className="kpi-icon-container blue"><DollarSign size={12} /></div>
          </div>
          <span className="kpi-value" style={{ color: parseFloat(kpis.ebitdaPercent) >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
            {kpis.ebitdaPercent}%
          </span>
          <div className="kpi-trend positive" style={{ visibility: 'hidden' }}>
            Trend
          </div>
          <div className="sparkline-container">
            <svg viewBox="0 0 100 30" width="100%" height="100%" preserveAspectRatio="none">
              <path d="M0,25 L20,20 L40,15 L60,22 L80,18 L100,12" fill="none" stroke="var(--color-blue)" strokeWidth="2" />
            </svg>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">Operating Room Utilization</span>
            <div className="kpi-icon-container blue"><Clock size={12} /></div>
          </div>
          <span className="kpi-value">{kpis.orUtil}%</span>
          <div className="kpi-trend positive" style={{ visibility: 'hidden' }}>
            Trend
          </div>
          <div className="sparkline-container">
            <svg viewBox="0 0 100 30" width="100%" height="100%" preserveAspectRatio="none">
              <path d="M0,25 Q15,10 30,22 T60,8 T90,12 T100,5" fill="none" stroke="var(--color-blue)" strokeWidth="2" />
            </svg>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">Profitable OR Utilization</span>
            <div className="kpi-icon-container green"><TrendingUp size={12} /></div>
          </div>
          <span className="kpi-value">{kpis.profitableUtil}%</span>
          <div className="kpi-trend positive" style={{ visibility: 'hidden' }}>
            Trend
          </div>
          <div className="sparkline-container">
            <svg viewBox="0 0 100 30" width="100%" height="100%" preserveAspectRatio="none">
              <path d="M0,25 Q30,12 60,20 T100,8" fill="none" stroke="var(--color-green)" strokeWidth="2" />
            </svg>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">Revenue per OR Hour</span>
            <div className="kpi-icon-container blue"><DollarSign size={12} /></div>
          </div>
          <span className="kpi-value">${kpis.revPerHour.toLocaleString()}</span>
          <div className="kpi-trend positive" style={{ visibility: 'hidden' }}>
            Trend
          </div>
          <div className="sparkline-container">
            <svg viewBox="0 0 100 30" width="100%" height="100%" preserveAspectRatio="none">
              <path d="M0,28 L30,24 L60,18 L100,10" fill="none" stroke="var(--color-green)" strokeWidth="2" />
            </svg>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">Net Margin per OR Hour</span>
            <div className="kpi-icon-container green"><TrendingUp size={12} /></div>
          </div>
          <span className="kpi-value" style={{ color: kpis.marginPerHour >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
            {kpis.marginPerHour >= 0 ? '$' : '-$'}{Math.abs(kpis.marginPerHour).toLocaleString()}
          </span>
          <div className="kpi-trend negative" style={{ visibility: 'hidden' }}>
            Trend
          </div>
          <div className="sparkline-container">
            <svg viewBox="0 0 100 30" width="100%" height="100%" preserveAspectRatio="none">
              <path d="M0,10 L30,12 L60,22 L100,28" fill="none" stroke="var(--color-red)" strokeWidth="2" />
            </svg>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">Average Turnover Time</span>
            <div className="kpi-icon-container orange"><Clock size={12} /></div>
          </div>
          <span className="kpi-value">{kpis.avgTurnover}</span>
          <div className="kpi-trend positive" style={{ visibility: 'hidden' }}>
            Trend
          </div>
          <div className="sparkline-container">
            <svg viewBox="0 0 100 30" width="100%" height="100%" preserveAspectRatio="none">
              <path d="M0,25 L20,20 L40,15 L60,22 L80,18 L100,12" fill="none" stroke="var(--color-orange)" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>

      {/* Sub-tabs menu */}
      <div className="subtabs-menu">
        <button className="subtab-item active" onClick={() => onTabChange('dashboard')}>Overview</button>
        <button className="subtab-item" onClick={() => onTabChange('or')}>ORPerformance</button>
        <button className="subtab-item" onClick={() => onTabChange('surgeons')}>Surgeon Performance</button>
        <button className="subtab-item" onClick={() => onTabChange('patients')}>Patient Registry</button>
        {/* <button className="subtab-item" onClick={() => onTabChange('financial')}>Financial Performance</button> */}
        {/* <button className="subtab-item" onClick={() => onTabChange('cpt')}>Case Profitability</button> */}
        <button className="subtab-item" onClick={() => onTabChange('cancellations')}>Case Cancellations</button>
        {/* <button className="subtab-item" onClick={() => onTabChange('supply')}>Supply Chain</button> */}
        <button className="subtab-item" onClick={() => onTabChange('ai')}>AI Insights</button>
      </div>

      {/* Middle Section: Trend, Surgeon and Case Donut Grid */}
      <div className="three-column-row">

        {/* OR Utilization Trend */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">OR Utilization (Last 6 Months)</h3>
          </div>
          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={orUtilTrend} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#334155" fontSize={10} tickLine={false} />
                <YAxis stroke="#334155" fontSize={10} domain={[0, 100]} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', fontSize: '11px', color: '#0f172a', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
                <Line type="monotone" dataKey="util" stroke="var(--color-blue)" strokeWidth={2.5} name="OR Utilization %" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="profUtil" stroke="var(--color-green)" strokeWidth={2} name="Profitable Utilization %" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Surgeon Performance */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">Top Surgeon Performance (Net Margin)</h3>
          </div>
          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={surgeonPerf} layout="vertical" margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <XAxis type="number" stroke="#334155" fontSize={9} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#334155" fontSize={9} width={80} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', fontSize: '10px', color: '#0f172a', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} formatter={(value) => value >= 0 ? `$${Math.round(value).toLocaleString()}` : `-$${Math.abs(Math.round(value)).toLocaleString()}`} />
                <Bar
                  dataKey="netMargin"
                  fill="var(--color-blue)"
                  radius={[0, 4, 4, 0]}
                  barSize={12}
                  name="Net Margin"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Case Profitability */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">Case Profitability Analysis</h3>
          </div>
          <div style={{ width: '100%', height: '220px', display: 'flex', alignItems: 'center' }}>
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie
                  data={caseProfitability}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomizedLabel}
                >
                  {caseProfitability.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', fontSize: '11px', color: '#0f172a', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="custom-legend" style={{ width: '50%', fontSize: '11px', paddingLeft: '8px' }}>
              {caseProfitability.map((entry, index) => (
                <div key={index} className="legend-item" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', backgroundColor: '#f1f5f9', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <div className="legend-color" style={{ width: '8px', height: '8px', backgroundColor: COLORS[index], borderRadius: '50%', marginRight: '8px' }}></div>
                  <div className="legend-text" style={{ color: '#0f172a', fontWeight: '600', flex: 1 }}>{entry.name}</div>
                  <div className="legend-value" style={{ color: '#0f172a', fontWeight: '700' }}>{entry.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
