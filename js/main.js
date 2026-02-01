import { initMLDetector } from "./ml-detector.js";
import { createMaskiverseController } from "./maskiverse.js";

const maskiverse = createMaskiverseController();

const startScreenEl = document.getElementById("startScreen");
const startBtn = document.getElementById("startAR");
const startHintEl = document.getElementById("startHint");
const errorBannerEl = document.getElementById("errorBanner");
const statusEl = document.getElementById("status");

let mlDetector = null;
let cameraStream = null;

function showError(msg) {
  errorBannerEl.textContent = msg;
  errorBannerEl.classList.remove("hidden");
}

function hideError() {
  errorBannerEl.classList.add("hidden");
}

function setStatus(msg) {
  if (statusEl) statusEl.textContent = msg;
}

// Camera on mobile requires HTTPS (except localhost) + a user gesture
if (!window.isSecureContext) {
  startHintEl.textContent =
    "Camera access requires HTTPS on mobile. Use an HTTPS tunnel (ngrok) or open this on the same device as localhost.";
}

// Initial state
setStatus("Looking for Maski...");

// Start camera and ML detection
async function startCamera() {
  hideError();
  setStatus("Starting camera...");
  
  try {
    const video = document.getElementById("cameraVideo");
    if (!video) throw new Error("Video element not found");

    // Request camera access
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment", // Use back camera on mobile
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });

    video.srcObject = cameraStream;
    await video.play();

    setStatus("Camera ready");
    
    // Hide start screen
    startScreenEl.classList.add("hidden");

    // Initialize ML detector
    try {
      console.log("Initializing ML detector...");
      setStatus("Loading ML model...");
      
      mlDetector = await initMLDetector(video, handleMaskiDetected);
      
      const status = mlDetector?.getStatus?.();
      console.log("ML Detector status:", status);
      
      if (status?.modelLoaded) {
        mlDetector?.start?.();
        console.log("✅ ML detection started");
        setStatus("Point camera at Maski...");
      } else if (status?.lastError) {
        console.log("⚠️ ML model load failed:", status.lastError);
        setStatus(`ML error: ${status.lastError.substring(0, 40)}...`);
        showError("ML detection unavailable - check console for details");
      } else {
        console.log("⚠️ ML model not loaded");
        setStatus("ML model not loaded (see console)");
      }
    } catch (err) {
      console.error("ML detector initialization failed:", err);
      setStatus("ML detection unavailable");
      showError(`ML error: ${err.message}`);
    }

  } catch (err) {
    console.error("Camera error:", err);
    showError(`Could not start camera: ${err?.message || err}`);
    setStatus("Camera blocked");
  }
}

function handleMaskiDetected(detection) {
  // Maski found! Show the celebration card
  const confidence = Math.round(detection.confidence * 100);
  setStatus(` Maski found! (${confidence}%)`);
  
  console.log(" Maski detected:", detection);
  
  // Show Maskiverse card with all options
  maskiverse.show(detection);
  
  // Haptic feedback
  if (navigator.vibrate) {
    navigator.vibrate([50, 100, 50]);
  }
}

// Test function (type testMaski() in console)
window.testMaski = function() {
  console.log(' Testing Maskiverse...');
  handleMaskiDetected({
    confidence: 0.95,
    timestamp: Date.now(),
    demo: true
  });
};

// Listen for custom event
window.addEventListener('maskiDetected', (e) => {
  handleMaskiDetected(e.detail);
});

// Handle errors
window.addEventListener("error", (e) => {
  const msg = e?.message || "Unexpected error";
  showError(msg);
});

window.addEventListener("unhandledrejection", (e) => {
  const reason = e?.reason;
  const msg = reason?.message || String(reason || "Unhandled promise rejection");
  showError(msg);
});

// Wire up start button
startBtn.addEventListener("click", startCamera);

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  if (mlDetector?.stop) mlDetector.stop();
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
  }
});
