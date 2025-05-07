# Modules Directory

This directory contains feature-based modules for the UniFinance application. Each module represents a specific functional area of the application and contains all related components, hooks, and utilities.

## Module Structure

Each module follows this structure:

```
module-name/
  ├── components/       # UI components specific to this module
  ├── hooks/            # Custom hooks specific to this module
  ├── utils/            # Utility functions specific to this module
  ├── types.ts          # TypeScript types and interfaces
  └── index.ts          # Exports from this module
```

## Available Modules

- **transactions**: Handles transaction management (adding, editing, viewing transactions)
- **categories**: Manages expense and income categories
- **dashboard**: Main dashboard and overview components
- **reports**: Financial reports and analytics
- **settings**: User settings and preferences
- **auth**: Authentication-related components and hooks
- **predictive**: AI-powered predictive analysis and recommendations

## Best Practices

1. Keep module-specific code within its module
2. Use the module's index.ts to export public API
3. Share common functionality through shared hooks and utilities
4. Minimize dependencies between modules when possible
