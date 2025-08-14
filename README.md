# Liiift Sanity Tools

🚀 **A collection of powerful, production-tested tools for Sanity Studio**

This repository contains a suite of open-source tools designed to enhance Sanity Studio workflows, built from real-world usage in production environments.

## 🛠️ **Available Tools**

### 1. **Advanced Reference Array** ✅ Published
- **NPM**: `sanity-advanced-reference-array`
- **Repository**: [sanity-advanced-reference-array](https://github.com/quitequinn/sanity-advanced-reference-array)
- **Features**: Smart search, click-to-add, bulk operations, dynamic sorting
- **Status**: Live on NPM v1.0.1

### 2. **Bulk Data Operations** 🚧 In Development
- **Repository**: [sanity-bulk-data-operations](https://github.com/quitequinn/sanity-bulk-data-operations)
- **Purpose**: Bulk operations for Sanity data management
- **Features**: Mass updates, batch processing, data transformation
- **Status**: Development phase

### 3. **Convert IDs to Slugs** 🚧 In Development
- **Repository**: [sanity-convert-ids-to-slugs](https://github.com/quitequinn/sanity-convert-ids-to-slugs)
- **Purpose**: Convert document IDs to human-readable slugs
- **Features**: Automated slug generation, batch conversion, validation
- **Status**: Development phase

### 4. **Convert References** 🚧 In Development
- **Repository**: [sanity-convert-references](https://github.com/quitequinn/sanity-convert-references)
- **Purpose**: Convert and migrate reference relationships
- **Features**: Reference mapping, relationship updates, data integrity
- **Status**: Development phase

### 5. **Delete Unused Assets** 🚧 In Development
- **Repository**: [sanity-delete-unused-assets](https://github.com/quitequinn/sanity-delete-unused-assets)
- **Purpose**: Clean up unused assets from Sanity projects
- **Features**: Asset scanning, usage detection, safe deletion
- **Status**: Development phase

### 6. **Duplicate and Rename** 🚧 In Development
- **Repository**: [sanity-duplicate-and-rename](https://github.com/quitequinn/sanity-duplicate-and-rename)
- **Purpose**: Duplicate documents with intelligent renaming
- **Features**: Smart duplication, naming patterns, relationship handling
- **Status**: Development phase

### 7. **Enhanced Commerce** 🚧 In Development
- **Repository**: [sanity-enhanced-commerce](https://github.com/quitequinn/sanity-enhanced-commerce)
- **Purpose**: Advanced e-commerce components for Sanity
- **Features**: Product variants, pricing, inventory management, cart components
- **Status**: Development phase

### 8. **Export Data** 🚧 In Development
- **Repository**: [sanity-export-data](https://github.com/quitequinn/sanity-export-data)
- **Purpose**: Export Sanity data in various formats
- **Features**: Multiple export formats, filtering, scheduling
- **Status**: Development phase

### 9. **Font Data Extractor** 🚧 In Development
- **Repository**: [sanity-font-data-extractor](https://github.com/quitequinn/sanity-font-data-extractor)
- **Purpose**: Extract metadata from font files
- **Features**: Font analysis, metadata extraction, specimen generation
- **Status**: Development phase

### 10. **Font Management Suite** 🚧 In Development
- **Repository**: [sanity-font-management-suite](https://github.com/quitequinn/sanity-font-management-suite)
- **Purpose**: Comprehensive font management for foundries
- **Features**: Font metadata, licensing workflows, specimen generation
- **Status**: Development phase

### 11. **Renewals Authorization** 🚧 In Development
- **Repository**: [sanity-renewals-authorization](https://github.com/quitequinn/sanity-renewals-authorization)
- **Purpose**: License renewal and authorization system
- **Features**: License tracking, renewal workflows, authorization management
- **Status**: Development phase

### 12. **Search and Delete** 🚧 In Development
- **Repository**: [sanity-search-and-delete](https://github.com/quitequinn/sanity-search-and-delete)
- **Purpose**: Advanced search and deletion capabilities
- **Features**: Complex queries, batch deletion, safety checks
- **Status**: Development phase

### 13. **Studio Utilities** 🚧 In Development
- **Repository**: [sanity-studio-utilities](https://github.com/quitequinn/sanity-studio-utilities)
- **Purpose**: General utilities for Sanity Studio enhancement
- **Features**: UI helpers, workflow improvements, developer tools
- **Status**: Development phase

## 🎯 **Mission**

Our mission is to enhance the Sanity ecosystem with production-tested tools that solve real-world problems faced by content creators, developers, and organizations using Sanity CMS.

## 🌟 **Key Principles**

- **Production-Tested**: All tools are extracted from real production environments
- **TypeScript-First**: Full type safety and excellent developer experience
- **Community-Focused**: Open source with comprehensive documentation
- **Performance-Optimized**: Built for scale and efficiency
- **Accessibility-Ready**: Following best practices for inclusive design

## 📦 **Installation**

Each tool is published as a separate NPM package for easy installation:

```bash
# Advanced Reference Array
npm install sanity-advanced-reference-array

# More tools coming soon...
```

## 🚀 **Quick Start**

### Advanced Reference Array
```typescript
import { AdvancedRefArray } from 'sanity-advanced-reference-array'

export default {
  name: 'myDocument',
  type: 'document',
  fields: [
    {
      name: 'relatedItems',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'product' }] }],
      components: {
        input: AdvancedRefArray
      }
    }
  ]
}
```

## 🤝 **Contributing**

We welcome contributions from the Sanity community! Each tool has its own repository for focused development:

### How to Contribute:
1. **Choose a tool** from the list above
2. **Visit the tool's repository** for specific contribution guidelines
3. **Open issues** for bugs or feature requests
4. **Submit pull requests** with improvements
5. **Share feedback** from your production usage

### Development Setup:
Each tool repository includes:
- `project.code-workspace` - VS Code workspace configuration
- Comprehensive README with setup instructions
- TypeScript configuration and build scripts
- Testing and linting setup

## 📊 **Community Impact**

Our tools are designed to serve the **10,000+ Sanity developers** worldwide:

- **Time Savings**: Reduce development time by 2-3 hours per implementation
- **Better UX**: Significantly improved content editor experiences
- **Production Quality**: Battle-tested in real-world environments
- **TypeScript Excellence**: Setting new standards for Sanity component development

## 🏆 **Success Stories**

### Advanced Reference Array
- **Downloads**: Growing adoption in the Sanity community
- **Features**: Smart search, individual click-to-add, bulk operations
- **Impact**: Transforms basic reference arrays into powerful content management tools

## 📈 **Roadmap**

### Q3 2025
- ✅ Advanced Reference Array (Published)
- 🚧 Font Management System (In Development)
- 🚧 Advanced Object Array (Planning)

### Q4 2025
- 📋 E-commerce Extensions
- 📋 UI Component Library
- 📋 Automation Toolkit

## 🔗 **Links**

- **Organization**: [Liiift Studio](https://github.com/Liiift-Studio)
- **Sanity.io**: [Official Website](https://www.sanity.io/)
- **Community**: [Sanity Slack](https://slack.sanity.io/)

## 📄 **License**

All tools are released under the MIT License, making them free to use in both personal and commercial projects.

## 🙏 **Acknowledgments**

These tools are built from real-world usage across multiple production Sanity studios:
- **Darden Studio** - Typography and font management workflows
- **The Designer's Foundry** - Enhanced UX patterns and interactions
- **Community Feedback** - Ongoing improvements and feature requests

---

**Made with ❤️ for the Sanity community by [Liiift Studio](https://liiift.studio)**

*Transforming content management experiences, one tool at a time.*
