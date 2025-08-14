# Liiift Sanity Tools

🚀 **A collection of powerful, production-tested tools for Sanity Studio**

This repository contains a suite of open-source tools designed to enhance Sanity Studio workflows, built from real-world usage in production environments.

## 🛠️ **Available Tools**

### 1. **Advanced Reference Array** ✅ Published
- **NPM**: `sanity-advanced-reference-array`
- **Repository**: [sanity-advanced-reference-array](https://github.com/quitequinn/sanity-advanced-reference-array)
- **Features**: Smart search, click-to-add, bulk operations, dynamic sorting
- **Status**: Live on NPM v1.0.1

### 2. **Font Management System** 🚧 In Development
- **Purpose**: Specialized tools for font foundries and typography management
- **Features**: Font metadata management, licensing workflows, specimen generation
- **Status**: Extracting from production code

### 3. **Advanced Object Array** 🚧 In Development
- **Purpose**: Enhanced object array management with search and filtering
- **Features**: Complex object editing, validation, bulk operations
- **Status**: Planning phase

### 4. **E-commerce Extensions** 🚧 In Development
- **Purpose**: Product management and cart components for Sanity
- **Features**: Product variants, pricing, inventory management
- **Status**: Extracting from production code

### 5. **UI Component Library** 📋 Planned
- **Purpose**: Shared UI components for consistent Sanity Studio experiences
- **Features**: Reusable components, theming, accessibility
- **Status**: Planning phase

### 6. **Automation Toolkit** 📋 Planned
- **Purpose**: Content migration and bulk operations
- **Features**: Data migration, bulk updates, maintenance scripts
- **Status**: Planning phase

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
