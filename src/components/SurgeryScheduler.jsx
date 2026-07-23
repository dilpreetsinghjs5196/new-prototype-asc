import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import { db } from '../lib/supabase';
import { 
    Search, Plus, Edit, Trash2, Clock, Calendar, 
    DollarSign, AlertCircle, Filter, Check, ChevronDown, ChevronUp 
} from 'lucide-react';
import ORBlockSchedule from './ORBlockSchedule';
import './SurgeryScheduler.css';

// Format currency helper
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

// Round up helper for time display
const formatTimeForInput = (time) => {
    if (!time) return '';
    const t = String(time);
    if (t.includes(':')) {
        const parts = t.split(':');
        return parts[0].padStart(2, '0') + ':' + parts[1].padStart(2, '0');
    }
    return t;
};

const SurgeryScheduler = ({ patients = [], surgeons = [], cptCodes = [], surgeries = [], onSchedule, onUpdate, onDelete }) => {
    // ----- State -----------------------------------------------------------
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [showSchedule, setShowSchedule] = useState(false);
    const [editingSurgery, setEditingSurgery] = useState(null);
    const [expandedMonths, setExpandedMonths] = useState(new Set());
    const [monthPages, setMonthPages] = useState({});
    const [cptSearchQuery, setCptSearchQuery] = useState('');
    const [selectedBodyPart, setSelectedBodyPart] = useState('');
    const [includeLaborSupplies, setIncludeLaborSupplies] = useState(true);
    const [otExtraCosts, setOtExtraCosts] = useState([]);
    const [orBlocks, setOrBlocks] = useState([]);

    useEffect(() => {
        db.getOTExtraCosts().then(setOtExtraCosts).catch(console.error);
        db.getORBlockSchedule().then(setOrBlocks).catch(console.error);
    }, []);

    const [formData, setFormData] = useState({
        patientId: '',
        doctorName: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        durationMinutes: 60,
        turnoverTime: 20,
        selectedCptCodes: [],
        trayCost: 0,
        suppliesCost: 0,
        implantsCost: 0,
        medicationsCost: 0,
        labourCost: 0,
        orRoomCost: 0,
        actualStartTime: '',
        actualEndTime: '',
        actualDurationMinutes: 0,
        writeOff: 0,
        isProbono: false,
        orRoom: 'OR 1',
        cptExpenses: {}
    });

    const availableSurgeons = useMemo(() => {
        if (!formData?.date || !surgeons || surgeons.length === 0) return surgeons;
        const [yearStr, monthStr, dayStr] = formData.date.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);
        const day = parseInt(dayStr, 10);
        
        return surgeons.filter(surgeon => {
            const format1 = `${surgeon.firstname} ${surgeon.lastname}`.trim(); // e.g. "Kelly Malinoski"
            const format2 = surgeon.name || `Dr. ${surgeon.lastname} ${surgeon.firstname}`.trim(); // e.g. "Dr. Malinoski Kelly"
            
            // Check explicit DB blocks
            if (orBlocks.some(b => b.date === formData.date && (b.provider_name === format1 || b.provider_name === format2))) {
                return true;
            }
            
            // Check recurring templates
            let templates = surgeon.block_templates;
            if (typeof templates === 'string') {
                try { templates = JSON.parse(templates); } catch(e) { templates = []; }
            }
            
            if (Array.isArray(templates) && templates.length > 0) {
                const dayNameToIndex = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
                const weekToMultiplier = { 'First': 0, 'Second': 1, 'Third': 2, 'Fourth': 3, 'Fifth': 4 };
                
                return templates.some(template => {
                    if (template.week === 'Specific Date') {
                        return template.day === formData.date;
                    } else {
                        const targetDay = dayNameToIndex[template.day];
                        if (targetDay !== undefined) {
                            const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
                            let offset = targetDay - firstDayOfMonth;
                            if (offset < 0) offset += 7;
                            const dayOfMonth = 1 + offset + (weekToMultiplier[template.week] * 7);
                            if (dayOfMonth === day) return true;
                        }
                    }
                    return false;
                });
            }
            return false;
        });
    }, [formData?.date, surgeons, orBlocks]);

    // Pagination
    const surgeriesPerPage = 5;

    // ----- Reset Form -----
    const handleCancelEdit = () => {
        setEditingSurgery(null);
        setIsFormOpen(false);
        setFormData({
            patientId: '',
            doctorName: '',
            date: new Date().toISOString().split('T')[0],
            startTime: '',
            durationMinutes: 60,
            turnoverTime: 20,
            selectedCptCodes: [],
            trayCost: 0,
            suppliesCost: 0,
            implantsCost: 0,
            medicationsCost: 0,
            labourCost: 0,
            orRoomCost: 0,
            actualStartTime: '',
            actualEndTime: '',
            actualDurationMinutes: 0,
            writeOff: 0,
            isProbono: false,
            orRoom: 'OR 1',
            cptExpenses: {}
        });
    };

    const toggleForm = () => {
        if (isFormOpen) {
            handleCancelEdit();
        } else {
            setIsFormOpen(true);
        }
    };

    // ----- Edit Surgery -----
    const handleEdit = (surgery) => {
        setEditingSurgery(surgery);

        // Fetch tray_cost with notes fallback
        let trayCostVal = parseFloat(surgery.tray_cost || 0);
        if (trayCostVal === 0 && surgery.notes) {
            const match = surgery.notes.match(/\[Tray Cost:\s*([\d.]+)\]/);
            if (match) {
                trayCostVal = parseFloat(match[1]);
            }
        }

        // Parse CPT codes array
        let selectedCpts = [];
        if (Array.isArray(surgery.cpt_codes)) {
            selectedCpts = surgery.cpt_codes.map(String);
        } else if (typeof surgery.cpt_codes === 'string') {
            try {
                const parsed = JSON.parse(surgery.cpt_codes);
                if (Array.isArray(parsed)) {
                    selectedCpts = parsed.map(String);
                } else {
                    selectedCpts = [String(parsed)];
                }
            } catch (e) {
                selectedCpts = surgery.cpt_codes.split(',').map(s => s.trim()).filter(Boolean);
            }
        }

        let calcCptExpenses = {};
        let calcSupplies = 0;
        let calcImplants = 0;
        let calcMeds = 0;
        let calcTray = 0;
        let calcLabour = 0;
        let calcOrRoom = 0;

        if (surgery.cpt_expenses && typeof surgery.cpt_expenses === 'object' && Object.keys(surgery.cpt_expenses).length > 0) {
            calcCptExpenses = JSON.parse(JSON.stringify(surgery.cpt_expenses));
            
            Object.values(calcCptExpenses).forEach(exp => {
                // Ignore special underscore keys when summing up costs
                if (typeof exp === 'object' && exp !== null) {
                    calcSupplies += parseFloat(exp.suppliesCost || 0);
                    calcImplants += parseFloat(exp.implantsCost || 0);
                    calcMeds += parseFloat(exp.medicationsCost || 0);
                    calcTray += parseFloat(exp.trayCost || 0);
                    calcLabour += parseFloat(exp.labourCost || 0);
                    calcOrRoom += parseFloat(exp.orRoomCost || 0);
                }
            });
        } else {
            selectedCpts.forEach(code => {
                const extraCostData = otExtraCosts.find(c => String(c.cpt_codes) === String(code));
                
                const exp = {
                    suppliesCost: parseFloat(extraCostData?.supply_cost || 0),
                    implantsCost: parseFloat(extraCostData?.implant_cost || 0),
                    medicationsCost: parseFloat(extraCostData?.medication_cost || 0),
                    trayCost: parseFloat(extraCostData?.tray_cost || 0),
                    labourCost: parseFloat(extraCostData?.labour_cost || 0),
                    orRoomCost: parseFloat(extraCostData?.or_room_cost || 0)
                };
                calcCptExpenses[code] = exp;
                
                calcSupplies += exp.suppliesCost;
                calcImplants += exp.implantsCost;
                calcMeds += exp.medicationsCost;
                calcTray += exp.trayCost;
                calcLabour += exp.labourCost;
                calcOrRoom += exp.orRoomCost;
            });
        }

        // Distribute any discrepancy (e.g. from past custom edits) to the first selected CPT
        if (selectedCpts.length > 0) {
            const first = selectedCpts[0];
            const dbSupplies = parseFloat(surgery.supplies_cost || calcSupplies || 0);
            const dbImplants = parseFloat(surgery.implants_cost || calcImplants || 0);
            const dbMeds = parseFloat(surgery.medications_cost || calcMeds || 0);
            const dbTray = parseFloat(trayCostVal || calcTray || 0);
            const dbLabour = parseFloat(surgery.labour_cost || calcLabour || 0);
            const dbOrRoom = parseFloat(surgery.or_room_cost || calcOrRoom || 0);

            if (calcSupplies !== dbSupplies) calcCptExpenses[first].suppliesCost = Math.max(0, calcCptExpenses[first].suppliesCost + (dbSupplies - calcSupplies));
            if (calcImplants !== dbImplants) calcCptExpenses[first].implantsCost = Math.max(0, calcCptExpenses[first].implantsCost + (dbImplants - calcImplants));
            if (calcMeds !== dbMeds) calcCptExpenses[first].medicationsCost = Math.max(0, calcCptExpenses[first].medicationsCost + (dbMeds - calcMeds));
            if (calcTray !== dbTray) calcCptExpenses[first].trayCost = Math.max(0, calcCptExpenses[first].trayCost + (dbTray - calcTray));
            if (calcLabour !== dbLabour) calcCptExpenses[first].labourCost = Math.max(0, calcCptExpenses[first].labourCost + (dbLabour - calcLabour));
            if (calcOrRoom !== dbOrRoom) calcCptExpenses[first].orRoomCost = Math.max(0, calcCptExpenses[first].orRoomCost + (dbOrRoom - calcOrRoom));
        }

        // Format the doctorName exactly how the dropdown expects it
        let formattedDoctorName = surgery.doctor_name || '';
        if (formattedDoctorName && surgeons && surgeons.length > 0) {
            const cleanDbName = formattedDoctorName.replace(/^Dr\.\s*/i, '').trim();
            const surgeonObj = surgeons.find(s => 
                s.name === formattedDoctorName || 
                `${s.firstname} ${s.lastname}`.trim() === cleanDbName || 
                `${s.lastname} ${s.firstname}`.trim() === cleanDbName
            );
            if (surgeonObj) {
                formattedDoctorName = `Dr. ${surgeonObj.lastname} ${surgeonObj.firstname}`.trim();
            }
        }

        setFormData({
            patientId: surgery.patient_id || '',
            doctorName: formattedDoctorName,
            date: surgery.date || '',
            startTime: formatTimeForInput(surgery.start_time),
            durationMinutes: surgery.duration_minutes || 60,
            turnoverTime: surgery.turnover_time || 20,
            selectedCptCodes: selectedCpts,
            trayCost: trayCostVal || calcTray || 0,
            suppliesCost: surgery.supplies_cost || calcSupplies || 0,
            implantsCost: surgery.implants_cost || calcImplants || 0,
            medicationsCost: surgery.medications_cost || calcMeds || 0,
            labourCost: surgery.labour_cost || calcLabour || 0,
            orRoomCost: surgery.or_room_cost || calcOrRoom || 0,
            actualStartTime: formatTimeForInput(surgery.actual_start_time || surgery.start_time),
            actualEndTime: formatTimeForInput(surgery.actual_end_time),
            actualDurationMinutes: surgery.actual_duration_minutes || surgery.duration_minutes || 0,
            writeOff: surgery.write_off || 0,
            isProbono: !!surgery.is_probono,
            orRoom: surgery.or_room ? (String(surgery.or_room).startsWith('OR') ? surgery.or_room : `OR ${surgery.or_room}`) : 'OR 1',
            cptExpenses: calcCptExpenses
        });

        setIsFormOpen(true);
        setTimeout(() => {
            const el = document.getElementById('surgery-form-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    // ----- Submit Handler -----
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.patientId || !formData.doctorName || !formData.startTime) {
            Swal.fire({
                title: 'Error',
                text: 'Please select a patient, surgeon, and start time.',
                icon: 'error',
                background: 'var(--bg-card)',
                color: '#fff'
            });
            return;
        }

        const selectedSurgeonObj = surgeons.find(s => s.name === formData.doctorName || `${s.lastname} ${s.firstname}`.trim() === formData.doctorName.replace(/^Dr\.\s*/i, '').trim());

        // Construct tray cost notes fallback format
        let noteText = '';
        if (formData.trayCost > 0) {
            noteText = `[Tray Cost: ${formData.trayCost}]`;
        }

        // Expected Reimbursement logic
        let reimbursementSum = 0;
        formData.selectedCptCodes.forEach(code => {
            const cpt = cptCodes.find(c => String(c.code) === String(code));
            if (cpt) {
                reimbursementSum += parseFloat(cpt.reimbursement || 0);
            }
        });

        // Room Cost & Labor Cost are now directly mapped from the user-entered CPT expense values
        const roomCost = parseFloat(formData.orRoomCost || 0);
        const laborCost = parseFloat(formData.labourCost || 0);
        const suppliesCostTotal = parseFloat(formData.suppliesCost || 0) + parseFloat(formData.implantsCost || 0) + parseFloat(formData.medicationsCost || 0) + parseFloat(formData.trayCost || 0);

        // Calculate Full Total based on current UI toggle state
        const internalCost = includeLaborSupplies ? (roomCost + laborCost + suppliesCostTotal) : 0;
        const writeOff = parseFloat(formData.writeOff || 0);
        const patientBillTotal = reimbursementSum - writeOff + internalCost;
        
        let netProfit = reimbursementSum - writeOff - (roomCost + laborCost + suppliesCostTotal);
        if (formData.isProbono) netProfit = 0;

        // Save into notes to ensure they are captured in DB
        noteText += (noteText ? ' ' : '') + `[Full Total: ${patientBillTotal}]`;
        
        const enhancedCptExpenses = {
            ...formData.cptExpenses,
            _full_total: patientBillTotal,
            _net_profit: netProfit,
            _include_labor_supplies: includeLaborSupplies
        };

        const surgeryData = {
            patient_id: parseInt(formData.patientId),
            surgeon_id: selectedSurgeonObj?.id || null,
            doctor_name: formData.doctorName,
            date: formData.date,
            start_time: formData.startTime,
            duration_minutes: parseInt(formData.durationMinutes),
            turnover_time: parseInt(formData.turnoverTime),
            cpt_codes: formData.selectedCptCodes,
            status: editingSurgery ? editingSurgery.status : 'scheduled',
            supplies_cost: parseFloat(formData.suppliesCost || 0),
            implants_cost: parseFloat(formData.implantsCost || 0),
            medications_cost: parseFloat(formData.medicationsCost || 0),
            notes: noteText || null, // Fallback notes container
            actual_start_time: formData.actualStartTime || formData.startTime || null,
            actual_end_time: formData.actualEndTime || null,
            actual_duration_minutes: parseInt(formData.actualDurationMinutes) || null,
            actual_room_cost: parseFloat(roomCost),
            actual_labor_cost: parseFloat(laborCost),
            expected_reimbursement: parseFloat(reimbursementSum),
            write_off: parseFloat(formData.writeOff || 0),
            is_probono: formData.isProbono,
            or_room: formData.orRoom ? parseInt(formData.orRoom.replace(/\D/g, '')) || null : null,
            cpt_expenses: enhancedCptExpenses
        };

        try {
            if (editingSurgery) {
                await onUpdate(editingSurgery.id, surgeryData);
                Swal.fire({
                    title: 'Updated!',
                    text: 'Surgery details have been updated successfully.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    background: 'var(--bg-card)',
                    color: '#fff'
                });
            } else {
                await onSchedule(surgeryData);
                Swal.fire({
                    title: 'Scheduled!',
                    text: 'Surgery has been scheduled successfully.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    background: 'var(--bg-card)',
                    color: '#fff'
                });
            }
            handleCancelEdit();
        } catch (err) {
            console.error(err);
            Swal.fire({
                title: 'Error',
                text: `Failed to save surgery: ${err.message || err.toString()}`,
                icon: 'error',
                background: 'var(--bg-card)',
                color: '#fff'
            });
        }
    };

    // ----- Cancel/Reschedule/Delete Handlers -----
    const handleCancelSurgery = async (id) => {
        const { value: reason } = await Swal.fire({
            title: 'Cancel Surgery?',
            input: 'text',
            inputLabel: 'Reason for cancellation',
            inputPlaceholder: 'e.g., Patient sick, Surgeon unavailable...',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Yes, Cancel it',
            background: 'var(--bg-card)',
            color: '#fff',
            inputValidator: (value) => {
                if (!value) return 'You need to write a reason!';
            }
        });

        if (reason) {
            await onUpdate(id, {
                status: 'cancelled',
                notes: `Cancelled: ${reason}`
            });
            Swal.fire({
                title: 'Cancelled!',
                text: 'Surgery status set to cancelled.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                background: 'var(--bg-card)',
                color: '#fff'
            });
        }
    };

    const handleCompleteSurgery = async (id) => {
        const confirm = await Swal.fire({
            title: 'Complete Surgery?',
            text: 'Mark this surgery as completed.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: 'var(--color-green)',
            confirmButtonText: 'Yes, complete it',
            background: 'var(--bg-card)',
            color: '#fff'
        });

        if (confirm.isConfirmed) {
            await onUpdate(id, { status: 'completed' });
            Swal.fire({
                title: 'Completed!',
                text: 'Surgery marked as completed.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                background: 'var(--bg-card)',
                color: '#fff'
            });
        }
    };

    const handleDeleteSurgery = async (id) => {
        const confirm = await Swal.fire({
            title: 'Delete Surgery?',
            text: 'This operation is permanent and cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Yes, delete',
            background: 'var(--bg-card)',
            color: '#fff'
        });

        if (confirm.isConfirmed) {
            await onDelete(id);
            Swal.fire({
                title: 'Deleted!',
                text: 'Surgery removed successfully.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                background: 'var(--bg-card)',
                color: '#fff'
            });
        }
    };

    // ----- CPT Toggles -----
    const handleCptToggle = (code) => {
        setFormData(prev => {
            const index = prev.selectedCptCodes.indexOf(code);
            let newCodes = [...prev.selectedCptCodes];
            const isRemoving = index > -1;
            
            if (isRemoving) {
                newCodes.splice(index, 1);
            } else {
                newCodes.push(code);
            }

            // Recalculate duration & turnover averages based on CPT codes
            let totalDuration = 0;
            let totalTurnover = 0;
            newCodes.forEach(cCode => {
                const cpt = cptCodes.find(c => String(c.code) === String(cCode));
                if (cpt) {
                    totalDuration += parseInt(cpt.average_duration || 60);
                    totalTurnover += parseInt(cpt.turnover_time || 20);
                }
            });

            const newCptExpenses = { ...prev.cptExpenses };

            if (isRemoving) {
                if (newCptExpenses[code]) {
                    delete newCptExpenses[code];
                }
            } else {
                const extraCostData = otExtraCosts.find(c => String(c.cpt_codes) === String(code));
                const exp = {
                    suppliesCost: parseFloat(extraCostData?.supply_cost || 0),
                    implantsCost: parseFloat(extraCostData?.implant_cost || 0),
                    medicationsCost: parseFloat(extraCostData?.medication_cost || 0),
                    trayCost: parseFloat(extraCostData?.tray_cost || 0),
                    labourCost: parseFloat(extraCostData?.labour_cost || 0),
                    orRoomCost: parseFloat(extraCostData?.or_room_cost || 0)
                };
                newCptExpenses[code] = exp;
            }

            // Calculate total expenses from all selected CPTs directly
            let totalSupplies = 0;
            let totalImplants = 0;
            let totalMeds = 0;
            let totalTray = 0;
            let totalLabour = 0;
            let totalOrRoom = 0;

            if (newCodes.length > 0) {
                Object.values(newCptExpenses).forEach(exp => {
                    totalSupplies += parseFloat(exp.suppliesCost || 0);
                    totalImplants += parseFloat(exp.implantsCost || 0);
                    totalMeds += parseFloat(exp.medicationsCost || 0);
                    totalTray += parseFloat(exp.trayCost || 0);
                    totalLabour += parseFloat(exp.labourCost || 0);
                    totalOrRoom += parseFloat(exp.orRoomCost || 0);
                });
            } else {
                // If no CPT codes are selected, revert to whatever they were before (or keep global intact)
                totalSupplies = parseFloat(prev.suppliesCost || 0);
                totalImplants = parseFloat(prev.implantsCost || 0);
                totalMeds = parseFloat(prev.medicationsCost || 0);
                totalTray = parseFloat(prev.trayCost || 0);
                totalLabour = parseFloat(prev.labourCost || 0);
                totalOrRoom = parseFloat(prev.orRoomCost || 0);
            }

            return {
                ...prev,
                selectedCptCodes: newCodes,
                cptExpenses: newCptExpenses,
                durationMinutes: totalDuration > 0 ? totalDuration : prev.durationMinutes,
                turnoverTime: totalTurnover > 0 ? totalTurnover : prev.turnoverTime,
                suppliesCost: totalSupplies,
                implantsCost: totalImplants,
                medicationsCost: totalMeds,
                trayCost: totalTray,
                labourCost: totalLabour,
                orRoomCost: totalOrRoom
            };
        });
    };

    const handleCptExpenseChange = (cptCode, field, value) => {
        setFormData(prev => {
            const numVal = parseFloat(value) || 0;
            
            const newCptExpenses = {
                ...prev.cptExpenses,
                [cptCode]: {
                    ...prev.cptExpenses[cptCode],
                    [field]: numVal
                }
            };
            
            // Recalculate total for this field based on all selected CPT codes
            let newTotal = 0;
            prev.selectedCptCodes.forEach(code => {
                newTotal += parseFloat(newCptExpenses[code]?.[field] || 0);
            });

            return {
                ...prev,
                cptExpenses: newCptExpenses,
                [field]: newTotal
            };
        });
    };

    // ----- Financials Calculator helper -----
    const calculateSurgeryFinancials = (surgery) => {
        const revenue = parseFloat(surgery.expected_reimbursement || 0);
        const supplies = parseFloat(surgery.supplies_cost || 0);
        const implants = parseFloat(surgery.implants_cost || 0);
        const meds = parseFloat(surgery.medications_cost || 0);
        const labor = parseFloat(surgery.actual_labor_cost || 0);
        const room = parseFloat(surgery.actual_room_cost || 0);

        // Fetch tray_cost with fallback
        let trayCost = parseFloat(surgery.tray_cost || 0);
        if (trayCost === 0 && surgery.notes) {
            const match = surgery.notes.match(/\[Tray Cost:\s*([\d.]+)\]/);
            if (match) {
                trayCost = parseFloat(match[1]);
            }
        }

        const cost = supplies + implants + meds + labor + room + trayCost;
        let displayProfit = revenue - cost;

        if (!includeLaborSupplies && !surgery.is_probono) {
            // Include only billing margin (omit internal room overhead, labor, and supplies)
            displayProfit = revenue;
        } else if (surgery.is_probono) {
            displayProfit = 0; // Charity loss
        }

        return {
            revenue,
            supplies,
            implants,
            meds,
            labor,
            room,
            trayCost,
            totalCost: cost,
            netProfit: displayProfit
        };
    };

    // ----- Group Surgeries by Month -----
    const surgeriesByMonth = useMemo(() => {
        const groups = {};
        surgeries.forEach(surg => {
            if (!surg.date) return;
            const monthKey = surg.date.substring(0, 7); // "YYYY-MM"
            if (!groups[monthKey]) groups[monthKey] = [];
            groups[monthKey].push(surg);
        });
        return groups;
    }, [surgeries]);

    const availableMonths = useMemo(() => {
        return Object.keys(surgeriesByMonth).sort().reverse();
    }, [surgeriesByMonth]);

    const formatMonthDisplay = (monthKey) => {
        const [year, month] = monthKey.split('-');
        const date = new Date(year, parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const toggleMonth = (monthKey) => {
        setExpandedMonths(prev => {
            const newSet = new Set(prev);
            if (newSet.has(monthKey)) newSet.delete(monthKey);
            else newSet.add(monthKey);
            return newSet;
        });
    };

    // ----- Filtering CPT codes by Specialty / Keyword -----
    const filteredCptCodes = useMemo(() => {
        const surgeonObj = surgeons.find(s => s.name === formData.doctorName || `${s.lastname} ${s.firstname}`.trim() === formData.doctorName.replace(/^Dr\.\s*/i, '').trim());
        const specialty = surgeonObj?.specialty;

        return cptCodes.filter(cpt => {
            // Specialty filter
            const matchesSpecialty = !specialty || cpt.category === specialty || cpt.category === 'General' || cpt.category === 'General Surgery';
            // Search query filter
            const matchesQuery = !cptSearchQuery || 
                cpt.code.toLowerCase().includes(cptSearchQuery.toLowerCase()) || 
                cpt.description.toLowerCase().includes(cptSearchQuery.toLowerCase());
            // Body part filter
            const matchesBodyPart = !selectedBodyPart || (cpt.details?.body_part === selectedBodyPart);

            return matchesSpecialty && matchesQuery && matchesBodyPart;
        }).sort((a, b) => {
            const aSelected = formData.selectedCptCodes.includes(a.code);
            const bSelected = formData.selectedCptCodes.includes(b.code);
            if (aSelected && !bSelected) return -1;
            if (!aSelected && bSelected) return 1;
            return 0;
        });
    }, [cptCodes, formData.doctorName, surgeons, cptSearchQuery, selectedBodyPart, formData.selectedCptCodes]);

    const uniqueSelectedCodes = useMemo(() => {
        return formData.selectedCptCodes.map(code => {
            return cptCodes.find(c => String(c.code) === String(code)) || { code, description: 'Selected CPT Code', reimbursement: 0 };
        });
    }, [formData.selectedCptCodes, cptCodes]);

    // Available body parts mapping from CPTs
    const availableBodyParts = useMemo(() => {
        const parts = new Set();
        cptCodes.forEach(c => {
            if (c.details?.body_part) parts.add(c.details.body_part);
        });
        return Array.from(parts);
    }, [cptCodes]);

    return (
        <div className="management-container fade-in">
            <div className="management-header">
                <h2 className="management-title">Surgery Log & OR Schedule</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        className="btn-add"
                        onClick={() => setShowSchedule(!showSchedule)}
                        style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--color-purple)', borderColor: 'rgba(99, 102, 241, 0.2)' }}
                    >
                        {showSchedule ? 'Hide Calendar' : 'View OR Calendar'}
                    </button>
                    <button className="btn-add btn-primary" onClick={toggleForm}>
                        {isFormOpen ? 'Close Form' : '+ Schedule Surgery'}
                    </button>
                </div>
            </div>

            {/* Visual calendar block schedule */}
            {showSchedule && (
                <div className="content-card fade-in" style={{ marginBottom: '24px' }}>
                    <ORBlockSchedule surgeons={surgeons} embedded={true} />
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Scheduling Input Form */}
                {isFormOpen && (
                    <div id="surgery-form-section" className="content-card fade-in">
                        <div className="card-header">
                            <div>
                                <h3>{editingSurgery ? 'Edit Surgery Log' : 'Schedule New Surgery'}</h3>
                                <p className="card-subtitle">Complete all surgical parameters, including tray costs and operational durations.</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="surgery-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        required
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Select Patient</label>
                                    <select
                                        className="form-input"
                                        required
                                        value={formData.patientId}
                                        onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                                    >
                                        <option value="">-- Select Patient --</option>
                                        {patients.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.mrn})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Surgeon Name</label>
                                    <select
                                        className="form-input"
                                        required
                                        value={formData.doctorName}
                                        onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                                    >
                                        <option value="">-- Select Surgeon --</option>
                                        {availableSurgeons.map(s => {
                                            const name = `Dr. ${s.lastname} ${s.firstname}`.trim();
                                            return (
                                                <option key={s.id} value={name}>
                                                    {name} - {s.specialty}
                                                </option>
                                            );
                                        })}
                                        {availableSurgeons.length === 0 && (
                                            <option value="" disabled>No surgeons scheduled for this date</option>
                                        )}
                                    </select>
                                </div>

                                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div className="form-group">
                                        <label>Start Time</label>
                                        <input
                                            type="time"
                                            className="form-input"
                                            required
                                            value={formData.startTime}
                                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>OR Room</label>
                                        <select
                                            className="form-input"
                                            value={formData.orRoom}
                                            onChange={(e) => setFormData({ ...formData, orRoom: e.target.value })}
                                        >
                                            <option value="OR 1">OR 1</option>
                                            <option value="Procedure Room">Procedure Room</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Estimated Duration (Minutes)</label>
                                    <select
                                        className="form-input"
                                        required
                                        value={formData.durationMinutes}
                                        onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                                    >
                                        {Array.from({ length: 24 }, (_, i) => (i + 1) * 15).map(mins => {
                                            const hours = mins / 60;
                                            return (
                                                <option key={mins} value={mins}>
                                                    {hours >= 1 ? `${Math.floor(hours)} hr ` : ''}{mins % 60 > 0 ? `${mins % 60} min` : ''} ({mins} min)
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>Turnover Time (min)</span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '400' }}>avg room-flip time</span>
                                    </label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <input
                                            type="number"
                                            className="form-input"
                                            min={5}
                                            max={120}
                                            step={5}
                                            required
                                            placeholder="e.g. 20"
                                            value={formData.turnoverTime || ''}
                                            onChange={(e) => setFormData({ ...formData, turnoverTime: parseInt(e.target.value) || 20 })}
                                            style={{ width: '100%' }}
                                        />
                                        {/* Quick-pick preset buttons */}
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                            {[10, 15, 20, 25, 30, 45].map(t => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, turnoverTime: t })}
                                                    style={{
                                                        padding: '2px 8px',
                                                        fontSize: '0.72rem',
                                                        borderRadius: '4px',
                                                        border: '1px solid',
                                                        cursor: 'pointer',
                                                        fontWeight: '600',
                                                        transition: 'all 0.15s',
                                                        borderColor: formData.turnoverTime === t ? 'var(--color-blue)' : 'var(--border-color)',
                                                        background: formData.turnoverTime === t ? 'rgba(59,130,246,0.15)' : 'transparent',
                                                        color: formData.turnoverTime === t ? 'var(--color-blue)' : 'var(--text-secondary)'
                                                    }}
                                                >
                                                    {t}m
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* CPT Codes Selection */}
                            <div className="form-group">
                                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Select CPT Codes</span>
                                    {uniqueSelectedCodes.length > 0 && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-blue)', fontWeight: '700' }}>
                                            {uniqueSelectedCodes.length} Selected
                                        </span>
                                    )}
                                </label>
                                
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                    <div style={{ position: 'relative', flex: '1' }}>
                                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
                                        <input
                                            type="text"
                                            placeholder="Search code or description..."
                                            className="form-input"
                                            style={{ paddingLeft: '30px' }}
                                            value={cptSearchQuery}
                                            onChange={(e) => setCptSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    {availableBodyParts.length > 0 && (
                                        <select
                                            className="filter-select"
                                            value={selectedBodyPart}
                                            onChange={(e) => setSelectedBodyPart(e.target.value)}
                                        >
                                            <option value="">All Body Parts</option>
                                            {availableBodyParts.map(p => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px' }}>
                                    <div className="cpt-grid">
                                        {filteredCptCodes.map(c => {
                                            const isSelected = formData.selectedCptCodes.includes(c.code);
                                            return (
                                                <div
                                                    key={c.code}
                                                    className={`cpt-card ${isSelected ? 'selected' : ''}`}
                                                    onClick={() => handleCptToggle(c.code)}
                                                >
                                                    <div className="cpt-card-header">
                                                        <span className="cpt-code-badge">{c.code}</span>
                                                        <span className="cpt-price">{formatCurrency(c.reimbursement)}</span>
                                                    </div>
                                                    <span className="cpt-description">{c.description}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Supplies, Implants, Tray Cost, Medications, Labour, OR Room */}
                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '4px' }}>
                                <h4 style={{ fontSize: '0.85rem', color: '#fff', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>Material & Facility Expenses</h4>
                                {formData.selectedCptCodes.length === 0 ? (
                                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
                                        <div className="form-group">
                                            <label style={{ fontSize: '0.7rem' }}>Supply Cost</label>
                                            <div style={{ position: 'relative' }}>
                                                <DollarSign size={12} style={{ position: 'absolute', left: '10px', top: '14px', color: 'var(--text-muted)' }} />
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="form-input"
                                                    style={{ paddingLeft: '24px', paddingRight: '5px' }}
                                                    value={formData.suppliesCost || ''}
                                                    onChange={(e) => setFormData({ ...formData, suppliesCost: parseFloat(e.target.value) || 0 })}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label style={{ fontSize: '0.7rem' }}>Implants & Devices</label>
                                            <div style={{ position: 'relative' }}>
                                                <DollarSign size={12} style={{ position: 'absolute', left: '10px', top: '14px', color: 'var(--text-muted)' }} />
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="form-input"
                                                    style={{ paddingLeft: '24px', paddingRight: '5px' }}
                                                    value={formData.implantsCost || ''}
                                                    onChange={(e) => setFormData({ ...formData, implantsCost: parseFloat(e.target.value) || 0 })}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label style={{ fontSize: '0.7rem' }}>Tray Cost (New)</label>
                                            <div style={{ position: 'relative' }}>
                                                <DollarSign size={12} style={{ position: 'absolute', left: '10px', top: '14px', color: 'var(--text-muted)' }} />
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="form-input"
                                                    style={{ paddingLeft: '24px', paddingRight: '5px' }}
                                                    value={formData.trayCost || ''}
                                                    onChange={(e) => setFormData({ ...formData, trayCost: parseFloat(e.target.value) || 0 })}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label style={{ fontSize: '0.7rem' }}>Medications</label>
                                            <div style={{ position: 'relative' }}>
                                                <DollarSign size={12} style={{ position: 'absolute', left: '10px', top: '14px', color: 'var(--text-muted)' }} />
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="form-input"
                                                    style={{ paddingLeft: '24px', paddingRight: '5px' }}
                                                    value={formData.medicationsCost || ''}
                                                    onChange={(e) => setFormData({ ...formData, medicationsCost: parseFloat(e.target.value) || 0 })}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label style={{ fontSize: '0.7rem' }}>Labour Cost</label>
                                            <div style={{ position: 'relative' }}>
                                                <DollarSign size={12} style={{ position: 'absolute', left: '10px', top: '14px', color: 'var(--text-muted)' }} />
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="form-input"
                                                    style={{ paddingLeft: '24px', paddingRight: '5px' }}
                                                    value={formData.labourCost || ''}
                                                    onChange={(e) => setFormData({ ...formData, labourCost: parseFloat(e.target.value) || 0 })}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label style={{ fontSize: '0.7rem' }}>OR Room Cost</label>
                                            <div style={{ position: 'relative' }}>
                                                <DollarSign size={12} style={{ position: 'absolute', left: '10px', top: '14px', color: 'var(--text-muted)' }} />
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="form-input"
                                                    style={{ paddingLeft: '24px', paddingRight: '5px' }}
                                                    value={formData.orRoomCost || ''}
                                                    onChange={(e) => setFormData({ ...formData, orRoomCost: parseFloat(e.target.value) || 0 })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {formData.selectedCptCodes.map(code => (
                                            <div key={code} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--primary-color)' }}>CPT {code} Expenses</div>
                                                <div className="form-row" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
                                                    <div className="form-group">
                                                        <label style={{ fontSize: '0.7rem' }}>Supply Cost</label>
                                                        <div style={{ position: 'relative' }}>
                                                            <DollarSign size={12} style={{ position: 'absolute', left: '10px', top: '14px', color: 'var(--text-muted)' }} />
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                className="form-input"
                                                                style={{ paddingLeft: '24px', paddingRight: '5px' }}
                                                                value={formData.cptExpenses[code]?.suppliesCost || ''}
                                                                onChange={(e) => handleCptExpenseChange(code, 'suppliesCost', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="form-group">
                                                        <label style={{ fontSize: '0.7rem' }}>Implants & Devices</label>
                                                        <div style={{ position: 'relative' }}>
                                                            <DollarSign size={12} style={{ position: 'absolute', left: '10px', top: '14px', color: 'var(--text-muted)' }} />
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                className="form-input"
                                                                style={{ paddingLeft: '24px', paddingRight: '5px' }}
                                                                value={formData.cptExpenses[code]?.implantsCost || ''}
                                                                onChange={(e) => handleCptExpenseChange(code, 'implantsCost', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="form-group">
                                                        <label style={{ fontSize: '0.7rem' }}>Tray Cost (New)</label>
                                                        <div style={{ position: 'relative' }}>
                                                            <DollarSign size={12} style={{ position: 'absolute', left: '10px', top: '14px', color: 'var(--text-muted)' }} />
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                className="form-input"
                                                                style={{ paddingLeft: '24px', paddingRight: '5px' }}
                                                                value={formData.cptExpenses[code]?.trayCost || ''}
                                                                onChange={(e) => handleCptExpenseChange(code, 'trayCost', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="form-group">
                                                        <label style={{ fontSize: '0.7rem' }}>Medications</label>
                                                        <div style={{ position: 'relative' }}>
                                                            <DollarSign size={12} style={{ position: 'absolute', left: '10px', top: '14px', color: 'var(--text-muted)' }} />
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                className="form-input"
                                                                style={{ paddingLeft: '24px', paddingRight: '5px' }}
                                                                value={formData.cptExpenses[code]?.medicationsCost || ''}
                                                                onChange={(e) => handleCptExpenseChange(code, 'medicationsCost', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="form-group">
                                                        <label style={{ fontSize: '0.7rem' }}>Labour Cost</label>
                                                        <div style={{ position: 'relative' }}>
                                                            <DollarSign size={12} style={{ position: 'absolute', left: '10px', top: '14px', color: 'var(--text-muted)' }} />
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                className="form-input"
                                                                style={{ paddingLeft: '24px', paddingRight: '5px' }}
                                                                value={formData.cptExpenses[code]?.labourCost || ''}
                                                                onChange={(e) => handleCptExpenseChange(code, 'labourCost', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="form-group">
                                                        <label style={{ fontSize: '0.7rem' }}>OR Room Cost</label>
                                                        <div style={{ position: 'relative' }}>
                                                            <DollarSign size={12} style={{ position: 'absolute', left: '10px', top: '14px', color: 'var(--text-muted)' }} />
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                className="form-input"
                                                                style={{ paddingLeft: '24px', paddingRight: '5px' }}
                                                                value={formData.cptExpenses[code]?.orRoomCost || ''}
                                                                onChange={(e) => handleCptExpenseChange(code, 'orRoomCost', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {/* Show grand totals summary if multiple CPTs */}
                                        {formData.selectedCptCodes.length > 1 && (
                                            <div style={{ padding: '8px 12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>Surgery Grand Total Expenses:</span>
                                                <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: '#fff' }}>
                                                    <span>Supplies: {formatCurrency(formData.suppliesCost)}</span>
                                                    <span>Implants: {formatCurrency(formData.implantsCost)}</span>
                                                    <span>Tray: {formatCurrency(formData.trayCost)}</span>
                                                    <span>Meds: {formatCurrency(formData.medicationsCost)}</span>
                                                    <span>Labour: {formatCurrency(formData.labourCost)}</span>
                                                    <span>OR Room: {formatCurrency(formData.orRoomCost)}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Actual Timing overrides */}
                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '4px' }}>
                                <h4 style={{ fontSize: '0.85rem', color: '#fff', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>Actual Timing log (Post-Op)</h4>
                                <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                                    <div className="form-group">
                                        <label>Actual Start Time</label>
                                        <input
                                            type="time"
                                            className="form-input"
                                            value={formData.actualStartTime}
                                            onChange={(e) => setFormData({ ...formData, actualStartTime: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Actual End Time</label>
                                        <input
                                            type="time"
                                            className="form-input"
                                            value={formData.actualEndTime}
                                            onChange={(e) => {
                                                const start = formData.actualStartTime || formData.startTime;
                                                const end = e.target.value;
                                                let duration = formData.actualDurationMinutes;
                                                if (start && end) {
                                                    const [sH, sM] = start.split(':').map(Number);
                                                    const [eH, eM] = end.split(':').map(Number);
                                                    duration = (eH * 60 + eM) - (sH * 60 + sM);
                                                    if (duration < 0) duration += 1440;
                                                }
                                                setFormData({ ...formData, actualEndTime: end, actualDurationMinutes: duration });
                                            }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Actual Duration (Minutes)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="Auto-calculated"
                                            value={formData.actualDurationMinutes || ''}
                                            onChange={(e) => setFormData({ ...formData, actualDurationMinutes: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Write-offs and Pro-bono options */}
                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '4px' }}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Write-Off Amount ($)</label>
                                        <div style={{ position: 'relative' }}>
                                            <DollarSign size={12} style={{ position: 'absolute', left: '10px', top: '14px', color: 'var(--text-muted)' }} />
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="form-input"
                                                style={{ paddingLeft: '24px' }}
                                                value={formData.writeOff || ''}
                                                onChange={(e) => setFormData({ ...formData, writeOff: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '16px' }}>
                                        <input
                                            type="checkbox"
                                            id="isProbono"
                                            checked={formData.isProbono}
                                            onChange={(e) => setFormData({ ...formData, isProbono: e.target.checked })}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                        <label htmlFor="isProbono" style={{ fontSize: '0.85rem', color: '#fff', cursor: 'pointer', fontWeight: '600' }}>
                                            💗 Mark as Charity/Pro-Bono Case
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Financial Projection Box */}
                            <div style={{ marginTop: '24px', padding: '20px', borderRadius: '12px', border: '2px solid var(--success-color)', backgroundColor: 'rgba(16, 185, 129, 0.05)', position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-color)', fontWeight: '600' }}>Financial Projection</h3>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={includeLaborSupplies}
                                                onChange={(e) => setIncludeLaborSupplies(e.target.checked)}
                                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                            />
                                            Include Labor/Supplies
                                        </label>

                                    </div>
                                </div>

                                {(() => {
                                    let revenue = 0;
                                    formData.selectedCptCodes.forEach(code => {
                                        const cpt = cptCodes.find(c => String(c.code) === String(code));
                                        if (cpt) revenue += parseFloat(cpt.reimbursement || 0);
                                    });
                                    const room = parseFloat(formData.orRoomCost || 0);
                                    const labor = parseFloat(formData.labourCost || 0);
                                    const supplies = parseFloat(formData.suppliesCost || 0) + parseFloat(formData.implantsCost || 0) + parseFloat(formData.medicationsCost || 0) + parseFloat(formData.trayCost || 0);
                                    const internalCost = includeLaborSupplies ? (room + labor + supplies) : 0;
                                    const writeOff = parseFloat(formData.writeOff || 0);
                                    let netProfit = revenue - writeOff - internalCost;
                                    if (formData.isProbono) netProfit = 0;
                                    const isPositive = netProfit >= 0;

                                    return (
                                        <>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.85rem' }}>
                                                        <span style={{ color: 'var(--text-secondary)' }}>Rev (CPT+Fee):</span>
                                                        <span style={{ fontWeight: 'bold', color: 'var(--success-color)' }}>{formatCurrency(revenue)}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                                        <span style={{ color: 'var(--danger-color)' }}>Write-Off / Disc:</span>
                                                        <span style={{ fontWeight: 'bold', color: 'var(--danger-color)' }}>- {formatCurrency(writeOff)}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.85rem' }}>
                                                        <span style={{ color: 'var(--text-secondary)' }}>Actual Room Cost:</span>
                                                        <span style={{ fontWeight: 'bold', color: 'var(--danger-color)' }}>{formatCurrency(includeLaborSupplies ? room : 0)}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                                        <span style={{ color: 'var(--text-secondary)' }}>Actual Labor:</span>
                                                        <span style={{ fontWeight: 'bold', color: 'var(--danger-color)' }}>{formatCurrency(includeLaborSupplies ? labor : 0)}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                                                        <span style={{ color: 'var(--text-secondary)' }}>Supplies:</span>
                                                        <span style={{ fontWeight: 'bold', color: 'var(--danger-color)' }}>{formatCurrency(includeLaborSupplies ? parseFloat(formData.suppliesCost || 0) : 0)}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                                                        <span style={{ color: 'var(--text-secondary)' }}>Implants:</span>
                                                        <span style={{ fontWeight: 'bold', color: 'var(--danger-color)' }}>{formatCurrency(includeLaborSupplies ? parseFloat(formData.implantsCost || 0) : 0)}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                                                        <span style={{ color: 'var(--text-secondary)' }}>Tray:</span>
                                                        <span style={{ fontWeight: 'bold', color: 'var(--danger-color)' }}>{formatCurrency(includeLaborSupplies ? parseFloat(formData.trayCost || 0) : 0)}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                                        <span style={{ color: 'var(--text-secondary)' }}>Meds:</span>
                                                        <span style={{ fontWeight: 'bold', color: 'var(--danger-color)' }}>{formatCurrency(includeLaborSupplies ? parseFloat(formData.medicationsCost || 0) : 0)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '16px 0', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Full Total:</span>
                                                    {(() => {
                                                        const patientBillTotal = revenue - writeOff + internalCost;
                                                        return (
                                                            <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: patientBillTotal >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                                                                {formatCurrency(patientBillTotal)}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>

                            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
                                <button type="button" className="btn-cancel" onClick={handleCancelEdit}>Cancel</button>
                                <button type="submit" className="btn-save">{editingSurgery ? 'Save Changes' : 'Schedule Case'}</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Monthly Surgeries Log Tables */}
                <div>
                    <div className="content-card">
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3>Surgery Log Book</h3>
                                <p className="card-subtitle">Review MTD case list sorted by calendar month with itemized financials.</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="checkbox"
                                    id="toggle-labor-costs"
                                    checked={includeLaborSupplies}
                                    onChange={(e) => setIncludeLaborSupplies(e.target.checked)}
                                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                <label htmlFor="toggle-labor-costs" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '600' }}>
                                    Include Labor/Overhead in Margins
                                </label>
                            </div>
                        </div>

                        {availableMonths.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <Clock size={32} style={{ opacity: 0.2, marginBottom: '8px' }} />
                                <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>No surgeries scheduled.</div>
                            </div>
                        ) : (
                            availableMonths.map(monthKey => {
                                const monthSurgeries = surgeriesByMonth[monthKey] || [];
                                const isExpanded = expandedMonths.has(monthKey);

                                // Month total margin
                                const monthTotalMargin = monthSurgeries.reduce((sum, s) => {
                                    const { netProfit } = calculateSurgeryFinancials(s);
                                    return sum + netProfit;
                                }, 0);

                                // Pagination calculation
                                const currentPage = monthPages[monthKey] || 1;
                                const totalPages = Math.ceil(monthSurgeries.length / surgeriesPerPage);
                                const currentSurgeries = monthSurgeries.slice(
                                    (currentPage - 1) * surgeriesPerPage,
                                    currentPage * surgeriesPerPage
                                );

                                return (
                                    <div key={monthKey} style={{ marginBottom: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                                        {/* Month Header Accordion */}
                                        <div
                                            onClick={() => toggleMonth(monthKey)}
                                            style={{
                                                padding: '12px 16px',
                                                background: 'rgba(59, 130, 246, 0.05)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#fff' }}>
                                                    {formatMonthDisplay(monthKey)}
                                                </h4>
                                                <span style={{ fontSize: '0.7rem', padding: '1px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', color: 'var(--text-secondary)' }}>
                                                    {monthSurgeries.length} cases
                                                </span>
                                            </div>
                                            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: monthTotalMargin >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
                                                {formatCurrency(monthTotalMargin)}
                                            </span>
                                        </div>

                                        {isExpanded && (
                                            <div className="table-container">
                                                <table className="data-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Patient MRN</th>
                                                            <th>Date</th>
                                                            <th>Time</th>
                                                            <th>Surgeon</th>
                                                            <th>CPT Code(s)</th>
                                                            <th>Occupancy</th>
                                                            <th>Tray Cost</th>
                                                            <th>Net Margin</th>
                                                            <th>Status</th>
                                                            <th>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {currentSurgeries.map(s => {
                                                            const patientObj = patients.find(p => String(p.id) === String(s.patient_id));
                                                            const patientMrn = patientObj ? patientObj.mrn : (s.patients ? s.patients.mrn : '---');

                                                            // Parse CPT codes array
                                                            let selectedCpts = [];
                                                            if (Array.isArray(s.cpt_codes)) {
                                                                selectedCpts = s.cpt_codes;
                                                            } else if (typeof s.cpt_codes === 'string') {
                                                                selectedCpts = s.cpt_codes.split(',').map(str => str.trim()).filter(Boolean);
                                                            }

                                                            const { trayCost, netProfit } = calculateSurgeryFinancials(s);

                                                            return (
                                                                <tr key={s.id}>
                                                                    <td style={{ color: 'var(--color-blue)', fontWeight: '600' }}>{patientMrn}</td>
                                                                    <td>{s.date}</td>
                                                                    <td>{formatTimeForInput(s.start_time)}</td>
                                                                    <td style={{ fontWeight: '500' }}>{s.doctor_name}</td>
                                                                    <td>
                                                                        {selectedCpts.length > 0 ? (
                                                                            selectedCpts.map(code => (
                                                                                <span key={code} className="badge badge-blue" style={{ marginRight: '4px' }}>{code}</span>
                                                                            ))
                                                                        ) : (
                                                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>None</span>
                                                                        )}
                                                                    </td>
                                                                    <td>
                                                                        <div>{s.duration_minutes || 0}m + <span style={{ color: 'var(--color-orange)' }}>{s.turnover_time || 0}m</span></div>
                                                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>turnover</div>
                                                                    </td>
                                                                    <td style={{ fontFamily: 'monospace' }}>{formatCurrency(trayCost)}</td>
                                                                    <td style={{ fontWeight: '700', color: netProfit >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
                                                                        {formatCurrency(netProfit)}
                                                                    </td>
                                                                    <td>
                                                                        <span className={`status-badge status-${s.status}`}>
                                                                            {s.status}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        <div className="actions-cell">
                                                                            <button className="btn-icon btn-edit" title="Edit" onClick={() => handleEdit(s)}>
                                                                                <Edit size={12} />
                                                                            </button>
                                                                            {s.status !== 'completed' && s.status !== 'cancelled' && (
                                                                                <>
                                                                                    <button className="btn-icon btn-reschedule" title="Complete" onClick={() => handleCompleteSurgery(s.id)}>
                                                                                        <Check size={12} />
                                                                                    </button>
                                                                                    <button className="btn-icon btn-action-cancel" title="Cancel" onClick={() => handleCancelSurgery(s.id)}>
                                                                                        <AlertCircle size={12} />
                                                                                    </button>
                                                                                </>
                                                                            )}
                                                                            <button className="btn-icon" style={{ color: 'var(--color-red)' }} title="Delete" onClick={() => handleDeleteSurgery(s.id)}>
                                                                                <Trash2 size={12} />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>

                                                {/* Pagination controls */}
                                                {totalPages > 1 && (
                                                    <div className="pagination-controls">
                                                        <span>Page {currentPage} of {totalPages}</span>
                                                        <div style={{ display: 'flex', gap: '4px' }}>
                                                            <button
                                                                className="page-btn"
                                                                disabled={currentPage === 1}
                                                                onClick={() => setMonthPages({ ...monthPages, [monthKey]: currentPage - 1 })}
                                                            >
                                                                Prev
                                                            </button>
                                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                                                                <button
                                                                    key={num}
                                                                    className={`page-num ${num === currentPage ? 'active' : ''}`}
                                                                    onClick={() => setMonthPages({ ...monthPages, [monthKey]: num })}
                                                                >
                                                                    {num}
                                                                </button>
                                                            ))}
                                                            <button
                                                                className="page-btn"
                                                                disabled={currentPage === totalPages}
                                                                onClick={() => setMonthPages({ ...monthPages, [monthKey]: currentPage + 1 })}
                                                            >
                                                                Next
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SurgeryScheduler;
