// Generate a unique ID
export const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Validate phone number (Indian format)
export const validatePhone = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
};

// Validate time format (HH:mm)
export const validateTimeFormat = (time) => {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return timeRegex.test(time);
};

// Get initials from name
export const getInitials = (name) => {
    if (!name) return '?';
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

// Capitalize first letter
export const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Format role for display
export const formatRole = (role) => {
    const roleMap = {
        'super_admin': 'Super Admin',
        'admin': 'Admin',
        'staff': 'Staff',
    };
    return roleMap[role] || role;
};

// Format status for display
export const formatStatus = (status) => {
    const statusMap = {
        'active': 'Active',
        'on_notice': 'On Notice',
        'left': 'Left',
        'pending': 'Pending',
        'approved': 'Approved',
        'rejected': 'Rejected',
        'present': 'Present',
        'absent': 'Absent',
        'late': 'Late',
        'on_leave': 'On Leave',
        'holiday': 'Holiday',
    };
    return statusMap[status] || status;
};

// Deep clone object
export const deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
};

// Group array by key
export const groupBy = (array, key) => {
    return array.reduce((result, item) => {
        const group = item[key];
        if (!result[group]) {
            result[group] = [];
        }
        result[group].push(item);
        return result;
    }, {});
};

// Sort array by key
export const sortBy = (array, key, order = 'asc') => {
    return [...array].sort((a, b) => {
        if (order === 'asc') {
            return a[key] > b[key] ? 1 : -1;
        }
        return a[key] < b[key] ? 1 : -1;
    });
};

// Filter array by search term
export const filterBySearch = (array, searchTerm, keys) => {
    if (!searchTerm) return array;
    const term = searchTerm.toLowerCase();
    return array.filter(item =>
        keys.some(key => {
            const value = item[key];
            return value && value.toString().toLowerCase().includes(term);
        })
    );
};
