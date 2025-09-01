# Monorepo Migration Documentation

## Overview

This document outlines the migration process from separate GitHub repositories to a unified monorepo structure for the Datacenter Tycoon project.

## Previous Repository Structure

Before migration, the project was split across two separate repositories:
- `datacenter-tycoon-front` - React/Next.js frontend application
- `datacenter-tycoon-api` - NestJS backend API

## New Monorepo Structure

The consolidated monorepo is now hosted at: `https://github.com/ignaciochemes/datacenter-tycoon`

```
datacenter-tycoon/
├── datacenter-tycoon-front/     # Frontend application
├── datacenter-tycoon-api/       # Backend API
├── docs/                        # Shared documentation
├── docker-compose.yml           # Multi-service orchestration
├── package.json                 # Root package configuration
├── pnpm-workspace.yaml          # PNPM workspace configuration
├── turbo.json                   # Turborepo build configuration
└── README.md                    # Main project documentation
```

## Migration Process

### 1. Repository Consolidation
- Created new GitHub repository: `datacenter-tycoon`
- Initialized Git repository in monorepo directory
- Cleaned up nested Git repositories from subdirectories
- Added all files to the monorepo structure

### 2. Workspace Configuration
- Configured PNPM workspace for dependency management
- Set up Turborepo for efficient build orchestration
- Created Docker Compose for multi-service development

### 3. GitHub Setup
- Created new repository on GitHub
- Configured remote origin
- Pushed initial monorepo structure to main branch

## Benefits of Monorepo Structure

1. **Unified Development**: Single repository for both frontend and backend
2. **Shared Dependencies**: Common tooling and configuration
3. **Atomic Changes**: Cross-service changes in single commits
4. **Simplified CI/CD**: Single pipeline for entire project
5. **Better Collaboration**: Centralized issue tracking and documentation

## Development Workflow

### Installation
```bash
# Install all dependencies
pnpm install
```

### Development
```bash
# Start all services
pnpm dev

# Start specific service
pnpm --filter datacenter-tycoon-front dev
pnpm --filter datacenter-tycoon-api dev
```

### Building
```bash
# Build all projects
pnpm build

# Build specific project
pnpm --filter datacenter-tycoon-front build
```

## Next Steps

1. Update old repository README files with migration notice
2. Archive old repositories after confirming successful migration
3. Update any CI/CD integrations to point to new repository
4. Notify team members of the new repository location

## Repository Links

- **New Monorepo**: https://github.com/ignaciochemes/datacenter-tycoon
- **Old Frontend Repo**: [To be archived]
- **Old Backend Repo**: [To be archived]

---

*Migration completed on: January 2025*
*Migrated by: Development Team*