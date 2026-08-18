# Metro Live (Metro Station Tracker)

Metro Live is a full-stack real-time web application that allows users to track metro stations, view live viewer counts, and receive instant announcements. It features a public-facing dashboard for commuters and a secure admin interface for broadcasting updates.

## Features

- **Real-Time Announcements:** Instant updates pushed to clients via Socket.io.
- **Live Presence Tracking:** See exactly how many users are currently viewing a specific station.
- **Categorized Stations:** Browse stations easily by their respective lines (Red, Orange, Green).
- **Admin Controls:** JWT-secured authentication allowing administrators to post announcements and add new stations.
- **Responsive UI:** A sleek, lightweight frontend built with Vanilla HTML, CSS, and JS (no heavy frameworks).

## Tech Stack

- **Backend:** Node.js, Express.js, MongoDB (Mongoose), Socket.io, JSON Web Tokens (JWT)
- **Frontend:** HTML5, CSS3 (Custom Properties, Flexbox), Vanilla JavaScript
- **Testing:** Jest, Supertest, MongoDB Memory Server
- **Deployment:** Ready for Vercel (Frontend)

## Project Structure

```text
 Metro-Live-Project
┣ Backend/            # Node.js Express server & API
┃ ┣ config/           # Configuration files
┃ ┣ controllers/      # Route handlers
┃ ┣ db/               # Database connection logic
┃ ┣ middleware/       # Auth & Error middlewares
┃ ┣ models/           # Mongoose schemas (Station, Announcement)
┃ ┣ routes/           # Express API routers
┃ ┣ seed/             # Database seeding scripts
┃ ┣ services/         # Business logic
┃ ┣ sockets/          # Socket.io initialization and events
┃ ┣ tests/            # Jest test suites
┃ ┣ app.js            # Express app setup
┃ ┗ server.js         # Server entry point
┣ Frontend/           # Vanilla Web Client
┃ ┣ css/              # Stylesheets
┃ ┣ js/               # Client-side logic & config
┃ ┗ index.html        # Main dashboard view
┣ Postman/            # API Documentation / Testing
┃ ┗ METRO_SYNC.postman_collection.json
┗ vercel.json         # Vercel deployment configuration
```

## Local Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas)

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd Backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up Environment Variables:
   - Copy `.env.example` to a new file named `.env`.
   - Update the variables (e.g., `MONGO_URI`, `JWT_SECRET`, admin credentials).
4. Seed the database with initial metro stations:
   ```bash
   npm run seed
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```
   *The server will start on `http://localhost:3000`.*

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd Frontend
   ```
2. Configure the API endpoint:
   - Open `js/config.js` and ensure `window.METRO_API_BASE` points to your backend URL (leave empty string `""` for relative path if running together, or set to `"http://localhost:3000"` for local dev).
3. Serve the frontend:
   - You can use an extension like VS Code Live Server, or run a simple python server:
     ```bash
     python -m http.server 8000
     ```
   - Open `http://localhost:8000` in your browser.

## Testing

The backend includes a comprehensive test suite using **Jest**, **Supertest**, and **MongoDB Memory Server** for an isolated testing environment.

To run the tests:
```bash
cd Backend
npm test
```

## API Documentation
A complete Postman collection is included for testing the API endpoints.
1. Open [Postman](https://www.postman.com/).
2. Import the `METRO_SYNC.postman_collection.json` file located in the `Postman/` folder.
3. The collection includes pre-configured tests, authentication variables, and environment setup.

## Deployment

The repository includes a `vercel.json` file configured for deploying the **Frontend** directory seamlessly to [Vercel](https://vercel.com).

**Note:** You need to run the backend by yourself to make Vercel read the backend and make it work.
