import { format, parse, differenceInMinutes, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, isSameDay, parseISO, addDays, subDays } from 'date-fns';

// Format date for display
export const formatDate = (date, formatStr = 'dd MMM yyyy') => {
    if (!date) return '';
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, formatStr);
};

// Format time for display
export const formatTime = (date, formatStr = 'hh:mm a') => {
    if (!date) return '';
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, formatStr);
};

// Get current date as ISO string (date only)
export const getCurrentDateString = () => {
    return format(new Date(), 'yyyy-MM-dd');
};

// Get current datetime as ISO string
export const getCurrentDateTimeString = () => {
    return new Date().toISOString();
};

// Parse time string (HH:mm) to minutes from midnight
export const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

// Calculate if check-in is late (considering grace period)
export const isCheckInLate = (checkInTime, startTime, gracePeriodMinutes = 15) => {
    const checkInMinutes = timeToMinutes(format(new Date(checkInTime), 'HH:mm'));
    const startMinutes = timeToMinutes(startTime);
    return checkInMinutes > (startMinutes + gracePeriodMinutes);
};

// Get working days in a month (excluding weekends and holidays)
export const getWorkingDaysInMonth = (year, month, holidays = []) => {
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));

    const allDays = eachDayOfInterval({ start, end });

    return allDays.filter(day => {
        // Exclude weekends (customize as needed)
        // if (isWeekend(day)) return false;

        // Exclude holidays
        const dayStr = format(day, 'yyyy-MM-dd');
        if (holidays.includes(dayStr)) return false;

        return true;
    }).length;
};

// Get days array for a month
export const getDaysInMonth = (year, month) => {
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));
    return eachDayOfInterval({ start, end });
};

// Check if date is today
export const isToday = (date) => {
    return isSameDay(new Date(), typeof date === 'string' ? parseISO(date) : date);
};

// Check if date is in the past
export const isPastDate = (date) => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
};

// Check if date is in the future
export const isFutureDate = (date) => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return d > today;
};

// Get month name
export const getMonthName = (month) => {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
};

// Get current month and year
export const getCurrentMonthYear = () => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
};
