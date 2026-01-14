// App-wide constants
export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    STAFF: 'staff',
};

export const STAFF_STATUS = {
    ACTIVE: 'active',
    ON_NOTICE: 'on_notice',
    LEFT: 'left',
};

export const LEAVE_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
};

export const LEAVE_TYPE = {
    PAID: 'paid',
    UNPAID: 'unpaid',
};

export const ATTENDANCE_STATUS = {
    PRESENT: 'present',
    ABSENT: 'absent',
    LATE: 'late',
    ON_LEAVE: 'on_leave',
    HOLIDAY: 'holiday',
};

// Late rules configuration
export const LATE_RULES = {
    1: { type: 'WARNING', penalty: 0, message: '1st late - Warning issued' },
    2: { type: 'WARNING', penalty: 0, message: '2nd late - Final warning' },
    3: { type: 'FINE', penalty: 200, message: '3rd late - ₹200 fine' },
    4: { type: 'HALF_DAY', penalty: 0.5, message: '4th late - Half-day deducted' },
    5: { type: 'ABSENT', penalty: 1, message: '5th late - Marked absent' },
    // 6+ each counted as absent
};

// Business rules
export const BUSINESS_RULES = {
    GRACE_PERIOD_MINUTES: 15,
    MAX_LEAVES_PER_MONTH: 2,
    PERFECT_ATTENDANCE_BONUS: 500,
    LATE_FINE_AMOUNT: 200,
    DEFAULT_LOCATION_RADIUS_METERS: 100,
};

// Storage keys
export const STORAGE_KEYS = {
    USER_DATA: 'user_data',
    DEVICE_ID: 'device_id',
    AUTH_TOKEN: 'auth_token',
    STORES: 'stores',
    STAFF: 'staff',
    ADMINS: 'admins',
    ATTENDANCE: 'attendance',
    LEAVE_REQUESTS: 'leave_requests',
    SALARY_ADVANCES: 'salary_advances',
    MONTHLY_SALARY: 'monthly_salary',
    NOTIFICATIONS: 'notifications',
    DEVICE_REQUESTS: 'device_requests',
};

// Screen names
export const SCREENS = {
    // Auth
    LOGIN: 'Login',
    REGISTER_DEVICE: 'RegisterDevice',

    // Super Admin
    SA_DASHBOARD: 'SuperAdminDashboard',
    SA_STORES: 'Stores',
    SA_ADMINS: 'Admins',
    SA_GLOBAL_LEAVES: 'GlobalLeaves',
    SA_REPORTS: 'GlobalReports',
    SA_SETTINGS: 'Settings',

    // Admin
    ADMIN_DASHBOARD: 'AdminDashboard',
    ADMIN_STAFF: 'StaffList',
    ADMIN_STAFF_DETAIL: 'StaffDetail',
    ADMIN_ATTENDANCE: 'Attendance',
    ADMIN_LEAVES: 'LeaveApprovals',
    ADMIN_SALARY: 'SalaryManager',
    ADMIN_REPORTS: 'StoreReports',

    // Staff
    STAFF_DASHBOARD: 'StaffDashboard',
    STAFF_CHECK_IN: 'CheckIn',
    STAFF_ATTENDANCE: 'MyAttendance',
    STAFF_LEAVE: 'LeaveApplication',
    STAFF_SALARY: 'MySalary',
    STAFF_RULES: 'CompanyRules',
};
