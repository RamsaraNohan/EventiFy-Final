# EventiFy Local Runbook

This guide contains step-by-step instructions to run the EventiFy application locally, run tests, and manage the database.

## Prerequisites
- Node.js (v18+)
- pnpm (`npm install -g pnpm`)
- Docker & Docker Compose (for the local MySQL instance)

## 1. Environment Setup

1. Copy the example environment variable file in the API application:
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```
   *Modify the credentials if necessary, but the defaults match the provided `docker-compose.yml`.*

## 2. Install Dependencies

In the root of the repository, install all workspace dependencies:
```bash
pnpm install
```

## 3. Database Setup

1. **Start the Database Container:**
   ```bash
   docker-compose up -d
   ```
   *This starts the MySQL database in the background.*

2. **Initialize & Seed Database:**
   ```bash
   pnpm --filter api run seed
   ```
   *This script forces a sync (creates all tables based on the Sequelize models) and inserts default mock data: an admin user (`admin@eventify.local`), a test vendor, and some mock events/notifications.*

*(Note: Production migrations should be run via the `umzug` migration scripts provided in `apps/api/src/database/migrations` rather than using `run seed`.)*

## 4. Run the Application

You can start both the API and the Web frontend concurrently from the root directory:
```bash
pnpm run dev
```
Alternatively, you can run them individually in separate terminal windows:
- API Server: `cd apps/api && pnpm run dev`
- Web Frontend: `cd apps/web && pnpm run dev`

The Web UI will be available at [http://localhost:5173](http://localhost:5173) and the API will be available at [http://localhost:3000](http://localhost:3000).

## 5. Testing

The API uses `jest` and `supertest` for integration testing.

To run the API integration tests:
```bash
pnpm --filter api run test
```

## 6. Accessing the Application
- **Create an Account:** Go to `http://localhost:5173/register` and select 'Client' or 'Vendor Owner'.
- **Test User:** You can log in using `admin@eventify.local` with the default password generated or initialize fresh accounts via the UI.
- Use the **TRANSMIT TEST BOOKING** button on the Home Dashboard to trigger a mock real-time Notification.

## 7. Git Workflow & Sprints
This repository is staged on the `feature/full-implementation` branch. To commit your progress:
```bash
git add .
git commit -m "feat(ui/api): implement futuristic dashboard, realtime notifications, and test skeletons"
```
