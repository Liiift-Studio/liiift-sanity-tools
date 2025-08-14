# System Patterns - Liiift Sanity Tools

## Architecture Overview

### Repository Architecture
The Liiift Sanity Tools suite follows a **monorepo-style architecture** with individual tool repositories managed as git submodules, providing both centralized management and individual tool autonomy.

```
liiift-sanity-tools/                    # Main repository
├── README.md                           # Central navigation hub
├── memory-bank/                        # Project documentation
├── project.code-workspace              # Multi-root VS Code workspace
├── LICENSE                             # MIT License
├── .gitignore                          # Git exclusions
└── [tool-name]/                        # Git submodules
    ├── src/                            # TypeScript source code
    ├── dist/                           # Built output
    ├── package.json                    # NPM configuration
    ├── README.md                       # Tool-specific documentation
    ├── project.code-workspace          # Tool workspace
    └── .git/                           # Individual git repository
```

### Git Submodule Pattern
Each tool maintains its own git repository while being embedded in the main repository:
- **Independent Development** - Tools can be developed, versioned, and released independently
- **Centralized Discovery** - All tools accessible through main repository
- **Individual Ownership** - Each tool has its own issues, PRs, and community
- **Flexible Deployment** - Tools can be extracted to standalone repositories if needed

## Development Patterns

### TypeScript-First Architecture
All tools follow consistent TypeScript patterns for maximum type safety and developer experience:

```typescript
// Standard tool export pattern
export interface ToolConfig {
	// Configuration interface
}

export interface ToolProps {
	// Component props interface
}

export const ToolComponent: React.FC<ToolProps> = (props) => {
	// Component implementation
}

export default ToolComponent
```

### Component Architecture Pattern
Sanity Studio components follow a consistent structure:

```typescript
// 1. Imports
import React, { useState, useCallback } from 'react'
import { useClient } from 'sanity'
import { Card, Stack, Button } from '@sanity/ui'

// 2. Interfaces
interface ComponentProps {
	value?: any[]
	onChange: (value: any[]) => void
	// ... other props
}

// 3. Component
export const Component: React.FC<ComponentProps> = ({
	value = [],
	onChange,
	...props
}) => {
	// 4. State management
	const [loading, setLoading] = useState(false)
	const client = useClient()

	// 5. Event handlers
	const handleAction = useCallback(async () => {
		// Implementation
	}, [])

	// 6. Render
	return (
		<Card>
			{/* UI implementation */}
		</Card>
	)
}
```

### Error Handling Pattern
Consistent error handling across all tools:

```typescript
// Error boundary pattern
interface ErrorState {
	hasError: boolean
	error?: Error
}

// Async operation pattern
const handleAsyncOperation = async () => {
	try {
		setLoading(true)
		const result = await client.fetch(query)
		// Handle success
	} catch (error) {
		console.error('Operation failed:', error)
		// Handle error gracefully
	} finally {
		setLoading(false)
	}
}
```

## Data Flow Patterns

### Sanity Client Integration
Standardized approach to Sanity client usage:

```typescript
// Client hook pattern
const client = useClient()

// Query pattern with error handling
const fetchData = useCallback(async (params: QueryParams) => {
	const query = `*[_type == "document" && defined(slug.current)]`
	
	try {
		const results = await client.fetch(query, params)
		return results
	} catch (error) {
		throw new Error(`Failed to fetch data: ${error.message}`)
	}
}, [client])
```

### State Management Pattern
Consistent state management using React hooks:

```typescript
// State pattern for tool components
const useToolState = (initialValue: any[]) => {
	const [value, setValue] = useState(initialValue)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const updateValue = useCallback((newValue: any[]) => {
		setValue(newValue)
		setError(null)
	}, [])

	return {
		value,
		loading,
		error,
		updateValue,
		setLoading,
		setError
	}
}
```

## UI/UX Patterns

### Sanity UI Integration
All tools use Sanity's design system for consistency:

```typescript
import {
	Card,
	Stack,
	Button,
	TextInput,
	Spinner,
	Text,
	Flex
} from '@sanity/ui'

// Consistent spacing and layout
<Card padding={4}>
	<Stack space={3}>
		<Text size={2} weight="semibold">
			Tool Title
		</Text>
		<Flex gap={2}>
			<Button tone="primary" onClick={handleAction}>
				Primary Action
			</Button>
			<Button tone="default" onClick={handleCancel}>
				Cancel
			</Button>
		</Flex>
	</Stack>
</Card>
```

### Loading States Pattern
Consistent loading state handling:

```typescript
// Loading component pattern
const LoadingState = () => (
	<Flex align="center" justify="center" padding={4}>
		<Spinner muted />
		<Text muted size={1} style={{ marginLeft: 8 }}>
			Loading...
		</Text>
	</Flex>
)

// Usage in components
{loading ? <LoadingState /> : <ContentComponent />}
```

### Search Pattern
Standardized search functionality across tools:

```typescript
// Search hook pattern
const useSearch = (items: any[], searchFields: string[]) => {
	const [searchTerm, setSearchTerm] = useState('')
	
	const filteredItems = useMemo(() => {
		if (!searchTerm) return items
		
		return items.filter(item =>
			searchFields.some(field =>
				item[field]?.toLowerCase().includes(searchTerm.toLowerCase())
			)
		)
	}, [items, searchTerm, searchFields])
	
	return {
		searchTerm,
		setSearchTerm,
		filteredItems
	}
}
```

## Build and Deployment Patterns

### Package.json Structure
Consistent package.json structure across all tools:

```json
{
	"name": "sanity-[tool-name]",
	"version": "1.0.0",
	"description": "Tool description",
	"main": "dist/index.js",
	"types": "dist/index.d.ts",
	"scripts": {
		"build": "rollup -c",
		"dev": "rollup -c -w",
		"type-check": "tsc --noEmit",
		"lint": "eslint src --ext .ts,.tsx"
	},
	"peerDependencies": {
		"react": "^18.0.0",
		"sanity": "^3.0.0"
	},
	"devDependencies": {
		"@types/react": "^18.0.0",
		"typescript": "^5.0.0",
		"rollup": "^3.0.0"
	}
}
```

### Build Configuration Pattern
Standardized Rollup configuration:

```javascript
// rollup.config.js
import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

export default {
	input: 'src/index.ts',
	output: {
		file: 'dist/index.js',
		format: 'esm',
		sourcemap: true
	},
	external: ['react', 'sanity', '@sanity/ui'],
	plugins: [
		resolve(),
		commonjs(),
		typescript({
			declaration: true,
			outDir: 'dist'
		})
	]
}
```

### TypeScript Configuration
Consistent TypeScript setup:

```json
{
	"compilerOptions": {
		"target": "ES2020",
		"module": "ESNext",
		"moduleResolution": "node",
		"strict": true,
		"esModuleInterop": true,
		"skipLibCheck": true,
		"forceConsistentCasingInFileNames": true,
		"declaration": true,
		"outDir": "dist",
		"jsx": "react-jsx"
	},
	"include": ["src/**/*"],
	"exclude": ["node_modules", "dist"]
}
```

## Testing Patterns

### Unit Testing Structure
Consistent testing approach using Jest and React Testing Library:

```typescript
// Component.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Component } from './Component'

describe('Component', () => {
	const mockOnChange = jest.fn()
	
	beforeEach(() => {
		mockOnChange.mockClear()
	})
	
	it('renders correctly', () => {
		render(<Component onChange={mockOnChange} />)
		expect(screen.getByRole('button')).toBeInTheDocument()
	})
	
	it('handles user interaction', () => {
		render(<Component onChange={mockOnChange} />)
		fireEvent.click(screen.getByRole('button'))
		expect(mockOnChange).toHaveBeenCalled()
	})
})
```

## Documentation Patterns

### README Structure
Consistent README structure for all tools:

```markdown
# Tool Name

Brief description of what the tool does.

## Installation

```bash
npm install sanity-tool-name
```

## Usage

```typescript
// Code example
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| option | type | default | description |

## Examples

### Basic Usage
[Example code]

### Advanced Usage
[Example code]

## Contributing

[Contribution guidelines]

## License

MIT
```

### Code Documentation Pattern
Consistent JSDoc comments:

```typescript
/**
 * Enhanced reference array component with search and bulk operations
 * 
 * @param value - Current array value
 * @param onChange - Change handler function
 * @param config - Optional configuration object
 * @returns React component for reference array management
 */
export const AdvancedRefArray: React.FC<AdvancedRefArrayProps> = ({
	value = [],
	onChange,
	config = {}
}) => {
	// Implementation
}
```

## Performance Patterns

### Optimization Strategies
- **Memoization** - Use React.memo and useMemo for expensive operations
- **Debouncing** - Debounce search and API calls to reduce load
- **Lazy Loading** - Load data on demand rather than upfront
- **Virtual Scrolling** - For large lists and data sets

### Memory Management
- **Cleanup** - Proper cleanup of event listeners and subscriptions
- **Weak References** - Use WeakMap/WeakSet where appropriate
- **Garbage Collection** - Avoid memory leaks in long-running components

These system patterns ensure consistency, maintainability, and quality across all tools in the Liiift Sanity Tools suite.
