# Login Implementation Guide

## What's Been Implemented

### Frontend (React)

1. **Axios Instance** (`src/utils/axios.js`)

   - Base URL: `http://localhost:8080/api/v1`
   - Configured with `withCredentials: true` for cookie handling
   - JSON content type headers

2. **Login Page** (`src/pages/LoginPage.jsx`)
   - Form submission with email and password
   - POST request to `/auth/login` endpoint
   - Error handling and display
   - Loading state during request
   - Token storage in localStorage
   - Automatic redirect to homepage on success using `useNavigate`

### Backend (Express)

1. **CORS Configuration** (`src/app.js`)
   - Allows requests from `http://localhost:5173` (default Vite dev server)
   - Can be configured via `FRONTEND_URL` environment variable
   - Credentials enabled for cookie support
   - Supports all necessary HTTP methods

## How to Use

### Start the Backend

```bash
cd giggle-fest-be-repository
npm start
# Server runs on http://localhost:8080
```

### Start the Frontend

```bash
cd giggle-fest-fe
npm run dev
# Frontend runs on http://localhost:5173
```

### Test the Login

1. Navigate to `http://localhost:5173/login`
2. Enter valid credentials
3. Click "MASUK" button
4. On success, you'll be redirected to the homepage

## Environment Variables (Optional)

Add to backend `.env` file:

```
FRONTEND_URL=http://localhost:5173
```

## Features

- ✅ Axios instance for API calls
- ✅ CORS properly configured
- ✅ Error handling and display
- ✅ Loading state
- ✅ Token storage
- ✅ Automatic navigation after login
- ✅ Form validation
