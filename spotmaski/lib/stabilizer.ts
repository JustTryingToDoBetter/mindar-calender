/**
 * Prediction stabilizer to reduce false positives
 * Maintains a sliding window of recent predictions
 * Triggers detection only when stable confidence is achieved
 */

export interface StabilizerResult {
  triggered: boolean;
  avg: number;
  countMaski: number;
}

export class PredictionStabilizer {
  private predictions: number[] = [];
  private readonly windowSize: number;
  private readonly threshold: number;
  private readonly minMaskiCount: number;

  /**
   * Create a new prediction stabilizer
   * @param windowSize - Number of recent predictions to track (default: 5)
   * @param threshold - Minimum average confidence to trigger (default: 0.80)
   * @param minMaskiCount - Minimum number of "Maski" predictions in window (default: 2)
   */
  constructor(
    windowSize: number = parseInt(process.env.NEXT_PUBLIC_STABILIZER_WINDOW || '7'),
    threshold: number = parseFloat(process.env.NEXT_PUBLIC_THRESHOLD || '0.85'),
    minMaskiCount: number = parseInt(process.env.NEXT_PUBLIC_MIN_MASKI_COUNT || '4')
  ) {
    this.windowSize = windowSize;
    this.threshold = threshold;
    this.minMaskiCount = minMaskiCount;

    console.log(JSON.stringify({
      event: 'stabilizer_initialized',
      windowSize,
      threshold,
      minMaskiCount,
    }));
  }

  /**
   * Push a new prediction confidence value
   * @param confidence - Confidence value from model (0 to 1)
   * @returns StabilizerResult with trigger status and metrics
   */
  push(confidence: number): StabilizerResult {
    // Add new prediction to the window
    this.predictions.push(confidence);

    // Keep only the last N predictions (sliding window)
    if (this.predictions.length > this.windowSize) {
      this.predictions.shift();
    }

    // Calculate metrics
    const avg = this.calculateAverage();
    const countMaski = this.countHighConfidencePredictions();

    // Check if trigger conditions are met
    const triggered =
      this.predictions.length === this.windowSize && // Window is full
      countMaski >= this.minMaskiCount && // Enough "Maski" predictions
      avg >= this.threshold; // Average confidence meets threshold

    // Log stabilizer state (only when triggered or every 10th prediction for debugging)
    if (triggered || this.predictions.length % 10 === 0) {
      console.log(JSON.stringify({
        event: 'stabilizer_update',
        timestamp: new Date().toISOString(),
        triggered,
        avg: parseFloat(avg.toFixed(3)),
        countMaski,
        windowSize: this.predictions.length,
        recentPredictions: this.predictions.map(p => parseFloat(p.toFixed(3))),
      }));
    }

    return { triggered, avg, countMaski };
  }

  /**
   * Calculate average confidence of predictions in the window
   */
  private calculateAverage(): number {
    if (this.predictions.length === 0) return 0;

    const sum = this.predictions.reduce((acc, val) => acc + val, 0);
    return sum / this.predictions.length;
  }

  /**
   * Count how many predictions in the window are above threshold
   */
  private countHighConfidencePredictions(): number {
    return this.predictions.filter(p => p >= this.threshold).length;
  }

  /**
   * Reset the stabilizer (clears all predictions)
   */
  reset(): void {
    console.log(JSON.stringify({
      event: 'stabilizer_reset',
      timestamp: new Date().toISOString(),
      previousWindowSize: this.predictions.length,
    }));

    this.predictions = [];
  }

  /**
   * Get current state for debugging
   */
  getState(): {
    predictions: number[];
    avg: number;
    countMaski: number;
    isFull: boolean;
  } {
    return {
      predictions: [...this.predictions],
      avg: this.calculateAverage(),
      countMaski: this.countHighConfidencePredictions(),
      isFull: this.predictions.length === this.windowSize,
    };
  }
}
