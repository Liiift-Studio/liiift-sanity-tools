# Sanity Sales Portal Plugin

A comprehensive sales dashboard and analytics plugin for Sanity Studio, converted from the Darden Studio sales portal.

## Features

- **📊 Sales Dashboard**: Real-time sales metrics and analytics
- **📈 Summary Cards**: Key performance indicators with period-over-period comparison
- **🎯 Top Performers**: Typeface and license type performance tracking
- **🌍 Location Analytics**: Geographic sales distribution analysis
- **📱 Responsive Design**: Built with Sanity UI components for consistent Studio integration
- **🔧 TypeScript**: Full type safety and excellent developer experience

## Installation

```bash
npm install sanity-sales-portal
```

## Usage

### Basic Setup

Add the plugin to your Sanity configuration:

```typescript
import { defineConfig } from 'sanity';
import { salesPortal } from 'sanity-sales-portal';

export default defineConfig({
	// ... other config
	plugins: [
		salesPortal(),
		// ... other plugins
	],
});
```

### Custom Configuration

```typescript
import { SalesPortalComponent } from 'sanity-sales-portal';

// Custom usage with specific props
<SalesPortalComponent apiEndpoint="/api/custom-sales-endpoint" theme="dark" showCharts={true} showSummaryCards={true} isAdmin={true} allowExport={true} />;
```

## Configuration Options

### SalesPortalProps

| Property           | Type                         | Default               | Description                 |
| ------------------ | ---------------------------- | --------------------- | --------------------------- |
| `apiEndpoint`      | `string`                     | `'/api/sales-portal'` | API endpoint for sales data |
| `dateRange`        | `{ start: Date; end: Date }` | -                     | Custom date range filter    |
| `filters`          | `object`                     | `{}`                  | Additional data filters     |
| `theme`            | `'light' \| 'dark'`          | `'dark'`              | UI theme                    |
| `showCharts`       | `boolean`                    | `true`                | Display charts section      |
| `showSummaryCards` | `boolean`                    | `true`                | Display summary metrics     |
| `showTables`       | `boolean`                    | `true`                | Display data tables         |
| `isAdmin`          | `boolean`                    | `false`               | Admin permissions           |
| `allowExport`      | `boolean`                    | `false`               | Enable data export          |

## Data Structure

### Expected API Response Format

```typescript
interface SaleData {
	id: string;
	total: number; // in cents
	taxAmount?: number; // in cents
	shippingCost?: number; // in cents
	date: string;
	customerAddress?: {
		country?: string;
	};
	items?: SaleItem[];
	discountAmount?: number;
	refunds?: RefundData[];
}

interface SaleItem {
	id: string;
	name: string;
	quantity: number;
	price: number; // in cents
	licenseType?: string;
	designer?: string;
	typeface?: string;
}
```

## API Integration

The plugin expects your API to provide sales data at the configured endpoint. Example API structure:

```typescript
// POST /api/sales-portal/getSales
{
  "date": "2025-01-01T00:00:00.000Z",
  "filters": {
    "designer": "optional-designer-filter",
    "typeface": "optional-typeface-filter"
  }
}

// Expected Response
{
  "success": true,
  "data": [
    // Array of SaleData objects
  ]
}
```

## Components

### SalesPortalComponent

Main dashboard component with complete functionality.

### SummaryCards

Standalone summary metrics component.

```typescript
import { SummaryCards } from 'sanity-sales-portal';

<SummaryCards sales={salesData} previousSales={previousPeriodData} total={totalRevenue} revenueChangePercent={changePercent} locationData={locationStats} />;
```

## Utilities

```typescript
import { formatCurrency, formatPercentage, calculatePercentageChange, centsToDollars } from 'sanity-sales-portal';

const formattedAmount = formatCurrency(1234.56); // "$1,234.56"
const change = calculatePercentageChange(150, 100); // 50
const percentage = formatPercentage(change); // "+50.0%"
```

## Development

### Prerequisites

- Node.js 18+
- Sanity Studio v3+
- React 18+

### Building from Source

```bash
git clone <repository-url>
cd sanity-sales-portal
npm install
npm run build
```

### Development Mode

```bash
npm run dev
```

## Integration with Existing Sales Systems

This plugin is designed to work with existing e-commerce and sales systems. You'll need to:

1. **Create API endpoints** that match the expected data format
2. **Configure authentication** for sales data access
3. **Set up data processing** to convert your sales data to the expected format
4. **Implement filtering** based on your business requirements

## Customization

### Styling

The plugin uses Sanity UI components, which automatically adapt to your Studio theme.

### Data Processing

Override the data processing logic by extending the base components:

```typescript
import { SalesPortalComponent } from 'sanity-sales-portal';

const CustomSalesPortal = (props) => {
	// Custom data processing logic
	const processedData = customDataProcessor(props.rawData);

	return <SalesPortalComponent {...props} data={processedData} />;
};
```

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Changelog

### v1.0.0

- Initial release
- Complete sales dashboard functionality
- TypeScript support
- Sanity UI integration
- Responsive design
- Summary cards with period-over-period comparison
- Top performers tracking
- Location analytics

## Support

For support, please open an issue on the GitHub repository or contact [support@liiift.studio](mailto:support@liiift.studio).

---

**Built with ❤️ by [Liiift Studio](https://liiift.studio) for the Sanity community**
