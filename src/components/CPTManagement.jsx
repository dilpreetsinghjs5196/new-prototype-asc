import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Stethoscope,
  CheckCircle,
  XCircle,
  Sliders,
  Loader
} from 'lucide-react';
import { db } from '../lib/supabase';

// Hardcoded unique categories found in database to ensure the dropdown options are instantly available
const CATEGORIES_LIST = [
  'Orthopedics',
  'Otolaryngology (ENT)',
  'Gastroenterology',
  'Urology',
  'Neurology',
  'Plastic / Cosmetic',
  'Dermatology',
  'Breast Oncology',
  'Pain Management',
  'Thoracic Surgery',
  'Ophthalmology',
  'Podiatry',
  'Cardiology',
  'Radiology',
  'Orthopedics / Musculoskeletal',
  'Anesthesiology',
  'Emerging Technology (T-Code)',
  'Radiology / Imaging',
  'General'
];

const PROCEDURE_GROUPS = [
  'Orthopedics Procedures',
  'Otolaryngology (ENT) Procedures',
  'Gastroenterology Procedures',
  'Urology Procedures',
  'Neurology Procedures',
  'Plastic / Cosmetic Procedures',
  'Dermatology Procedures',
  'Breast Oncology Procedures',
  'Pain Management Procedures',
  'Thoracic Surgery Procedures',
  'Ophthalmology Procedures',
  'Podiatry Procedures',
  'Cardiology Procedures',
  'Orthopedics / Musculoskeletal Procedures',
  'Anesthesiology Procedures',
  'Emerging Technology (T-Code) Procedures',
  'Radiology / Imaging Procedures',
  'General Procedures'
];

const INDICATORS = ['A2', 'J8', 'G2', 'P3', 'N1', 'S', 'A', 'P2'];

export default function CPTManagement({
  onAdd,
  onUpdate,
  onDelete
}) {
  const [cpts, setCpts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [refreshKey, setRefreshKey] = useState(0);

  // Form & Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCpt, setEditingCpt] = useState(null);
  const [form, setForm] = useState({
    code: '',
    description: '',
    reimbursement: '',
    cost: '',
    category: '',
    average_duration: '',
    turnover_time: '',
    body_part: '',
    procedure_group: '',
    procedure_indicator: '',
    gross_charge: '',
    active_published: true,
    active_code: true
  });

  // Dynamic server-side data fetching
  useEffect(() => {
    let active = true;
    async function fetchData() {
      setLoading(true);
      try {
        const { cptCodes: fetched, totalCount: total } = await db.getCPTCodesPaged({
          search: searchQuery,
          category: categoryFilter,
          page: currentPage,
          limit: rowsPerPage
        });
        if (active) {
          setCpts(fetched);
          setTotalCount(total);
        }
      } catch (err) {
        console.error('Error fetching paged CPT codes:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchData();
    return () => {
      active = false;
    };
  }, [searchQuery, categoryFilter, currentPage, rowsPerPage, refreshKey]);

  // Pagination calculations
  const totalPages = Math.ceil(totalCount / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;

  // Open modal for add
  const handleOpenAdd = () => {
    setEditingCpt(null);
    setForm({
      code: '',
      description: '',
      reimbursement: '',
      cost: '',
      category: '',
      average_duration: '',
      turnover_time: '',
      body_part: '',
      procedure_group: '',
      procedure_indicator: '',
      gross_charge: '',
      active_published: true,
      active_code: true
    });
    setModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEdit = (cpt) => {
    setEditingCpt(cpt);
    setForm({
      code: cpt.code || '',
      description: cpt.description || '',
      reimbursement: cpt.reimbursement !== null && cpt.reimbursement !== undefined ? String(cpt.reimbursement) : '',
      cost: cpt.cost !== null && cpt.cost !== undefined ? String(cpt.cost) : '',
      category: cpt.category || '',
      average_duration: cpt.average_duration !== null && cpt.average_duration !== undefined ? String(cpt.average_duration) : '',
      turnover_time: cpt.turnover_time !== null && cpt.turnover_time !== undefined ? String(cpt.turnover_time) : '',
      body_part: cpt.body_part || '',
      procedure_group: cpt.procedure_group || '',
      procedure_indicator: cpt.procedure_indicator || '',
      gross_charge: cpt.gross_charge !== null && cpt.gross_charge !== undefined ? String(cpt.gross_charge) : '',
      active_published: cpt.is_active !== false,
      active_code: cpt.is_active !== false
    });
    setModalOpen(true);
  };

  // Handle Form Submit (Save)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const code = form.code.trim();
    const description = form.description.trim();

    if (!form.category) {
      alert('Category is required.');
      return;
    }
    if (!code || code.length > 10) {
      alert('CPT code is required and must be 10 characters or less.');
      return;
    }
    if (!description) {
      alert('Description is required.');
      return;
    }
    if (form.reimbursement === '') {
      alert('Reimbursement is required.');
      return;
    }

    const payload = {
      code,
      description,
      category: form.category,
      body_part: form.body_part.trim() || null,
      procedure_group: form.procedure_group || null,
      procedure_indicator: form.procedure_indicator || null,
      reimbursement: parseFloat(form.reimbursement),
      cost: form.cost === '' ? 0 : parseFloat(form.cost),
      average_duration: form.average_duration === '' ? 0 : parseInt(form.average_duration, 10),
      turnover_time: form.turnover_time === '' ? 0 : parseInt(form.turnover_time, 10),
      gross_charge: form.gross_charge === '' ? 0 : parseFloat(form.gross_charge),
      is_active: form.active_published && form.active_code
    };

    try {
      if (editingCpt) {
        await onUpdate(editingCpt.id, payload);
      } else {
        await onAdd(payload);
      }
      setRefreshKey(prev => prev + 1);
      setModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Delete
  const handleDelete = async (cpt) => {
    if (confirm(`Are you sure you want to permanently delete CPT Code: ${cpt.code}?`)) {
      try {
        await onDelete(cpt.id);
        setRefreshKey(prev => prev + 1);
      } catch (err) {
        console.error(err);
        alert('An error occurred while deleting CPT code.');
      }
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      pages.push(
        <button
          key={1}
          className={`btn-header ${currentPage === 1 ? 'btn-primary' : ''}`}
          style={{ height: '32px', width: '32px', padding: 0, minWidth: 'auto', justifyContent: 'center' }}
          onClick={() => setCurrentPage(1)}
        >
          1
        </button>
      );
      if (start > 2) {
        pages.push(<span key="ellipsis-start" style={{ padding: '0 4px', alignSelf: 'center' }}>...</span>);
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          className={`btn-header ${currentPage === i ? 'btn-primary' : ''}`}
          style={{ height: '32px', width: '32px', padding: 0, minWidth: 'auto', justifyContent: 'center' }}
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </button>
      );
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push(<span key="ellipsis-end" style={{ padding: '0 4px', alignSelf: 'center' }}>...</span>);
      }
      pages.push(
        <button
          key={totalPages}
          className={`btn-header ${currentPage === totalPages ? 'btn-primary' : ''}`}
          style={{ height: '32px', width: '32px', padding: 0, minWidth: 'auto', justifyContent: 'center' }}
          onClick={() => setCurrentPage(totalPages)}
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Search and Filters Header */}
      <div className="dashboard-card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div>
            <h3 className="card-title" style={{ fontSize: '1.05rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Stethoscope size={18} style={{ color: 'var(--color-blue)' }} />
              CPT Codes Registry
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '0' }}>
              Manage clinical codes, expected reimbursement rates, base supply costs, and procedural duration benchmarks.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="btn-header btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px' }}
          >
            <Plus size={16} /> Register CPT Code
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by code or description..."
              className="date-range-selector"
              style={{ width: '100%', paddingLeft: '32px', height: '36px' }}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '180px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Category:</span>
            <select
              className="date-range-selector"
              style={{ flex: '1', height: '36px', background: 'var(--bg-card)', padding: '0 8px' }}
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="All">All Categories</option>
              {CATEGORIES_LIST.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="dashboard-card" style={{ padding: '0', position: 'relative' }}>
        
        {loading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(5, 11, 24, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            borderRadius: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontSize: '0.9rem', fontWeight: '600' }}>
              <Loader size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
              Fetching records...
            </div>
            <style dangerouslySetInnerHTML={{
              __html: `
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}} />
          </div>
        )}

        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Description</th>
                <th>Category</th>
                <th>Procedure Group</th>
                <th>Indicator</th>
                <th>Body Part</th>
                <th>Duration</th>
                <th>Turnover</th>
                <th style={{ textAlign: 'right' }}>Gross Charge</th>
                <th style={{ textAlign: 'right' }}>Reimbursement</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cpts.length > 0 ? (
                cpts.map(cpt => (
                  <tr key={cpt.id} className="clickable-row">
                    <td style={{ fontWeight: '700', fontFamily: 'monospace', color: 'var(--color-blue)', letterSpacing: '0.5px' }}>
                      {cpt.code}
                    </td>
                    <td style={{ fontWeight: '500', color: '#fff' }}>
                      {cpt.description}
                    </td>
                    <td>{cpt.category || 'N/A'}</td>
                    <td>{cpt.procedure_group || 'N/A'}</td>
                    <td style={{ textAlign: 'center', fontWeight: '600', color: '#fff' }}>{cpt.procedure_indicator || 'N/A'}</td>
                    <td>{cpt.body_part || 'N/A'}</td>
                    <td>{cpt.average_duration ? `${cpt.average_duration} mins` : 'N/A'}</td>
                    <td>{cpt.turnover_time ? `${cpt.turnover_time} mins` : 'N/A'}</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>
                      {cpt.gross_charge ? `$${cpt.gross_charge.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '$0.00'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--color-green)' }}>
                      {cpt.reimbursement ? `$${cpt.reimbursement.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '$0.00'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${cpt.is_active ? 'badge-scheduled' : 'badge-cancelled'}`}>
                        {cpt.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleOpenEdit(cpt)}
                          className="btn-header"
                          style={{ padding: '4px 8px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(59, 130, 246, 0.3)', color: 'var(--color-blue)' }}
                          title="Edit CPT Details"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(cpt)}
                          className="btn-header"
                          style={{ padding: '4px 8px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(244, 63, 94, 0.3)', color: 'var(--color-red)' }}
                          title="Delete CPT Code"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="12" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
                    <Stethoscope size={32} style={{ opacity: 0.2, marginBottom: '12px' }} />
                    <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>No CPT codes found</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>Try adjusting your keyword filter or register a new CPT code.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Limit & Pagination Controls Footer */}
        <div className="table-footer" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          borderTop: '1px solid var(--border-light)',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Rows per page:</span>
            <select
              className="date-range-selector"
              style={{ height: '32px', background: 'var(--bg-card)', padding: '2px 8px', width: '70px', cursor: 'pointer' }}
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span style={{ marginLeft: '12px' }}>
              Showing {totalCount > 0 ? startIndex + 1 : 0}–{Math.min(totalCount, endIndex)} of {totalCount} records
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              className="btn-header"
              style={{ height: '32px', padding: '0 10px', minWidth: 'auto', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              Previous
            </button>

            {renderPageNumbers()}

            <button
              className="btn-header"
              style={{ height: '32px', padding: '0 10px', minWidth: 'auto', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Register / Edit CPT Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '800px', maxWidth: '95%', background: 'var(--bg-app)', border: '1px solid var(--border-light)' }}>
            <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', color: '#fff', fontWeight: '700', margin: 0 }}>
                  {editingCpt ? 'Edit CPT Details' : 'Add New CPT'}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  Complete the details below to update the master price list
                </p>
              </div>
              <button className="modal-close" onClick={() => setModalOpen(false)} style={{ fontSize: '1.5rem', color: 'var(--text-muted)', hover: { color: '#fff' } }}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Row 1 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Category *</label>
                  <select
                    className="date-range-selector"
                    style={{ width: '100%', height: '38px', background: 'var(--bg-card)', padding: '0 10px' }}
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    required
                  >
                    <option value="" disabled>Select Category...</option>
                    {CATEGORIES_LIST.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>CPT Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 99213"
                    className="date-range-selector"
                    style={{ width: '100%', height: '38px' }}
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    disabled={!!editingCpt}
                    maxLength={10}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Procedure Group</label>
                  <select
                    className="date-range-selector"
                    style={{ width: '100%', height: '38px', background: 'var(--bg-card)', padding: '0 10px' }}
                    value={form.procedure_group}
                    onChange={(e) => setForm({ ...form, procedure_group: e.target.value })}
                  >
                    <option value="">Select Group...</option>
                    {PROCEDURE_GROUPS.map(group => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: 'span 1' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Description *</label>
                  <input
                    type="text"
                    required
                    placeholder="Procedure name"
                    className="date-range-selector"
                    style={{ width: '100%', height: '38px' }}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Indicator</label>
                  <select
                    className="date-range-selector"
                    style={{ width: '100%', height: '38px', background: 'var(--bg-card)', padding: '0 10px' }}
                    value={form.procedure_indicator}
                    onChange={(e) => setForm({ ...form, procedure_indicator: e.target.value })}
                  >
                    <option value="">Select...</option>
                    {INDICATORS.map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Body Part</label>
                  <input
                    type="text"
                    placeholder="e.g. Hand, Knee"
                    className="date-range-selector"
                    style={{ width: '100%', height: '38px' }}
                    value={form.body_part}
                    onChange={(e) => setForm({ ...form, body_part: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 3 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Duration (Min)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Duration in minutes"
                    className="date-range-selector"
                    style={{ width: '100%', height: '38px' }}
                    value={form.average_duration}
                    onChange={(e) => setForm({ ...form, average_duration: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Turnover (Min)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Turnover in minutes"
                    className="date-range-selector"
                    style={{ width: '100%', height: '38px' }}
                    value={form.turnover_time}
                    onChange={(e) => setForm({ ...form, turnover_time: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Reimbursement *</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '12px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>$</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      placeholder="0.00"
                      className="date-range-selector"
                      style={{ width: '100%', height: '38px', paddingLeft: '24px' }}
                      value={form.reimbursement}
                      onChange={(e) => setForm({ ...form, reimbursement: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Row 4 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Gross Charge (350%)</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '12px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>$</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0.00"
                      className="date-range-selector"
                      style={{ width: '100%', height: '38px', paddingLeft: '24px' }}
                      value={form.gross_charge}
                      onChange={(e) => setForm({ ...form, gross_charge: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingSelf: 'center', marginTop: '24px' }}>
                  <input
                    type="checkbox"
                    id="active_published"
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    checked={form.active_published}
                    onChange={(e) => setForm({ ...form, active_published: e.target.checked })}
                  />
                  <label htmlFor="active_published" style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff', cursor: 'pointer', userSelect: 'none' }}>
                    Active / Published
                  </label>
                </div>

                <div></div> {/* Spacer */}
              </div>

              {/* Row 5 / Footer Actions */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '16px',
                paddingTop: '20px',
                borderTop: '1px solid var(--border-light)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="active_code"
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    checked={form.active_code}
                    onChange={(e) => setForm({ ...form, active_code: e.target.checked })}
                  />
                  <label htmlFor="active_code" style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff', cursor: 'pointer', userSelect: 'none' }}>
                    Active Code
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    className="btn-header"
                    style={{ height: '38px', padding: '0 18px' }}
                    onClick={() => setModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-header btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '38px', padding: '0 18px' }}
                  >
                    <CheckCircle size={14} />
                    {editingCpt ? 'Save Changes' : 'Add to Price List'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
