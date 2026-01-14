import { db } from './database';
import { calculateMonthlySalary, calculateLatePenalty } from '../utils/calculations';
import { getWorkingDaysInMonth, getCurrentMonthYear } from '../utils/dateUtils';
import { generateId } from '../utils/helpers';
import { ATTENDANCE_STATUS, LEAVE_STATUS, BUSINESS_RULES } from '../constants';

// Calculate salary for a staff member for a specific month
export const calculateStaffSalary = async (staffId, year, month) => {
    try {
        // Get staff info
        const staff = await db.staff.getById(staffId);
        if (!staff) throw new Error('Staff not found');

        // Get store info for holidays
        const store = await db.stores.getById(staff.storeId);
        const holidays = (store?.holidayDates || []).map(h => h.date);

        // Calculate working days
        const workingDays = getWorkingDaysInMonth(year, month, holidays);

        // Get attendance records for the month
        const attendance = await db.attendance.getByStaffAndMonth(staffId, year, month);

        // Get approved leaves for the month
        const monthStr = `${year}-${String(month).padStart(2, '0')}`;
        const allLeaves = await db.leaveRequests.getByStaffId(staffId);
        const approvedLeaves = allLeaves.filter(l =>
            l.status === LEAVE_STATUS.APPROVED && l.leaveDate.startsWith(monthStr)
        );

        // Count statistics
        let presentDays = 0;
        let lateDays = 0;
        let absentDays = 0;

        attendance.forEach(record => {
            if (record.status === ATTENDANCE_STATUS.PRESENT) {
                presentDays++;
            } else if (record.status === ATTENDANCE_STATUS.LATE) {
                presentDays++;
                lateDays++;
            } else if (record.status === ATTENDANCE_STATUS.ABSENT) {
                absentDays++;
            }
        });

        // Days on leave
        const leaveDays = approvedLeaves.length;

        // Calculate absent days (working days - present - leave - recorded absents)
        const attendedDays = presentDays + leaveDays + absentDays;
        const unaccountedDays = Math.max(0, workingDays - attendedDays);
        absentDays += unaccountedDays; // Unaccounted days = absent

        // Get undeducted advances
        const advances = await db.salaryAdvances.getUndeductedByStaffId(staffId);
        const totalAdvances = advances.reduce((sum, a) => sum + a.amount, 0);

        // Calculate salary
        const salaryBreakdown = calculateMonthlySalary({
            baseSalary: staff.monthlySalary,
            workingDays,
            presentDays,
            absentDays,
            lateCount: lateDays,
            leavesUsed: leaveDays,
            advanceAmount: totalAdvances,
        });

        return {
            staffId,
            staffName: staff.name,
            year,
            month,
            ...salaryBreakdown,
            leavesUsed: leaveDays,
            advances: totalAdvances,
        };
    } catch (error) {
        console.error('Error calculating salary:', error);
        throw error;
    }
};

// Save salary record and lock month
export const saveMonthlySalary = async (staffId, year, month) => {
    try {
        // Check if already locked
        const existing = await db.monthlySalary.getByStaffAndMonth(staffId, year, month);
        if (existing?.isLocked) {
            throw new Error('Salary already locked for this month');
        }

        // Calculate salary
        const salary = await calculateStaffSalary(staffId, year, month);

        const salaryRecord = {
            id: existing?.id || generateId(),
            staffId,
            year,
            month,
            baseSalary: salary.baseSalary,
            workingDays: salary.workingDays,
            presentDays: salary.presentDays,
            absentDays: salary.absentDays,
            lateCount: salary.lateCount,
            latePenalty: salary.latePenalty,
            absentDeduction: salary.absentDeduction,
            advanceDeduction: salary.advanceDeduction,
            bonus: salary.bonus,
            finalAmount: salary.finalAmount,
            isLocked: true,
            calculatedAt: new Date().toISOString(),
        };

        if (existing) {
            await db.monthlySalary.update(existing.id, salaryRecord);
        } else {
            await db.monthlySalary.add(salaryRecord);
        }

        // Mark advances as deducted
        const advances = await db.salaryAdvances.getUndeductedByStaffId(staffId);
        for (const advance of advances) {
            await db.salaryAdvances.update(advance.id, { isDeducted: true });
        }

        return salaryRecord;
    } catch (error) {
        console.error('Error saving salary:', error);
        throw error;
    }
};

// Get salary history for staff
export const getSalaryHistory = async (staffId) => {
    try {
        const salaries = await db.monthlySalary.getByStaffId(staffId);
        salaries.sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
        });
        return salaries;
    } catch (error) {
        console.error('Error getting salary history:', error);
        return [];
    }
};

// Add salary advance
export const addSalaryAdvance = async (staffId, amount, givenBy) => {
    try {
        const advance = {
            id: generateId(),
            staffId,
            amount,
            givenDate: new Date().toISOString().split('T')[0],
            givenBy,
            isDeducted: false,
        };
        await db.salaryAdvances.add(advance);
        return advance;
    } catch (error) {
        console.error('Error adding advance:', error);
        throw error;
    }
};

export default {
    calculateStaffSalary,
    saveMonthlySalary,
    getSalaryHistory,
    addSalaryAdvance,
};
