/**
 * ML-based Maski character detection
 * Uses TensorFlow.js for real-time object detection
 */

let model = null;
let isDetecting = false;
let videoStream = null;

export const DETECTION_CONFIG = {
  modelUrl: "./models/maski-detector/model.json", // You'll train and export this
  confidenceThreshold: 0.7, // 70% confidence to trigger
  detectionInterval: 500, // Check every 500ms (balance performance/battery)
  cooldownMs: 5000, // Don't spam detections - 5s between triggers
};

let lastDetectionTime = 0;

/**
 * Initialize the ML detector
 * @param {HTMLVideoElement} video - The camera video element
 * @param {Function} onMaskiDetected - Callback when Maski is spotted
 */
export async function initMLDetector(video, onMaskiDetected) {
  videoStream = video;

  // Check if TensorFlow.js is available
  if (typeof tf === "undefined") {
    console.warn("TensorFlow.js not loaded - ML detection disabled");
    return { start: () => {}, stop: () => {} };
  }

  try {
    // Load the custom trained model
    // For MVP: you can start with MobileNet transfer learning
    model = await tf.loadGraphModel(DETECTION_CONFIG.modelUrl);
    console.log("✅ Maski ML detector loaded");
  } catch (err) {
    console.warn("Could not load Maski detector model:", err.message);
    // Gracefully degrade - app still works without ML detection
    return { start: () => {}, stop: () => {} };
  }

  return {
    start: startDetection.bind(null, onMaskiDetected),
    stop: stopDetection,
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
      setTimeout(() => detectLoop(onMaskiDetected), 1000);
    }
    return;
  }

  try {
    const predictions = await detectMaski(videoStream);

    // Check if we found Maski with high confidence
    const maskiFound = predictions.find(
      (p) =>
        p.class === "maski" && p.score >= DETECTION_CONFIG.confidenceThreshold
    );

    if (maskiFound) {
      const now = Date.now();
      if (now - lastDetectionTime > DETECTION_CONFIG.cooldownMs) {
        lastDetectionTime = now;
        onMaskiDetected({
          confidence: maskiFound.score,
          bbox: maskiFound.bbox, // [x, y, width, height]
          timestamp: now,
        });
      }
    }
  } catch (err) {
    console.error("Detection error:", err);
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
  // Preprocess video frame
  const tensor = tf.browser
    .fromPixels(video)
    .resizeBilinear([224, 224]) // Standard input size
    .toFloat()
    .div(255.0) // Normalize
    .expandDims(0);

  // Run inference
  const predictions = await model.predict(tensor).data();

  // Clean up tensor
  tensor.dispose();

  // Parse predictions (format depends on your model architecture)
  // This is a placeholder - adjust based on your trained model output
  return parsePredictions(predictions);
}

function parsePredictions(rawOutput) {
  // TODO: Replace with your actual model's output format
  // Example for a simple classifier:
  // [class_0_prob, class_1_prob, ...] where class 0 might be "maski"

  // For object detection models (YOLO, SSD, etc.), you'd parse bounding boxes
  // This is a simplified example:

  const maskiScore = rawOutput[0]; // Assuming index 0 is "maski" class
  if (maskiScore > 0.5) {
    return [
      {
        class: "maski",
        score: maskiScore,
        bbox: [0.3, 0.3, 0.4, 0.4], // Placeholder - real models give actual boxes
      },
    ];
  }

  return [];
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
