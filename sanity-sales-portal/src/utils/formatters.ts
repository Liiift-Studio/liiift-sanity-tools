// Utility functions for formatting data in the sales portal

/**
 * Format currency values for display
 */
export const formatCurrency = (amount: number): string => {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount);
};

/**
 * Format percentage values
 */
export const formatPercentage = (value: number): string => {
	const sign = value >= 0 ? '+' : '';
	return `${sign}${value.toFixed(1)}%`;
};

/**
 * Calculate percentage change between two values
 */
export const calculatePercentageChange = (current: number, previous: number): number | null => {
	if (previous === 0 || previous === null || previous === undefined) {
		return null;
	}
	return ((current - previous) / previous) * 100;
};

/**
 * Format date for display
 */
export const formatDate = (date: Date | string): string => {
	const d = typeof date === 'string' ? new Date(date) : date;
	return d.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
};

/**
 * Format date for chart axis
 */
export const formatDateAxis = (date: Date | string): string => {
	const d = typeof date === 'string' ? new Date(date) : date;
	return d.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
	});
};

/**
 * Convert cents to dollars
 */
export const centsToDollars = (cents: number): number => {
	return cents / 100;
};

/**
 * Convert dollars to cents
 */
export const dollarsToCents = (dollars: number): number => {
	return Math.round(dollars * 100);
};

/**
 * Get trend direction from percentage change
 */
export const getTrendDirection = (change: number | null): 'up' | 'down' | 'flat' => {
	if (change === null || change === undefined) return 'flat';
	if (Math.abs(change) < 1) return 'flat';
	return change > 0 ? 'up' : 'down';
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
	if (text.length <= maxLength) return text;
	return text.substring(0, maxLength - 3) + '...';
};

/**
 * Format number with commas
 */
export const formatNumber = (num: number): string => {
	return new Intl.NumberFormat('en-US').format(num);
};

/**
 * Get ordinal suffix for numbers (1st, 2nd, 3rd, etc.)
 */
export const getOrdinalSuffix = (num: number): string => {
	const j = num % 10;
	const k = num % 100;

	if (j === 1 && k !== 11) return 'st';
	if (j === 2 && k !== 12) return 'nd';
	if (j === 3 && k !== 13) return 'rd';
	return 'th';
};

/**
 * Capitalize first letter of string
 */
export const capitalize = (str: string): string => {
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
