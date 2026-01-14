import { LATE_RULES, BUSINESS_RULES } from '../constants';

// Calculate daily salary from monthly
export const calculateDailySalary = (monthlySalary, workingDays) => {
    if (!monthlySalary || !workingDays) return 0;
    return Math.round(monthlySalary / workingDays);
};

// Calculate late penalty based on late count
export const calculateLatePenalty = (lateCount, dailySalary) => {
    let totalPenalty = 0;

    for (let i = 1; i <= lateCount; i++) {
        if (i <= 2) {
            // Warning only, no penalty
            continue;
        } else if (i === 3) {
            // ₹200 fine
            totalPenalty += BUSINESS_RULES.LATE_FINE_AMOUNT;
        } else if (i === 4) {
            // Half-day deduction
            totalPenalty += dailySalary / 2;
        } else {
            // 5th and onwards - full day absent
            totalPenalty += dailySalary;
        }
    }

    return Math.round(totalPenalty);
};

// Get late rule message for a specific late count
export const getLateRuleMessage = (lateCount) => {
    if (lateCount <= 0) return null;
    if (lateCount <= 5) {
        return LATE_RULES[lateCount];
    }
    return {
        type: 'ABSENT',
        penalty: 1,
        message: `${lateCount}th late - Marked absent`
    };
};

// Calculate monthly salary
export const calculateMonthlySalary = ({
    baseSalary,
    workingDays,
    presentDays,
    absentDays,
    lateCount,
    leavesUsed,
    advanceAmount = 0,
}) => {
    const dailySalary = calculateDailySalary(baseSalary, workingDays);

    // Absent deduction
    const absentDeduction = absentDays * dailySalary;

    // Late penalties
    const latePenalty = calculateLatePenalty(lateCount, dailySalary);

    // Bonus for perfect attendance (no leaves taken)
    const bonus = leavesUsed === 0 ? BUSINESS_RULES.PERFECT_ATTENDANCE_BONUS : 0;

    // Final calculation
    const totalDeductions = absentDeduction + latePenalty + advanceAmount;
    const finalAmount = baseSalary - totalDeductions + bonus;

    return {
        baseSalary,
        workingDays,
        presentDays,
        absentDays,
        lateCount,
        dailySalary,
        absentDeduction: Math.round(absentDeduction),
        latePenalty: Math.round(latePenalty),
        advanceDeduction: advanceAmount,
        bonus,
        totalDeductions: Math.round(totalDeductions),
        finalAmount: Math.max(0, Math.round(finalAmount)),
    };
};

// Format currency (INR)
export const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
};

// Calculate distance between two coordinates (in meters)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
};

// Check if user is within store radius
export const isWithinRadius = (userLat, userLon, storeLat, storeLon, radius) => {
    const distance = calculateDistance(userLat, userLon, storeLat, storeLon);
    return distance <= radius;
};
