// Summary cards component displaying key sales metrics using Sanity UI
import React from 'react';
import { Card, Grid, Heading, Text, Box, Flex, Badge, Stack } from '@sanity/ui';
import { SaleData, LocationData } from '../types';
import { formatCurrency, formatPercentage, getTrendDirection, centsToDollars } from '../utils/formatters';

interface SummaryCardsProps {
	sales: SaleData[];
	previousSales: SaleData[];
	total: number;
	revenueChangePercent: number;
	locationData: LocationData;
}

/**
 * Summary cards showing key sales metrics
 */
export const SummaryCards: React.FC<SummaryCardsProps> = ({
	sales,
	previousSales,
	total,
	revenueChangePercent,
	locationData,
}) => {
	// Calculate metrics
	const orderCount = sales.length;
	const averageOrderValue = orderCount ? total / orderCount : 0;
	
	// Calculate discount metrics
	const totalDiscounts = sales.reduce((sum, sale) => {
		return sum + centsToDollars(sale.discountAmount || 0);
	}, 0);
	const discountRate = (total + totalDiscounts) > 0 ? (totalDiscounts / (total + totalDiscounts)) * 100 : 0;
	
	// Calculate refund metrics
	const totalRefunds = sales.reduce((sum, sale) => {
		if (sale.refunds && sale.refunds.length > 0) {
			return sum + sale.refunds.reduce((refundSum, refund) => {
				return refundSum + centsToDollars(refund.adjustedTotal);
			}, 0);
		}
		return sum;
	}, 0);
	const refundRate = (total + totalRefunds) > 0 ? (totalRefunds / (total + totalRefunds)) * 100 : 0;
	
	// Calculate previous period metrics for comparison
	let previousRevenue = 0;
	let previousOrderCount = 0;
	let previousAvgOrderValue = 0;
	
	if (previousSales && previousSales.length > 0) {
		previousOrderCount = previousSales.length;
		previousRevenue = previousSales.reduce((sum, sale) => {
			const saleTotal = sale.total || 0;
			const saleTax = sale.taxAmount || 0;
			const saleShipping = sale.shippingCost || 0;
			return sum + centsToDollars(saleTotal - saleTax - saleShipping);
		}, 0);
		previousAvgOrderValue = previousOrderCount ? previousRevenue / previousOrderCount : 0;
	}
	
	// Calculate changes
	const orderCountChange = previousOrderCount > 0 ? ((orderCount - previousOrderCount) / previousOrderCount) * 100 : null;
	const avgOrderValueChange = previousAvgOrderValue > 0 ? ((averageOrderValue - previousAvgOrderValue) / previousAvgOrderValue) * 100 : null;
	
	const metrics = [
		{
			title: 'Gross Sales',
			value: formatCurrency(total),
			change: revenueChangePercent,
			tooltip: `Previous: ${formatCurrency(previousRevenue)}`,
		},
		{
			title: 'Orders',
			value: orderCount,
			change: orderCountChange,
			tooltip: `Previous: ${previousOrderCount}`,
		},
		{
			title: 'Avg. Order Value',
			value: formatCurrency(averageOrderValue),
			change: avgOrderValueChange,
			tooltip: `Previous: ${formatCurrency(previousAvgOrderValue)}`,
		},
		{
			title: 'Discount Rate',
			value: `${discountRate.toFixed(1)}%`,
			tooltip: `Total discounts: ${formatCurrency(totalDiscounts)}`,
		},
		{
			title: 'Refund Rate',
			value: `${refundRate.toFixed(1)}%`,
			tooltip: `Total refunds: ${formatCurrency(totalRefunds)}`,
		},
		{
			title: 'Top Location',
			value: locationData.topLocation !== 'Unknown' ? 
				`${locationData.topLocationPercentage.toFixed(0)}% ${locationData.topLocation}` : 
				'Unknown',
			change: locationData.locationChange,
			tooltip: locationData.previousTopLocation ? 
				`Previous: ${locationData.previousTopLocation} (${locationData.previousTopLocationPercentage.toFixed(1)}%)` : 
				'No prior data',
		},
	];

	return (
		<Grid columns={[1, 2, 3]} gap={3}>
			{metrics.map((metric, index) => (
				<Card key={index} padding={4} radius={2} shadow={1} tone="transparent">
					<Stack space={2}>
						<Text size={1} muted weight="medium">
							{metric.title}
						</Text>
						
						<Flex align="center" gap={2}>
							<Heading as="h3" size={2}>
								{metric.value}
							</Heading>
							
							{metric.change !== null && metric.change !== undefined && (
								<Badge
									tone={getTrendDirection(metric.change) === 'up' ? 'positive' : 
										getTrendDirection(metric.change) === 'down' ? 'critical' : 'default'}
								>
									{formatPercentage(metric.change)}
								</Badge>
							)}
						</Flex>
						
						{metric.tooltip && (
							<Text size={0} muted>
								{metric.tooltip}
							</Text>
						)}
					</Stack>
				</Card>
			))}
		</Grid>
	);
};

export default SummaryCards;
