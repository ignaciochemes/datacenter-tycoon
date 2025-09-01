# Datacenter Tycoon

A full-stack datacenter management simulation game built with NestJS and Next.js in a monorepo structure.

## Project Structure

```
datacenter-tycoon/
├── datacenter-tycoon-api/     # Backend API (NestJS)
├── datacenter-tycoon-front/   # Frontend App (Next.js)
├── packages/                  # Shared packages
├── pnpm-workspace.yaml       # PNPM workspace configuration
├── turbo.json                # Turborepo configuration
└── package.json              # Root package.json
```

## Tech Stack

### Backend (datacenter-tycoon-api)
- **Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT
- **Real-time**: WebSockets with Socket.IO
- **Queue**: BullMQ with Redis
- **Documentation**: Swagger/OpenAPI

### Frontend (datacenter-tycoon-front)
- **Framework**: Next.js 15 with Turbopack
- **UI**: Tailwind CSS + shadcn/ui
- **Language**: TypeScript
- **Styling**: PostCSS

## Prerequisites

- Node.js >= 18.0.0
- PNPM >= 8.0.0
- PostgreSQL
- Redis
- Docker (optional)

## Quick Start

### 1. Install Dependencies

```bash
# Install PNPM globally if not already installed
npm install -g pnpm

# Install all dependencies
pnpm install
```

### 2. Environment Setup

```bash
# Copy environment files
cp datacenter-tycoon-api/.env-example datacenter-tycoon-api/.env
```

Update the `.env` file with your database and Redis configuration.

### 3. Database Setup

```bash
# Start PostgreSQL and Redis (using Docker)
pnpm docker:up

# Run database migrations
pnpm api:typeorm migration:run
```

### 4. Development

```bash
# Start both frontend and backend in development mode
pnpm dev

# Or start individually
pnpm api:dev    # Backend only
pnpm front:dev  # Frontend only
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:33000
- **API Documentation**: http://localhost:33000/api-docs

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
- **Real-time Simulation**: Live monitoring of power, cooling, and performance

### Technical Features
- **JWT Authentication**: Secure user authentication and authorization
- **WebSocket Events**: Real-time updates and notifications
- **Hardware Seeding**: Automated hardware catalog population
- **RESTful API**: Comprehensive API with Swagger documentation
- **Responsive UI**: Modern, mobile-friendly interface

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