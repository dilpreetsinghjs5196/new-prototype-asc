import * as XLSX from 'xlsx';

export const parseCaseLogExcel = (file, surgeonsList = []) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rawArray = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Find header row
        let headerRowIndex = -1;
        for (let i = 0; i < rawArray.length; i++) {
          const rowString = rawArray[i].join(' ').toLowerCase();
          if (rowString.includes('surgeon') || rowString.includes('cpt code')) {
            headerRowIndex = i;
            break;
          }
        }
        
        // Convert to JSON using the found header row
        let rawData = [];
        if (headerRowIndex !== -1) {
          rawData = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex, defval: '' });
        } else {
          rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        }
        
        // Normalize the data
        const normalizedData = normalizeData(rawData, surgeonsList);
        resolve(normalizedData);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

const normalizeData = (rawData, surgeonsList = []) => {
  const findKey = (obj, possibleKeys) => {
    const keys = Object.keys(obj);
    for (const pk of possibleKeys) {
      const match = keys.find(k => k.toLowerCase().includes(pk.toLowerCase()));
      if (match) return obj[match];
    }
    return null;
  };

  const normalized = rawData.map((row, index) => {
    const surgeon = findKey(row, ['surgeon', 'doctor', 'physician', 'provider']) || 'Unknown Surgeon';
    let specialty = findKey(row, ['specialty', 'department', 'category']);
    
    if (!specialty && surgeonsList.length > 0) {
      // Helper for Levenshtein distance
      const getDistance = (a, b) => {
        if(a.length === 0) return b.length;
        if(b.length === 0) return a.length;
        const matrix = [];
        for(let i = 0; i <= b.length; i++){ matrix[i] = [i]; }
        for(let j = 0; j <= a.length; j++){ matrix[0][j] = j; }
        for(let i = 1; i <= b.length; i++){
          for(let j = 1; j <= a.length; j++){
            if(b.charAt(i-1) == a.charAt(j-1)){
              matrix[i][j] = matrix[i-1][j-1];
            } else {
              matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, Math.min(matrix[i][j-1] + 1, matrix[i-1][j] + 1));
            }
          }
        }
        return matrix[b.length][a.length];
      };

      const match = surgeonsList.find(s => {
        const searchName = surgeon.toLowerCase().trim();
        const last = (s.lastname || '').toLowerCase().trim();
        const first = (s.firstname || '').toLowerCase().trim();
        const full = `${first} ${last}`.trim();
        
        // Exact substring matches
        if (last && (searchName.includes(last) || last.includes(searchName))) return true;
        if (first && (searchName.includes(first) || first.includes(searchName))) return true;
        
        // Tokenized matches (for cases like "Shell Masouras Troy")
        const searchTokens = searchName.split(/\s+/);
        const lastTokens = last.split(/\s+/);
        for (const sTok of searchTokens) {
           for (const lTok of lastTokens) {
              if (sTok.length > 4 && lTok.length > 4) {
                 if (getDistance(sTok, lTok) <= 2) return true; // Allows 2 typos (e.g. ie vs ei)
              }
           }
        }

        return false;
      });
      if (match && match.specialty) {
        specialty = match.specialty;
      }
    }
    specialty = specialty || 'Unknown Specialty';

    const cptCode = findKey(row, ['cpt', 'code', 'cptcode']) || '00000';
    const procedureName = findKey(row, ['procedure', 'desc', 'surgery']) || 'Unknown Procedure';
    
    // Parse duration
    let duration = findKey(row, ['duration', 'time', 'minutes', 'length', 'actual or time', 'or time booked']);
    let caseDurationMinutes = 60; // Default
    let durationSource = 'estimated';
    if (typeof duration === 'number') {
      caseDurationMinutes = duration;
      durationSource = 'historical_case';
    } else if (typeof duration === 'string') {
      const parsed = parseInt(duration.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(parsed)) {
        caseDurationMinutes = parsed;
        durationSource = 'historical_case';
      }
    }

    // Parse charge
    let charge = findKey(row, ['charge', 'fee', 'cost', 'amount', 'price', 'expected reimbursement', 'actual reimbursement']);
    let chargeAmount = 0;
    if (typeof charge === 'number') {
      chargeAmount = charge;
    } else if (typeof charge === 'string') {
      const parsed = parseFloat(charge.replace(/[^0-9.]/g, ''));
      if (!isNaN(parsed)) chargeAmount = parsed;
    }

    // Parse date
    let rawDate = findKey(row, ['date', 'scheduled', 'date of service']);
    let historicalDate = new Date().toISOString().split('T')[0];
    if (typeof rawDate === 'number') {
      // Excel serial date
      const excelEpoch = new Date(1899, 11, 30);
      historicalDate = new Date(excelEpoch.getTime() + rawDate * 86400000).toISOString().split('T')[0];
    } else if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) historicalDate = d.toISOString().split('T')[0];
    }

    // Attempt to extract an existing ID if any, else generate
    let existingId = findKey(row, ['pt id', 'patient id', 'case id']);
    let caseId = existingId ? String(existingId) : `CASE-${String(index + 1).padStart(4, '0')}`;

    return {
      caseId: caseId,
      sourceRow: index + 1, // 1-indexed
      surgeonName: surgeon,
      specialty: specialty,
      cptCode: String(cptCode),
      procedureName: procedureName,
      historicalDate: historicalDate,
      caseDurationMinutes: caseDurationMinutes,
      durationSource: durationSource,
      orRoom: findKey(row, ['or', 'room', 'operating']) || 'OR-1',
      caseType: findKey(row, ['type', 'class']) || 'Elective',
      chargeAmount: chargeAmount,
      originalRowData: row
    };
  }).filter(item => item.surgeonName !== 'Unknown Surgeon' && item.surgeonName.trim() !== '');

  // Remove strictly identical duplicate cases if any (same ID and content), but preserve all valid distinct cases.
  const uniqueMap = new Map();
  normalized.forEach(item => {
    // Generate a composite key just to be safe if ID is duplicate
    const key = `${item.caseId}-${item.surgeonName}-${item.cptCode}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item);
    }
  });

  return Array.from(uniqueMap.values());
};
