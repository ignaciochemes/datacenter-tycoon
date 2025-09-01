# Datacenter Tycoon

🏢 A comprehensive datacenter simulation game built with modern web technologies.

[![GitHub Repository](https://img.shields.io/badge/GitHub-datacenter--tycoon-blue?logo=github)](https://github.com/ignaciochemes/datacenter-tycoon)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PNPM](https://img.shields.io/badge/PNPM-8+-orange.svg)](https://pnpm.io/)

## 🚀 Project Overview

Datacenter Tycoon is an immersive simulation game where players build, manage, and optimize their own datacenter empire. This monorepo contains both the frontend and backend applications, providing a complete full-stack gaming experience.

## 📁 Project Structure

```
datacenter-tycoon/
├── datacenter-tycoon-front/     # React/Next.js frontend application
├── datacenter-tycoon-api/       # NestJS backend API
├── docs/                        # Project documentation
├── docker-compose.yml           # Multi-service orchestration
├── package.json                 # Root package configuration
├── pnpm-workspace.yaml          # PNPM workspace configuration
├── turbo.json                   # Turborepo build configuration
└── README.md                    # This file
```

## ⚡ Quick Start

### Prerequisites

- **Node.js** 18 or higher
- **PNPM** 8 or higher
- **Docker** (optional, for containerized development)
- **PostgreSQL** (for database)

### Installation

```bash
# Clone the repository
git clone https://github.com/ignaciochemes/datacenter-tycoon.git
cd datacenter-tycoon

# Install all dependencies
pnpm install
```

### Development

```bash
# Start all services in development mode
pnpm dev

# Or start services individually
pnpm --filter datacenter-tycoon-front dev
pnpm --filter datacenter-tycoon-api dev
```

### Building

```bash
# Build all projects
pnpm build

# Build specific project
pnpm --filter datacenter-tycoon-front build
pnpm --filter datacenter-tycoon-api build
```

### Docker Development

```bash
# Start all services with Docker Compose
docker-compose up -d
```

## 🏗️ Architecture

### Frontend (`datacenter-tycoon-front`)
- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS with shadcn/ui components
- **Authentication**: Auth0 integration with hybrid auth system
- **State Management**: React Context API
- **Type Safety**: TypeScript
- **UI Components**: Modern, responsive design system

### Backend (`datacenter-tycoon-api`)
- **Framework**: NestJS with Express
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with Auth0 integration
- **API**: RESTful endpoints with OpenAPI documentation
- **Type Safety**: TypeScript
- **Architecture**: Modular, scalable design

## ✨ Features

- 🏢 **Datacenter Simulation**: Build and manage virtual datacenters
- 👤 **User Management**: Secure authentication and user profiles
- 🎮 **Interactive Gameplay**: Engaging game mechanics and progression
- 📊 **Real-time Analytics**: Live statistics and performance monitoring
- 🔒 **Security**: JWT-based authentication with Auth0 integration
- 🛡️ **Network Security**: Firewall rules and load balancer management
- 📋 **SLA Management**: Service Level Agreement contracts with security integration
- ⚡ **Real-time Processing**: Tick-based system for continuous evaluation
- 🎨 **Modern UI**: Responsive design with beautiful components
- 🚀 **Performance**: Optimized for speed and scalability

## 🛠️ Development Tools

- **Package Manager**: PNPM with workspaces
- **Build System**: Turborepo for efficient monorepo builds
- **Code Quality**: ESLint, Prettier
- **Type Checking**: TypeScript across all projects
- **Containerization**: Docker and Docker Compose
- **Documentation**: Comprehensive docs and API documentation

## 📚 Documentation

- [Monorepo Migration Guide](docs/MONOREPO_MIGRATION.md)
- [Sprint 3: Network Security Features](docs/SPRINT3_NETWORK_SECURITY.md)
- [OAuth Integration Status](datacenter-tycoon-front/docs/OAUTH_INTEGRATION_STATUS.md)
- [API Documentation](datacenter-tycoon-api/README.md)
- [Frontend Setup](datacenter-tycoon-front/README.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`pnpm test && pnpm lint`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Repository**: https://github.com/ignaciochemes/datacenter-tycoon
- **Issues**: https://github.com/ignaciochemes/datacenter-tycoon/issues
- **Discussions**: https://github.com/ignaciochemes/datacenter-tycoon/discussions

---

**Built with ❤️ by the Datacenter Tycoon Team**

## Available Scripts

### Root Level Scripts

```bash
pnpm dev          # Start both apps in development mode
pnpm build        # Build both apps
pnpm start        # Start both apps in production mode
pnpm lint         # Lint all packages
pnpm type-check   # Type check all packages
pnpm clean        # Clean all build artifacts
```

### Backend Scripts

```bash
pnpm api:dev      # Start backend in development mode
pnpm api:build    # Build backend
pnpm api:start    # Start backend in production mode
```

### Frontend Scripts

```bash
pnpm front:dev    # Start frontend in development mode
pnpm front:build  # Build frontend
pnpm front:start  # Start frontend in production mode
```

### Docker Scripts

```bash
pnpm docker:up    # Start PostgreSQL and Redis containers
pnpm docker:down  # Stop containers
pnpm docker:logs  # View container logs
```

## Game Features

### Core Gameplay
- **Datacenter Management**: Create and manage multiple datacenters
- **Rack Management**: Design rack layouts and optimize space utilization
- **Device Management**: Purchase, install, and maintain various hardware
- **Hardware Catalog**: Extensive catalog of servers, switches, storage, and more
- **Network Security**: Configure firewall rules and load balancers for optimal security
- **SLA Contracts**: Manage service level agreements with automated evaluation
- **Real-time Simulation**: Live monitoring of power, cooling, performance, and security

### Technical Features
- **JWT Authentication**: Secure user authentication and authorization
- **WebSocket Events**: Real-time updates and notifications
- **Hardware Seeding**: Automated hardware catalog population
- **Security Integration**: Firewall and load balancer impact on SLA performance
- **Tick System**: Automated periodic evaluation of contracts and security
- **RESTful API**: Comprehensive API with Swagger documentation
- **Responsive UI**: Modern, mobile-friendly interface with security dashboards

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Datacenter Management
- `GET /api/datacenters` - List datacenters
- `POST /api/datacenters` - Create datacenter
- `GET /api/datacenters/:id` - Get datacenter details
- `PATCH /api/datacenters/:id` - Update datacenter
- `DELETE /api/datacenters/:id` - Delete datacenter

### Rack Management
- `GET /api/racks` - List racks
- `POST /api/racks` - Create rack
- `GET /api/racks/:id` - Get rack details
- `PATCH /api/racks/:id` - Update rack
- `DELETE /api/racks/:id` - Delete rack

### Device Management
- `GET /api/devices` - List devices
- `POST /api/devices` - Create device
- `GET /api/devices/:id` - Get device details
- `PATCH /api/devices/:id` - Update device
- `DELETE /api/devices/:id` - Delete device
- `GET /api/devices/status/:status` - Filter by status
- `GET /api/devices/type/:type` - Filter by type

### Hardware Seeding
- `POST /api/hardware-seeding/seed` - Seed hardware catalog
- `GET /api/hardware-seeding/stats` - Get catalog statistics
- `DELETE /api/hardware-seeding/clear` - Clear catalog
- `POST /api/hardware-seeding/reseed` - Reseed catalog

### NPC Seeding
- `POST /api/npc-seeding/seed` - Seed NPC catalog
- `GET /api/npc-seeding/stats` - Get NPC catalog statistics
- `DELETE /api/npc-seeding/clear` - Clear NPC catalog
- `POST /api/npc-seeding/reseed` - Reseed NPC catalog

### Network Security
- `GET /api/firewall-rules` - List firewall rules
- `POST /api/firewall-rules` - Create firewall rule
- `GET /api/firewall-rules/:id` - Get firewall rule details
- `PATCH /api/firewall-rules/:id` - Update firewall rule
- `DELETE /api/firewall-rules/:id` - Delete firewall rule
- `PATCH /api/firewall-rules/:id/toggle` - Toggle firewall rule status

### Load Balancer Management
- `GET /api/load-balancers` - List load balancers
- `POST /api/load-balancers` - Create load balancer
- `GET /api/load-balancers/:id` - Get load balancer details
- `PATCH /api/load-balancers/:id` - Update load balancer
- `DELETE /api/load-balancers/:id` - Delete load balancer
- `PATCH /api/load-balancers/:id/toggle` - Toggle load balancer status
- `POST /api/load-balancers/:id/health-check` - Perform health check

### Security Metrics
- `GET /api/security-metrics/impact/:datacenterId` - Get security impact for datacenter
- `GET /api/security-metrics/sla-adjustments/:datacenterId` - Get SLA adjustments
- `GET /api/security-metrics/contract-status/:contractId` - Get contract security status
- `GET /api/security-metrics/incidents` - Get security incidents
- `POST /api/security-metrics/incidents/:id/resolve` - Resolve security incident
- `DELETE /api/security-metrics/incidents/cleanup` - Cleanup resolved incidents
- `GET /api/security-metrics/dashboard` - Get security dashboard data
- `GET /api/security-metrics/recommendations` - Get security recommendations

## Development Guidelines

### Code Style
- Use TypeScript for all code
- Follow ESLint and Prettier configurations
- Use meaningful variable and function names
- Write code in English

### Git Workflow
- Use conventional commit messages
- Create feature branches for new features
- Submit pull requests for code review

### Database
- Use TypeORM migrations for schema changes
- Follow naming conventions for entities and columns
- Use proper relationships and constraints

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000 and 33000 are available
2. **Database connection**: Verify PostgreSQL is running and credentials are correct
3. **Redis connection**: Ensure Redis is running for WebSocket and queue functionality
4. **PNPM issues**: Clear cache with `pnpm store prune`

### Logs

```bash
# View backend logs
pnpm api:dev

# View frontend logs
pnpm front:dev

# View Docker logs
pnpm docker:logs
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details