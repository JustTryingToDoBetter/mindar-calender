import * as tf from '@tensorflow/tfjs';

const MODEL_URL = process.env.NEXT_PUBLIC_MODEL_URL || '/model/model.json';
const MODEL_INPUT_SIZE = parseInt(process.env.NEXT_PUBLIC_MODEL_INPUT_SIZE || '224');
const MASKI_CLASS_INDEX = parseInt(process.env.NEXT_PUBLIC_MASKI_CLASS_INDEX || '1');

let modelInstance: tf.LayersModel | null = null;
let isLoading = false;

export interface CropBox {
  y1: number;
  x1: number;
  y2: number;
  x2: number;
}

async function ensureBackend(): Promise<void> {
  await tf.ready();

  if (tf.getBackend() === 'webgl') {
    return;
  }

  const ok = await tf.setBackend('webgl');
  await tf.ready();

  if (!ok) {
    await tf.setBackend('cpu');
    await tf.ready();
  }
}

export async function loadModel(): Promise<tf.LayersModel> {
  if (modelInstance) return modelInstance;
  if (isLoading) {
    while (isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (modelInstance) return modelInstance;
  }

  isLoading = true;

  try {
    await ensureBackend();
    modelInstance = await tf.loadLayersModel(MODEL_URL);

    const warmup = tf.zeros([1, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE, 3]);
    const warmupOutput = modelInstance.predict(warmup) as tf.Tensor;
    warmupOutput.dispose();
    warmup.dispose();

    return modelInstance;
  } catch (error) {
    throw new Error(
      `Failed to load model: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  } finally {
    isLoading = false;
  }
}

export function getModelInputSize(): number {
  return MODEL_INPUT_SIZE;
}

export function getCenterCropBox(scale: number): CropBox {
  const size = Math.min(1, Math.max(0.1, scale));
  const offset = (1 - size) / 2;
  return { y1: offset, x1: offset, y2: offset + size, x2: offset + size };
}

export function getCornerCropBoxes(scale: number): CropBox[] {
  const size = Math.min(1, Math.max(0.1, scale));
  return [
    { y1: 0, x1: 0, y2: size, x2: size },
    { y1: 0, x1: 1 - size, y2: size, x2: 1 },
    { y1: 1 - size, x1: 0, y2: 1, x2: size },
    { y1: 1 - size, x1: 1 - size, y2: 1, x2: 1 },
  ];
}

function parsePredictions(
  data: Float32Array | Int32Array | Uint8Array,
  numCrops: number,
  outputSize: number
): number[] {
  const confidences: number[] = [];

  for (let i = 0; i < numCrops; i += 1) {
    if (outputSize === 1) {
      confidences.push(data[i]);
    } else {
      const offset = i * outputSize;
      confidences.push(data[offset + MASKI_CLASS_INDEX]);
    }
  }

  return confidences;
}

export async function predictCrops(
  source: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
  cropBoxes: CropBox[]
): Promise<number[]> {
  const model = await loadModel();

  return tf.tidy(() => {
    const input = tf.browser.fromPixels(source).toFloat().div(255);
    const batch = input.expandDims(0) as tf.Tensor4D;

    const boxes = tf.tensor2d(
      cropBoxes.map((box) => [box.y1, box.x1, box.y2, box.x2])
    );
    const boxInd = tf.tensor1d(new Array(cropBoxes.length).fill(0), 'int32');

    const crops = tf.image.cropAndResize(batch, boxes, boxInd, [
      MODEL_INPUT_SIZE,
      MODEL_INPUT_SIZE,
    ]);

    const predictions = model.predict(crops) as tf.Tensor;
    const predictionData = predictions.dataSync();
    const outputShape = predictions.shape;
    const outputSize = outputShape.length === 2 ? outputShape[1] : 1;

    boxes.dispose();
    boxInd.dispose();

    return parsePredictions(predictionData, cropBoxes.length, outputSize);
  });
}

export function disposeModel(): void {
  if (modelInstance) {
    modelInstance.dispose();
    modelInstance = null;
  }
}
