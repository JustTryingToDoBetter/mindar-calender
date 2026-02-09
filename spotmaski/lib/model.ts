/**
 * Model loading and inference utilities for Maski detection
 * Uses TensorFlow.js Layers Model API
 */

import * as tf from '@tensorflow/tfjs';

// Model configuration
const MODEL_URL = process.env.NEXT_PUBLIC_MODEL_URL || '/model/model.json';
const MODEL_INPUT_SIZE = 224; // Model expects 224x224 images

// Singleton model instance
let modelInstance: tf.LayersModel | null = null;
let isLoading = false;

/**
 * Load the TensorFlow.js model (singleton pattern)
 * Caches the model after first load
 */
export async function loadModel(): Promise<tf.LayersModel> {
  // Return cached model if already loaded
  if (modelInstance) {
    console.log('[Model] Using cached model instance');
    return modelInstance;
  }

  // Wait if already loading
  if (isLoading) {
    console.log('[Model] Waiting for model to load...');
    while (isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (modelInstance) return modelInstance;
  }

  isLoading = true;

  try {
    console.log('[Model] Loading model from:', MODEL_URL);

    // Set backend to WebGL for performance (fall back to CPU if unavailable)
    await tf.ready();
    console.log('[Model] TensorFlow.js backend:', tf.getBackend());

    // Load the model
    modelInstance = await tf.loadLayersModel(MODEL_URL);

    // Warmup: run a dummy prediction to initialize the model
    console.log('[Model] Warming up model...');
    const dummyInput = tf.zeros([1, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE, 3]);
    const dummyOutput = modelInstance.predict(dummyInput) as tf.Tensor;
    dummyOutput.dispose();
    dummyInput.dispose();

    console.log('[Model] Model loaded successfully');
    logModelInfo(modelInstance);

    return modelInstance;
  } catch (error) {
    console.error('[Model] Failed to load model:', error);
    throw new Error(`Failed to load model: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    isLoading = false;
  }
}

/**
 * Run inference on an HTML canvas or video element
 * @param source - HTMLVideoElement, HTMLCanvasElement, or HTMLImageElement
 * @returns Prediction result { isMaski: boolean, confidence: number, class0: number, class1: number }
 */
export async function predictMaski(
  source: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement
): Promise<{ isMaski: boolean; confidence: number; class0: number; class1: number }> {
  const model = await loadModel();

  // Which class index is Maski? Set via env var (default: 0)
  // If your model detects you as Maski when you're NOT Maski, change this to 1
  const maskiClassIndex = parseInt(process.env.NEXT_PUBLIC_MASKI_CLASS_INDEX || '0');

  return tf.tidy(() => {
    // Convert source to tensor
    let tensor = tf.browser.fromPixels(source);

    // Resize to model input size (224x224)
    tensor = tf.image.resizeBilinear(tensor, [MODEL_INPUT_SIZE, MODEL_INPUT_SIZE]);

    // Normalize to [0, 1] (model trained with Teachable Machine uses this range)
    tensor = tensor.div(255.0);

    // Add batch dimension
    tensor = tensor.expandDims(0);

    // Run inference
    const predictions = model.predict(tensor) as tf.Tensor;

    // Get predictions as array [class_0_confidence, class_1_confidence]
    const data = predictions.dataSync();
    const class0 = data[0];
    const class1 = data[1];

    // Get Maski confidence based on which class is Maski
    const maskiConfidence = maskiClassIndex === 0 ? class0 : class1;
    const notMaskiConfidence = maskiClassIndex === 0 ? class1 : class0;
    const isMaski = maskiConfidence > notMaskiConfidence;

    // Log inference result with BOTH classes for debugging
    console.log(JSON.stringify({
      event: 'inference',
      timestamp: new Date().toISOString(),
      class0_confidence: parseFloat(class0.toFixed(3)),
      class1_confidence: parseFloat(class1.toFixed(3)),
      maskiClassIndex,
      isMaski,
      maskiConfidence: parseFloat(maskiConfidence.toFixed(3)),
    }));

    return {
      isMaski,
      confidence: maskiConfidence,
      class0,
      class1,
    };
  });
}

/**
 * Clean up model and free memory
 */
export function disposeModel(): void {
  if (modelInstance) {
    modelInstance.dispose();
    modelInstance = null;
    console.log('[Model] Model disposed');
  }
}

/**
 * Log model information for debugging
 */
function logModelInfo(model: tf.LayersModel): void {
  const inputShape = model.inputs[0].shape;
  const outputShape = model.outputs[0].shape;

  console.log('[Model] Input shape:', inputShape);
  console.log('[Model] Output shape:', outputShape);
  console.log('[Model] Total parameters:', model.countParams());
}

/**
 * Get model input size
 */
export function getModelInputSize(): number {
  return MODEL_INPUT_SIZE;
}
