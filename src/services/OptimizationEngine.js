/**
 * REAL ASC Case-Level Scheduling Engine
 * Treats normalized historical data as the pool of available cases.
 * Generates true OR schedules by assigning actual cases to time slots.
 */

export const generateOptimizationModels = (normalizedData, config) => {
  const { activeORs, operatingDays, dailyMinutes, targetUtilization, maxSurgeonDays } = config;

  // 1. Build Surgeon Intelligence
  const surgeonProfiles = {};
  const cptProfiles = {};
  
  // Array of cases we can schedule from
  const availableCases = [...normalizedData].filter(c => c.caseDurationMinutes > 0);
  
  const totalAvailableCases = availableCases.length;

  availableCases.forEach(row => {
    // Surgeon
    if (!surgeonProfiles[row.surgeonName]) {
      surgeonProfiles[row.surgeonName] = {
        name: row.surgeonName,
        specialty: row.specialty,
        totalCases: 0,
        totalMinutes: 0,
        durations: [],
        weekdayDistribution: {
          'Monday': 0, 'Tuesday': 0, 'Wednesday': 0, 'Thursday': 0, 'Friday': 0
        },
        scheduledDays: new Set()
      };
    }
    const sProfile = surgeonProfiles[row.surgeonName];
    sProfile.totalCases++;
    sProfile.totalMinutes += row.caseDurationMinutes;
    sProfile.durations.push(row.caseDurationMinutes);
    
    const dayOfWeek = new Date(row.historicalDate).toLocaleDateString('en-US', { weekday: 'long' });
    if (sProfile.weekdayDistribution[dayOfWeek] !== undefined) {
      sProfile.weekdayDistribution[dayOfWeek]++;
    }
    
    // CPT
    if (!cptProfiles[row.cptCode]) {
      cptProfiles[row.cptCode] = {
        code: row.cptCode,
        procedureName: row.procedureName,
        totalCases: 0,
        durations: []
      };
    }
    const cProfile = cptProfiles[row.cptCode];
    cProfile.totalCases++;
    cProfile.durations.push(row.caseDurationMinutes);
  });

  // Calculate averages/medians and dynamically detect allowed future days
  Object.values(surgeonProfiles).forEach(sp => {
    sp.averageDuration = Math.round(sp.totalMinutes / sp.totalCases) || 60;
    
    // Determine allowed operating days purely from historical case log presence
    sp.allowedFutureDays = Object.keys(sp.weekdayDistribution).filter(day => sp.weekdayDistribution[day] > 0);
  });

  // Calculate ASC Capacity
  const dailyCapacity = activeORs * dailyMinutes; 
  const weeklyAvailableMinutes = dailyCapacity * operatingDays;
  const targetMinutesPerDay = dailyCapacity * (targetUtilization / 100);

  // Time manipulation helper
  const addMinutes = (timeStr, minsToAdd) => {
    const [h, m] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    date.setMinutes(date.getMinutes() + minsToAdd);
    return date.toTimeString().substring(0, 5);
  };

  const validateUniqueCaseAssignment = (schedule) => {
    const assignedIds = new Set();
    const errors = [];
    
    schedule.forEach(row => {
      // Hard Constraint: Surgeon must historically operate on this day
      const sProfile = surgeonProfiles[row.surgeonName];
      if (sProfile && !sProfile.allowedFutureDays.includes(row.day)) {
        errors.push(`Surgeon ${row.surgeonName} is scheduled on ${row.day}, but ${row.day} was not found in the current uploaded case log.`);
      }

      row.casesList?.forEach(c => {
        if (assignedIds.has(c.caseId)) {
          errors.push(`${c.caseId} is assigned more than once`);
        }
        assignedIds.add(c.caseId);
      });
    });

    return {
      valid: errors.length === 0,
      errors
    };
  };

  const calculateScore = (modelType, overallUtilization, targetUtilization, validation) => {
    if (!validation.valid) return { score: 0, status: 'INVALID' };

    let score = 80;
    const utilDiff = Math.abs(overallUtilization - targetUtilization);
    
    // Penalize heavily for missing utilization target
    score -= (utilDiff * 0.5);

    if (modelType === 'High Utilization') score += 5;
    if (modelType === 'Conservative') score += (utilDiff > 20 ? -10 : 2); // Rewards lower utilization slightly
    if (modelType === 'Revenue Optimized') score += 4;
    if (modelType === 'Balanced') score += 3;
    if (modelType === 'Surgeon Balanced') score += 3;

    return { score: Math.max(0, Math.min(100, score)).toFixed(1), status: 'VALID' };
  };

  const generateSchedule = (modelType) => {
    const scheduleSummary = [];
    let pool = [...availableCases]; // Clone pool for this model
    
    // Group cases by surgeon first to enforce block scheduling (prevent interleaving), 
    // then apply model-specific sorting logic within the blocks.
    pool.sort((a, b) => {
      // 1. Group by surgeon
      if (a.surgeonName !== b.surgeonName) {
        return a.surgeonName.localeCompare(b.surgeonName);
      }
      
      // 2. Sort within the surgeon's block based on model objective
      if (modelType === 'High Utilization') {
        return b.caseDurationMinutes - a.caseDurationMinutes; // Best-Fit Decreasing
      } else if (modelType === 'Revenue Optimized') {
        return (b.chargeAmount || 0) - (a.chargeAmount || 0);
      } else if (modelType === 'Surgeon Balanced') {
        return surgeonProfiles[a.surgeonName].totalCases - surgeonProfiles[b.surgeonName].totalCases;
      } else {
        return a.caseDurationMinutes - b.caseDurationMinutes; // Balanced / Conservative
      }
    });

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].slice(0, operatingDays);
    
    let totalScheduledMinutes = 0;
    let scheduledCaseCount = 0;
    
    // Reset surgeon scheduled days tracking
    Object.values(surgeonProfiles).forEach(sp => sp.scheduledDays.clear());

    days.forEach(day => {
      // Track how many cases each surgeon is assigned on this specific day
      const surgeonDailyCount = {};

      for (let orIndex = 1; orIndex <= activeORs; orIndex++) {
        const orName = `OR-${orIndex}`;
        let currentOrMinutes = 0;
        let currentTime = '08:00';
        
        let targetForThisOR = dailyMinutes * (targetUtilization / 100);
        if (modelType === 'High Utilization') targetForThisOR = dailyMinutes * 0.95; // Try to pack
        if (modelType === 'Conservative') targetForThisOR = dailyMinutes * (Math.max(40, targetUtilization - 10) / 100);

        // We will assign cases to this OR until we hit target or run out of valid cases
        const dailyAssignedCases = [];
        let assignedSurgeon = null;

        for (let i = 0; i < pool.length; i++) {
          if (currentOrMinutes >= targetForThisOR) break;
          
          const candidateCase = pool[i];
          const sProfile = surgeonProfiles[candidateCase.surgeonName];

          // Hard constraint: Surgeon historically operates on this day
          if (!sProfile.allowedFutureDays.includes(day)) {
            continue;
          }

          // Hard constraint: Limit to historical volume for this specific weekday
          const historicalLimit = sProfile.weekdayDistribution[day] || 0;
          const currentAssignedCount = surgeonDailyCount[candidateCase.surgeonName] || 0;
          if (currentAssignedCount >= historicalLimit) {
            continue;
          }

          // Hard constraint: Surgeon day limits
          if (!sProfile.scheduledDays.has(day) && sProfile.scheduledDays.size >= maxSurgeonDays) {
            continue; // Can't schedule this surgeon on a new day
          }

          // Hard constraint: Don't exceed OR capacity
          if (currentOrMinutes + candidateCase.caseDurationMinutes > dailyMinutes) {
            continue;
          }

          // Soft constraint: Try to keep same surgeon in OR block to minimize turnover conflicts
          if (assignedSurgeon && assignedSurgeon !== candidateCase.surgeonName) {
            // In a real ASC, we usually want block scheduling. For now, allow mixed ORs if needed, 
            // but strongly prefer sticking to the same surgeon if they have more cases.
            // Let's only mix if the model is 'High Utilization'.
            if (modelType !== 'High Utilization' && modelType !== 'Revenue Optimized') {
              continue; 
            }
          }

          // Schedule case
          const startTime = currentTime;
          const endTime = addMinutes(startTime, candidateCase.caseDurationMinutes);
          
          dailyAssignedCases.push({
            ...candidateCase,
            scheduledDay: day,
            scheduledOR: orName,
            startTime,
            endTime
          });

          // Update tracking
          currentOrMinutes += candidateCase.caseDurationMinutes;
          currentTime = addMinutes(endTime, 15); // 15 min turnover time assumed
          sProfile.scheduledDays.add(day);
          assignedSurgeon = candidateCase.surgeonName;
          surgeonDailyCount[candidateCase.surgeonName] = (surgeonDailyCount[candidateCase.surgeonName] || 0) + 1;
          
          // Remove from pool
          pool.splice(i, 1);
          i--; // Adjust index after removal
        }

        if (dailyAssignedCases.length > 0) {
          totalScheduledMinutes += currentOrMinutes;
          scheduledCaseCount += dailyAssignedCases.length;
          
          // Group by surgeon for summary view
          const casesBySurgeon = {};
          dailyAssignedCases.forEach(c => {
            if (!casesBySurgeon[c.surgeonName]) {
              casesBySurgeon[c.surgeonName] = { cases: [], totalMinutes: 0, specialty: c.specialty };
            }
            casesBySurgeon[c.surgeonName].cases.push(c);
            casesBySurgeon[c.surgeonName].totalMinutes += c.caseDurationMinutes;
          });

          Object.keys(casesBySurgeon).forEach(sName => {
            scheduleSummary.push({
              day,
              or: orName,
              surgeon: sName,
              specialty: casesBySurgeon[sName].specialty,
              cases: casesBySurgeon[sName].cases.length,
              minutes: casesBySurgeon[sName].totalMinutes,
              utilization: Math.round((casesBySurgeon[sName].totalMinutes / dailyMinutes) * 100),
              casesList: casesBySurgeon[sName].cases
            });
          });
        }
      }
    });

    const weeklyUtilization = (totalScheduledMinutes / weeklyAvailableMinutes) * 100;
    
    // Validation
    const validation = validateUniqueCaseAssignment(scheduleSummary);
    const { score, status } = calculateScore(modelType, weeklyUtilization, targetUtilization, validation);

    return {
      id: modelType.toLowerCase().replace(' ', '_'),
      name: modelType,
      score: score,
      valid: validation.valid,
      validationErrors: validation.errors,
      utilization: weeklyUtilization.toFixed(1),
      scheduledCases: scheduledCaseCount,
      scheduledMinutes: totalScheduledMinutes,
      schedule: scheduleSummary,
      risk: modelType === 'Conservative' ? 'Low' : (weeklyUtilization > 90 ? 'High' : 'Medium')
    };
  };

  const generatedModels = [
    generateSchedule('Balanced'),
    generateSchedule('High Utilization'),
    generateSchedule('Conservative'),
    generateSchedule('Revenue Optimized'),
    generateSchedule('Surgeon Balanced')
  ];

  // Filter valid models and sort by score
  const validModels = generatedModels.filter(m => m.valid && parseFloat(m.score) > 0);
  validModels.sort((a, b) => parseFloat(b.score) - parseFloat(a.score));

  let recommendedModel = validModels.length > 0 ? validModels[0] : null;
  
  // If user selected a specific optimization objective, force that model to be recommended
  if (config.optimizationObjective && validModels.some(m => m.name === config.optimizationObjective)) {
    recommendedModel = validModels.find(m => m.name === config.optimizationObjective);
  }

  return {
    configuration: config,
    sourceData: {
      totalCases: totalAvailableCases,
      uniqueCases: totalAvailableCases,
      surgeons: Object.keys(surgeonProfiles).length
    },
    surgeonIntelligence: surgeonProfiles,
    capacity: {
      dailyCapacity,
      weeklyAvailableMinutes,
      activeORs,
      operatingDays
    },
    models: generatedModels, // Return all so UI can show invalid ones as 0 score
    recommendedModel: recommendedModel
  };
};
