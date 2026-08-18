// On Vercel, the frontend and API share one origin. Local development uses port 3000.
window.METRO_API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:3000"
  : window.location.origin;

// Socket.IO needs a persistent server, so retain it for local development only.
window.METRO_REALTIME_ENABLED = window.location.hostname === "localhost";
