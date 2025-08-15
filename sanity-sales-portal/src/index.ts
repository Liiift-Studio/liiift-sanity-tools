// Main entry point for the Sanity Sales Portal plugin
import { definePlugin } from 'sanity';
import { SalesPortalComponent } from './components/SalesPortalComponent';

/**
 * Sanity Sales Portal Plugin
 *
 * Provides comprehensive sales analytics and dashboard functionality
 * integrated directly into Sanity Studio.
 */
export const salesPortal = definePlugin(() => ({
	name: 'sales-portal',
	title: 'Sales Portal',

	tools: [
		{
			name: 'sales-portal',
			title: 'Sales Portal',
			icon: () => '📊',
			component: SalesPortalComponent,
		},
	],
}));

// Export components for custom usage
export { SalesPortalComponent } from './components/SalesPortalComponent';
export { SummaryCards } from './components/SummaryCards';

// Export types
export type { SaleData, ChartData, TypefaceData, LocationData, LicenseTypeData, SalesPortalProps, LoadingStates, SummaryMetric, CountryCode } from './types';

// Export utilities
export { formatCurrency, formatPercentage, calculatePercentageChange, formatDate, formatDateAxis, centsToDollars, dollarsToCents, getTrendDirection, truncateText, formatNumber, getOrdinalSuffix, capitalize } from './utils/formatters';

// Default export
export default salesPortal;
