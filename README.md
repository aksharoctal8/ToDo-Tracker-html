# TaskFlow - Task Management & Tracking System

TaskFlow is a responsive task-management application with an Express MVC foundation, EJS views, and MongoDB-backed Mongoose models. Authentication and task management use protected server routes; visual preferences remain browser-local.

## Requirements

- Node.js 18 or newer
- npm
- MongoDB (local or hosted)

## Setup

1. Install dependencies:

   ```sh
   npm install
   ```

2. Configure your local `.env` file. It is ignored by Git and contains no connection string by default. If it is missing, create it from the template:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Set `MONGODB_URI` in `.env` to your MongoDB connection string. For a local MongoDB instance, use `mongodb://127.0.0.1:27017/taskflow`.

4. Generate a JWT signing secret and put it in `.env`:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

   Copy the generated value into `JWT_SECRET`. The server requires at least 32 random bytes and never uses a hardcoded secret.

5. Start the app:

   ```sh
   npm start
   ```

Open [http://localhost:3000](http://localhost:3000). Set `PORT` in `.env` to change the port. Run `npm run dev` to restart automatically after server-side changes.

The server does not start without `MONGODB_URI`, a sufficiently strong `JWT_SECRET`, or if MongoDB is unreachable. Database credentials and signing keys belong only in the ignored local `.env` file; do not commit it. `.env.example` contains variable names and safe defaults only.

## MVC layout

```text
config/             Environment and MongoDB connection configuration
controllers/        HTTP request handlers
middleware/         Request validation, 404 handling, and error handling
models/             Mongoose User, Project, Task, Notification, and Activity schemas
routes/             Page, authentication, task, project, and health-check route registration
services/           MongoDB-backed task, project, and page-data services
utils/              Shared application utilities and errors
views/              EJS pages and reusable partials
public/
├── css/            Stylesheets
├── js/              Browser-side interactions
└── images/          Static image assets
app.js               Express configuration and middleware
server.js            Database startup and graceful HTTP shutdown
```

## Current scope

- Public pages and all workspace views continue to render with EJS.
- Static assets are served only from `public/`.
- `/api/health` reports HTTP and MongoDB connection readiness.
- Registration and login validate submitted data, hash passwords with bcrypt, and authenticate with short-lived JWTs in HttpOnly, SameSite=Strict cookies.
- Protected workspace routes redirect signed-out visitors to login. Logout and password changes revoke issued tokens by rotating a per-user token version.
- Tasks support create, read, update, status changes, and owner-only deletion. Task lists include scoped search, status/priority/category/project/due-date filters, sorting, and pagination.
- Tasks belong to their creator and can also be assigned to an active user in the selected project. Users see tasks they created or that are assigned to them.
- Task status values are pending, in progress, completed, and cancelled; priorities are low, medium, high, and critical. Overdue tasks are detected from their due date and current status.
- Task and dashboard data are queried from MongoDB; the old browser-local sample-task store is no longer used.
- Projects support create, view, edit, delete, status/date management, and member assignment. Owners manage project data; project members can view it.
- Project progress is calculated from all related MongoDB tasks and displayed with task totals and completion counts. Deleting a project removes the project reference from its tasks without deleting those tasks.
- Dashboard task statistics, completion percentage, recent tasks, project counts, and recent project progress are loaded from MongoDB for the signed-in user. Analytics includes that user's task status and priority distributions, seven-day completion history, overdue breakdown, and progress for accessible projects.
- Mutating form requests require a CSRF token; authentication endpoints are rate-limited.
- Profile details and password changes are stored through Mongoose. Password hashes are excluded from normal queries and serialization.
- Use `/register` to create the first account, then `/login` to sign in. The authenticated workspace remains protected until logout or token expiry.
- Request validation, centralized error handling, and a consistent 404 response are configured.
- Mongoose schemas establish User, Project, Task, Notification, and Activity data shapes with references, validation, timestamps, and query indexes.
- Theme and notification preferences remain browser-local. Role-based authorization is not implemented.
- No database credentials or JWT secrets are committed.
