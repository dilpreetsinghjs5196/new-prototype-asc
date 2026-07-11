import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { db } from '../lib/supabase';
import { Upload, Database, CheckCircle, AlertTriangle, Loader, FileSpreadsheet } from 'lucide-react';
import Swal from 'sweetalert2';

export default function OTCostManagement() {
  const [data, setData] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dbData, setDbData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Columns to extract as per user requirements
  const targetColumns = {
    cpt_hcpcs_code: 'cpt_codes',
    supplies_cost: 'supply_cost',
    implants_cost: 'implant_cost',
    actual_labor_cost: 'labour_cost',
    actual_room_cost: 'or_room_cost',
    medications_cost: 'medication_cost',
    tray_cost: 'tray_cost'
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (db.getOTExtraCosts) {
        const result = await db.getOTExtraCosts();
        setDbData(result);
      }
    } catch (error) {
      console.error('Error fetching OT extra costs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const bstr = event.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        
        // Assuming data is in the first sheet or a sheet named 'Costed_Fee_Schedule'
        const sheetName = workbook.SheetNames.includes('Costed_Fee_Schedule') 
          ? 'Costed_Fee_Schedule' 
          : workbook.SheetNames[0];
          
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null });
        
        // Process and extract only the needed columns
        const processedData = jsonData.map(row => {
          const newRow = {};
          
          // Map exact keys from excel to db column names
          Object.keys(targetColumns).forEach(excelCol => {
             const dbCol = targetColumns[excelCol];
             let val = row[excelCol];
             
             // Handle numeric conversions for cost columns
             if (dbCol !== 'cpt_codes') {
               if (typeof val === 'string') {
                 // Remove $ and commas
                 val = val.replace(/[$,]/g, '');
               }
               val = parseFloat(val) || 0.00;
             } else {
               val = val ? String(val).trim() : '';
             }
             
             newRow[dbCol] = val;
          });
          
          return newRow;
        }).filter(row => row.cpt_codes); // filter out empty rows
        
        setData(processedData);
        Swal.fire('Success', `Successfully extracted ${processedData.length} rows from Excel.`, 'success');
      } catch (error) {
        console.error("Error reading excel:", error);
        Swal.fire('Error', 'Failed to parse Excel file. Make sure it has the required columns.', 'error');
      } finally {
        setIsUploading(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleSaveToDB = async () => {
    if (data.length === 0) return;
    
    setIsSaving(true);
    try {
      if (db.upsertOTExtraCosts) {
        await db.upsertOTExtraCosts(data);
        Swal.fire('Success', `Successfully saved ${data.length} records to the database.`, 'success');
        fetchData(); // Refresh table
        setData([]); // Clear upload data
      } else {
        Swal.fire('Error', 'Database function not implemented yet.', 'error');
      }
    } catch (error) {
      console.error('Error saving to DB:', error);
      Swal.fire('Error', error.message || 'Failed to save to database.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="ot-cost-management">
      <div className="dashboard-header" style={{ marginBottom: '20px' }}>
        <div>
          <h2 className="dashboard-title">OT Cost Management</h2>
          <p className="dashboard-subtitle">Upload and manage procedure costs based on CPT codes</p>
        </div>
      </div>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        
        {/* Upload Section */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title"><Upload size={18} /> Import Excel Data</h3>
          </div>
          
          <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Upload your Excel sheet to extract and save the following columns: <br/>
              <strong>cpt_hcpcs_code, supplies_cost, implants_cost, actual_labor_cost, actual_room_cost, medications_cost, tray_cost</strong>
            </p>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
               <label className="btn-header btn-primary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <FileSpreadsheet size={16} />
                 {isUploading ? 'Parsing...' : 'Select Excel File'}
                 <input 
                   type="file" 
                   accept=".xlsx, .xls, .csv" 
                   onChange={handleFileUpload} 
                   style={{ display: 'none' }}
                   disabled={isUploading || isSaving}
                 />
               </label>
               
               {data.length > 0 && (
                 <button 
                   className="btn-header" 
                   style={{ backgroundColor: 'var(--color-green)', color: 'white', borderColor: 'var(--color-green)', display: 'flex', alignItems: 'center', gap: '8px' }}
                   onClick={handleSaveToDB}
                   disabled={isSaving}
                 >
                   <Database size={16} />
                   {isSaving ? 'Saving to DB...' : `Save ${data.length} records to DB`}
                 </button>
               )}
            </div>
          </div>

          {/* Preview extracted data */}
          {data.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '10px', color: '#fff' }}>Extracted Data Preview (Showing top 5)</h4>
              <div className="custom-table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>CPT Code</th>
                      <th>Supply Cost</th>
                      <th>Implant Cost</th>
                      <th>Labor Cost</th>
                      <th>Room Cost</th>
                      <th>Medication Cost</th>
                      <th>Tray Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(0, 5).map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: '600' }}>{row.cpt_codes}</td>
                        <td>${row.supply_cost?.toFixed(2)}</td>
                        <td>${row.implant_cost?.toFixed(2)}</td>
                        <td>${row.labour_cost?.toFixed(2)}</td>
                        <td>${row.or_room_cost?.toFixed(2)}</td>
                        <td>${row.medication_cost?.toFixed(2)}</td>
                        <td>${row.tray_cost?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Database View Section */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title"><Database size={18} /> Database Records (Total: {dbData.length} rows)</h3>
            <button className="btn-header" onClick={fetchData} disabled={isLoading}>
               {isLoading ? <Loader size={14} className="spin" /> : 'Refresh'}
            </button>
          </div>
          
          <div style={{ marginTop: '16px' }}>
            {isLoading && dbData.length === 0 ? (
               <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading records...</div>
            ) : dbData.length === 0 ? (
               <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-body)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                  No records found in database. Please upload an Excel file to populate data.
               </div>
            ) : (
              <div className="custom-table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="custom-table">
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-card)', zIndex: 1 }}>
                    <tr>
                      <th>CPT Code</th>
                      <th>Supply Cost</th>
                      <th>Implant Cost</th>
                      <th>Labor Cost</th>
                      <th>Room Cost</th>
                      <th>Medication Cost</th>
                      <th>Tray Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbData.map((row, idx) => (
                      <tr key={row.id || idx}>
                        <td style={{ fontWeight: '600', color: 'var(--color-blue)' }}>{row.cpt_codes}</td>
                        <td>${Number(row.supply_cost).toFixed(2)}</td>
                        <td>${Number(row.implant_cost).toFixed(2)}</td>
                        <td>${Number(row.labour_cost).toFixed(2)}</td>
                        <td>${Number(row.or_room_cost).toFixed(2)}</td>
                        <td>${Number(row.medication_cost).toFixed(2)}</td>
                        <td>${Number(row.tray_cost).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
