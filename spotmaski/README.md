# SpotMaski MVP (Two-Stage Detection)

A Vercel-ready Next.js app with in-browser TensorFlow.js detection and a deterministic ML training pipeline. The runtime uses a two-stage gating system to reduce false positives.

## Repository Structure

```
apps/web
  src
  public/model
ml
  data
    maski
    not_maski
    hard_negatives
  scripts
  exports
  train.py
  eval.py
  export_tfjs.sh
  export_tfjs.ps1
  requirements.txt
docs
```

## Quick Start (Web)

```bash
cd apps/web
npm install
npm run dev
```

Open http://localhost:3000 (or your Codespaces HTTPS URL).

### Codespaces

1. Run `npm run dev` from `apps/web`.
2. Use the Ports tab to open the forwarded HTTPS URL.
3. Camera access requires HTTPS (Codespaces provides this).

## Environment Variables

Create `apps/web/.env.local`:

```env
# Microsoft Form URL
NEXT_PUBLIC_FORM_URL=https://forms.office.com/YOUR_ACTUAL_FORM_URL

# Model URL
NEXT_PUBLIC_MODEL_URL=/model/model.json
NEXT_PUBLIC_MODEL_INPUT_SIZE=224
NEXT_PUBLIC_MASKI_CLASS_INDEX=1

# Inference FPS (5-8 recommended)
NEXT_PUBLIC_INFERENCE_FPS=6

# Gate A (candidate)
NEXT_PUBLIC_GATE_A_THRESHOLD=0.80
NEXT_PUBLIC_GATE_A_WINDOW=10
NEXT_PUBLIC_GATE_A_MIN_HITS=6
NEXT_PUBLIC_GATE_A_MAX_VARIANCE=0.01

# Gate B (confirmation)
NEXT_PUBLIC_GATE_B_THRESHOLD=0.90
NEXT_PUBLIC_GATE_B_MIN_HITS=3
NEXT_PUBLIC_GATE_B_CONSECUTIVE=3
NEXT_PUBLIC_GATE_B_COOLDOWN_MS=2000

# Cropping
NEXT_PUBLIC_CENTER_CROP_SCALE=0.8
NEXT_PUBLIC_CORNER_CROP_SCALE=0.65

# Optional campaign tag
NEXT_PUBLIC_CAMPAIGN=maski_mvp

# Debug overlay default (dev only)
NEXT_PUBLIC_DEBUG_OVERLAY_DEFAULT=false
```

## ML Training (Local)

See `ml/README.md` for full steps. Summary:

```bash
cd ml
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

python train.py --epochs 12 --batch_size 32 --model_name mobilenetv3
./export_tfjs.sh exports/maski_model ../apps/web/public/model
```

## Two-Stage Gating (Runtime)

- **Gate A**: Center crop inference. Candidate triggers when $K$ of $N$ frames exceed $T_1$ and variance is low.
- **Gate B**: Multi-crop confirmation (center + 4 corners). Confirm only when $M$ of 5 crops exceed $T_2$ for $X$ consecutive frames.
- On failure, the scanner cools down for 2 seconds before retrying.

## Dev Model Test Harness

Open `/dev/model-test` to drag-and-drop local images and see predictions in-browser. No uploads.

## Deployment (Vercel)

- Set the project root to `apps/web`.
- Add the same env vars from `.env.local` in Vercel.
- Build command: `npm run build`.

## Performance Notes

- Inference is throttled to ~6 FPS.
- WebGL backend is preferred; the model warms up on load.
- All tensors are disposed via `tf.tidy()`.

## Tuning Playbook

1. **Add hard negatives**
   - Drop lookalike images into `ml/data/hard_negatives`.
   - Retrain and re-export the TFJS model.
2. **Find thresholds**
   - Run `ml/eval.py` and focus on lookalike FPR.
   - Increase `NEXT_PUBLIC_GATE_A_THRESHOLD` or `NEXT_PUBLIC_GATE_B_THRESHOLD` to reduce false positives.
3. **Field test**
   - Use `/dev/model-test` for quick regression checks.
   - Adjust `GATE_A_WINDOW` and `GATE_B_CONSECUTIVE` for stability on-device.
