const statusEl = document.getElementById("status");
const consentBanner = document.getElementById("consentBanner");
const consentAllow = document.getElementById("consentAllow");
const consentDeny = document.getElementById("consentDeny");

let watchId = null;

// assign a clientId for this user
let clientId = localStorage.getItem("clientId");
if (!clientId) {
  clientId = Math.random().toString(36).substring(2);
  localStorage.setItem("clientId", clientId);
}

function updateStatus(txt) {
  statusEl.textContent = txt;
}

function showCoords(pos) {
  const { latitude, longitude, accuracy } = pos.coords;
  const timestamp = new Date(pos.timestamp).toISOString();
  const payload = { latitude, longitude, accuracy, timestamp, clientId };
  sendToServer(payload);
}

async function requestAndStart() {
  if (!("geolocation" in navigator)) {
    updateStatus("Geolocation not supported by browser");
    return;
  }
  try {
    updateStatus("Requesting permission...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateStatus("Permission granted.");
        consentBanner.style.display = "none";
        startWatch();
        showCoords(pos);
      },
      (err) => {
        updateStatus("Permission denied or error: " + (err.message || err));
        consentBanner.style.display = "block";
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  } catch (e) {
    updateStatus("Error: " + e.message);
  }
}

function startWatch() {
  if (watchId !== null) return;
  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      updateStatus("Running in background...");
      showCoords(pos);
    },
    (err) => {
      updateStatus("Watch error: " + (err.message || err));
    },
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
  );
}

function stopWatch() {
  if (watchId === null) return;
  navigator.geolocation.clearWatch(watchId);
  watchId = null;
  updateStatus("Watch stopped");
}

async function sendToServer(payload) {
  try {
    const BACKEND_URL = "";
    const url = BACKEND_URL ? `${BACKEND_URL}/api/location` : "/api/location";
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    // Payload sent silently — no UI update
  } catch (e) {
    console.error("send error:", e.message);
  }
}

// Consent buttons
consentAllow.addEventListener("click", () => {
  consentBanner.style.display = "none";
  requestAndStart();
});
consentDeny.addEventListener("click", () => {
  consentBanner.style.display = "block";
  updateStatus("User denied consent.");
});

// On load
window.addEventListener("load", async () => {
  consentBanner.style.display = "flex";
  if (navigator.permissions && navigator.permissions.query) {
    try {
      const p = await navigator.permissions.query({ name: "geolocation" });
      if (p.state === "granted") {
        consentBanner.style.display = "none";
        startWatch();
        updateStatus("Tracking enabled.");
      } else if (p.state === "prompt") {
        requestAndStart();
      } else {
        updateStatus("Permission state: " + p.state);
      }
      p.onchange = () => {
        if (p.state === "granted") {
          consentBanner.style.display = "none";
          startWatch();
        } else {
          stopWatch();
          consentBanner.style.display = "flex";
        }
      };
    } catch {
      requestAndStart();
    }
  } else {
    requestAndStart();
  }
});
