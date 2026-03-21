# EventiFy

EventiFy is an event vendor marketplace & booking platform. This monorepo contains the initial skeleton (Deliverable 1) powered by Express, Sequelize (MySQL), and Vite + React.

## System Dependencies
- Docker & Docker Compose
- Node.js (v18+)
- pnpm

## Local Development Setup

### 1. Install Dependencies
In the root directory, install workspace dependencies:
```bash
pnpm install
```

### 2. Start MySQL Database
A `docker-compose.yml` is provided at the root. Spin up the local MySQL instance:
```bash
docker-compose up -d
```

### 3. Initialize and Seed the Database
Ensure the API builds first (if Typescript executes slowly, `ts-node` is configured for the seed script).
```bash
# Run the DB sync and seeder
cd apps/api
pnpm run seed
```
This will automatically sync the `User`, `Vendor`, `Booking`, and `Notification` Sequelize models to the MySQL database and inject mock users.

### 4. Start the Application
You can start both the backend and frontend concurrently from the root directory:
```bash
pnpm run dev
```

- API runs on: `http://localhost:8000`
- Web app runs on: `http://localhost:5173`

### 5. Testing the Implementation
1. Head over to the frontend at `http://localhost:5173`.
2. Login with the seeded client account:
   - **Email:** `client@eventify.local`
   - **Password:** `password123`
3. Notice the logged-in state inside the Navbar with the bell icon.
4. On the Home Page, click the **"Trigger Test Booking Request"** button. This will instantly fire off a mock booking, broadcast a Socket.io event, and increment the Notification Bell dynamically!
5. View `/notifications` to see your persisted notifications.

## Project Structure
- `apps/api/`: Express.js backend API with Socket.io real-time connection.
- `apps/web/`: React frontend setup with Vite, Tailwind CSS, React-Router, and Zustand.
