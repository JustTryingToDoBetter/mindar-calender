/**
 * ML-based Maski character detection
 * Uses TensorFlow.js for real-time object detection
 */

let model = null;
let modelMetadata = null;
let isDetecting = false;
let videoStream = null;
let debugElement = null;
let detectionAttempts = 0;
let lastError = null;

export const DETECTION_CONFIG = {
  modelUrl: "./models/maski-detector/model.json",
  metadataUrl: "./models/maski-detector/metadata.json",
  confidenceThreshold: 0.7,
  detectionInterval: 500,
  cooldownMs: 5000,
  debugMode: true, // Set to false in production
  mobileOptimized: true, // Use smaller input size on mobile
  demoMode: false, // Set to true to test UI without a real model
};

let lastDetectionTime = 0;

/**
 * Initialize the ML detector
 * @param {HTMLVideoElement} video - The camera video element
 * @param {Function} onMaskiDetected - Callback when Maski is spotted
 */
export async function initMLDetector(video, onMaskiDetected) {
  videoStream = video;

  // Create debug overlay if enabled
  if (DETECTION_CONFIG.debugMode) {
    createDebugOverlay();
    updateDebug("Initializing ML detector...");
  }

  // Check if TensorFlow.js is available
  if (typeof tf === "undefined") {
    const msg = "TensorFlow.js not loaded - ML detection disabled";
    console.warn(msg);
    updateDebug(`❌ ${msg}`);
    lastError = msg;
    return { start: () => {}, stop: () => {}, getStatus };
  }

  updateDebug(`✅ TensorFlow.js loaded (v${tf.version.tfjs || 'unknown'})`);

  try {
    // Load metadata first to get proper labels
    updateDebug(`Loading metadata from ${DETECTION_CONFIG.metadataUrl}...`);
    try {
      const metaRes = await fetch(DETECTION_CONFIG.metadataUrl);
      if (metaRes.ok) {
        modelMetadata = await metaRes.json();
        updateDebug(`✅ Metadata loaded (${modelMetadata.labels?.length || 0} labels)`);
      }
    } catch (metaErr) {
      console.warn("Could not load metadata:", metaErr.message);
      updateDebug(`⚠️ No metadata, using defaults`);
    }

    updateDebug(`Loading model from ${DETECTION_CONFIG.modelUrl}...`);
    
    // Use loadLayersModel for Teachable Machine (Keras format)
    // Use loadGraphModel for TF.js graph models
    const loadPromise = tf.loadLayersModel(DETECTION_CONFIG.modelUrl);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Model load timeout (30s)')), 30000)
    );
    
    model = await Promise.race([loadPromise, timeoutPromise]);
    
    console.log("✅ Maski ML detector loaded");
    updateDebug("✅ Model loaded successfully");
    
    // Warmup: run a dummy prediction to initialize GPU/WASM backend
    updateDebug("Warming up model...");
    const dummyInput = tf.zeros([1, 224, 224, 3]);
    await model.predict(dummyInput).data();
    dummyInput.dispose();
    updateDebug("✅ Model ready");
    
  } catch (err) {
    const msg = `Could not load model: ${err.message}`;
    console.warn(msg, err);
    updateDebug(`❌ ${msg}`);
    lastError = err.message;
    // Gracefully degrade - app still works without ML detection
    return { start: () => {}, stop: () => {}, getStatus };
  }

  return {
    start: startDetection.bind(null, onMaskiDetected),
    stop: stopDetection,
    getStatus,
  };
}

/**
 * Demo mode: test the Maskiverse UI without a trained model
 * Call this from console: window.testMaskiDetection()
 */
if (typeof window !== 'undefined') {
  window.testMaskiDetection = function() {
    console.log('🧪 Triggering test Maski detection...');
    const event = new CustomEvent('maskiDetected', {
      detail: {
        confidence: 0.95,
        timestamp: Date.now(),
        demo: true
      }
    });
    window.dispatchEvent(event);
  };
}

function startDetection(onMaskiDetected) {
  if (!model || isDetecting) return;

  isDetecting = true;
  detectLoop(onMaskiDetected);
}

function stopDetection() {
  isDetecting = false;
}

async function detectLoop(onMaskiDetected) {
  if (!isDetecting || !videoStream || videoStream.readyState !== 4) {
    // Video not ready, try again soon
    if (isDetecting) {
      updateDebug(`Video not ready (readyState: ${videoStream?.readyState || 'null'})`);
      setTimeout(() => detectLoop(onMaskiDetected), 1000);
    }
    return;
  }

  detectionAttempts++;
  const startTime = performance.now();

  try {
    // Check if video has actual dimensions (sometimes readyState=4 but no frames yet)
    if (!videoStream.videoWidth || !videoStream.videoHeight) {
      updateDebug(`Video has no dimensions yet`);
      if (isDetecting) {
        setTimeout(() => detectLoop(onMaskiDetected), 1000);
      }
      return;
    }

    const predictions = await detectMaski(videoStream);
    const inferenceTime = Math.round(performance.now() - startTime);

    // Check if we found Maski with high confidence
    const maskiFound = predictions.find(
      (p) =>
        p.class === "maski" && p.score >= DETECTION_CONFIG.confidenceThreshold
    );

    if (maskiFound) {
      const now = Date.now();
      if (now - lastDetectionTime > DETECTION_CONFIG.cooldownMs) {
        lastDetectionTime = now;
        updateDebug(`🎯 DETECTED! Confidence: ${Math.round(maskiFound.score * 100)}%`);
        onMaskiDetected({
          confidence: maskiFound.score,
          bbox: maskiFound.bbox,
          timestamp: now,
        });
      }
    } else {
      // Show periodic status updates
      if (detectionAttempts % 10 === 0) {
        const topScore = predictions[0]?.score || 0;
        updateDebug(
          `Checking... (attempt ${detectionAttempts}, ` +
          `top score: ${Math.round(topScore * 100)}%, ` +
          `inference: ${inferenceTime}ms)`
        );
      }
    }
  } catch (err) {
    console.error("Detection error:", err);
    lastError = err.message;
    updateDebug(`❌ Error: ${err.message}`);
  }

  // Continue loop
  if (isDetecting) {
    setTimeout(
      () => detectLoop(onMaskiDetected),
      DETECTION_CONFIG.detectionInterval
    );
  }
}

async function detectMaski(video) {
  // Use smaller input size on mobile to improve performance
  const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
  const inputSize = DETECTION_CONFIG.mobileOptimized && isMobile ? 160 : 224;

  let tensor = null;
  try {
    // Preprocess video frame
    tensor = tf.browser
      .fromPixels(video)
      .resizeBilinear([inputSize, inputSize])
      .toFloat()
      .div(255.0)
      .expandDims(0);

    // Run inference
    const predictionTensor = model.predict(tensor);
    const predictions = await predictionTensor.data();
    
    // Clean up
    predictionTensor.dispose();
    tensor.dispose();

    return parsePredictions(predictions);
  } catch (err) {
    // Ensure cleanup on error
    if (tensor) tensor.dispose();
    throw err;
  }
}

function parsePredictions(rawOutput) {
  // Parse based on model output format
  // Teachable Machine outputs: [prob_class0, prob_class1, ...]
  
  const results = [];
  const labels = modelMetadata?.labels || [];
  
  // Find which index is "maski" (or similar)
  let maskiIndex = -1;
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i].toLowerCase();
    if (label.includes('maski') || label === 'class 1') {
      maskiIndex = i;
      break;
    }
  }
  
  // If no label found, assume first class is "maski" (for backwards compat)
  if (maskiIndex === -1 && rawOutput.length > 0) {
    maskiIndex = 0;
  }
  
  if (maskiIndex !== -1 && rawOutput[maskiIndex] !== undefined) {
    const maskiScore = rawOutput[maskiIndex];
    
    // Only return if above minimum threshold (prevent false positives)
    if (maskiScore > 0.3) {
      results.push({
        class: "maski",
        score: maskiScore,
        bbox: [0.3, 0.3, 0.4, 0.4],
      });
    }
  }

  return results;
}

function createDebugOverlay() {
  if (debugElement) return;
  
  debugElement = document.createElement('div');
  debugElement.id = 'ml-debug';
  debugElement.style.cssText = `
    position: fixed;
    top: 60px;
    right: 10px;
    background: rgba(0, 0, 0, 0.85);
    color: #0f0;
    padding: 8px 12px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 11px;
    max-width: 300px;
    z-index: 10005;
    line-height: 1.4;
    pointer-events: none;
    word-wrap: break-word;
  `;
  document.body.appendChild(debugElement);
}

function updateDebug(message) {
  if (!DETECTION_CONFIG.debugMode || !debugElement) return;
  
  const timestamp = new Date().toLocaleTimeString();
  debugElement.textContent = `[${timestamp}] ${message}`;
  console.log(`[ML Debug] ${message}`);
}

function getStatus() {
  return {
    isDetecting,
    modelLoaded: !!model,
    videoReady: videoStream?.readyState === 4,
    detectionAttempts,
    lastError,
    tfVersion: typeof tf !== 'undefined' ? tf.version.tfjs : null,
  };
}

/**
 * Training guide (for reference - do this outside the app):
 *
 * 1. Collect dataset:
 *    - Take 500+ photos of Maski character in different contexts
 *    - Different angles, lighting, backgrounds
 *    - Include "negative" examples (not Maski)
 *
 * 2. Annotate data:
 *    - Use LabelImg or Roboflow to draw bounding boxes
 *    - Export in TensorFlow format
 *
 * 3. Train model:
 *    - Start with MobileNet v2 (fast for mobile)
 *    - Or use Teachable Machine for quick MVP: https://teachablemachine.withgoogle.com/
 *    - Fine-tune on your Maski dataset
 *
 * 4. Export for TensorFlow.js:
 *    - Convert to web format: tensorflowjs_converter
 *    - Put model.json + .bin files in /models/maski-detector/
 *
 * 5. Test thresholds:
 *    - Adjust confidenceThreshold based on false positives
 */
