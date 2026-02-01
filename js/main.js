import { TARGETS, EXTRA_TARGET_PACKS } from "./config.js";
import { initAR } from "./ar.js";
import { createUIController } from "./ui.js";
import { initMLDetector } from "./ml-detector.js";
import { createMaskiverseController } from "./maskiverse.js";

const ui = createUIController();
const maskiverse = createMaskiverseController();

const startScreenEl = document.getElementById("startScreen");
const startBtn = document.getElementById("startAR");
const startHintEl = document.getElementById("startHint");
const errorBannerEl = document.getElementById("errorBanner");
const sceneEl = document.querySelector("a-scene");

const ar = initAR({
  targets: TARGETS,
  onFound: handleFound,
  onLost: handleLost,
});

let mlDetector = null;

const rootStyle = document.documentElement.style;
let viewportLocked = false;

function setViewportVars({ lock = false } = {}) {
  const vv = window.visualViewport;
  const width = Math.round(vv?.width ?? window.innerWidth);
  const height = Math.round(vv?.height ?? window.innerHeight);
  rootStyle.setProperty("--app-width", `${width}px`);
  rootStyle.setProperty("--app-height", `${height}px`);
  if (lock) viewportLocked = true;
}

// Keep these updated during startup; lock them once AR begins.
setViewportVars();
window.visualViewport?.addEventListener("resize", () => {
  if (!viewportLocked) setViewportVars();
});
window.addEventListener("orientationchange", () => {
  viewportLocked = false;
  setTimeout(() => setViewportVars(), 250);
});

function showError(msg) {
  errorBannerEl.textContent = msg;
  errorBannerEl.classList.remove("hidden");
}

function hideError() {
  errorBannerEl.classList.add("hidden");
}

// Initial state
ui.setStatus("Point camera at a page…");
ui.showDock(false);
ui.hideContextCards();

// Camera on mobile requires HTTPS (except localhost) + a user gesture in many cases.
if (!window.isSecureContext) {
  startHintEl.textContent =
    "Camera access requires HTTPS on mobile. Use an HTTPS tunnel (ngrok) or open this on the same device as localhost.";
}

function getTargetUrl() {
  const cfg = sceneEl?.getAttribute?.("mindar-image");
  const src = cfg && typeof cfg === "object" ? cfg.imageTargetSrc : null;
  if (!src) return null;
  try {
    return new URL(src, window.location.href).toString();
  } catch {
    return src;
  }
}

async function preflightTargetFile() {
  const url = getTargetUrl();
  if (!url) return;

  // Prefer a tiny request so we don't download the whole .mind file twice.
  // Some static servers don't allow HEAD, so we try Range as a fallback.
  try {
    const head = await fetch(url, { method: "HEAD", cache: "no-store" });
    if (head.ok) return;
    if (head.status !== 405 && head.status !== 501) {
      throw new Error(`Target file request failed (${head.status})`);
    }
  } catch {
    // Continue to Range fallback
  }

  const res = await fetch(url, {
    method: "GET",
    headers: { Range: "bytes=0-0" },
    cache: "no-store",
  });
  if (!res.ok && res.status !== 206) {
    throw new Error(`Target file not reachable (${res.status})`);
  }
}

window.addEventListener("error", (e) => {
  const msg = e?.message || "Unexpected JS error";
  showError(msg);
});

window.addEventListener("unhandledrejection", (e) => {
  const reason = e?.reason;
  const msg = reason?.message || String(reason || "Unhandled promise rejection");
  showError(msg);
});

// Start MindAR only after a user tap (helps iOS Safari / black-screen cases)
async function startAR() {
  hideError();
  ui.setStatus("Starting camera…");
  try {
    if (!sceneEl) throw new Error("AR scene missing");

    // Stabilize viewport sizing before the renderer initializes.
    setViewportVars();

     // Fail fast if the target file is missing/unreachable (this prevents
     // MindAR from later crashing with an undefined tracker/dummyRun).
    try {
      await preflightTargetFile();
    } catch (e) {
      const url = getTargetUrl();
      throw new Error(
        `Could not load AR target file${url ? ` (${url})` : ""}. ${e?.message || e}`
      );
    }

    if (!sceneEl.hasLoaded) {
      await new Promise((resolve) => sceneEl.addEventListener("loaded", resolve, { once: true }));
    }

    const system = sceneEl.systems?.["mindar-image-system"];
    if (!system?.start) throw new Error("MindAR system not ready");

    await system.start();

    // Load any optional extra target packs (e.g. MML product markers)
    await tryLoadExtraTargetPacks(system);

    // Lock viewport dimensions to prevent mid-session canvas jumps.
    setViewportVars({ lock: true });

    // Hide the start overlay as soon as start() succeeds.
    // (Some browsers/devices don't always emit arReady reliably.)
    startScreenEl.classList.add("hidden");

    // Initialize ML-based "Wild Maski" detection (runs in parallel with MindAR tracking)
    // This is OPTIONAL - app works fine without it until you train the model
    try {
      const video = document.querySelector("video");
      if (video) {
        console.log("Initializing ML detector with video:", {
          readyState: video.readyState,
          width: video.videoWidth,
          height: video.videoHeight,
        });
        mlDetector = await initMLDetector(video, handleMaskiDetection);
        
        // Log detector status
        const status = mlDetector?.getStatus?.();
        console.log("ML Detector status:", status);
        
        if (status?.modelLoaded) {
          mlDetector?.start?.();
          console.log("✅ ML detection loop started");
        } else {
          console.log("⚠️ ML model not loaded - detection disabled (this is OK)");
        }
      } else {
        console.warn("No video element found - ML detection disabled");
      }
    } catch (err) {
      console.log("ML detector initialization skipped:", err.message);
      console.log("👉 App works fine without ML detection. Train model later.");
    }
  } catch (err) {
    showError(`Could not start camera: ${err?.message || err}`);
    ui.setStatus("Camera blocked");
  }
}

startBtn.addEventListener("click", startAR);

sceneEl?.addEventListener("arReady", () => {
  startScreenEl.classList.add("hidden");
  ui.setStatus("Point camera at a page…");
});

sceneEl?.addEventListener("arError", (e) => {
  const msg = e?.detail?.message || "AR error. Check camera permissions and HTTPS.";
  showError(msg);
});

function handleFound(def) {
  ui.setStatus(`Tracking: ${def.label}`);
  ui.showDock(true);

  if (def.type === "product") {
    ui.showProductCard(def);
    return;
  }

  if (def.type === "emergency") {
    ui.showEmergencyCard();
    return;
  }

  if (def.month && def.layout) {
    ui.showMonthCard(def);
    return;
  }

  ui.showPageCard(def);
}

function handleLost() {
  ui.setStatus("Point camera at a page…");
  ui.showDock(false);
  ui.hideContextCards();
  ui.closeNotePanel();
}

function handleMaskiDetection(detection) {
  // Triggered by ML when Maski character is spotted in the wild (not via MindAR marker)
  const confidence = Math.round(detection.confidence * 100);
  ui.setStatus(`🎯 Wild Maski spotted! (${confidence}% match)`);
  
  // Show Maskiverse signup flow
  maskiverse.show(detection);
  
  // Optional: vibrate on detection (if supported)
  if (navigator.vibrate) {
    navigator.vibrate([50, 100, 50]);
  }
}

// Allow testing Maskiverse UI without ML model (open console and run: testMaski())
window.testMaski = function() {
  console.log('🧪 Testing Maskiverse UI...');
  handleMaskiDetection({
    confidence: 0.95,
    timestamp: Date.now(),
    demo: true
  });
};

// Also listen for custom event from ml-detector test function
window.addEventListener('maskiDetected', (e) => {
  handleMaskiDetection(e.detail);
});

function getController(system) {
  // Be defensive across MindAR versions/builds.
  return (
    system?.controller ||
    system?._controller ||
    system?.arController ||
    system?._arController ||
    system
  );
}

function getTargetCount(controller) {
  const candidates = [
    controller?.markerDimensions?.length,
    controller?.dimensions?.length,
    controller?.trackingDataList?.length,
    controller?.tracker?.trackingKeyframeList?.length,
    controller?.tracker?.featurePointsListT?.length,
  ].filter((n) => typeof n === "number" && Number.isFinite(n));
  return candidates.length ? Math.max(...candidates) : 0;
}

async function tryLoadExtraTargetPacks(system) {
  const controller = getController(system);
  const addFromBuffer = controller?.addImageTargetsFromBuffer;
  if (typeof addFromBuffer !== "function") {
    // If we can't append packs, just skip silently.
    return;
  }

  for (const pack of EXTRA_TARGET_PACKS || []) {
    if (!pack?.url) continue;

    // Optional: missing pack should not break the app.
    let res;
    try {
      res = await fetch(pack.url, { cache: "no-store" });
    } catch {
      continue;
    }
    if (!res.ok) continue;

    const before = getTargetCount(controller);
    const buf = await res.arrayBuffer();

    try {
      // MindAR returns tracking metadata; internally it appends targets.
      addFromBuffer.call(controller, buf);
    } catch {
      continue;
    }

    const after = getTargetCount(controller);
    const added = Math.max(0, after - before);
    if (!added) continue;

    const newDefs = [];
    for (let i = 0; i < added; i++) {
      newDefs.push({
        i: before + i,
        type: pack.type || "product",
        label: `${pack.label || "Product"} #${i + 1}`,
      });
    }

    ar?.addTargets?.(newDefs);
  }
}
