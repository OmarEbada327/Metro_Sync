// ---------- Configuration ----------
// js/config.js selects the same-origin Vercel API in production and localhost in development.
const API_BASE = window.METRO_API_BASE || "http://localhost:3000";

// ---------- State ----------
const state = {
  stations: [],
  selectedStationId: null,
  selectedStation: null,
  socket: null,
  token: localStorage.getItem("metroLiveToken") || null,
  announcements: [],
  pagination: { page: 1, pages: 1 },
  viewers: 0,
};

// ---------- DOM references ----------
const el = {
  connDot: document.getElementById("connDot"),
  connLabel: document.getElementById("connLabel"),
  authArea: document.getElementById("authArea"),
  signInBtn: document.getElementById("signInBtn"),
  lineList: document.getElementById("lineList"),
  boardEmpty: document.getElementById("boardEmpty"),
  boardContent: document.getElementById("boardContent"),
  stationName: document.getElementById("stationName"),
  stationLine: document.getElementById("stationLine"),
  viewerNumber: document.getElementById("viewerNumber"),
  announcementList: document.getElementById("announcementList"),
  loadMoreBtn: document.getElementById("loadMoreBtn"),
  composer: document.getElementById("composer"),
  composerText: document.getElementById("composerText"),
  composerCount: document.getElementById("composerCount"),
  postBtn: document.getElementById("postBtn"),
  toast: document.getElementById("toast"),
  loginOverlay: document.getElementById("loginOverlay"),
  loginError: document.getElementById("loginError"),
  loginEmail: document.getElementById("loginEmail"),
  loginPassword: document.getElementById("loginPassword"),
  loginCancelBtn: document.getElementById("loginCancelBtn"),
  loginSubmitBtn: document.getElementById("loginSubmitBtn"),
};

const LINE_CLASS = {
  red: "line-red",
  orange: "line-orange",
  green: "line-green",
};

function lineClass(line) {
  return LINE_CLASS[(line || "").toLowerCase()] || "line-default";
}

// ---------- Toast ----------
let toastTimer = null;
function showToast(message, isError = false) {
  el.toast.textContent = message;
  el.toast.classList.toggle("error", isError);
  el.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.toast.hidden = true; }, 3500);
}

// ---------- API helpers ----------
async function apiFetch(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  let body = null;
  try { body = await res.json(); } catch (_) { /* no body */ }

  if (!res.ok) {
    const message = body?.message || body?.errors?.[0]?.msg || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return body;
}

// ---------- Auth ----------
function isAdmin() {
  return Boolean(state.token);
}

function renderAuthArea() {
  if (isAdmin()) {
    el.authArea.innerHTML = "";
    const badge = document.createElement("span");
    badge.className = "btn btn-ghost";
    badge.style.cursor = "default";
    badge.textContent = "Admin";
    const signOut = document.createElement("button");
    signOut.className = "btn btn-ghost";
    signOut.style.marginLeft = "8px";
    signOut.textContent = "Sign Out";
    signOut.addEventListener("click", signOut_);
    el.authArea.appendChild(badge);
    el.authArea.appendChild(signOut);
  } else {
    el.authArea.innerHTML = "";
    const btn = document.createElement("button");
    btn.className = "btn btn-ghost";
    btn.id = "signInBtn";
    btn.type = "button";
    btn.textContent = "Admin Sign In";
    el.authArea.appendChild(btn);
  }
  renderComposerVisibility();
}

function signOut_() {
  state.token = null;
  localStorage.removeItem("metroLiveToken");
  renderAuthArea();
  showToast("Signed out");
}

function openLogin() {
  el.loginError.hidden = true;
  el.loginEmail.value = "";
  el.loginPassword.value = "";
  el.loginOverlay.hidden = false;
  el.loginEmail.focus();
}

function closeLogin() {
  el.loginOverlay.hidden = true;
}

async function submitLogin() {
  const email = el.loginEmail.value.trim();
  const password = el.loginPassword.value;

  el.loginError.hidden = true;
  el.loginSubmitBtn.disabled = true;

  try {
    const body = await apiFetch("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    state.token = body.token;
    localStorage.setItem("metroLiveToken", body.token);
    closeLogin();
    renderAuthArea();
    showToast("Signed in as admin");
  } catch (error) {
    el.loginError.textContent = error.message;
    el.loginError.hidden = false;
  } finally {
    el.loginSubmitBtn.disabled = false;
  }
}

// ---------- Stations sidebar ----------
async function loadStations() {
  try {
    const body = await apiFetch("/api/v1/stations?limit=100");
    state.stations = body.data || [];
    renderLineList();
  } catch (error) {
    el.lineList.innerHTML = `<div class="empty-hint">Couldn't load stations. Is the backend running?</div>`;
    showToast(error.message, true);
  }
}

function renderLineList() {
  const byLine = {};
  for (const station of state.stations) {
    if (!byLine[station.line]) byLine[station.line] = [];
    byLine[station.line].push(station);
  }

  el.lineList.innerHTML = "";

  if (state.stations.length === 0) {
    el.lineList.innerHTML = `<div class="empty-hint">No stations found. Run the seed script.</div>`;
    return;
  }

  for (const [line, stations] of Object.entries(byLine)) {
    const label = document.createElement("div");
    label.className = `line-group-label ${lineClass(line)}`;
    label.textContent = `● ${line} Line`;
    el.lineList.appendChild(label);

    for (const station of stations) {
      const btn = document.createElement("button");
      btn.className = "station-item";
      btn.textContent = station.name;
      btn.dataset.id = station._id;
      if (station._id === state.selectedStationId) btn.classList.add("active");
      btn.addEventListener("click", () => selectStation(station));
      el.lineList.appendChild(btn);
    }
  }
}

// ---------- Station board ----------
async function selectStation(station) {
  state.selectedStationId = station._id;
  state.selectedStation = station;
  state.announcements = [];
  state.pagination = { page: 1, pages: 1 };

  renderLineList();
  el.boardEmpty.hidden = true;
  el.boardContent.hidden = false;
  el.stationName.textContent = station.name;
  el.stationLine.textContent = `${station.line} Line`;
  el.stationLine.className = `station-line ${lineClass(station.line)}`;
  el.announcementList.innerHTML = `<div class="board-list-empty">Loading announcements…</div>`;

  // Clear any draft text so it doesn't get posted to the wrong station
  el.composerText.value = "";
  updateComposerCount();

  renderComposerVisibility();

  if (state.socket?.connected) {
    state.socket.emit("joinStation", { stationId: station._id });
  }

  await loadAnnouncements(true);
}

async function loadAnnouncements(reset = false) {
  if (!state.selectedStationId) return;

  const page = reset ? 1 : state.pagination.page + 1;

  try {
    const body = await apiFetch(
      `/api/v1/stations/${state.selectedStationId}/announcements?page=${page}&limit=10`
    );

    if (reset) {
      state.announcements = body.data;
    } else {
      state.announcements = state.announcements.concat(body.data);
    }
    state.pagination = body.pagination;

    renderAnnouncements();
  } catch (error) {
    if (reset) {
      el.announcementList.innerHTML = `<div class="board-list-empty">Couldn't load announcements.</div>`;
    }
    showToast(error.message, true);
  }
}

function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function renderAnnouncements() {
  el.announcementList.innerHTML = "";

  if (state.announcements.length === 0) {
    el.announcementList.innerHTML = `<div class="board-list-empty">No announcements yet. This station's board is clear.</div>`;
  } else {
    // "Fresh" (amber) styling is reserved for announcements that arrive live
    // via the socket — see prependLiveAnnouncement(). A full re-render (initial
    // load, pagination, switching stations) should never mark the top row as
    // fresh, since it may be hours old.
    for (const announcement of state.announcements) {
      el.announcementList.appendChild(buildAnnouncementRow(announcement, false));
    }
  }

  el.loadMoreBtn.hidden = state.pagination.page >= state.pagination.pages;
}

function buildAnnouncementRow(announcement, isFresh, animate = false) {
  const row = document.createElement("div");
  row.className = "announcement-row" + (isFresh ? " fresh" : "") + (animate ? " flip-in" : "");
  row.dataset.id = announcement._id;

  const time = document.createElement("div");
  time.className = "time-chip";
  time.textContent = formatTime(announcement.createdAt);

  const text = document.createElement("div");
  text.className = "announcement-text";
  text.textContent = announcement.text;

  row.appendChild(time);
  row.appendChild(text);
  return row;
}

function prependLiveAnnouncement(announcement) {
  if (announcement.stationId !== state.selectedStationId) return;

  // Un-mark the previous "fresh" row now that a newer one is arriving
  const previousFresh = el.announcementList.querySelector(".announcement-row.fresh");
  if (previousFresh) previousFresh.classList.remove("fresh");

  state.announcements.unshift(announcement);

  const emptyState = el.announcementList.querySelector(".board-list-empty");
  if (emptyState) emptyState.remove();

  const row = buildAnnouncementRow(announcement, true, true);
  el.announcementList.prepend(row);
}

function renderComposerVisibility() {
  el.composer.hidden = !(isAdmin() && state.selectedStationId);
}

// ---------- Composer ----------
function updateComposerCount() {
  const len = el.composerText.value.length;
  el.composerCount.textContent = `${len} / 500`;
}

async function submitAnnouncement() {
  const text = el.composerText.value.trim();
  if (!text || !state.selectedStationId) return;

  el.postBtn.disabled = true;

  try {
    await apiFetch(`/api/v1/stations/${state.selectedStationId}/announcements`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    el.composerText.value = "";
    updateComposerCount();
    showToast("Announcement posted");
    // The new row appears via the "newAnnouncement" socket broadcast,
    // so we don't insert it manually here.
  } catch (error) {
    showToast(error.message, true);
    if (error.status === 401) {
      signOut_();
    }
  } finally {
    el.postBtn.disabled = false;
  }
}

// ---------- Socket.io ----------
function connectSocket() {
  const socket = io(API_BASE, { transports: ["websocket", "polling"] });
  state.socket = socket;

  socket.on("connect", () => {
    el.connDot.className = "dot dot-on";
    el.connLabel.textContent = "Connected";
    if (state.selectedStationId) {
      socket.emit("joinStation", { stationId: state.selectedStationId });
    }
  });

  socket.on("disconnect", () => {
    el.connDot.className = "dot dot-off";
    el.connLabel.textContent = "Disconnected";
  });

  socket.on("connect_error", () => {
    el.connDot.className = "dot dot-off";
    el.connLabel.textContent = "Connection error";
  });

  socket.on("presenceUpdate", ({ stationId, viewers }) => {
    if (stationId === state.selectedStationId) {
      el.viewerNumber.textContent = viewers;
    }
  });

  socket.on("newAnnouncement", (announcement) => {
    prependLiveAnnouncement(announcement);
  });
}

// ---------- Event wiring ----------
el.loadMoreBtn.addEventListener("click", () => loadAnnouncements(false));
el.composerText.addEventListener("input", updateComposerCount);
el.postBtn.addEventListener("click", submitAnnouncement);
el.authArea.addEventListener("click", (e) => {
  if (e.target.closest("#signInBtn")) openLogin();
});
el.loginCancelBtn.addEventListener("click", closeLogin);
el.loginSubmitBtn.addEventListener("click", submitLogin);
el.loginOverlay.addEventListener("click", (e) => {
  if (e.target === el.loginOverlay) closeLogin();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && document.activeElement === el.loginPassword) submitLogin();
  if (e.key === "Escape" && !el.loginOverlay.hidden) closeLogin();
});

// ---------- Init ----------
renderAuthArea();
loadStations();
if (window.METRO_REALTIME_ENABLED) {
  connectSocket();
} else {
  el.connLabel.textContent = "Live updates unavailable";
}
