// backend/utils/timezone.js
const TIMEZONE = 'Asia/Manila';

/**
 * Convert UTC date to Philippine timezone
 */
const utcToPhilippineTime = (utcDate) => {
    if (!utcDate) return null;
    const date = new Date(utcDate);
    return new Date(date.toLocaleString('en-US', { timeZone: TIMEZONE }));
};

/**
 * Convert Philippine local time to UTC for storage
 * @param {Date|string} phDate - Philippine local date/time
 * @returns {Date} UTC date
 */
const philippineTimeToUTC = (phDate) => {
    if (!phDate) return null;
    const date = new Date(phDate);
    // Get the timezone offset in minutes and convert to milliseconds
    const offset = date.getTimezoneOffset();
    // Create UTC date by subtracting the offset
    const utcDate = new Date(date.getTime() - (offset * 60 * 1000));
    return utcDate;
};

/**
 * Format date for API response
 */
const formatForAPI = (date) => {
    if (!date) return null;
    return new Date(date).toISOString();
};

/**
 * Check if current time is within range (Philippine timezone)
 */
const isWithinRange = (startDate, endDate) => {
    const now = new Date();
    const phNow = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date(8640000000000000);
    
    return phNow >= start && phNow <= end;
};

/**
 * Convert UTC string to Philippine timezone formatted string
 */
const formatUTCToPhilippineString = (utcDateString, format = 'datetime') => {
    if (!utcDateString) return null;
    const date = new Date(utcDateString);
    
    if (format === 'date') {
        return date.toLocaleDateString('en-US', { timeZone: TIMEZONE });
    } else if (format === 'time') {
        return date.toLocaleTimeString('en-US', { timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit' });
    } else {
        return date.toLocaleString('en-US', { timeZone: TIMEZONE });
    }
};

module.exports = {
    TIMEZONE,
    utcToPhilippineTime,
    philippineTimeToUTC,
    formatForAPI,
    isWithinRange,
    formatUTCToPhilippineString
};