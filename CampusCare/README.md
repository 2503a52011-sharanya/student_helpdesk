# CampusCare — Student Query & Helpdesk System

## Folder structure

```text
project/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── seed.js
│   ├── .env.example
│   └── src/
│       ├── middleware/
│       │   └── auth.js
│       ├── models/
│       │   ├── User.js
│       │   └── Query.js
│       └── routes/
│           ├── authRoutes.js
│           └── queryRoutes.js
└── frontend/
    ├── index.html
    ├── style.css
    └── script.js
```

## Important
The frontend files are named `style.css` and `script.js` as in your requested folder layout. The HTML file already links to those filenames.

## Run the project

1. Install Node.js and start MongoDB locally, or create a MongoDB Atlas database.
2. Open the `backend` folder in the VS Code terminal.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Copy `.env.example` to `.env` inside `backend` and configure it:

   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/student_helpdesk
   JWT_SECRET=replace_with_a_long_random_secret
   JWT_EXPIRES_IN=1d
   ```

5. Create the demo student and faculty accounts:

   ```bash
   npm run seed
   ```

6. Start the application:

   ```bash
   npm run dev
   ```

7. Open http://localhost:5000 in your browser. Do not open `frontend/index.html` directly.

## Demo accounts

- Student: `student@demo.com` / `Demo@123`
- Faculty: `faculty@demo.com` / `Demo@123`

Public registration creates student accounts only. Faculty accounts are provisioned by the seed script or an administrator.

## API summary

All query endpoints require a JWT bearer token.

- `POST /api/auth/register` — student registration
- `POST /api/auth/login` — login
- `GET /api/auth/me` — current user
- `POST /api/queries` — create query (student)
- `GET /api/queries` — student's own queries or all queries for faculty
- `GET /api/queries/stats` — faculty statistics
- `GET /api/queries/:id` — view query
- `PATCH /api/queries/:id/status` — update status (faculty)
- `POST /api/queries/:id/replies` — reply (faculty)
- `PATCH /api/queries/:id/close` — close resolved query (student owner)
- `DELETE /api/queries/:id` — delete pending query (student owner)

Before public deployment, use a strong secret, HTTPS, rate limiting, secure environment variables, and test all role permissions.
