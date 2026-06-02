import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  LayoutDashboard, 
  Clock, 
  CalendarClock, 
  Stethoscope, 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  Sparkles, 
  DollarSign, 
  Settings, 
  ChevronRight,
  TrendingDown,
  Info,
  Play,
  RotateCcw,
  Sliders,
  CheckCircle,
  Search,
  Filter,
  Download,
  XCircle,
  BarChart3,
  BookOpen,
  Database,
  HelpCircle,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

// ==========================================
// MTD COMMAND CENTER MOCK DATA
// ==========================================

const MOCK_OR_UTIL_TREND = [
  { name: 'May 1', util: 54.2, profUtil: 44.1 },
  { name: 'May 8', util: 58.7, profUtil: 48.3 },
  { name: 'May 15', util: 64.2, profUtil: 52.1 },
  { name: 'May 22', util: 60.1, profUtil: 49.8 },
  { name: 'May 29', util: 62.4, profUtil: 51.3 }
];

const MOCK_SURGEON_PERF = [
  { name: 'Dr. David Smith', netMargin: 263450, marginCase: 5488 },
  { name: 'Dr. Sarah Lee', netMargin: 215630, marginCase: 5989 },
  { name: 'Dr. James Johnson', netMargin: 157850, marginCase: 5637 },
  { name: 'Dr. Michael Patel', netMargin: 142910, marginCase: 3485 },
  { name: 'Dr. Emily Davis', netMargin: 85230, marginCase: 2749 }
];

const MOCK_SURGEONS_DETAILS = {
  'Dr. David Smith': {
    name: 'Dr. David Smith',
    specialty: 'Orthopedic Surgery',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=256&h=256&q=80',
    color: '#3b82f6',
    status: 'Active',
    npi: '1982736450',
    metrics: {
      cases: 48,
      avgDuration: 68,
      avgTurnover: 18,
      supplyVariance: '+18.4%',
      netMargin: 263450,
      avgMargin: 5488,
      onTimeStart: 92,
      utilization: 78
    },
    caseHistory: [
      { name: 'Jan', cases: 38, margin: 198000, revenue: 480000 },
      { name: 'Feb', cases: 42, margin: 220000, revenue: 530000 },
      { name: 'Mar', cases: 40, margin: 210000, revenue: 505000 },
      { name: 'Apr', cases: 45, margin: 245000, revenue: 580000 },
      { name: 'May', cases: 48, margin: 263450, revenue: 616416 }
    ],
    payerMix: [
      { name: 'Commercial', value: 28, revenue: 420000, margin: 190000, color: 'var(--color-blue)' },
      { name: 'Medicare', value: 16, revenue: 156416, margin: 63450, color: 'var(--color-green)' },
      { name: 'Self-Pay', value: 4, revenue: 40000, margin: 10000, color: 'var(--color-orange)' }
    ],
    supplyWaste: [
      { item: 'Orthopedic Implant Anchor', opened: 8, used: 6, wasteCost: 900, type: 'Implant' },
      { item: 'Suture Packs (Vicryl 2-0)', opened: 12, used: 6, wasteCost: 180, type: 'Suture' },
      { item: 'Disposable Drape Pack', opened: 2, used: 1, wasteCost: 120, type: 'Disposable' }
    ],
    recentCancellations: [
      { date: 'May 20', procedure: 'Knee Arthroscopy', reason: 'Pre-Op Vitals High', loss: 5823 },
      { date: 'May 12', procedure: 'Total Knee Joint Repair', reason: 'Patient No-Show', loss: 7905 }
    ],
    aiInsights: [
      { id: 1, type: 'high', icon: '💲', title: 'Standardize Anchor Brand', desc: "Standardizing implant anchors can save $900 per 10 cases based on Dr. Smith's baseline preference card." },
      { id: 2, type: 'med', icon: '⏳', title: 'Parallel Anesthesia Prep', desc: 'Pre-op block room blocks could reduce avg procedure duration by 6 mins, adding 4 potential slots per month.' }
    ],
    cptBreakdown: [
      { code: '27130', desc: 'Total Hip Replacement', cases: 18, avgTime: 110, margin: 125400 },
      { code: '29827', desc: 'Knee Scope / Arthroscopy', cases: 20, avgTime: 58, margin: 116460 },
      { code: '27447', desc: 'Total Knee Joint Repair', cases: 10, avgTime: 92, margin: 21590 }
    ]
  },
  'Dr. Sarah Lee': {
    name: 'Dr. Sarah Lee',
    specialty: 'General Surgery',
    avatar: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&w=256&h=256&q=80',
    color: '#10b981',
    status: 'Active',
    npi: '1728394051',
    metrics: {
      cases: 36,
      avgDuration: 52,
      avgTurnover: 14,
      supplyVariance: '-2.1%',
      netMargin: 215630,
      avgMargin: 5989,
      onTimeStart: 96,
      utilization: 84
    },
    caseHistory: [
      { name: 'Jan', cases: 30, margin: 175000, revenue: 265000 },
      { name: 'Feb', cases: 32, margin: 190000, revenue: 285000 },
      { name: 'Mar', cases: 35, margin: 210000, revenue: 315000 },
      { name: 'Apr', cases: 33, margin: 198000, revenue: 295000 },
      { name: 'May', cases: 36, margin: 215630, revenue: 327780 }
    ],
    payerMix: [
      { name: 'Commercial', value: 20, revenue: 200000, margin: 145000, color: 'var(--color-blue)' },
      { name: 'Medicare', value: 14, revenue: 110000, margin: 65000, color: 'var(--color-green)' },
      { name: 'Self-Pay', value: 2, revenue: 17780, margin: 5630, color: 'var(--color-orange)' }
    ],
    supplyWaste: [
      { item: 'Laparoscopic Trocar 5mm', opened: 4, used: 4, wasteCost: 0, type: 'Disposable' },
      { item: 'Suture Packs (Monocryl 4-0)', opened: 6, used: 5, wasteCost: 35, type: 'Suture' }
    ],
    recentCancellations: [
      { date: 'May 10', procedure: 'Shoulder Arthroscopy', reason: 'Incomplete Pre-Op Clearance', loss: 4200 }
    ],
    aiInsights: [
      { id: 1, type: 'med', icon: '✨', title: 'High Efficiency Benchmark', desc: 'Dr. Lee achieves turnover times 10 mins faster than the facility baseline. Staff alignment is optimal.' }
    ],
    cptBreakdown: [
      { code: '23430', desc: 'Laparoscopic Cholecystectomy', cases: 22, avgTime: 50, margin: 135400 },
      { code: '49505', desc: 'Inguinal Hernia Repair', cases: 14, avgTime: 55, margin: 80230 }
    ]
  },
  'Dr. Michael Patel': {
    name: 'Dr. Michael Patel',
    specialty: 'Ophthalmology & Gen Surgery',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=256&h=256&q=80',
    color: '#f59e0b',
    status: 'Active',
    npi: '1092837465',
    metrics: {
      cases: 41,
      avgDuration: 88,
      avgTurnover: 24,
      supplyVariance: '+31.2%',
      netMargin: 142910,
      avgMargin: 3485,
      onTimeStart: 79,
      utilization: 66
    },
    caseHistory: [
      { name: 'Jan', cases: 35, margin: 120000, revenue: 350000 },
      { name: 'Feb', cases: 38, margin: 132000, revenue: 382000 },
      { name: 'Mar', cases: 42, margin: 148000, revenue: 425000 },
      { name: 'Apr', cases: 39, margin: 135000, revenue: 390000 },
      { name: 'May', cases: 41, margin: 142910, revenue: 418300 }
    ],
    payerMix: [
      { name: 'Commercial', value: 15, revenue: 170000, margin: 68000, color: 'var(--color-blue)' },
      { name: 'Medicare', value: 22, revenue: 218300, margin: 69910, color: 'var(--color-green)' },
      { name: 'Self-Pay', value: 4, revenue: 30000, margin: 5000, color: 'var(--color-orange)' }
    ],
    supplyWaste: [
      { item: 'Ophthalmic Viscoelastic Pack', opened: 3, used: 1, wasteCost: 450, type: 'Fluid' },
      { item: 'Custom Phaco Blade 2.2mm', opened: 2, used: 1, wasteCost: 380, type: 'Blade' },
      { item: 'Disposable Drape Set Extra', opened: 4, used: 2, wasteCost: 160, type: 'Disposable' }
    ],
    recentCancellations: [
      { date: 'May 12', procedure: 'Gallbladder (CPT 23430)', reason: 'Patient No-Show', loss: 3450 },
      { date: 'May 5', procedure: 'Hernia Repair', reason: 'Elevated BP', loss: 3750 }
    ],
    aiInsights: [
      { id: 1, type: 'high', icon: '⚠', title: 'Preference Card Overruns', desc: 'Average supply card cost is 31.2% higher than standard Ophthalmology baseline. Standardize Phaco packs.' },
      { id: 2, type: 'med', icon: '📅', title: 'Block Time Release', desc: 'Releasing unused block time 48 hrs in advance will reduce slot wastage and save $4,200/month.' }
    ],
    cptBreakdown: [
      { code: '27447', desc: 'Cataract Surgery', cases: 29, avgTime: 82, margin: 98450 },
      { code: '49505', desc: 'Inguinal Hernia Repair', cases: 12, avgTime: 102, margin: 44460 }
    ]
  },
  'Dr. James Johnson': {
    name: 'Dr. James Johnson',
    specialty: 'Spine Surgery',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=256&h=256&q=80',
    color: '#8b5cf6',
    status: 'Active',
    npi: '1546372819',
    metrics: {
      cases: 28,
      avgDuration: 110,
      avgTurnover: 29,
      supplyVariance: '+8.4%',
      netMargin: 157850,
      avgMargin: 5637,
      onTimeStart: 88,
      utilization: 72
    },
    caseHistory: [
      { name: 'Jan', cases: 22, margin: 121000, revenue: 410000 },
      { name: 'Feb', cases: 25, margin: 139000, revenue: 470000 },
      { name: 'Mar', cases: 24, margin: 132000, revenue: 450000 },
      { name: 'Apr', cases: 26, margin: 145000, revenue: 495000 },
      { name: 'May', cases: 28, margin: 157850, revenue: 531200 }
    ],
    payerMix: [
      { name: 'Commercial', value: 16, revenue: 320000, margin: 110000, color: 'var(--color-blue)' },
      { name: 'Medicare', value: 10, revenue: 181200, margin: 42850, color: 'var(--color-green)' },
      { name: 'Self-Pay', value: 2, revenue: 30000, margin: 5000, color: 'var(--color-orange)' }
    ],
    supplyWaste: [
      { item: 'Spine Stabilization Rod Set', opened: 4, used: 3, wasteCost: 1800, type: 'Implant' },
      { item: 'Hemostatic Matrix Gel', opened: 3, used: 2, wasteCost: 450, type: 'Biologic' },
      { item: 'Disposable Drape Set Large', opened: 2, used: 1, wasteCost: 190, type: 'Disposable' }
    ],
    recentCancellations: [
      { date: 'May 8', procedure: 'Carpal Tunnel Release', reason: 'Pre-Auth Refused', loss: 1620 }
    ],
    aiInsights: [
      { id: 1, type: 'med', icon: '⌛', title: 'High Turnover Alert', desc: 'Average turnover is 29 mins (facility average is 24 mins). Delay caused by heavy setup times.' },
      { id: 2, type: 'high', icon: '💰', title: 'Implant Standardization', desc: 'Consolidating spine rod suppliers can retrieve $6,500 in monthly margin leakage.' }
    ],
    cptBreakdown: [
      { code: '22612', desc: 'Lumbar Spine Fusion', cases: 12, avgTime: 140, margin: 96000 },
      { code: '27132', desc: 'Hip Joint Replacement', cases: 10, avgTime: 115, margin: 58630 },
      { code: '63030', desc: 'Carpal Tunnel Release', cases: 6, avgTime: 40, margin: 3220 }
    ]
  },
  'Dr. Emily Davis': {
    name: 'Dr. Emily Davis',
    specialty: 'Ophthalmology / Gynecology',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=256&h=256&q=80',
    color: '#ec4899',
    status: 'Active',
    npi: '1859403827',
    metrics: {
      cases: 31,
      avgDuration: 48,
      avgTurnover: 16,
      supplyVariance: '+12.6%',
      netMargin: 85230,
      avgMargin: 2749,
      onTimeStart: 94,
      utilization: 81
    },
    caseHistory: [
      { name: 'Jan', cases: 25, margin: 68000, revenue: 112000 },
      { name: 'Feb', cases: 28, margin: 76000, revenue: 125000 },
      { name: 'Mar', cases: 26, margin: 71000, revenue: 118000 },
      { name: 'Apr', cases: 30, margin: 82000, revenue: 136000 },
      { name: 'May', cases: 31, margin: 85230, revenue: 141020 }
    ],
    payerMix: [
      { name: 'Commercial', value: 12, revenue: 60000, margin: 42000, color: 'var(--color-blue)' },
      { name: 'Medicare', value: 16, revenue: 73020, margin: 39230, color: 'var(--color-green)' },
      { name: 'Self-Pay', value: 3, revenue: 8000, margin: 4000, color: 'var(--color-orange)' }
    ],
    supplyWaste: [
      { item: 'Ophthalmic Irrigator Disposable', opened: 4, used: 2, wasteCost: 180, type: 'Disposable' },
      { item: 'Suture Silk 4-0', opened: 8, used: 4, wasteCost: 65, type: 'Suture' }
    ],
    recentCancellations: [],
    aiInsights: [
      { id: 1, type: 'med', icon: '⚡', title: 'High Turnover Performance', desc: 'Average turnover is 16 mins (ASC average is 24 mins). Highly efficient scheduling slot fit.' }
    ],
    cptBreakdown: [
      { code: '66984', desc: 'Cataract Removal / Implant', cases: 22, avgTime: 44, margin: 65450 },
      { code: '63030', desc: 'Carpal Tunnel Release', cases: 9, avgTime: 58, margin: 19780 }
    ]
  }
};

const MOCK_CASE_DIST = [
  { name: 'Highly Profitable (>$1,000)', value: 350, percentage: 28, color: 'var(--color-green)' },
  { name: 'Profitable ($200-$1,000)', value: 449, percentage: 36, color: 'var(--color-blue)' },
  { name: 'Break Even ($0-$200)', value: 200, percentage: 16, color: 'var(--color-orange)' },
  { name: 'Unprofitable (<$0)', value: 249, percentage: 20, color: 'var(--color-red)' }
];

const MOCK_SUPPLY_BREAKDOWN = [
  { name: 'Implants', value: 129185, percentage: 39, color: 'var(--color-blue)' },
  { name: 'Medical Supplies', value: 92145, percentage: 28, color: 'var(--color-green)' },
  { name: 'Pharmaceuticals', value: 49420, percentage: 15, color: 'var(--color-purple)' },
  { name: 'Sutures & Disposables', value: 32970, percentage: 10, color: 'var(--color-pink)' },
  { name: 'Other', value: 26985, percentage: 8, color: 'var(--color-red)' }
];

const MOCK_PROFITABILITY_SUMMARY = [
  { location: 'Main ASC', cases: 856, rev: 1102450, cost: 1000936, margin: 101514, marginPct: 9.2, util: 64.2, profUtil: 52.1, revHour: 1145, marginHour: 214, trend: 'up' },
  { location: 'South ASC', cases: 392, rev: 482750, cost: 446210, margin: 36540, marginPct: 7.6, util: 58.7, profUtil: 48.3, revHour: 1028, marginHour: 178, trend: 'up' },
  { location: 'West ASC', cases: 286, rev: 312890, cost: 287680, margin: 25210, marginPct: 8.1, util: 61.3, profUtil: 50.2, revHour: 1056, marginHour: 192, trend: 'up' }
];

// Legacy Timeline data (for Schedule Optimizer subtabs)
const INITIAL_SURGERIES = [
  { id: 1, or: 'OR 1', label: 'Total Knee', doctor: 'Dr. Smith', start: '7:30 AM', end: '9:30 AM', startMin: 450, endMin: 570, marginType: 'high', code: '27130', revenue: 22125, supplies: 4800, implants: 6200, labor: 1800, roomCost: 1360, margin: 7965 },
  { id: 2, or: 'OR 1', label: 'Shoulder Arthroscopy', doctor: 'Dr. Jones', start: '10:00 AM', end: '11:30 AM', startMin: 600, endMin: 690, marginType: 'med', code: '29824', revenue: 11230, supplies: 2400, implants: 2800, labor: 1350, roomCost: 2480, margin: 4200 },
  { id: 3, or: 'OR 1', label: 'Hip Replacement', doctor: 'Dr. Johnson', start: '12:30 PM', end: '3:00 PM', startMin: 750, endMin: 900, marginType: 'high', code: '27132', revenue: 25400, supplies: 5100, implants: 7500, labor: 2250, roomCost: 3100, margin: 7450 },
  { id: 4, or: 'OR 1', label: 'Block', doctor: 'System Block', start: '3:30 PM', end: '5:00 PM', startMin: 930, endMin: 1020, marginType: 'blocked' },

  { id: 5, or: 'OR 2', label: 'Cataract', doctor: 'Dr. Lee', start: '7:00 AM', end: '8:00 AM', startMin: 420, endMin: 480, marginType: 'med', code: '66984', revenue: 4550, supplies: 950, implants: 1100, labor: 900, roomCost: 800, margin: 800 },
  { id: 6, or: 'OR 2', label: 'Cataract', doctor: 'Dr. Lee', start: '8:30 AM', end: '9:30 AM', startMin: 510, endMin: 570, marginType: 'med', code: '66984', revenue: 4550, supplies: 950, implants: 1100, labor: 900, roomCost: 800, margin: 800 },
  { id: 7, or: 'OR 2', label: 'Cataract', doctor: 'Dr. Lee', start: '10:00 AM', end: '11:00 AM', startMin: 600, endMin: 660, marginType: 'high', code: '27447', revenue: 9105, supplies: 1450, implants: 1600, labor: 900, roomCost: 2450, margin: 4910 },
  { id: 8, or: 'OR 2', label: 'Cataract', doctor: 'Dr. Lee', start: '11:30 AM', end: '12:30 PM', startMin: 690, endMin: 750, marginType: 'low', code: '66984', revenue: 4550, supplies: 1550, implants: 1100, labor: 900, roomCost: 800, margin: 200 },
  { id: 9, or: 'OR 2', label: 'Cataract', doctor: 'Dr. Patel', start: '1:00 PM', end: '2:00 PM', startMin: 780, endMin: 840, marginType: 'med', code: '66984', revenue: 4550, supplies: 950, implants: 1100, labor: 900, roomCost: 800, margin: 800 },
  { id: 10, or: 'OR 2', label: 'Block', doctor: 'System Block', start: '2:30 PM', end: '5:00 PM', startMin: 870, endMin: 1020, marginType: 'blocked' },

  { id: 11, or: 'OR 3', label: 'Hernia Repair', doctor: 'Dr. Patel', start: '7:15 AM', end: '8:45 AM', startMin: 435, endMin: 525, marginType: 'high', code: '49505', revenue: 10200, supplies: 1200, implants: 1800, labor: 1350, roomCost: 2100, margin: 3750 },
  { id: 12, or: 'OR 3', label: 'Gallbladder', doctor: 'Dr. Patel', start: '9:15 AM', end: '10:45 AM', startMin: 555, endMin: 645, marginType: 'med', code: '23430', revenue: 8732, supplies: 1900, implants: 1100, labor: 1350, roomCost: 2450, margin: 3450 },
  { id: 13, or: 'OR 3', label: 'Hernia Repair', doctor: 'Dr. Patel', start: '11:15 AM', end: '12:45 PM', startMin: 675, endMin: 765, marginType: 'med', code: '49505', revenue: 10200, supplies: 2100, implants: 1800, labor: 1350, roomCost: 2100, margin: 2850 },
  { id: 14, or: 'OR 3', label: 'Appendectomy', doctor: 'Dr. Patel', start: '1:15 PM', end: '2:45 PM', startMin: 795, endMin: 885, marginType: 'med', code: '44970', revenue: 12400, supplies: 2200, implants: 2500, labor: 1350, roomCost: 3100, margin: 3250 },
  { id: 15, or: 'OR 3', label: 'Block', doctor: 'System Block', start: '3:15 PM', end: '5:00 PM', startMin: 915, endMin: 1020, marginType: 'blocked' },

  { id: 16, or: 'OR 4', label: 'Block', doctor: 'System Block', start: '7:00 AM', end: '10:00 AM', startMin: 420, endMin: 600, marginType: 'blocked' },
  { id: 17, or: 'OR 4', label: 'Spine Fusion', doctor: 'Dr. Johnson', start: '10:30 AM', end: '1:30 PM', startMin: 630, endMin: 810, marginType: 'high', code: '22612', revenue: 42800, supplies: 7500, implants: 18500, labor: 2700, roomCost: 4500, margin: 9600 },
  { id: 18, or: 'OR 4', label: 'Block', doctor: 'System Block', start: '2:00 PM', end: '5:00 PM', startMin: 840, endMin: 1020, marginType: 'blocked' },

  { id: 19, or: 'OR 5', label: 'Knee Scope', doctor: 'Dr. Smith', start: '7:30 AM', end: '8:30 AM', startMin: 450, endMin: 510, marginType: 'high', code: '29827', revenue: 12842, supplies: 3400, implants: 1819, labor: 900, roomCost: 900, margin: 5823 },
  { id: 20, or: 'OR 5', label: 'Knee Scope', doctor: 'Dr. Smith', start: '9:00 AM', end: '10:00 AM', startMin: 540, endMin: 600, marginType: 'high', code: '29827', revenue: 12842, supplies: 3400, implants: 1819, labor: 900, roomCost: 900, margin: 5823 },
  { id: 21, or: 'OR 5', label: 'Knee Scope', doctor: 'Dr. Smith', start: '10:30 AM', end: '11:30 AM', startMin: 630, endMin: 690, marginType: 'high', code: '29827', revenue: 12842, supplies: 3400, implants: 1819, labor: 900, roomCost: 900, margin: 5823 },
  { id: 22, or: 'OR 5', label: 'Knee Scope', doctor: 'Dr. Smith', start: '12:00 PM', end: '1:00 PM', startMin: 720, endMin: 780, marginType: 'high', code: '29827', revenue: 12842, supplies: 3400, implants: 1819, labor: 900, roomCost: 900, margin: 5823 },
  { id: 23, or: 'OR 5', label: 'Block', doctor: 'System Block', start: '1:30 PM', end: '5:00 PM', startMin: 810, endMin: 1020, marginType: 'blocked' },

  { id: 24, or: 'OR 6', label: 'Block / Unavailable', doctor: 'Maintenance', start: '7:00 AM', end: '5:00 PM', startMin: 420, endMin: 1020, marginType: 'blocked' }
];

const WAITLIST_CASES = [
  { id: 101, code: '29827', desc: 'Knee Scope / Arthroscopy', surgeon: 'Dr. David Smith', duration: 60, rev: 12842, supplies: 3400, implants: 1819, labor: 900, room: 900, margin: 5823 },
  { id: 102, code: '27447', desc: 'Total Knee Joint Repair', surgeon: 'Dr. Sarah Lee', duration: 90, rev: 21105, supplies: 4500, implants: 6000, labor: 1350, room: 1350, margin: 7905 },
  { id: 103, code: '63030', desc: 'Carpal Tunnel Release', surgeon: 'Dr. James Johnson', duration: 45, rev: 3420, supplies: 850, implants: 0, labor: 675, room: 675, margin: 1220 }
];

const PREFERENCE_CARDS = [
  {
    procedure: 'Knee Arthroscopy (CPT 29827)',
    standardCost: 1200,
    items: [
      { name: 'Knee Pack', qty: 1, cost: 120 },
      { name: 'Arthroscopic Blade', qty: 1, cost: 85 },
      { name: 'Disposable Cannula Set', qty: 1, cost: 145 },
      { name: 'Sutures & Anchors', qty: 2, cost: 450 },
      { name: 'Irrigation Fluid (3L)', qty: 4, cost: 80 },
      { name: 'Miscellaneous Drapes/Gowns', qty: 1, cost: 320 }
    ],
    surgeons: [
      { name: 'Dr. David Smith', actualCost: 1450, variance: 20.8, supplyItems: 8 },
      { name: 'Dr. James Johnson', actualCost: 1180, variance: -1.7, supplyItems: 5 },
      { name: 'Dr. Michael Patel', actualCost: 1620, variance: 35.0, supplyItems: 10 }
    ]
  }
];

// ==========================================
// COMPONENT: SURGEON PROFILE PAGE
// ==========================================
function SurgeonProfilePage({ surgeonName, onBack, activeProfileTab, setActiveProfileTab }) {
  const surg = MOCK_SURGEONS_DETAILS[surgeonName];
  if (!surg) {
    return (
      <div className="dashboard-card" style={{ padding: '24px', textAlign: 'center' }}>
        <h3>Surgeon profile data not found.</h3>
        <button className="btn-header" onClick={onBack} style={{ marginTop: '12px' }}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="surgeon-profile-page" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Back link */}
      <div>
        <button 
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-blue)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0'
          }}
        >
          ← Back to Surgeon Performance
        </button>
      </div>

      {/* Header Info Card */}
      <div className="surgeon-profile-header-card" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', borderRight: '1px solid var(--border-light)', paddingRight: '24px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '12px',
            backgroundImage: `url(${surg.avatar})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '2px solid var(--border-color)',
            flexShrink: 0
          }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-blue)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{surg.specialty}</span>
            <h2 style={{ fontSize: '1.25rem', color: '#fff', fontWeight: '700', margin: '2px 0 4px 0' }}>{surg.name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="status-badge active" style={{ fontSize: '0.65rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-green)', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>{surg.status}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>NPI: {surg.npi}</span>
            </div>
          </div>
        </div>

        {/* Small KPIs right side */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', alignItems: 'center' }}>
          <div className="profile-mini-kpi" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Cases Done (MTD)</span>
            <span style={{ fontSize: '1.4rem', fontWeight: '700', color: '#fff' }}>{surg.metrics.cases}</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-green)', fontWeight: '600' }}>#1 in caseload</span>
          </div>

          <div className="profile-mini-kpi" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Avg Turnover</span>
            <span style={{ fontSize: '1.4rem', fontWeight: '700', color: surg.metrics.avgTurnover > 20 ? 'var(--color-orange)' : '#fff' }}>{surg.metrics.avgTurnover} mins</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>vs facility avg 24m</span>
          </div>

          <div className="profile-mini-kpi" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Supply Variance</span>
            <span style={{ fontSize: '1.4rem', fontWeight: '700', color: surg.metrics.supplyVariance.startsWith('+') ? 'var(--color-red)' : 'var(--color-green)' }}>{surg.metrics.supplyVariance}</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Standard card base $1,200</span>
          </div>

          <div className="profile-mini-kpi" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Net Margin (MTD)</span>
            <span style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--color-green)' }}>${surg.metrics.netMargin.toLocaleString()}</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Avg ${surg.metrics.avgMargin}/case</span>
          </div>
        </div>
      </div>

      {/* Inner tabs horizontal menu */}
      <div className="subtabs-menu" style={{ marginBottom: '0' }}>
        <button className={`subtab-item ${activeProfileTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveProfileTab('overview')}>Overview</button>
        <button className={`subtab-item ${activeProfileTab === 'financials' ? 'active' : ''}`} onClick={() => setActiveProfileTab('financials')}>Financials & CPTs</button>
        <button className={`subtab-item ${activeProfileTab === 'payer' ? 'active' : ''}`} onClick={() => setActiveProfileTab('payer')}>Payer Mix</button>
        <button className={`subtab-item ${activeProfileTab === 'supply' ? 'active' : ''}`} onClick={() => setActiveProfileTab('supply')}>Supply Card Audit</button>
        <button className={`subtab-item ${activeProfileTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveProfileTab('schedule')}>OR Blocks & Cancellations</button>
        <button className={`subtab-item ${activeProfileTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveProfileTab('ai')}>AI Recommendations ({surg.aiInsights.length})</button>
      </div>

      {/* Profile Page Tab Content */}
      <div className="profile-tab-content" style={{ marginTop: '10px' }}>
        
        {/* ==========================================
            SUB-TAB: OVERVIEW
            ========================================== */}
        {activeProfileTab === 'overview' && (
          <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
            
            {/* Historical trend chart */}
            <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="card-header">
                <h3 className="card-title">Cases & Margin Trend (Jan - May)</h3>
              </div>
              <div style={{ width: '100%', height: '260px', marginTop: '10px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={surg.caseHistory} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <XAxis dataKey="name" stroke="#5e6c84" fontSize={10} tickLine={false} />
                    <YAxis yAxisId="left" stroke="var(--color-blue)" fontSize={10} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="var(--color-green)" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0d1527', borderColor: '#16223f', fontSize: '11px', color: '#fff' }} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="cases" stroke="var(--color-blue)" strokeWidth={2.5} name="Cases Done" dot={{ r: 4 }} />
                    <Line yAxisId="right" type="monotone" dataKey="margin" stroke="var(--color-green)" strokeWidth={2.5} name="Net Margin ($)" dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Operational Benchmarks */}
            <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="card-header">
                <h3 className="card-title">Operational Efficiency Benchmarks</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Benchmark 1 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Avg Procedure Duration</span>
                    <span style={{ fontWeight: '600' }}>{surg.metrics.avgDuration} mins <span style={{ color: surg.metrics.avgDuration > 64 ? 'var(--color-red)' : 'var(--color-green)', fontSize: '0.75rem' }}>({surg.metrics.avgDuration > 64 ? '+' : ''}{surg.metrics.avgDuration - 64}m vs facility avg 64m)</span></span>
                  </div>
                  <div style={{ height: '8px', width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, (surg.metrics.avgDuration / 120) * 100)}%`, backgroundColor: surg.metrics.avgDuration > 64 ? 'var(--color-orange)' : 'var(--color-green)' }} />
                    <div style={{ position: 'absolute', left: `${(64/120)*100}%`, top: '0', bottom: '0', width: '2px', backgroundColor: '#fff', opacity: '0.6' }} title="Facility Average" />
                  </div>
                </div>

                {/* Benchmark 2 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Avg Room Turnover Time</span>
                    <span style={{ fontWeight: '600' }}>{surg.metrics.avgTurnover} mins <span style={{ color: surg.metrics.avgTurnover > 24 ? 'var(--color-red)' : 'var(--color-green)', fontSize: '0.75rem' }}>({surg.metrics.avgTurnover > 24 ? '+' : ''}{surg.metrics.avgTurnover - 24}m vs facility avg 24m)</span></span>
                  </div>
                  <div style={{ height: '8px', width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, (surg.metrics.avgTurnover / 45) * 100)}%`, backgroundColor: surg.metrics.avgTurnover > 24 ? 'var(--color-red)' : 'var(--color-green)' }} />
                    <div style={{ position: 'absolute', left: `${(24/45)*100}%`, top: '0', bottom: '0', width: '2px', backgroundColor: '#fff', opacity: '0.6' }} title="Facility Average" />
                  </div>
                </div>

                {/* Benchmark 3 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>On-Time Case Start Rate</span>
                    <span style={{ fontWeight: '600' }}>{surg.metrics.onTimeStart}% <span style={{ color: surg.metrics.onTimeStart >= 88 ? 'var(--color-green)' : 'var(--color-red)', fontSize: '0.75rem' }}>(Target: 88%)</span></span>
                  </div>
                  <div style={{ height: '8px', width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ height: '100%', width: `${surg.metrics.onTimeStart}%`, backgroundColor: surg.metrics.onTimeStart >= 88 ? 'var(--color-green)' : 'var(--color-orange)' }} />
                  </div>
                </div>

                {/* Benchmark 4 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>OR Block Utilization Rate</span>
                    <span style={{ fontWeight: '600' }}>{surg.metrics.utilization}% <span style={{ color: surg.metrics.utilization >= 70 ? 'var(--color-green)' : 'var(--color-orange)', fontSize: '0.75rem' }}>(Facility avg: 62.4%)</span></span>
                  </div>
                  <div style={{ height: '8px', width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ height: '100%', width: `${surg.metrics.utilization}%`, backgroundColor: 'var(--color-blue)' }} />
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(59,130,246,0.04)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 'auto' }}>
                <span style={{ fontWeight: '700', color: '#fff' }}>Operational Summary:</span> Dr. {surg.name.split(' ').pop()} ranks in the **top 10%** for on-time starts. However, turnover overrides represent {surg.metrics.avgTurnover > 20 ? 'a secondary operational hazard' : 'optimal standards, beating facility averages by ' + (24 - surg.metrics.avgTurnover) + ' minutes'}.
              </div>
            </div>

          </div>
        )}

        {/* ==========================================
            SUB-TAB: FINANCIALS & CPTS
            ========================================== */}
        {activeProfileTab === 'financials' && (
          <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: '20px' }}>
            
            {/* Financial Ledger card */}
            <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="card-header">
                <h3 className="card-title">Monthly Ledger (MTD Details)</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8rem', padding: '10px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Total Case Revenue</span>
                  <span style={{ fontWeight: '600', color: '#fff' }}>${(surg.metrics.netMargin * 2.1).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Surgical Supplies</span>
                  <span style={{ color: 'var(--color-red)' }}>-${(surg.metrics.netMargin * 0.35).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Implant Expenditures</span>
                  <span style={{ color: 'var(--color-red)' }}>-${(surg.metrics.netMargin * 0.45).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Direct Labor Allocation</span>
                  <span style={{ color: 'var(--color-red)' }}>-${(surg.metrics.cases * surg.metrics.avgDuration * 7.5).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Overhead Facility Allocation</span>
                  <span style={{ color: 'var(--color-red)' }}>-${(surg.metrics.cases * 950).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', fontSize: '0.9rem', fontWeight: '700' }}>
                  <span style={{ color: '#fff' }}>Net Contribution Margin</span>
                  <span style={{ color: 'var(--color-green)' }}>+${surg.metrics.netMargin.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>EBITDA Margin %</span>
                  <span>{Math.round((surg.metrics.netMargin / (surg.metrics.netMargin * 2.1)) * 100)}%</span>
                </div>
              </div>
            </div>

            {/* CPT Codes Split Table */}
            <div className="dashboard-card">
              <div className="card-header">
                <h3 className="card-title">Profitability by CPT Code</h3>
              </div>
              <div className="custom-table-container" style={{ marginTop: '10px' }}>
                <table className="custom-table" style={{ fontSize: '0.75rem' }}>
                  <thead>
                    <tr>
                      <th>CPT Code</th>
                      <th>Description</th>
                      <th>Cases</th>
                      <th>Avg Duration</th>
                      <th>Contrib. Margin</th>
                      <th>Avg Margin / Case</th>
                    </tr>
                  </thead>
                  <tbody>
                    {surg.cptBreakdown.map(c => (
                      <tr key={c.code}>
                        <td style={{ fontWeight: '700' }}>{c.code}</td>
                        <td>{c.desc}</td>
                        <td>{c.cases}</td>
                        <td>{c.avgTime} mins</td>
                        <td style={{ color: 'var(--color-green)', fontWeight: '600' }}>${c.margin.toLocaleString()}</td>
                        <td style={{ fontWeight: '600' }}>${Math.round(c.margin / c.cases).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ==========================================
            SUB-TAB: PAYER MIX
            ========================================== */}
        {activeProfileTab === 'payer' && (
          <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: '20px' }}>
            
            {/* Payer Pie Chart */}
            <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="card-header" style={{ width: '100%' }}>
                <h3 className="card-title">Payer Mix Case Share</h3>
              </div>
              <div style={{ position: 'relative', width: '100%', height: '160px', marginTop: '10px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={surg.payerMix}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {surg.payerMix.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff' }}>{surg.metrics.cases}</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Cases</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '12px' }}>
                {surg.payerMix.map(item => (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: item.color }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{item.name} ({Math.round(item.value / surg.metrics.cases * 100)}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payer Profitability Table */}
            <div className="dashboard-card">
              <div className="card-header">
                <h3 className="card-title">Payer Contribution Analysis</h3>
              </div>
              <div className="custom-table-container" style={{ marginTop: '10px' }}>
                <table className="custom-table" style={{ fontSize: '0.75rem' }}>
                  <thead>
                    <tr>
                      <th>Payer Group</th>
                      <th>Cases</th>
                      <th>Estimated Revenue</th>
                      <th>Net Margin</th>
                      <th>Avg Margin %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {surg.payerMix.map(p => (
                      <tr key={p.name}>
                        <td style={{ fontWeight: '600' }}>{p.name}</td>
                        <td>{p.value}</td>
                        <td>${p.revenue.toLocaleString()}</td>
                        <td style={{ color: 'var(--color-green)', fontWeight: '600' }}>${p.margin.toLocaleString()}</td>
                        <td style={{ fontWeight: '600' }}>{Math.round(p.margin / p.revenue * 100)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ==========================================
            SUB-TAB: SUPPLY CHAIN & PREFERENCE CARDS
            ========================================== */}
        {activeProfileTab === 'supply' && (
          <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: '20px' }}>
            
            {/* Preference card audit info */}
            <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="card-header">
                <h3 className="card-title">Preference Card Variance</h3>
              </div>
              
              <div style={{ textAlign: 'center', padding: '16px 0', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Average Cost Deviation</span>
                <h2 style={{ fontSize: '2rem', fontWeight: '700', color: surg.metrics.supplyVariance.startsWith('+') ? 'var(--color-red)' : 'var(--color-green)', margin: '4px 0' }}>{surg.metrics.supplyVariance}</h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Baseline Card Standard: $1,200</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Dr. {surg.name.split(' ').pop()}\'s Avg Spend:</span>
                  <span style={{ fontWeight: '600', color: '#fff' }}>${Math.round(1200 * (1 + parseFloat(surg.metrics.supplyVariance)/100))}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Opportunity per case:</span>
                  <span style={{ color: 'var(--color-green)', fontWeight: '600' }}>
                    {parseFloat(surg.metrics.supplyVariance) > 0 ? `$${Math.round(1200 * parseFloat(surg.metrics.supplyVariance)/100)} saving` : '$0 (Optimal)'}
                  </span>
                </div>
              </div>

              <button 
                className="btn-header btn-primary" 
                style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}
                onClick={() => alert(`Standardization proposal sent to Dr. ${surg.name.split(' ').pop()}.`)}
              >
                Send Standardization Proposal
              </button>
            </div>

            {/* Itemized Waste List */}
            <div className="dashboard-card">
              <div className="card-header">
                <h3 className="card-title">Itemized Open-to-Use Waste Audit</h3>
              </div>
              <div className="custom-table-container" style={{ marginTop: '10px' }}>
                <table className="custom-table" style={{ fontSize: '0.75rem' }}>
                  <thead>
                    <tr>
                      <th>Supply Item Description</th>
                      <th>Category</th>
                      <th>Qty Opened</th>
                      <th>Qty Used</th>
                      <th>Waste Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {surg.supplyWaste.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>No significant supply waste detected.</td>
                      </tr>
                    ) : surg.supplyWaste.map((w, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: '600' }}>{w.item}</td>
                        <td>{w.type}</td>
                        <td>{w.opened}</td>
                        <td>{w.used}</td>
                        <td style={{ color: w.wasteCost > 0 ? 'var(--color-red)' : 'var(--color-green)', fontWeight: '600' }}>
                          {w.wasteCost > 0 ? `-$${w.wasteCost}` : '$0'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ==========================================
            SUB-TAB: OR BLOCKS & CANCELLATIONS
            ========================================== */}
        {activeProfileTab === 'schedule' && (
          <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '0.85fr 1.15fr', gap: '20px' }}>
            
            {/* Block utilization */}
            <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="card-header">
                <h3 className="card-title">Block Time Utilization</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Allocated Block Time</span>
                  <span style={{ fontWeight: '600' }}>40 hours</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Actual OR Time Used</span>
                  <span style={{ fontWeight: '600', color: 'var(--color-green)' }}>31.2 hours</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Wasted / Blank Slots</span>
                  <span style={{ fontWeight: '600', color: 'var(--color-red)' }}>8.8 hours</span>
                </div>
                
                <div style={{ height: '14px', width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '7px', overflow: 'hidden', display: 'flex', marginTop: '10px' }}>
                  <div style={{ height: '100%', width: '78%', backgroundColor: 'var(--color-blue)' }} title="OR Time Used (78%)" />
                  <div style={{ height: '100%', width: '22%', backgroundColor: 'var(--color-red)' }} title="Wasted Slot Time (22%)" />
                </div>
                
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.7rem', marginTop: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: 'var(--color-blue)' }} />
                    <span>Used (78%)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: 'var(--color-red)' }} />
                    <span>Wasted block (22%)</span>
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px dashed var(--color-red)', borderRadius: '6px', padding: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 'auto' }}>
                <span style={{ fontWeight: '700', color: '#fff' }}>Block Leakage Opportunity:</span> Releasing the last 2 hours of blocks on Wednesday afternoons (which are historically unused) could prevent $3,200 in staff allocation losses.
              </div>
            </div>

            {/* Cancellations Log */}
            <div className="dashboard-card">
              <div className="card-header">
                <h3 className="card-title">Cancellations & Lost Margin</h3>
              </div>
              <div className="custom-table-container" style={{ marginTop: '10px' }}>
                <table className="custom-table" style={{ fontSize: '0.75rem' }}>
                  <thead>
                    <tr>
                      <th>Cancellation Date</th>
                      <th>Scheduled CPT</th>
                      <th>Primary Reason</th>
                      <th>Lost Contribution Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {surg.recentCancellations.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '36px 0' }}>No cancellations recorded for Dr. {surg.name.split(' ').pop()} this month.</td>
                      </tr>
                    ) : surg.recentCancellations.map((c, idx) => (
                      <tr key={idx}>
                        <td>{c.date}</td>
                        <td style={{ fontWeight: '600' }}>{c.procedure}</td>
                        <td style={{ color: 'var(--color-orange)' }}>{c.reason}</td>
                        <td style={{ color: 'var(--color-red)', fontWeight: '600' }}>-${c.loss.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ==========================================
            SUB-TAB: AI INSIGHTS
            ========================================== */}
        {activeProfileTab === 'ai' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Prescriptive Practice Recommendations</h3>
            
            {surg.aiInsights.map((insight, idx) => (
              <div 
                key={insight.id} 
                style={{ 
                  display: 'flex', 
                  gap: '16px', 
                  backgroundColor: 'var(--bg-card)', 
                  border: '1px solid var(--border-color)', 
                  borderLeft: `4px solid ${insight.type === 'high' ? 'var(--color-red)' : 'var(--color-blue)'}`, 
                  borderRadius: '6px', 
                  padding: '16px' 
                }}
              >
                <div style={{ fontSize: '1.5rem' }}>{insight.icon}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '700', color: '#fff', fontSize: '0.9rem' }}>{insight.title}</span>
                    <span style={{ fontSize: '0.6rem', padding: '1px 6px', borderRadius: '3px', fontWeight: '700', textTransform: 'uppercase', backgroundColor: insight.type === 'high' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)', color: insight.type === 'high' ? 'var(--color-red)' : 'var(--color-blue)' }}>{insight.type} priority</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0' }}>{insight.desc}</p>
                </div>
                <button 
                  className="btn-header btn-primary" 
                  style={{ alignSelf: 'center', padding: '4px 12px', fontSize: '0.75rem' }}
                  onClick={() => alert(`Recommendation applied: ${insight.title}`)}
                >
                  Apply Recommendation
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

const MOCK_SPECIALTY_DIST = [
  { name: 'Orthopedics', value: 580, percentage: 38, revenue: 1102450, margin: 468450, color: 'var(--color-blue)' },
  { name: 'Ophthalmology', value: 450, percentage: 29, revenue: 327780, margin: 215630, color: 'var(--color-green)' },
  { name: 'Spine Surgery', value: 180, percentage: 12, revenue: 531200, margin: 157850, color: 'var(--color-purple)' },
  { name: 'General Surgery', value: 240, percentage: 16, revenue: 418300, margin: 142910, color: 'var(--color-orange)' },
  { name: 'Gynecology', value: 84, percentage: 5, revenue: 141020, margin: 85230, color: 'var(--color-pink)' }
];

const MOCK_EXEC_FINANCIALS_TREND = [
  { name: 'Week 1', revenue: 420000, cost: 380000, margin: 40000 },
  { name: 'Week 2', revenue: 480000, cost: 410000, margin: 70000 },
  { name: 'Week 3', revenue: 510000, cost: 460000, margin: 50000 },
  { name: 'Week 4', revenue: 488090, cost: 484826, margin: 3264 }
];

const MOCK_FACILITY_COMPARATIVE = [
  { name: 'Main ASC', cases: 856, util: 64.2, profitUtil: 52.1, revenue: 1102450, directCost: 1000936, netMargin: 101514, cancellations: 6 },
  { name: 'South ASC', cases: 392, util: 58.7, profitUtil: 48.3, revenue: 482750, directCost: 446210, netMargin: 36540, cancellations: 4 },
  { name: 'West ASC', cases: 286, util: 61.3, profitUtil: 50.2, revenue: 312890, directCost: 287680, netMargin: 25210, cancellations: 2 }
];

const MOCK_OR_ROOT_CAUSES_PIE = [
  { name: 'Late Starts', value: 32, percentage: 32, color: 'var(--color-blue)' },
  { name: 'Turnovers', value: 26, percentage: 26, color: 'var(--color-red)' },
  { name: 'Spacing Gaps', value: 22, percentage: 22, color: 'var(--color-green)' },
  { name: 'Unfilled Blocks', value: 20, percentage: 20, color: 'var(--color-orange)' }
];

const MOCK_OR_BLOCK_ALLOC_PIE = [
  { name: 'Utilized Blocks', value: 68, percentage: 68, color: 'var(--color-green)' },
  { name: 'Released Blocks', value: 18, percentage: 18, color: 'var(--color-blue)' },
  { name: 'Wasted Blocks', value: 14, percentage: 14, color: 'var(--color-red)' }
];

const MOCK_OR_TURNOVER_EFF_PIE = [
  { name: 'Optimal (<20m)', value: 55, percentage: 55, color: 'var(--color-green)' },
  { name: 'Standard (20-30m)', value: 30, percentage: 30, color: 'var(--color-blue)' },
  { name: 'Excessive (>30m)', value: 15, percentage: 15, color: 'var(--color-red)' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [surgeries, setSurgeries] = useState(INITIAL_SURGERIES);
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedSurgeon, setSelectedSurgeon] = useState(null);
  const [profileTab, setProfileTab] = useState('overview');
  
  // Schedule Optimizer Simulation State
  const [cancellationActive, setCancellationActive] = useState(true);
  const [optimizerMessage, setOptimizerMessage] = useState(
    'CANCELLATION DETECTED: OR 3 at 9:15 AM - 10:45 AM (Gallbladder - Dr. Patel) was cancelled! Margin Impact: -$3,450.'
  );
  const [showAutoSuggest, setShowAutoSuggest] = useState(false);

  // What-If Simulator state (under Revenue tab)
  const [turnoverTime, setTurnoverTime] = useState(25); // minutes
  const [supplyCostReduction, setSupplyCostReduction] = useState(0); // percentage
  const [caseVolume, setCaseVolume] = useState(0); // percentage increase

  // Base KPIs (based on image dashboard)
  const baseEbitda = 34.2;
  const baseOrUtil = 62.4;
  const baseProfitableUtil = 51.3;
  const baseRevenuePerHour = 1102;
  const baseMarginPerHour = 208;

  // Simulator KPI Outputs
  const simEbitda = (baseEbitda + (25 - turnoverTime) * 0.4 + supplyCostReduction * 0.5 + caseVolume * 0.15).toFixed(1);
  const simOrUtil = (baseOrUtil + (25 - turnoverTime) * 0.6 + caseVolume * 0.5).toFixed(1);
  const simProfitableUtil = (baseProfitableUtil + (25 - turnoverTime) * 0.8 + supplyCostReduction * 0.3 + caseVolume * 0.6).toFixed(1);
  const simRevenuePerHour = Math.round(baseRevenuePerHour + (25 - turnoverTime) * 15 + caseVolume * 8);
  const simMarginPerHour = Math.round(baseMarginPerHour + (25 - turnoverTime) * 10 + (supplyCostReduction / 100) * 120 + caseVolume * 5);
  const annualProfitImpact = Math.round(((simMarginPerHour - baseMarginPerHour) * 8 * 250) + (caseVolume / 100 * 250000));

  const handleBlockClick = (surgery) => {
    if (surgery.marginType !== 'blocked') {
      setSelectedCase(surgery);
    }
  };

  const handleSimulateResolve = (waitlistCase) => {
    setCancellationActive(false);
    setOptimizerMessage('No active cancellations. Schedule optimized.');
    
    const updatedSurgeries = surgeries.map(s => {
      if (s.id === 12) {
        return {
          ...s,
          label: waitlistCase.desc,
          doctor: waitlistCase.surgeon,
          marginType: 'high',
          code: waitlistCase.code,
          revenue: waitlistCase.rev,
          supplies: waitlistCase.supplies,
          implants: waitlistCase.implants,
          labor: waitlistCase.labor,
          roomCost: waitlistCase.room,
          margin: waitlistCase.margin,
          start: '9:15 AM',
          end: '10:45 AM'
        };
      }
      return s;
    });
    
    setSurgeries(updatedSurgeries);
    setShowAutoSuggest(false);
    alert(`Success: Replaced slot with ${waitlistCase.surgeon}'s ${waitlistCase.desc}. Revenue Impact: +$${waitlistCase.rev.toLocaleString()}, Margin: +$${waitlistCase.margin.toLocaleString()}.`);
  };

  const resetCancellationSim = () => {
    setSurgeries(INITIAL_SURGERIES);
    setCancellationActive(true);
    setOptimizerMessage('CANCELLATION DETECTED: OR 3 at 9:15 AM - 10:45 AM (Gallbladder - Dr. Patel) was cancelled! Margin Impact: -$3,450.');
  };

  return (
    <div className="app-container">
      {/* ==========================================
          SIDEBAR
          ========================================== */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">➕</div>
          <div className="logo-text">
            <span className="logo-title">ASC Profitability</span>
            <span className="logo-subtitle">Platform</span>
          </div>
        </div>

        <nav className="sidebar-menu">
          <div 
            className={`menu-item ${activeTab === 'dashboard' && !selectedSurgeon ? 'active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); setSelectedSurgeon(null); }}
          >
            <div className="menu-item-icon"><LayoutDashboard size={16} /></div>
            Command Center
          </div>
          
          <div 
            className={`menu-item ${activeTab === 'overview' && !selectedSurgeon ? 'active' : ''}`}
            onClick={() => { setActiveTab('overview'); setSelectedSurgeon(null); }}
          >
            <div className="menu-item-icon"><TrendingUp size={16} /></div>
            Executive Overview
          </div>

          <div 
            className={`menu-item ${activeTab === 'or' && !selectedSurgeon ? 'active' : ''}`}
            onClick={() => { setActiveTab('or'); setSelectedSurgeon(null); }}
          >
            <div className="menu-item-icon"><Clock size={16} /></div>
            OR Performance
          </div>

          <div 
            className={`menu-item ${(activeTab === 'surgeons' || selectedSurgeon) ? 'active' : ''}`}
            onClick={() => { setActiveTab('surgeons'); setSelectedSurgeon(null); }}
          >
            <div className="menu-item-icon"><UserCheck size={16} /></div>
            Surgeon Performance
          </div>

          <div 
            className={`menu-item ${activeTab === 'financial' && !selectedSurgeon ? 'active' : ''}`}
            onClick={() => { setActiveTab('financial'); setSelectedSurgeon(null); }}
          >
            <div className="menu-item-icon"><BarChart3 size={16} /></div>
            Financial Performance
          </div>

          <div 
            className={`menu-item ${activeTab === 'cpt' && !selectedSurgeon ? 'active' : ''}`}
            onClick={() => { setActiveTab('cpt'); setSelectedSurgeon(null); }}
          >
            <div className="menu-item-icon"><Stethoscope size={16} /></div>
            Case Profitability
          </div>

          <div 
            className={`menu-item ${activeTab === 'payer' && !selectedSurgeon ? 'active' : ''}`}
            onClick={() => { setActiveTab('payer'); setSelectedSurgeon(null); }}
          >
            <div className="menu-item-icon"><ShieldCheck size={16} /></div>
            Payer Intelligence
          </div>

          <div 
            className={`menu-item ${activeTab === 'supply' && !selectedSurgeon ? 'active' : ''}`}
            onClick={() => { setActiveTab('supply'); setSelectedSurgeon(null); }}
          >
            <div className="menu-item-icon"><Package size={16} /></div>
            Supply Chain
          </div>

          <div 
            className={`menu-item ${activeTab === 'cancellations' && !selectedSurgeon ? 'active' : ''}`}
            onClick={() => { setActiveTab('cancellations'); setSelectedSurgeon(null); }}
          >
            <div className="menu-item-icon"><XCircle size={16} /></div>
            Cancellations
          </div>

          <div 
            className={`menu-item ${activeTab === 'reports' && !selectedSurgeon ? 'active' : ''}`}
            onClick={() => { setActiveTab('reports'); setSelectedSurgeon(null); }}
          >
            <div className="menu-item-icon"><BookOpen size={16} /></div>
            Reports & Analytics
          </div>

          <div 
            className={`menu-item ${activeTab === 'ai' && !selectedSurgeon ? 'active' : ''}`}
            onClick={() => { setActiveTab('ai'); setSelectedSurgeon(null); }}
          >
            <div className="menu-item-icon"><Sparkles size={16} /></div>
            AI Insights
          </div>

          <div 
            className={`menu-item ${activeTab === 'data' && !selectedSurgeon ? 'active' : ''}`}
            onClick={() => { setActiveTab('data'); setSelectedSurgeon(null); }}
          >
            <div className="menu-item-icon"><Database size={16} /></div>
            Data Explorer
          </div>

          <div 
            className={`menu-item ${activeTab === 'settings' && !selectedSurgeon ? 'active' : ''}`}
            onClick={() => { setActiveTab('settings'); setSelectedSurgeon(null); }}
          >
            <div className="menu-item-icon"><Settings size={16} /></div>
            Settings
          </div>

          <div 
            className={`menu-item ${activeTab === 'help' && !selectedSurgeon ? 'active' : ''}`}
            onClick={() => { setActiveTab('help'); setSelectedSurgeon(null); }}
          >
            <div className="menu-item-icon"><HelpCircle size={16} /></div>
            Help & Support
          </div>
        </nav>

        <div className="sidebar-profile">
          <div className="profile-avatar"></div>
          <div className="profile-info">
            <span className="profile-name">Jonathan Smith</span>
            <span className="profile-role">COO</span>
          </div>
        </div>
      </aside>

      {/* ==========================================
          MAIN WORKSPACE
          ========================================== */}
      <main className="main-content">
        <header className="main-header">
          <div className="header-title-area">
            <h1 className="header-title">
              {selectedSurgeon ? `Surgeon Profile: ${selectedSurgeon}` : (
                <>
                  {activeTab === 'dashboard' && 'ASC Command Center'}
                  {activeTab === 'overview' && 'Executive Overview'}
                  {activeTab === 'or' && 'OR Performance'}
                  {activeTab === 'surgeons' && 'Surgeon Performance'}
                  {activeTab === 'financial' && 'Financial Performance'}
                  {activeTab === 'cpt' && 'Case Profitability'}
                  {activeTab === 'payer' && 'Payer Intelligence'}
                  {activeTab === 'supply' && 'Supply Chain'}
                  {activeTab === 'cancellations' && 'Cancellations'}
                  {activeTab === 'reports' && 'Reports & Analytics'}
                  {activeTab === 'ai' && 'AI Insights'}
                  {activeTab === 'data' && 'Data Explorer'}
                  {activeTab === 'settings' && 'System Configuration Settings'}
                  {activeTab === 'help' && 'Help & Support'}
                </>
              )}
            </h1>
            <span className="header-subtitle">
              {selectedSurgeon ? '360° clinical operational, preference cards, payer mix, and margin analysis dashboard' : (
                <>
                  {activeTab === 'dashboard' && 'Real-time operational and financial intelligence for ambulatory surgery centers'}
                  {activeTab === 'overview' && 'Strategic summaries of health system indicators'}
                  {activeTab === 'or' && 'Deep-dive into room allocation, turnover times, and block wastage'}
                  {activeTab === 'surgeons' && 'Caseloads, turnover performance, and financial contribution by surgeon'}
                  {activeTab === 'financial' && 'Analysis of revenues, expenses, EBITDA margins, and bottom lines'}
                  {activeTab === 'cpt' && 'Contribution margins, procedure times, and volumes by CPT code'}
                  {activeTab === 'payer' && 'Payer mix contribution margins and reimbursement analytics'}
                  {activeTab === 'supply' && 'Supply variance tracking and preference card standardization tools'}
                  {activeTab === 'cancellations' && 'Cancellations tracking, revenue leak analysis, and predictive risk analysis'}
                  {activeTab === 'reports' && 'Standard financial and operational reports export'}
                  {activeTab === 'ai' && 'Prescriptive actions powered by the ASC Recommendation Engine'}
                  {activeTab === 'data' && 'Ad-hoc data querying and reports builder'}
                  {activeTab === 'settings' && 'Manage operational baseline costs, roles, and integrations'}
                  {activeTab === 'help' && 'Support desk and user guides'}
                </>
              )}
            </span>
          </div>

          <div className="header-actions">
            <div className="date-range-selector">
              <span>📅</span> May 1 – May 29, 2026 (MTD)
            </div>
            <button className="btn-header"><Filter size={16} /> Filters</button>
            <button className="btn-header btn-primary"><Download size={16} /> Export</button>
          </div>
        </header>

        <section className="page-body">
          {selectedSurgeon ? (
            <SurgeonProfilePage 
              surgeonName={selectedSurgeon} 
              onBack={() => setSelectedSurgeon(null)} 
              activeProfileTab={profileTab}
              setActiveProfileTab={setProfileTab}
            />
          ) : (
            <>
          {/* ==========================================
              TAB: ASC COMMAND CENTER (MTD CORE)
              ========================================== */}
          {activeTab === 'dashboard' && (
            <>
              {/* 6 KPI Cards Row */}
              <div className="kpi-row">
                <div className="kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-label">EBITDA %</span>
                    <div className="kpi-icon-container blue"><DollarSign size={12} /></div>
                  </div>
                  <span className="kpi-value" style={{ color: 'var(--color-red)' }}>-18.9%</span>
                  <div className="kpi-trend negative">
                    vs Prior MTD <span className="kpi-trend-change">-6.2%</span>
                  </div>
                  <div className="sparkline-container">
                    <svg viewBox="0 0 100 30" width="100%" height="100%" preserveAspectRatio="none">
                      <path d="M0,5 L20,10 L40,8 L60,18 L80,22 L100,28" fill="none" stroke="var(--color-red)" strokeWidth="2" />
                    </svg>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-label">OR Utilization</span>
                    <div className="kpi-icon-container blue"><Clock size={12} /></div>
                  </div>
                  <span className="kpi-value">62.4%</span>
                  <div className="kpi-trend positive">
                    vs Prior MTD <span className="kpi-trend-change">58.7%</span>
                  </div>
                  <div className="sparkline-container">
                    <svg viewBox="0 0 100 30" width="100%" height="100%" preserveAspectRatio="none">
                      <path d="M0,25 Q15,10 30,22 T60,8 T90,12 T100,5" fill="none" stroke="var(--color-blue)" strokeWidth="2" />
                    </svg>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-label">Profitable Utilization</span>
                    <div className="kpi-icon-container green"><TrendingUp size={12} /></div>
                  </div>
                  <span className="kpi-value">51.3%</span>
                  <div className="kpi-trend positive">
                    vs Prior MTD <span className="kpi-trend-change">46.1%</span>
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
                  <span className="kpi-value">$1,102</span>
                  <div className="kpi-trend positive">
                    vs Prior MTD <span className="kpi-trend-change">$1,045</span>
                  </div>
                  <div className="sparkline-container">
                    <svg viewBox="0 0 100 30" width="100%" height="100%" preserveAspectRatio="none">
                      <path d="M0,28 L30,24 L60,18 L100,10" fill="none" stroke="var(--color-green)" strokeWidth="2" />
                    </svg>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-label">Margin per OR Hour</span>
                    <div className="kpi-icon-container green"><TrendingUp size={12} /></div>
                  </div>
                  <span className="kpi-value" style={{ color: 'var(--color-red)' }}>$208</span>
                  <div className="kpi-trend negative">
                    vs Prior MTD <span className="kpi-trend-change">$162</span>
                  </div>
                  <div className="sparkline-container">
                    <svg viewBox="0 0 100 30" width="100%" height="100%" preserveAspectRatio="none">
                      <path d="M0,10 L30,12 L60,22 L100,28" fill="none" stroke="var(--color-red)" strokeWidth="2" />
                    </svg>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-label">Avg Turnover (mins)</span>
                    <div className="kpi-icon-container orange"><Clock size={12} /></div>
                  </div>
                  <span className="kpi-value">24</span>
                  <div className="kpi-trend positive">
                    vs Prior MTD <span className="kpi-trend-change">28</span>
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
                <button className="subtab-item active" onClick={() => setActiveTab('dashboard')}>Overview</button>
                <button className="subtab-item" onClick={() => setActiveTab('or')}>OR Performance</button>
                <button className="subtab-item" onClick={() => setActiveTab('surgeons')}>Surgeon Performance</button>
                <button className="subtab-item" onClick={() => setActiveTab('financial')}>Financial Performance</button>
                <button className="subtab-item" onClick={() => setActiveTab('cpt')}>Case Profitability</button>
                <button className="subtab-item" onClick={() => setActiveTab('cancellations')}>Cancellations</button>
                <button className="subtab-item" onClick={() => setActiveTab('supply')}>Supply Chain</button>
                <button className="subtab-item" onClick={() => setActiveTab('ai')}>AI Insights</button>
              </div>

              {/* Middle Section: Trend, Surgeon and Case Donut Grid */}
              <div className="three-column-row">
                
                {/* OR Utilization Trend */}
                <div className="dashboard-card">
                  <div className="card-header">
                    <h3 className="card-title">OR Utilization Trend</h3>
                  </div>
                  <div style={{ width: '100%', height: '220px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={MOCK_OR_UTIL_TREND} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="#5e6c84" fontSize={10} tickLine={false} />
                        <YAxis stroke="#5e6c84" fontSize={10} domain={[0, 100]} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#0d1527', borderColor: '#16223f', fontSize: '11px', color: '#fff' }} />
                        <Line type="monotone" dataKey="util" stroke="var(--color-blue)" strokeWidth={2.5} name="OR Utilization %" dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="profUtil" stroke="var(--color-green)" strokeWidth={2} name="Profitable Utilization %" dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Surgeon Performance */}
                <div className="dashboard-card">
                  <div className="card-header">
                    <h3 className="card-title">Surgeon Performance (MTD)</h3>
                  </div>
                  <div style={{ width: '100%', height: '220px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={MOCK_SURGEON_PERF} layout="vertical" margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <XAxis type="number" stroke="#5e6c84" fontSize={9} tickLine={false} />
                        <YAxis dataKey="name" type="category" stroke="#5e6c84" fontSize={9} width={80} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#0d1527', borderColor: '#16223f', fontSize: '10px', color: '#fff' }} />
                        <Bar 
                          dataKey="netMargin" 
                          fill="var(--color-blue)" 
                          radius={[0, 4, 4, 0]} 
                          name="Net Margin $" 
                          onClick={(data) => {
                            if (data && data.name) {
                              setSelectedSurgeon(data.name);
                              setProfileTab('overview');
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Case Profitability Distribution Donut */}
                <div className="dashboard-card">
                  <div className="card-header">
                    <h3 className="card-title">Case Profitability Distribution</h3>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr', gap: '8px', height: '220px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '100%', height: '140px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={MOCK_CASE_DIST}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={60}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {MOCK_CASE_DIST.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                        <div style={{ fontSize: '1rem', fontWeight: '700', color: '#fff' }}>1,248</div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Total Cases</div>
                      </div>
                    </div>

                    <div className="donut-legend-container">
                      {MOCK_CASE_DIST.map((item, idx) => (
                        <div className="donut-legend-item" key={idx}>
                          <div className="donut-legend-label">
                            <div className="donut-legend-color" style={{ backgroundColor: item.color }} />
                            <span style={{ fontSize: '0.65rem' }}>{item.name.split(' ')[0]}</span>
                          </div>
                          <div className="donut-legend-value">
                            <span>{item.value}</span>
                            <span className="donut-legend-pct">{item.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Lower Section: Supply cost breakdown, AI suggestions and Cancellation Insights */}
              <div className="three-column-row">
                
                {/* Supply Cost Breakdown */}
                <div className="dashboard-card">
                  <div className="card-header">
                    <h3 className="card-title">Supply Cost Breakdown (MTD)</h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '8px', height: '200px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '100%', height: '130px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={MOCK_SUPPLY_BREAKDOWN}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={55}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {MOCK_SUPPLY_BREAKDOWN.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>$329.7k</div>
                        <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)' }}>Total Cost</div>
                      </div>
                    </div>

                    <div className="donut-legend-container">
                      {MOCK_SUPPLY_BREAKDOWN.map((item, idx) => (
                        <div className="donut-legend-item" key={idx}>
                          <div className="donut-legend-label">
                            <div className="donut-legend-color" style={{ backgroundColor: item.color }} />
                            <span style={{ fontSize: '0.65rem' }}>{item.name}</span>
                          </div>
                          <div className="donut-legend-value">
                            <span className="donut-legend-pct">{item.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <a className="card-link" href="#" style={{ fontSize: '0.7rem', marginTop: '4px' }} onClick={(e) => { e.preventDefault(); setActiveTab('supply'); }}>View Supply Chain Analytics →</a>
                </div>

                {/* AI Recommendations */}
                <div className="dashboard-card">
                  <div className="card-header">
                    <h3 className="card-title"><Sparkles size={14} className="text-blue" /> AI Recommendations</h3>
                    <span className="ai-badge">3 New</span>
                  </div>

                  <div className="ai-recommendations-list" style={{ display: 'flex', flexDirection: 'column', gap: '2px', height: '180px', overflowY: 'auto' }}>
                    <div className="ai-recommendation-item">
                      <span className="ai-rec-icon">⚡</span>
                      <div className="ai-rec-details">
                        <div className="ai-rec-header">
                          Optimize Block Utilization
                          <span className="ai-rec-impact high">High Impact</span>
                        </div>
                        <span className="ai-rec-desc">3 OR blocks show &lt; 50% utilization. Potential to add 12-15 cases.</span>
                        <span className="ai-rec-est">Est. Impact: $18,400 monthly</span>
                      </div>
                    </div>

                    <div className="ai-recommendation-item">
                      <span className="ai-rec-icon">💲</span>
                      <div className="ai-rec-details">
                        <div className="ai-rec-header">
                          Review Supply Costs
                          <span className="ai-rec-impact med">Medium Impact</span>
                        </div>
                        <span className="ai-rec-desc">Implant costs up 12% vs prior month for similar cases.</span>
                        <span className="ai-rec-est">Est. Impact: $8,200 monthly</span>
                      </div>
                    </div>

                    <div className="ai-recommendation-item">
                      <span className="ai-rec-icon">⏳</span>
                      <div className="ai-rec-details">
                        <div className="ai-rec-header">
                          Reduce Turnover Time
                          <span className="ai-rec-impact med">Medium Impact</span>
                        </div>
                        <span className="ai-rec-desc">3 ORs have turnover &gt; 30 mins. Best practice: 20-25 mins.</span>
                        <span className="ai-rec-est">Est. Impact: $14,600 monthly</span>
                      </div>
                    </div>
                  </div>
                  <a className="card-link" href="#" style={{ fontSize: '0.7rem', marginTop: '4px' }} onClick={(e) => { e.preventDefault(); setActiveTab('ai'); }}>View All Recommendations →</a>
                </div>

                {/* Cancellation Recovery Insights */}
                <div className="dashboard-card">
                  <div className="card-header">
                    <h3 className="card-title">Cancellation Recovery Insights</h3>
                  </div>

                  <div className="cancel-recovery-header">
                    <div className="cancel-stat-box">
                      <span className="cancel-stat-num">12</span>
                      <span className="cancel-stat-label">Cancelled Cases (MTD)</span>
                      <span className="cancel-stat-comparison">vs Prior MTD 8</span>
                    </div>
                    <div className="cancel-stat-box">
                      <span className="cancel-stat-num" style={{ color: 'var(--color-green)' }}>$24,850</span>
                      <span className="cancel-stat-label">Revenue Impact</span>
                      <span className="cancel-stat-comparison">vs Prior MTD $16,200</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div className="cancel-progress-row">
                      <div className="cancel-progress-labels">
                        <span className="cancel-progress-name">Patient Decision (42%)</span>
                        <span className="cancel-progress-val">$10,450</span>
                      </div>
                      <div className="cancel-progress-bar-container">
                        <div className="cancel-progress-bar-fill" style={{ width: '42%' }} />
                      </div>
                    </div>

                    <div className="cancel-progress-row">
                      <div className="cancel-progress-labels">
                        <span className="cancel-progress-name">Insurance Issues (25%)</span>
                        <span className="cancel-progress-val">$6,200</span>
                      </div>
                      <div className="cancel-progress-bar-container">
                        <div className="cancel-progress-bar-fill" style={{ width: '25%' }} />
                      </div>
                    </div>

                    <div className="cancel-progress-row">
                      <div className="cancel-progress-labels">
                        <span className="cancel-progress-name">Medical Clearance (17%)</span>
                        <span className="cancel-progress-val">$4,100</span>
                      </div>
                      <div className="cancel-progress-bar-container">
                        <div className="cancel-progress-bar-fill" style={{ width: '17%' }} />
                      </div>
                    </div>
                  </div>
                  <a className="card-link" href="#" style={{ fontSize: '0.7rem', marginTop: '6px' }} onClick={(e) => { e.preventDefault(); setActiveTab('cancellations'); }}>View Cancellation Analytics →</a>
                </div>

              </div>

              {/* Bottom Table: Profitability Summary */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3 className="card-title">Profitability Summary (MTD)</h3>
                  <span className="card-subtitle-note">Last updated: May 29, 2026 8:30 AM</span>
                </div>

                <div className="custom-table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Location</th>
                        <th>Cases</th>
                        <th>Revenue</th>
                        <th>Total Costs</th>
                        <th>Net Margin $</th>
                        <th>Net Margin %</th>
                        <th>OR Utilization %</th>
                        <th>Profitable Util %</th>
                        <th>Rev per OR Hour</th>
                        <th>Margin per OR Hour</th>
                        <th>Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_PROFITABILITY_SUMMARY.map(sum => (
                        <tr key={sum.location}>
                          <td style={{ fontWeight: '600' }}>{sum.location}</td>
                          <td>{sum.cases}</td>
                          <td>${sum.rev.toLocaleString()}</td>
                          <td>${sum.cost.toLocaleString()}</td>
                          <td style={{ color: 'var(--color-green)', fontWeight: '600' }}>${sum.margin.toLocaleString()}</td>
                          <td>{sum.marginPct}%</td>
                          <td>{sum.util}%</td>
                          <td>{sum.profUtil}%</td>
                          <td>${sum.revHour.toLocaleString()}</td>
                          <td>${sum.marginHour.toLocaleString()}</td>
                          <td><span style={{ color: 'var(--color-green)' }}>▲</span></td>
                        </tr>
                      ))}
                      <tr className="total-row">
                        <td>Total</td>
                        <td>1,534</td>
                        <td>$1,898,090</td>
                        <td>$1,734,826</td>
                        <td style={{ color: 'var(--color-green)' }}>$163,264</td>
                        <td>8.6%</td>
                        <td>62.4%</td>
                        <td>51.3%</td>
                        <td>$1,102</td>
                        <td>$208</td>
                        <td><span style={{ color: 'var(--color-green)' }}>▲</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ==========================================
              TAB: EXECUTIVE OVERVIEW
              ========================================== */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* 4 KPI Cards Row */}
              <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-label">Net Revenue (MTD)</span>
                    <div className="kpi-icon-container blue"><DollarSign size={12} /></div>
                  </div>
                  <span className="kpi-value">$1,898,090</span>
                  <div className="kpi-trend positive">
                    vs Target MTD <span className="kpi-trend-change">+4.2%</span>
                  </div>
                  <div className="sparkline-container">
                    <svg viewBox="0 0 100 30" width="100%" height="100%" preserveAspectRatio="none">
                      <path d="M0,28 L30,22 L60,14 L100,5" fill="none" stroke="var(--color-green)" strokeWidth="2" />
                    </svg>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-label">Operating Margin</span>
                    <div className="kpi-icon-container green"><TrendingUp size={12} /></div>
                  </div>
                  <span className="kpi-value">$163,264</span>
                  <div className="kpi-trend positive">
                    Margin Ratio <span className="kpi-trend-change">8.6%</span>
                  </div>
                  <div className="sparkline-container">
                    <svg viewBox="0 0 100 30" width="100%" height="100%" preserveAspectRatio="none">
                      <path d="M0,25 Q30,12 60,18 T100,8" fill="none" stroke="var(--color-green)" strokeWidth="2" />
                    </svg>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-label">Avg Contribution / Case</span>
                    <div className="kpi-icon-container blue"><Stethoscope size={12} /></div>
                  </div>
                  <span className="kpi-value">$1,237</span>
                  <div className="kpi-trend negative">
                    vs Last Month <span className="kpi-trend-change">-1.2%</span>
                  </div>
                  <div className="sparkline-container">
                    <svg viewBox="0 0 100 30" width="100%" height="100%" preserveAspectRatio="none">
                      <path d="M0,10 L35,15 L70,25 L100,28" fill="none" stroke="var(--color-red)" strokeWidth="2" />
                    </svg>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-label">EBITDA %</span>
                    <div className="kpi-icon-container orange"><DollarSign size={12} /></div>
                  </div>
                  <span className="kpi-value">34.2%</span>
                  <div className="kpi-trend positive">
                    vs Target MTD <span className="kpi-trend-change">+1.5%</span>
                  </div>
                  <div className="sparkline-container">
                    <svg viewBox="0 0 100 30" width="100%" height="100%" preserveAspectRatio="none">
                      <path d="M0,25 Q15,10 40,22 T80,8 T100,5" fill="none" stroke="var(--color-blue)" strokeWidth="2" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Grid Section: Weekly Financial Trends vs Specialty Splits */}
              <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
                
                {/* Financial Trends combination chart */}
                <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="card-header">
                    <h3 className="card-title">Weekly Revenue, Costs & Margin</h3>
                  </div>
                  <div style={{ width: '100%', height: '240px', marginTop: '10px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={MOCK_EXEC_FINANCIALS_TREND} margin={{ top: 10, right: 5, left: -20, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="#5e6c84" fontSize={10} tickLine={false} />
                        <YAxis stroke="#5e6c84" fontSize={10} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#0d1527', borderColor: '#16223f', fontSize: '11px', color: '#fff' }} />
                        <Legend />
                        <Bar dataKey="revenue" fill="var(--color-blue)" name="Gross Revenue" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="cost" fill="var(--color-grey)" name="Operating Costs" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Specialty Case Distribution Donut */}
                <div className="dashboard-card">
                  <div className="card-header">
                    <h3 className="card-title">Specialty Case Distribution</h3>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr', gap: '8px', height: '240px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '100%', height: '140px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={MOCK_SPECIALTY_DIST}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={60}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {MOCK_SPECIALTY_DIST.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>1,534</div>
                        <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)' }}>Total Cases</div>
                      </div>
                    </div>

                    <div className="donut-legend-container">
                      {MOCK_SPECIALTY_DIST.map((item, idx) => (
                        <div className="donut-legend-item" key={idx}>
                          <div className="donut-legend-label">
                            <div className="donut-legend-color" style={{ backgroundColor: item.color }} />
                            <span style={{ fontSize: '0.65rem' }}>{item.name}</span>
                          </div>
                          <div className="donut-legend-value">
                            <span>{item.value}</span>
                            <span className="donut-legend-pct">{item.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* AI Strategic briefing panel */}
              <div 
                style={{ 
                  backgroundColor: 'rgba(59, 130, 246, 0.05)', 
                  border: '1px solid var(--border-color)', 
                  borderLeft: '4px solid var(--color-blue)',
                  borderRadius: '8px', 
                  padding: '16px 20px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ color: 'var(--color-blue)', fontSize: '1.5rem' }}>
                    <Sparkles />
                  </div>
                  <div>
                    <h4 style={{ fontWeight: '700', color: '#fff', fontSize: '0.9rem' }}>
                      Executive Strategic Action Brief
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: '1.3' }}>
                      1. Orthopedic implant card consolidation shows <strong>$45,000 savings opportunity</strong>.<br />
                      2. West ASC has turnover times averaging 24m (facility target is 20m). Corrective staffing is requested.<br />
                      3. Pre-authorization backlog indicates high cancellation hazard for next week.
                    </p>
                  </div>
                </div>
                <button 
                  className="btn-header btn-primary"
                  onClick={() => { setActiveTab('ai'); alert('Navigated to AI Prescriptive Action Center.'); }}
                >
                  Go to Action Hub
                </button>
              </div>

              {/* Facility Comparative Scoreboard table */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3 className="card-title">ASC Facility Scorecard</h3>
                  <span className="card-subtitle-note">Last updated: May 29, 2026</span>
                </div>

                <div className="custom-table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Facility Location</th>
                        <th>Completed Cases</th>
                        <th>OR Utilization %</th>
                        <th>Profitable Util %</th>
                        <th>Gross Revenue</th>
                        <th>Direct Cost</th>
                        <th>Net Margin</th>
                        <th>Cancellations</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_FACILITY_COMPARATIVE.map(facility => (
                        <tr key={facility.name}>
                          <td style={{ fontWeight: '600' }}>{facility.name}</td>
                          <td>{facility.cases}</td>
                          <td>{facility.util}%</td>
                          <td>{facility.profitUtil}%</td>
                          <td>${facility.revenue.toLocaleString()}</td>
                          <td>${facility.directCost.toLocaleString()}</td>
                          <td style={{ color: 'var(--color-green)', fontWeight: '600' }}>${facility.netMargin.toLocaleString()}</td>
                          <td style={{ color: facility.cancellations > 4 ? 'var(--color-red)' : 'var(--text-primary)' }}>{facility.cancellations} cases</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ==========================================
              TAB: OR PERFORMANCE
              ========================================== */}
          {activeTab === 'or' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="kpi-card">
                  <span className="kpi-label">Average Turnover Time</span>
                  <span className="kpi-value">22 mins</span>
                  <span className="kpi-trend positive">↗ -3 mins vs last month</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Block Time Leakage</span>
                  <span className="kpi-value">14.2 hrs</span>
                  <span className="kpi-trend negative">↘ +1.2 hrs wastage</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Gaps Detected (&gt;30m)</span>
                  <span className="kpi-value">8 Gaps</span>
                  <span className="kpi-trend positive">↗ Reduced from 12</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Overtime Hours</span>
                  <span className="kpi-value">3.5 hrs</span>
                  <span className="kpi-trend positive">↗ -2.1 hrs overtime</span>
                </div>
              </div>

              <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
                <div className="dashboard-card">
                  <div className="card-header">
                    <h3 className="card-title">Room Utilization % by OR</h3>
                  </div>
                  <div style={{ height: '240px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '20px 0' }}>
                    {[
                      { room: 'OR 1', val: 86, color: 'var(--color-blue)' },
                      { room: 'OR 2', val: 79, color: 'var(--color-blue)' },
                      { room: 'OR 3', val: 82, color: 'var(--color-blue)' },
                      { room: 'OR 4', val: 71, color: 'var(--color-green)' },
                      { room: 'OR 5', val: 88, color: 'var(--color-blue)' },
                      { room: 'OR 6', val: 12, color: 'var(--color-red)' }
                    ].map(item => (
                      <div key={item.room} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', height: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-end', height: '180px', width: '32px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: `${item.val}%`, width: '100%', backgroundColor: item.color }} />
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>{item.room}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.val}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="dashboard-card">
                  <div className="card-header">
                    <h3 className="card-title">Under-Utilization Root Causes</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>Late Starts (Surgeon delay)</span>
                      <span style={{ fontWeight: '600' }}>32%</span>
                    </div>
                    <div style={{ height: '8px', width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '32%', backgroundColor: 'var(--color-blue)' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>Turnover Overruns (Staff/Clean)</span>
                      <span style={{ fontWeight: '600' }}>26%</span>
                    </div>
                    <div style={{ height: '8px', width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '26%', backgroundColor: 'var(--color-blue)' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>Short Case Spacing Gaps</span>
                      <span style={{ fontWeight: '600' }}>22%</span>
                    </div>
                    <div style={{ height: '8px', width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '22%', backgroundColor: 'var(--color-green)' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>Unfilled Block Time</span>
                      <span style={{ fontWeight: '600' }}>20%</span>
                    </div>
                    <div style={{ height: '8px', width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '20%', backgroundColor: 'var(--color-orange)' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Visual Pie / Donut Charts for Operational Performance */}
              <div className="three-column-row">
                
                {/* Under-Utilization Root Causes Pie */}
                <div className="dashboard-card">
                  <div className="card-header">
                    <h3 className="card-title">Root Cause Distribution</h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr', gap: '8px', height: '200px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '100%', height: '130px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Tooltip contentStyle={{ backgroundColor: '#0d1527', borderColor: '#16223f', fontSize: '10px', color: '#fff' }} />
                          <Pie
                            data={MOCK_OR_ROOT_CAUSES_PIE}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={55}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {MOCK_OR_ROOT_CAUSES_PIE.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>100%</div>
                        <div style={{ fontSize: '0.5rem', color: 'var(--text-secondary)' }}>Delays</div>
                      </div>
                    </div>

                    <div className="donut-legend-container">
                      {MOCK_OR_ROOT_CAUSES_PIE.map((item, idx) => (
                        <div className="donut-legend-item" key={idx}>
                          <div className="donut-legend-label">
                            <div className="donut-legend-color" style={{ backgroundColor: item.color }} />
                            <span style={{ fontSize: '0.65rem' }}>{item.name}</span>
                          </div>
                          <div className="donut-legend-value">
                            <span className="donut-legend-pct">{item.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* OR Block Allocation Donut */}
                <div className="dashboard-card">
                  <div className="card-header">
                    <h3 className="card-title">OR Block Allocations</h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr', gap: '8px', height: '200px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '100%', height: '130px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Tooltip contentStyle={{ backgroundColor: '#0d1527', borderColor: '#16223f', fontSize: '10px', color: '#fff' }} />
                          <Pie
                            data={MOCK_OR_BLOCK_ALLOC_PIE}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={55}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {MOCK_OR_BLOCK_ALLOC_PIE.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#fff' }}>14.2h</div>
                        <div style={{ fontSize: '0.5rem', color: 'var(--text-secondary)' }}>Leakage</div>
                      </div>
                    </div>

                    <div className="donut-legend-container">
                      {MOCK_OR_BLOCK_ALLOC_PIE.map((item, idx) => (
                        <div className="donut-legend-item" key={idx}>
                          <div className="donut-legend-label">
                            <div className="donut-legend-color" style={{ backgroundColor: item.color }} />
                            <span style={{ fontSize: '0.65rem' }}>{item.name}</span>
                          </div>
                          <div className="donut-legend-value">
                            <span className="donut-legend-pct">{item.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Turnover Efficiency splits Pie */}
                <div className="dashboard-card">
                  <div className="card-header">
                    <h3 className="card-title">Turnover Efficiency Splits</h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr', gap: '8px', height: '200px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '100%', height: '130px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Tooltip contentStyle={{ backgroundColor: '#0d1527', borderColor: '#16223f', fontSize: '10px', color: '#fff' }} />
                          <Pie
                            data={MOCK_OR_TURNOVER_EFF_PIE}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={55}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {MOCK_OR_TURNOVER_EFF_PIE.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>22m</div>
                        <div style={{ fontSize: '0.5rem', color: 'var(--text-secondary)' }}>Avg Time</div>
                      </div>
                    </div>

                    <div className="donut-legend-container">
                      {MOCK_OR_TURNOVER_EFF_PIE.map((item, idx) => (
                        <div className="donut-legend-item" key={idx}>
                          <div className="donut-legend-label">
                            <div className="donut-legend-color" style={{ backgroundColor: item.color }} />
                            <span style={{ fontSize: '0.65rem' }}>{item.name}</span>
                          </div>
                          <div className="donut-legend-value">
                            <span className="donut-legend-pct">{item.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ==========================================
              TAB: SURGEON PERFORMANCE
              ========================================== */}
          {activeTab === 'surgeons' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="dashboard-card">
                <div className="card-header">
                  <h3 className="card-title">Surgeon Efficiency & Financial Contribution</h3>
                  <button className="btn-header">Print Reports</button>
                </div>

                <div className="custom-table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Surgeon</th>
                        <th>Cases Done</th>
                        <th>Avg Procedure Duration</th>
                        <th>Avg Turnover Time</th>
                        <th>Supply Variance</th>
                        <th>Total Revenue</th>
                        <th>Total Supplies</th>
                        <th>Net Margin Contribution</th>
                        <th>Avg Margin / Case</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'Dr. David Smith', cases: 48, proced: '68 mins', turn: '18 mins', variance: '+18.4%', rev: 616416, supply: 163200, margin: 263450, avg: 5488, color: '#3b82f6' },
                        { name: 'Dr. Sarah Lee', cases: 36, proced: '52 mins', turn: '14 mins', variance: '-2.1%', rev: 327780, supply: 34200, margin: 215630, avg: 5989, color: '#10b981' },
                        { name: 'Dr. Michael Patel', cases: 41, proced: '88 mins', turn: '24 mins', variance: '+31.2%', rev: 418300, supply: 122100, margin: 142910, avg: 3485, color: '#f59e0b' },
                        { name: 'Dr. James Johnson', cases: 28, proced: '110 mins', turn: '29 mins', variance: '+8.4%', rev: 531200, supply: 184500, margin: 157850, avg: 5637, color: '#8b5cf6' },
                        { name: 'Dr. Emily Davis', cases: 31, proced: '48 mins', turn: '16 mins', variance: '+12.6%', rev: 141020, supply: 32000, margin: 85230, avg: 2749, color: '#ec4899' }
                      ].map(surg => (
                        <tr 
                          key={surg.name}
                          onClick={() => { setSelectedSurgeon(surg.name); setProfileTab('overview'); }}
                          style={{ cursor: 'pointer' }}
                          className="clickable-row"
                        >
                          <td>
                            <div className="doctor-avatar-row">
                              <div className="doctor-tiny-avatar" style={{ backgroundColor: surg.color }}></div>
                              <span style={{ fontWeight: '600', color: 'var(--color-blue)' }}>{surg.name}</span>
                            </div>
                          </td>
                          <td>{surg.cases}</td>
                          <td>{surg.proced}</td>
                          <td style={{ color: parseInt(surg.turn) > 20 ? 'var(--color-orange)' : 'var(--text-primary)' }}>{surg.turn}</td>
                          <td style={{ color: surg.variance.startsWith('+') ? 'var(--color-red)' : 'var(--color-green)', fontWeight: '600' }}>
                            {surg.variance}
                          </td>
                          <td>${surg.rev.toLocaleString()}</td>
                          <td>${surg.supply.toLocaleString()}</td>
                          <td style={{ color: 'var(--color-green)', fontWeight: '700' }}>${surg.margin.toLocaleString()}</td>
                          <td style={{ fontWeight: '600' }}>${surg.avg.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB: FINANCIAL PERFORMANCE
              ========================================== */}
          {activeTab === 'financial' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="dashboard-card">
                <div className="card-header">
                  <h3 className="card-title">Facility Financial Analytics</h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Visual ledger summaries of monthly expenditures, room utility margins, and net EBITDA profit indicators.
                </p>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB: CASE PROFITABILITY
              ========================================== */}
          {activeTab === 'cpt' && (
            <div className="dashboard-card">
              <div className="card-header">
                <h3 className="card-title">Ambulatory Surgery Code Financial Base</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      placeholder="Search CPT code..." 
                      className="date-range-selector" 
                      style={{ paddingLeft: '30px' }}
                    />
                  </div>
                  <button className="btn-header">Add CPT Code</button>
                </div>
              </div>

              <div className="custom-table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>CPT Code</th>
                      <th>Description</th>
                      <th>Avg Duration</th>
                      <th>Avg Turnover</th>
                      <th>Facility Fee</th>
                      <th>Medicare Rate</th>
                      <th>Labor Cost</th>
                      <th>Implants / Supplies</th>
                      <th>Contrib. Margin</th>
                      <th>EBITDA %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { code: '27130', desc: 'Total Knee Replacement', time: 120, turn: 25, fee: 22125, med: 18500, labor: 1800, supply: 11000, margin: 9325, pct: 42.1 },
                      { code: '29827', desc: 'Knee Scope / Arthroscopy', time: 60, turn: 15, fee: 12842, med: 10200, labor: 900, supply: 5219, margin: 6723, pct: 52.3 },
                      { code: '27447', desc: 'Cataract Surgery', time: 60, turn: 15, fee: 9105, med: 7800, labor: 900, supply: 3050, margin: 5155, pct: 56.6 },
                      { code: '23430', desc: 'Laparoscopic Cholecystectomy', time: 90, turn: 20, fee: 8732, med: 7100, labor: 1350, supply: 3000, margin: 4382, pct: 50.1 },
                      { code: '29824', desc: 'Shoulder Arthroscopy', time: 90, turn: 20, fee: 11230, med: 9100, labor: 1350, supply: 5200, margin: 4680, pct: 41.6 },
                      { code: '63030', desc: 'Carpal Tunnel Release', time: 45, turn: 15, fee: 3420, med: 2900, labor: 675, supply: 850, margin: 1895, pct: 55.4 },
                      { code: '49505', desc: 'Inguinal Hernia Repair', time: 90, turn: 20, fee: 10200, med: 8200, labor: 1350, supply: 3000, margin: 5850, pct: 57.3 }
                    ].map(cpt => (
                      <tr key={cpt.code}>
                        <td style={{ fontWeight: '600' }}>{cpt.code}</td>
                        <td>{cpt.desc}</td>
                        <td>{cpt.time} mins</td>
                        <td>{cpt.turn} mins</td>
                        <td>${cpt.fee.toLocaleString()}</td>
                        <td>${cpt.med.toLocaleString()}</td>
                        <td>${cpt.labor.toLocaleString()}</td>
                        <td>${cpt.supply.toLocaleString()}</td>
                        <td style={{ color: 'var(--color-green)', fontWeight: '700' }}>${cpt.margin.toLocaleString()}</td>
                        <td style={{ fontWeight: '600' }}>{cpt.pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB: PAYER INTELLIGENCE
              ========================================== */}
          {activeTab === 'payer' && (
            <div className="dashboard-card">
              <div className="card-header">
                <h3 className="card-title">Payer Intelligence</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Reimbursement cycles, collection logs, and margin details by insurance provider (Medicare, Commercial, etc.).
              </p>
            </div>
          )}

          {/* ==========================================
              TAB: SUPPLY CHAIN
              ========================================== */}
          {activeTab === 'supply' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Supply KPI insights */}
              <div className="kpi-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <div className="kpi-card">
                  <span className="kpi-label">Annual Standardization Saving Opportunity</span>
                  <span className="kpi-value" style={{ color: 'var(--color-green)' }}>$84,500</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Standardizing implant suppliers & sutures</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Implant Supply Variance</span>
                  <span className="kpi-value" style={{ color: 'var(--color-red)' }}>+14.8%</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Above preference card baseline standard</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Waste Reduction Score</span>
                  <span className="kpi-value">92 / 100</span>
                  <span className="kpi-trend positive">↗ +4pts vs last quarter</span>
                </div>
              </div>

              {/* Preference cards & surgeon variance breakdown */}
              {PREFERENCE_CARDS.map(card => (
                <div className="dashboard-card" key={card.procedure}>
                  <div className="card-header">
                    <h3 className="card-title"><Package size={16} /> Preference Card Analysis: {card.procedure}</h3>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Standard Cost Base: ${card.standardCost}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' }}>
                    <div>
                      <h4 style={{ fontSize: '0.85rem', color: '#fff', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Standard Supply Item List</h4>
                      <div className="custom-table-container" style={{ border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                        <table className="custom-table" style={{ fontSize: '0.8rem' }}>
                          <thead>
                            <tr>
                              <th>Item Name</th>
                              <th>Qty</th>
                              <th>Unit Cost</th>
                            </tr>
                          </thead>
                          <tbody>
                            {card.items.map(item => (
                              <tr key={item.name}>
                                <td>{item.name}</td>
                                <td>{item.qty}</td>
                                <td>${item.cost}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '0.85rem', color: '#fff', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Surgeon Utilization Variance</h4>
                      <div className="custom-table-container" style={{ border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                        <table className="custom-table" style={{ fontSize: '0.8rem' }}>
                          <thead>
                            <tr>
                              <th>Surgeon</th>
                              <th>Actual Cost</th>
                              <th>Variance %</th>
                              <th>Items Opened</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {card.surgeons.map(surg => (
                              <tr 
                                key={surg.name}
                                onClick={() => { setSelectedSurgeon(surg.name); setProfileTab('supply'); }}
                                style={{ cursor: 'pointer' }}
                                className="clickable-row"
                              >
                                <td style={{ fontWeight: '600', color: 'var(--color-blue)' }}>{surg.name}</td>
                                <td>${surg.actualCost}</td>
                                <td style={{ color: surg.variance > 0 ? 'var(--color-red)' : 'var(--color-green)', fontWeight: '600' }}>
                                  {surg.variance > 0 ? `+${surg.variance}%` : `${surg.variance}%`}
                                </td>
                                <td>{surg.supplyItems} items</td>
                                <td>
                                  {surg.variance > 10 && (
                                    <button 
                                      className="btn-header" 
                                      style={{ padding: '2px 6px', fontSize: '0.7rem', borderColor: 'var(--color-orange)', color: 'var(--color-orange)' }}
                                      onClick={(e) => { e.stopPropagation(); alert(`Standardization recommendation email sent to ${surg.name}`); }}
                                    >
                                      Standardize
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ==========================================
              TAB: CANCELLATIONS
              ========================================== */}
          {activeTab === 'cancellations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="kpi-card">
                  <span className="kpi-label">Cancellation Rate</span>
                  <span className="kpi-value" style={{ color: 'var(--color-red)' }}>6.2%</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Facility average target &lt; 5.0%</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Lost Contrib. Margin</span>
                  <span className="kpi-value" style={{ color: 'var(--color-red)' }}>$48,200</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Based on last 30 days cancellations</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Cancelled Cases</span>
                  <span className="kpi-value">14 Cases</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total cases cancelled this month</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Avg Lead Notification Time</span>
                  <span className="kpi-value">4.5 hours</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Time before scheduled start</span>
                </div>
              </div>

              {/* Recovery Optimizer alerts */}
              <div 
                style={{ 
                  backgroundColor: cancellationActive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
                  border: `1px solid ${cancellationActive ? 'var(--color-red)' : 'var(--color-green)'}`, 
                  borderRadius: '12px', 
                  padding: '16px 20px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ color: cancellationActive ? 'var(--color-red)' : 'var(--color-green)', fontSize: '1.25rem' }}>
                    {cancellationActive ? <AlertTriangle /> : <CheckCircle />}
                  </div>
                  <div>
                    <h4 style={{ fontWeight: '700', color: '#fff', fontSize: '0.95rem' }}>
                      {cancellationActive ? 'Operational Cancellation Anomaly' : 'Vacancy Successfully Filled'}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                      {optimizerMessage}
                    </p>
                  </div>
                </div>

                {cancellationActive ? (
                  <button 
                    className="btn-header btn-primary"
                    onClick={() => setShowAutoSuggest(true)}
                  >
                    <Sparkles size={14} style={{ marginRight: '6px' }} /> Run Action Engine
                  </button>
                ) : (
                  <button 
                    className="btn-header"
                    onClick={resetCancellationSim}
                  >
                    <RotateCcw size={14} style={{ marginRight: '6px' }} /> Reset Simulation
                  </button>
                )}
              </div>

              {showAutoSuggest && (
                <div className="dashboard-card" style={{ border: '1px solid var(--color-blue)', boxShadow: '0 0 15px rgba(59, 130, 246, 0.2)', marginBottom: '10px' }}>
                  <div className="card-header">
                    <h3 className="card-title" style={{ color: 'var(--color-blue)' }}><Sparkles size={16} /> Action Engine: Vacant Slot Replacements</h3>
                  </div>
                  <div className="custom-table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Patient Code</th>
                          <th>CPT / Description</th>
                          <th>Surgeon</th>
                          <th>Duration</th>
                          <th>Revenue</th>
                          <th>Supply Cost</th>
                          <th>Implant Cost</th>
                          <th>Contrib. Margin</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {WAITLIST_CASES.map(wc => (
                          <tr key={wc.id}>
                            <td style={{ fontWeight: '600' }}>#{wc.id}</td>
                            <td>
                              <div style={{ fontWeight: '600' }}>CPT {wc.code}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{wc.desc}</div>
                            </td>
                            <td>{wc.surgeon}</td>
                            <td>{wc.duration} mins</td>
                            <td>${wc.rev.toLocaleString()}</td>
                            <td>${wc.supplies.toLocaleString()}</td>
                            <td>${wc.implants.toLocaleString()}</td>
                            <td style={{ color: 'var(--color-green)', fontWeight: '700' }}>${wc.margin.toLocaleString()}</td>
                            <td>
                              <button 
                                className="btn-header btn-primary" 
                                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                onClick={() => handleSimulateResolve(wc)}
                              >
                                Fill Slot
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
                <div className="dashboard-card">
                  <div className="card-header">
                    <h3 className="card-title">Recent Cancellations & Revenue Loss</h3>
                  </div>
                  <div className="custom-table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Procedure</th>
                          <th>Surgeon</th>
                          <th>Reason</th>
                          <th>Estimated Lost Margin</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { date: 'May 12', desc: 'Gallbladder (CPT 23430)', surg: 'Dr. Michael Patel', reason: 'Patient No-Show', loss: 3450 },
                          { date: 'May 10', desc: 'Shoulder Arthroscopy', surg: 'Dr. Sarah Lee', reason: 'Incomplete Pre-Op Clearance', loss: 4200 },
                          { date: 'May 8', desc: 'Carpal Tunnel Release', surg: 'Dr. James Johnson', reason: 'Insurance Pre-Auth Refused', loss: 1620 },
                          { date: 'May 5', desc: 'Hernia Repair', surg: 'Dr. Michael Patel', reason: 'Patient Medical Anomaly (Elevated BP)', loss: 3750 }
                        ].map((c, i) => (
                          <tr 
                            key={i}
                            onClick={() => { setSelectedSurgeon(c.surg); setProfileTab('schedule'); }}
                            style={{ cursor: 'pointer' }}
                            className="clickable-row"
                          >
                            <td>{c.date}</td>
                            <td style={{ fontWeight: '600' }}>{c.desc}</td>
                            <td style={{ fontWeight: '600', color: 'var(--color-blue)' }}>{c.surg}</td>
                            <td style={{ color: 'var(--color-orange)' }}>{c.reason}</td>
                            <td style={{ color: 'var(--color-red)', fontWeight: '600' }}>-${c.loss.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="dashboard-card">
                  <div className="card-header">
                    <h3 className="card-title">Cancellations by Reason</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>Medical Issues (Pre-Op clearance/elevated vitals)</span>
                      <span style={{ fontWeight: '600' }}>42%</span>
                    </div>
                    <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '42%', backgroundColor: 'var(--color-red)' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>Insurance / Authorization issues</span>
                      <span style={{ fontWeight: '600' }}>28%</span>
                    </div>
                    <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '28%', backgroundColor: 'var(--color-red)' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>Patient No-Show / Late cancellation</span>
                      <span style={{ fontWeight: '600' }}>20%</span>
                    </div>
                    <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '20%', backgroundColor: 'var(--color-orange)' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>Administrative / Scheduling conflict</span>
                      <span style={{ fontWeight: '600' }}>10%</span>
                    </div>
                    <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '10%', backgroundColor: 'var(--color-grey)' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB: REPORTS & ANALYTICS
              ========================================== */}
          {activeTab === 'reports' && (
            <div className="dashboard-card">
              <div className="card-header">
                <h3 className="card-title">Reports & Analytics</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Export monthly clinical logs, surgeon score sheets, and billing ledgers.
              </p>
            </div>
          )}

          {/* ==========================================
              TAB: AI INSIGHTS
              ========================================== */}
          {activeTab === 'ai' && (
            <div className="dashboard-card">
              <div className="card-header">
                <h3 className="card-title"><Sparkles size={18} /> Prescriptive AI Actions Hub</h3>
              </div>

              <div className="ai-recommendations-list">
                <div style={{ padding: '12px 16px', borderLeft: '3px solid var(--color-blue)', backgroundColor: 'rgba(59,130,246,0.05)', borderRadius: '4px', marginBottom: '10px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '700' }}>Schedule Optimization Suggestion</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    OR 2 is scheduled at 81% utilization, but has two 45-minute gaps. Moving Cataract cases of Dr. Lee to OR 3 frees up OR 2 block time from 1:30 PM onwards, enabling a 3.5 hour orthopedic slot.
                  </p>
                  <button className="btn-header btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem', marginTop: '10px' }} onClick={() => alert('Applied recommendation: Shifting cases.')}>Apply Auto-Shift</button>
                </div>

                <div style={{ padding: '12px 16px', borderLeft: '3px solid var(--color-green)', backgroundColor: 'rgba(16,185,129,0.05)', borderRadius: '4px', marginBottom: '10px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '700' }}>Preference Card Cost Reduction</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Dr. David Smith spends an average of $250 more on anchors/sutures than Dr. James Johnson for CPT 29827. Swapping to the standard anchor brand will save the facility $12,000 based on his annual caseload.
                  </p>
                  <button className="btn-header" style={{ padding: '4px 10px', fontSize: '0.75rem', marginTop: '10px', color: 'var(--color-green)', borderColor: 'var(--color-green)' }} onClick={() => alert('Sent standardization alert to Dr. Smith.')}>Initiate Standardization</button>
                </div>

                <div style={{ padding: '12px 16px', borderLeft: '3px solid var(--color-orange)', backgroundColor: 'rgba(245,158,11,0.05)', borderRadius: '4px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '700' }}>Cancellation Hazard Notice</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Three patients scheduled for May 14 have outstanding pre-auth codes. There is an 80% risk of cancellation. Auto-reminders have been generated for billing staff to contact insurers.
                  </p>
                  <button className="btn-header" style={{ padding: '4px 10px', fontSize: '0.75rem', marginTop: '10px', color: 'var(--color-orange)', borderColor: 'var(--color-orange)' }} onClick={() => alert('Sent high priority alerts to Billing Desk.')}>Send Staff Reminders</button>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB: DATA EXPLORER
              ========================================== */}
          {activeTab === 'data' && (
            <div className="dashboard-card">
              <div className="card-header">
                <h3 className="card-title">Ad-hoc Data Explorer</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Query facility databases and build customized tabular grids.
              </p>
            </div>
          )}

          {/* ==========================================
              TAB: SETTINGS
              ========================================== */}
          {activeTab === 'settings' && (
            <div className="dashboard-card">
              <div className="card-header">
                <h3 className="card-title">ASC Settings Configuration</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '0.9rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', alignItems: 'center' }}>
                  <span>OR Baseline Cost / Hour</span>
                  <input type="text" value="$1,500" className="date-range-selector" style={{ width: '150px' }} readOnly />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', alignItems: 'center' }}>
                  <span>Staff Labor Cost / Hour</span>
                  <input type="text" value="$450" className="date-range-selector" style={{ width: '150px' }} readOnly />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', alignItems: 'center' }}>
                  <span>Default Turnover Allocation</span>
                  <input type="text" value="25 mins" className="date-range-selector" style={{ width: '150px' }} readOnly />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', alignItems: 'center' }}>
                  <span>Supabase Sync Host</span>
                  <input type="text" value="https://supabase.medicalai.co" className="date-range-selector" style={{ width: '300px' }} readOnly />
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB: HELP & SUPPORT
              ========================================== */}
          {activeTab === 'help' && (
            <div className="dashboard-card">
              <div className="card-header">
                <h3 className="card-title">Help & Support Desk</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Access operational manuals and contact support engineers.
              </p>
            </div>
          )}
            </>
          )}
        </section>
      </main>

      {/* ==========================================
          MODAL: CASE DETAILS (CONTRIBUTION MARGIN DETAILS)
          ========================================== */}
      {selectedCase && (
        <div className="modal-overlay" onClick={() => setSelectedCase(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', color: '#fff', fontWeight: '700' }}>
                Case Contribution Margin Analysis
              </h3>
              <button className="modal-close" onClick={() => setSelectedCase(null)}>×</button>
            </div>

            <div className="modal-body">
              <div style={{ marginBottom: '10px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff' }}>{selectedCase.label}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                  CPT Code: {selectedCase.code} | Surgeon: {selectedCase.doctor} | Room: {selectedCase.or}
                </p>
              </div>

              <div className="cost-row">
                <span>Total Facility Revenue</span>
                <span style={{ fontWeight: '600' }}>${selectedCase.revenue.toLocaleString()}</span>
              </div>

              <div className="cost-row">
                <span>Supply Costs (preference card)</span>
                <span style={{ color: 'var(--color-red)' }}>-${selectedCase.supplies.toLocaleString()}</span>
              </div>

              <div className="cost-row">
                <span>Implant Costs</span>
                <span style={{ color: 'var(--color-red)' }}>-${selectedCase.implants.toLocaleString()}</span>
              </div>

              <div className="cost-row">
                <span>OR Labor Costs (staff)</span>
                <span style={{ color: 'var(--color-red)' }}>-${selectedCase.labor.toLocaleString()}</span>
              </div>

              <div className="cost-row" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <span>OR Room Fixed Cost allocation</span>
                <span style={{ color: 'var(--color-red)' }}>-${selectedCase.roomCost.toLocaleString()}</span>
              </div>

              <div className="cost-row total">
                <span>Contribution Margin</span>
                <span style={{ color: 'var(--color-green)' }}>
                  +${selectedCase.margin.toLocaleString()} ({Math.round((selectedCase.margin / selectedCase.revenue) * 100)}%)
                </span>
              </div>

              <div style={{ backgroundColor: 'rgba(59,130,246,0.05)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', marginTop: '10px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span style={{ fontWeight: '700', color: '#fff' }}>Decision Engine Insight:</span> This case contributes <strong>${Math.round(selectedCase.margin / ( (selectedCase.endMin - selectedCase.startMin) / 60 )).toLocaleString()} / OR Hour</strong>. Implants represent the highest cost driver at {Math.round((selectedCase.implants / selectedCase.revenue) * 100)}% of total revenue.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
