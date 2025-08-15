// Main sales portal component for Sanity Studio using Sanity UI components
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
	Card,
	Grid,
	Heading,
	Text,
	Box,
	Flex,
	Button,
	Select,
	TextInput,
	Tooltip,
	Spinner,
	Badge,
	Stack,
} from '@sanity/ui';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import {
	SaleData,
	ChartData,
	TypefaceData,
	LocationData,
	LicenseTypeData,
	SalesPortalProps,
	LoadingStates,
} from '../types';
import { 
	formatCurrency, 
	formatPercentage, 
	calculatePercentageChange,
	centsToDollars,
	getTrendDirection,
} from '../utils/formatters';
import { SummaryCards } from './SummaryCards';

/**
 * Main sales portal component for Sanity Studio
 */
export const SalesPortalComponent: React.FC<SalesPortalProps> = ({
	apiEndpoint = '/api/sales-portal',
	dateRange,
	filters = {},
	theme = 'dark',
	showCharts = true,
	showSummaryCards = true,
	showTables = true,
	isAdmin = false,
	allowExport = false,
}) => {
	// Loading states
	const [loadingStates, setLoadingStates] = useState<LoadingStates>({
		designersList: false,
		salesData: false,
		previousSalesData: false,
		salesProcessing: false,
		designersProcessing: false,
		chartProcessing: false,
		csvDownload: false,
		dateRangeSalesData: false,
	});

	// Data states
	const [sales, setSales] = useState<SaleData[]>([]);
	const [previousSales, setPreviousSales] = useState<SaleData[]>([]);
	const [currentDate, setCurrentDate] = useState<Date>(new Date());
	const [selectedDesigner, setSelectedDesigner] = useState<string>('');
	const [message, setMessage] = useState<string>('');
	
	// Processed data
	const [total, setTotal] = useState<number>(0);
	const [revenueChangePercent, setRevenueChangePercent] = useState<number>(0);
	const [typefaceData, setTypefaceData] = useState<TypefaceData[]>([]);
	const [locationData, setLocationData] = useState<LocationData>({
		topLocation: '',
		topLocationRevenue: 0,
		topLocationPercentage: 0,
		previousTopLocation: '',
		previousTopLocationRevenue: 0,
		previousTopLocationPercentage: 0,
		locationChange: null,
	});
	const [licenseTypeData, setLicenseTypeData] = useState<LicenseTypeData[]>([]);

	// Helper to update loading states
	const updateLoadingState = useCallback((key: keyof LoadingStates, value: boolean) => {
		setLoadingStates(prev => ({
			...prev,
			[key]: value,
		}));
	}, []);

	// Compute overall loading state
	const loading = useMemo(() => 
		Object.values(loadingStates).some(value => value) && !loadingStates.dateRangeSalesData,
		[loadingStates]
	);

	// Mock data fetching function (replace with actual API calls)
	const fetchSalesData = useCallback(async (date: Date) => {
		updateLoadingState('salesData', true);
		try {
			// Mock API call - replace with actual implementation
			const response = await fetch(`${apiEndpoint}/getSales`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					date: date.toISOString(),
					filters,
				}),
			});
			
			if (response.ok) {
				const data = await response.json();
				setSales(data.sales || []);
			} else {
				throw new Error('Failed to fetch sales data');
			}
		} catch (error) {
			setMessage('Error fetching sales data');
			console.error('Sales data fetch error:', error);
		} finally {
			updateLoadingState('salesData', false);
		}
	}, [apiEndpoint, filters, updateLoadingState]);

	// Process sales data
	useEffect(() => {
		if (!sales.length) return;
		
		updateLoadingState('salesProcessing', true);
		
		try {
			// Calculate total revenue
			const totalRevenue = sales.reduce((sum, sale) => {
				const saleRevenue = centsToDollars(sale.total - (sale.taxAmount || 0) - (sale.shippingCost || 0));
				return sum + saleRevenue;
			}, 0);
			
			setTotal(totalRevenue);
			
			// Process typeface data
			const typefaceMap = new Map<string, { revenue: number; orders: number; designer?: string }>();
			
			sales.forEach(sale => {
				sale.items?.forEach(item => {
					if (item.typeface) {
						const existing = typefaceMap.get(item.typeface) || { revenue: 0, orders: 0, designer: item.designer };
						typefaceMap.set(item.typeface, {
							revenue: existing.revenue + centsToDollars(item.price * item.quantity),
							orders: existing.orders + item.quantity,
							designer: item.designer || existing.designer,
						});
					}
				});
			});
			
			const typefaceArray = Array.from(typefaceMap.entries()).map(([name, data]) => ({
				name,
				...data,
				percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
			}));
			
			setTypefaceData(typefaceArray.sort((a, b) => b.revenue - a.revenue));
			
			// Process license type data
			const licenseMap = new Map<string, { revenue: number; orders: number }>();
			
			sales.forEach(sale => {
				sale.items?.forEach(item => {
					const licenseType = item.licenseType || 'Unknown';
					const existing = licenseMap.get(licenseType) || { revenue: 0, orders: 0 };
					licenseMap.set(licenseType, {
						revenue: existing.revenue + centsToDollars(item.price * item.quantity),
						orders: existing.orders + item.quantity,
					});
				});
			});
			
			const licenseArray = Array.from(licenseMap.entries()).map(([type, data]) => ({
				type,
				...data,
				percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
			}));
			
			setLicenseTypeData(licenseArray.sort((a, b) => b.revenue - a.revenue));
			
			// Process location data
			const locationMap = new Map<string, { revenue: number; orders: number }>();
			
			sales.forEach(sale => {
				const country = sale.paymentMethod?.origin?.country ||
					sale.customerAddress?.country ||
					sale.billingAddress?.country ||
					'Unknown';
				
				const existing = locationMap.get(country) || { revenue: 0, orders: 0 };
				const saleRevenue = centsToDollars(sale.total - (sale.taxAmount || 0) - (sale.shippingCost || 0));
				
				locationMap.set(country, {
					revenue: existing.revenue + saleRevenue,
					orders: existing.orders + 1,
				});
			});
			
			// Find top location
			let topLocation = { country: 'Unknown', revenue: 0, percentage: 0 };
			locationMap.forEach((data, country) => {
				if (data.revenue > topLocation.revenue) {
					topLocation = {
						country,
						revenue: data.revenue,
						percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
					};
				}
			});
			
			setLocationData(prev => ({
				...prev,
				topLocation: topLocation.country,
				topLocationRevenue: topLocation.revenue,
				topLocationPercentage: topLocation.percentage,
			}));
			
		} catch (error) {
			console.error('Error processing sales data:', error);
			setMessage('Error processing sales data');
		} finally {
			updateLoadingState('salesProcessing', false);
		}
	}, [sales, updateLoadingState]);

	// Fetch data when date changes
	useEffect(() => {
		if (currentDate) {
			fetchSalesData(currentDate);
		}
	}, [currentDate, fetchSalesData]);

	// Date navigation handlers
	const handlePreviousMonth = useCallback(() => {
		setCurrentDate(prev => subMonths(prev, 1));
	}, []);

	const handleNextMonth = useCallback(() => {
		setCurrentDate(prev => subMonths(prev, -1));
	}, []);

	// Render loading overlay
	if (loading) {
		return (
			<Card padding={4} radius={2} shadow={1}>
				<Flex align="center" justify="center" padding={4}>
					<Spinner muted />
					<Text muted size={1} style={{ marginLeft: '8px' }}>
						Loading sales data...
					</Text>
				</Flex>
			</Card>
		);
	}

	return (
		<Card padding={4} radius={2} shadow={1} tone={theme === 'dark' ? 'transparent' : 'default'}>
			<Stack space={4}>
				{/* Header */}
				<Flex align="center" justify="space-between" wrap="wrap" gap={3}>
					<Box flex={1}>
						<Heading as="h1" size={3}>
							{formatCurrency(total)}
							{revenueChangePercent !== 0 && (
								<Badge
									tone={getTrendDirection(revenueChangePercent) === 'up' ? 'positive' : 'critical'}
									style={{ marginLeft: '12px' }}
								>
									{formatPercentage(revenueChangePercent)}
								</Badge>
							)}
						</Heading>
						<Text muted size={1}>
							Sales Dashboard - {format(currentDate, 'MMMM yyyy')}
						</Text>
					</Box>

					{/* Date Controls */}
					<Flex align="center" gap={2}>
						<Button 
							mode="ghost" 
							icon={() => '←'} 
							onClick={handlePreviousMonth}
							disabled={loading}
							tooltip="Previous month"
						/>
						
						<Text size={1} weight="medium">
							{format(currentDate, 'MMM yyyy')}
						</Text>
						
						<Button 
							mode="ghost" 
							icon={() => '→'} 
							onClick={handleNextMonth}
							disabled={loading}
							tooltip="Next month"
						/>
					</Flex>
				</Flex>

				{/* Error Message */}
				{message && (
					<Card tone="critical" padding={3} radius={2}>
						<Text size={1}>{message}</Text>
					</Card>
				)}

				{/* Summary Cards */}
				{showSummaryCards && sales.length > 0 && (
					<SummaryCards
						sales={sales}
						previousSales={previousSales}
						total={total}
						revenueChangePercent={revenueChangePercent}
						locationData={locationData}
					/>
				)}

				{/* Top Performers */}
				{sales.length > 0 && (
					<Grid columns={[1, 2]} gap={4}>
						{/* Typefaces */}
						<Card padding={4} radius={2} shadow={1}>
							<Stack space={3}>
								<Heading as="h3" size={1}>Top Typefaces</Heading>
								{typefaceData.slice(0, 5).map((typeface, index) => (
									<Flex key={typeface.name} align="center" justify="space-between">
										<Box flex={1}>
											<Text size={1} weight="medium">{typeface.name}</Text>
											{typeface.designer && (
												<Text size={0} muted>{typeface.designer}</Text>
											)}
										</Box>
										<Box>
											<Text size={1}>{formatCurrency(typeface.revenue)}</Text>
											<Text size={0} muted>{typeface.percentage.toFixed(1)}%</Text>
										</Box>
									</Flex>
								))}
							</Stack>
						</Card>

						{/* License Types */}
						<Card padding={4} radius={2} shadow={1}>
							<Stack space={3}>
								<Heading as="h3" size={1}>License Types</Heading>
								{licenseTypeData.slice(0, 5).map((license) => (
									<Flex key={license.type} align="center" justify="space-between">
										<Box flex={1}>
											<Text size={1} weight="medium">{license.type}</Text>
											<Text size={0} muted>{license.orders} orders</Text>
										</Box>
										<Box>
											<Text size={1}>{formatCurrency(license.revenue)}</Text>
											<Text size={0} muted>{license.percentage.toFixed(1)}%</Text>
										</Box>
									</Flex>
								))}
							</Stack>
						</Card>
					</Grid>
				)}

				{/* No Data State */}
				{sales.length === 0 && !loading && (
					<Card tone="transparent" padding={6} radius={2}>
						<Flex align="center" justify="center" direction="column" gap={3}>
							<Text size={2} muted>No sales data available</Text>
							<Text size={1} muted>
								Try selecting a different date range or check your data source configuration.
							</Text>
						</Flex>
					</Card>
				)}
			</Stack>
		</Card>
	);
};

export default SalesPortalComponent;
