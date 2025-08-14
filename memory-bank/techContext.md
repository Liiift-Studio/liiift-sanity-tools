# Technical Context - Liiift Sanity Tools

## Technology Stack

### Core Technologies
- **TypeScript** - Primary development language for type safety and developer experience
- **React** - UI framework for Sanity Studio components
- **Sanity Studio v3** - Target platform for all tools
- **Node.js** - Runtime environment for build tools and scripts
- **Git** - Version control with submodule architecture

### Build and Development Tools
- **Rollup** - Module bundler for optimized package builds
- **ESLint** - Code linting and style enforcement
- **Prettier** - Code formatting consistency
- **Jest** - Unit testing framework
- **React Testing Library** - Component testing utilities

### Package Management
- **NPM** - Package manager and registry for tool distribution
- **Semantic Versioning** - Version management across all tools
- **Peer Dependencies** - Sanity and React as peer dependencies to avoid conflicts

## Development Environment

### Repository Structure
```
liiift-sanity-tools/
├── .git/                               # Main repository git
├── .gitignore                          # Git exclusions
├── .gitmodules                         # Submodule configuration
├── README.md                           # Central documentation
├── LICENSE                             # MIT License
├── project.code-workspace              # VS Code multi-root workspace
├── memory-bank/                        # Project documentation
│   ├── projectbrief.md
│   ├── productContext.md
│   ├── systemPatterns.md
│   ├── techContext.md
│   ├── activeContext.md
│   └── progress.md
└── [tool-directories]/                 # Git submodules
    ├── .git/                           # Individual tool git repository
    ├── src/                            # TypeScript source code
    ├── dist/                           # Built output (gitignored)
    ├── node_modules/                   # Dependencies (gitignored)
    ├── package.json                    # NPM configuration
    ├── package-lock.json               # Dependency lock file
    ├── tsconfig.json                   # TypeScript configuration
    ├── rollup.config.js                # Build configuration
    ├── .eslintrc.js                    # Linting configuration
    ├── README.md                       # Tool documentation
    └── project.code-workspace          # Tool-specific workspace
```

### VS Code Workspace Configuration
Multi-root workspace for unified development experience:

```json
{
	"folders": [
		{
			"name": "🏠 Main Repository",
			"path": "."
		},
		{
			"name": "📦 Advanced Reference Array",
			"path": "./sanity-advanced-reference-array"
		},
		{
			"name": "📦 Bulk Data Operations",
			"path": "./sanity-bulk-data-operations"
		}
		// ... additional tools
	],
	"settings": {
		"typescript.preferences.includePackageJsonAutoImports": "auto",
		"editor.formatOnSave": true,
		"editor.codeActionsOnSave": {
			"source.fixAll.eslint": true
		}
	},
	"extensions": {
		"recommendations": [
			"ms-vscode.vscode-typescript-next",
			"esbenp.prettier-vscode",
			"dbaeumer.vscode-eslint"
		]
	}
}
```

## Build System

### TypeScript Configuration
Standardized across all tools:

```json
{
	"compilerOptions": {
		"target": "ES2020",
		"lib": ["ES2020", "DOM", "DOM.Iterable"],
		"module": "ESNext",
		"moduleResolution": "node",
		"allowSyntheticDefaultImports": true,
		"esModuleInterop": true,
		"allowJs": false,
		"strict": true,
		"noUnusedLocals": true,
		"noUnusedParameters": true,
		"noImplicitReturns": true,
		"noFallthroughCasesInSwitch": true,
		"skipLibCheck": true,
		"forceConsistentCasingInFileNames": true,
		"declaration": true,
		"declarationMap": true,
		"outDir": "dist",
		"rootDir": "src",
		"jsx": "react-jsx"
	},
	"include": ["src/**/*"],
	"exclude": ["node_modules", "dist", "**/*.test.*"]
}
```

### Rollup Build Configuration
Optimized for Sanity Studio integration:

```javascript
import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { terser } from 'rollup-plugin-terser'

const isProduction = process.env.NODE_ENV === 'production'

export default {
	input: 'src/index.ts',
	output: [
		{
			file: 'dist/index.js',
			format: 'esm',
			sourcemap: !isProduction
		},
		{
			file: 'dist/index.cjs.js',
			format: 'cjs',
			sourcemap: !isProduction
		}
	],
	external: [
		'react',
		'react-dom',
		'sanity',
		'@sanity/ui',
		'@sanity/icons',
		'styled-components'
	],
	plugins: [
		resolve({
			browser: true,
			preferBuiltins: false
		}),
		commonjs(),
		typescript({
			declaration: true,
			declarationDir: 'dist',
			rootDir: 'src'
		}),
		isProduction && terser()
	].filter(Boolean)
}
```

### Package.json Standards
Consistent structure across all tools:

```json
{
	"name": "sanity-[tool-name]",
	"version": "1.0.0",
	"description": "Brief tool description",
	"keywords": ["sanity", "studio", "plugin", "tool"],
	"author": "Liiift Studio",
	"license": "MIT",
	"repository": {
		"type": "git",
		"url": "https://github.com/quitequinn/sanity-[tool-name].git"
	},
	"main": "dist/index.cjs.js",
	"module": "dist/index.js",
	"types": "dist/index.d.ts",
	"files": ["dist", "README.md"],
	"scripts": {
		"build": "rollup -c",
		"dev": "rollup -c -w",
		"type-check": "tsc --noEmit",
		"lint": "eslint src --ext .ts,.tsx",
		"lint:fix": "eslint src --ext .ts,.tsx --fix",
		"test": "jest",
		"test:watch": "jest --watch",
		"prepublishOnly": "npm run build"
	},
	"peerDependencies": {
		"react": "^18.0.0",
		"sanity": "^3.0.0"
	},
	"devDependencies": {
		"@types/react": "^18.0.0",
		"@typescript-eslint/eslint-plugin": "^6.0.0",
		"@typescript-eslint/parser": "^6.0.0",
		"eslint": "^8.0.0",
		"eslint-plugin-react": "^7.0.0",
		"eslint-plugin-react-hooks": "^4.0.0",
		"jest": "^29.0.0",
		"rollup": "^3.0.0",
		"typescript": "^5.0.0"
	}
}
```

## Development Workflow

### Git Submodule Management
Commands for managing the submodule architecture:

```bash
# Initialize all submodules
git submodule update --init --recursive

# Update all submodules to latest
git submodule update --remote

# Add new tool as submodule
git submodule add https://github.com/quitequinn/sanity-new-tool.git sanity-new-tool

# Remove submodule
git submodule deinit sanity-tool-name
git rm sanity-tool-name
rm -rf .git/modules/sanity-tool-name
```

### Development Commands
Standardized commands across all tools:

```bash
# Development workflow
npm run dev          # Start development build with watch mode
npm run build        # Production build
npm run type-check   # TypeScript type checking
npm run lint         # Code linting
npm run lint:fix     # Auto-fix linting issues
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode

# Publishing workflow
npm version patch    # Bump version
npm publish         # Publish to NPM
git push --tags     # Push version tags
```

### Code Quality Standards

#### ESLint Configuration
```javascript
module.exports = {
	extends: [
		'eslint:recommended',
		'@typescript-eslint/recommended',
		'plugin:react/recommended',
		'plugin:react-hooks/recommended'
	],
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint', 'react', 'react-hooks'],
	rules: {
		'@typescript-eslint/no-unused-vars': 'error',
		'@typescript-eslint/explicit-function-return-type': 'off',
		'@typescript-eslint/explicit-module-boundary-types': 'off',
		'react/prop-types': 'off',
		'react/react-in-jsx-scope': 'off'
	},
	settings: {
		react: {
			version: 'detect'
		}
	}
}
```

#### Prettier Configuration
```json
{
	"semi": false,
	"singleQuote": true,
	"tabWidth": 2,
	"useTabs": true,
	"trailingComma": "none",
	"printWidth": 80,
	"bracketSpacing": true,
	"arrowParens": "avoid"
}
```

## Testing Strategy

### Jest Configuration
```javascript
module.exports = {
	testEnvironment: 'jsdom',
	setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
	moduleNameMapping: {
		'^@/(.*)$': '<rootDir>/src/$1'
	},
	collectCoverageFrom: [
		'src/**/*.{ts,tsx}',
		'!src/**/*.d.ts',
		'!src/index.ts'
	],
	coverageThreshold: {
		global: {
			branches: 80,
			functions: 80,
			lines: 80,
			statements: 80
		}
	}
}
```

### Testing Utilities
```typescript
// setupTests.ts
import '@testing-library/jest-dom'

// Mock Sanity client
jest.mock('sanity', () => ({
	useClient: () => ({
		fetch: jest.fn(),
		create: jest.fn(),
		patch: jest.fn(),
		delete: jest.fn()
	})
}))
```

## Deployment and Distribution

### NPM Publishing Strategy
- **Semantic Versioning** - Major.Minor.Patch versioning
- **Automated Publishing** - GitHub Actions for CI/CD
- **Pre-release Testing** - Beta versions for testing
- **Documentation Updates** - Automated README updates

### GitHub Actions Workflow
```yaml
name: Build and Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

## Performance Considerations

### Bundle Optimization
- **Tree Shaking** - Eliminate unused code
- **Code Splitting** - Lazy load components when possible
- **External Dependencies** - Keep Sanity and React as externals
- **Minification** - Production builds are minified

### Runtime Performance
- **React Optimization** - Use React.memo, useMemo, useCallback
- **Debouncing** - Debounce search and API calls
- **Virtual Scrolling** - For large data sets
- **Lazy Loading** - Load data on demand

## Security Considerations

### Dependency Management
- **Regular Updates** - Keep dependencies current
- **Security Audits** - Regular npm audit checks
- **Minimal Dependencies** - Only include necessary packages
- **Peer Dependencies** - Avoid version conflicts

### Code Security
- **Input Validation** - Validate all user inputs
- **XSS Prevention** - Proper data sanitization
- **Access Control** - Respect Sanity's permission system
- **Error Handling** - Don't expose sensitive information

This technical context ensures consistent, high-quality development across all tools in the Liiift Sanity Tools suite.
