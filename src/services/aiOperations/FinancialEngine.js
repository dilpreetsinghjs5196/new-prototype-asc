/**
 * Financial Engine Module
 * Calculates comprehensive costs and Net Profit.
 * Reusable across the application for optimization and historical profiling.
 */

import { calculateORCost as utilCalculateORCost } from '../../utils/hospitalUtils';

/**
 * Calculates a detailed financial breakdown and pure Net Profit.
 * Formula: Gross Charge - (OR + Labor + Supplies + Implant + Recovery + Cleaning)
 */
export const calculateNetProfit = ({
    grossCharge,
    durationMinutes,
    suppliesCost,
    implantCost,
}) => {
    // 1. OR Cost
    const orCost = utilCalculateORCost(durationMinutes);
    
    // 2. Labor Cost ($15/min of OR time)
    const laborCost = durationMinutes * 15;
    
    // 3. Recovery Cost ($10/min of OR time to predict PACU utilization)
    const recoveryCost = durationMinutes * 10;
    
    // 4. Cleaning Cost (Flat $150 per turnover)
    const cleaningCost = 150;
    
    // Total Costs
    const totalCost = orCost + laborCost + suppliesCost + implantCost + recoveryCost + cleaningCost;
    
    // Net Profit
    const netProfit = grossCharge - totalCost;
    
    return {
        orCost,
        laborCost,
        suppliesCost,
        implantCost,
        recoveryCost,
        cleaningCost,
        totalCost,
        netProfit
    };
};

export const estimateFinancials = (cpt, duration, avgSuppliesCost, avgImplantCost = 0) => {
    const grossCharge = parseFloat(cpt.gross_charge || cpt.reimbursement || 0);
    
    // Use average supplies cost, capped reasonably to avoid massive outlier distortion
    const suppliesCost = Math.min(avgSuppliesCost, grossCharge * 0.4) || 200;
    const implantCost = avgImplantCost || 0;
    
    const financials = calculateNetProfit({
        grossCharge,
        durationMinutes: duration,
        suppliesCost,
        implantCost
    });
    
    return {
        estimatedORCost: financials.orCost,
        estimatedLaborCost: financials.laborCost,
        estimatedSuppliesCost: financials.suppliesCost,
        estimatedImplantCost: financials.implantCost,
        estimatedRecoveryCost: financials.recoveryCost,
        estimatedCleaningCost: financials.cleaningCost,
        totalCost: financials.totalCost,
        estimatedProfit: financials.netProfit,
        reimbursement: grossCharge
    };
};
