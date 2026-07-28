# ElectroPi Task Management API

A production-grade REST API for a task management application built with **NestJS**, **MySQL**, and **TypeORM**.

## 🚀 Features

- **Authentication:** JWT-based login and registration with bcrypt password hashing.
- **Role-Based Access Control (RBAC):** Admin and Member roles via global guards.
- **Projects & Tasks:** Full CRUD operations with proper relation mappings.
- **Security & Validation:** Data validation via `class-validator`, centralized error handling, and robust interceptors.
- **API Documentation:** OpenAPI (Swagger) interface.
- **Docker:** Ready-to-use `docker-compose.yml` for spinning up the app and DB.

## 🛠️ Prerequisites

- Node.js (v18+)
- MySQL (v8+) or Docker

## ⚙️ Setup & Installation

1. **Clone & Install**
   ```bash
   cd server
   npm install
   ```

2. **Environment Configuration**
   Copy the example environment file and configure it:
   ```bash
   cp .env.example .env
   ```
   *Make sure to provide your MySQL credentials (`DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`).*

3. **Database Setup & Migrations**
   If you have a local MySQL instance running, create the database and run the migrations:
   ```bash
   npm run migration:run
   ```

4. **Seed Database (Optional)**
   Create a demo Admin and Member user:
   ```bash
   npm run seed
   ```
   *Admin Credentials:* `admin@demo.com` / `Admin@123`
   *Member Credentials:* `member@demo.com` / `Member@123`

## 🏃 Running the Application

### Locally (Dev)
```bash
npm run start:dev
```
*API will be available at: http://localhost:3000/api*

### Using Docker Compose (Bonus Feature)
To run the entire stack (App + MySQL) in Docker:
```bash
docker-compose up --build
```
*(The API will be available at http://localhost:3000/api)*

## 📚 API Documentation

Once the app is running, visit the Swagger UI for comprehensive API documentation:
**[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

## 🧪 Testing

9 meaningful unit tests cover core business logic and database mocks.
```bash
npm run test
```

## 🏗️ Architecture & Structure

- **`src/common/`**: Contains global guards (`JwtAuthGuard`, `RolesGuard`), decorators (`@CurrentUser`, `@Roles`), filters, and interceptors.
- **`src/config/`**: Uses `@nestjs/config` and `Joi` to validate environment variables strictly upon startup.
- **`src/database/data-source.ts`**: The TypeORM CLI config. Migrations are completely decoupled from `src/` execution to ensure no auto-sync (`DB_SYNC=false`) happens in production.
- **`src/modules/`**: Feature-based modules containing Controllers, Services, DTOs, and Entities for separation of concerns.
