// Type definitions for sales portal data structures
export interface SaleData {
	id: string;
	total: number; // in cents
	taxAmount?: number; // in cents
	shippingCost?: number; // in cents
	date: string;
	customerAddress?: {
		country?: string;
	};
	billingAddress?: {
		country?: string;
	};
	paymentMethod?: {
		origin?: {
			country?: string;
		};
	};
	refunds?: RefundData[];
	items?: SaleItem[];
	discountAmount?: number;
	discountCode?: string;
}

export interface RefundData {
	id: string;
	adjustedTotal: number; // in cents
	date: string;
}

export interface SaleItem {
	id: string;
	name: string;
	quantity: number;
	price: number; // in cents
	licenseType?: string;
	designer?: string;
	typeface?: string;
}

export interface ChartData {
	xAxis: string[];
	discountLostData: number[];
	salesData: number[];
	totalSalesData: number[];
	salesMax: number;
	orderData: number[];
	orderMax: number;
	regularOrderData: number[];
	regularOrderMax: number;
	discountData: number[];
	discountMax: number;
	discountFirstOrderData: number[];
	firstOrderDiscountMax: number;
	firstOrderData: number[];
	firstOrderMax: number;
	refundData: number[];
	refundMax: number;
	refundTotal: number;
	changeMax: number;
	taxData: number[];
	shippingData: number[];
	shippedOrdersData: number[];
	shippedOrdersMax: number;
}

export interface TypefaceData {
	name: string;
	revenue: number;
	orders: number;
	designer?: string;
	percentage: number;
}

export interface DesignerData {
	name: string;
	revenue: number;
	orders: number;
	typefaces: TypefaceData[];
	percentage: number;
}

export interface LocationData {
	topLocation: string;
	topLocationRevenue: number;
	topLocationPercentage: number;
	previousTopLocation: string;
	previousTopLocationRevenue: number;
	previousTopLocationPercentage: number;
	locationChange: number | null;
}

export interface LicenseTypeData {
	type: string;
	revenue: number;
	orders: number;
	percentage: number;
}

export interface SalesPortalProps {
	// Configuration options
	apiEndpoint?: string;
	dateRange?: {
		start: Date;
		end: Date;
	};
	filters?: {
		designer?: string;
		typeface?: string;
		licenseType?: string;
		country?: string;
	};
	// Styling options
	theme?: 'light' | 'dark';
	showCharts?: boolean;
	showSummaryCards?: boolean;
	showTables?: boolean;
	// Permissions
	isAdmin?: boolean;
	allowExport?: boolean;
}

export interface SummaryMetric {
	title: string;
	value: string | number;
	change?: number | null;
	tooltip?: string;
	trend?: 'up' | 'down' | 'flat';
}

export interface CountryCode {
	code: string;
	label: string;
}

export interface LoadingStates {
	salesData: boolean;
	previousSalesData: boolean;
	designersList: boolean;
	salesProcessing: boolean;
	designersProcessing: boolean;
	chartProcessing: boolean;
	csvDownload: boolean;
	dateRangeSalesData: boolean;
}
