# ML Pipeline

This folder contains the deterministic training + evaluation pipeline for Maski detection.

## Data Layout

```
ml/data/
  maski/
  not_maski/
  hard_negatives/
```

- `maski`: positive class (label 1)
- `not_maski`: normal negatives (label 0)
- `hard_negatives`: lookalikes, mascots, purple objects, posters, robots (label 0, higher weight)

## Setup

```bash
cd ml
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Train

```bash
python train.py \
  --epochs 12 \
  --batch_size 32 \
  --lr 1e-3 \
  --img_size 224 \
  --model_name mobilenetv3 \
  --hard_negative_weight 2.5
```

Artifacts are saved to `ml/exports/maski_model`.

## Evaluate a Folder

```bash
python eval.py \
  --model_path exports/maski_model \
  --data_dir data \
  --output_csv eval_results.csv
```

Outputs:
- `eval_results.csv` with per-image scores
- Confusion matrix
- AUC
- Lookalike false positive rate

## Export to TFJS

```bash
./export_tfjs.sh exports/maski_model ../apps/web/public/model
```

Windows (PowerShell):

```powershell
./export_tfjs.ps1 exports/maski_model ../apps/web/public/model
```

## Notes

- All randomness uses a fixed seed for deterministic runs.
- Augmentations simulate real camera scanning: resize down, crop/pad, brightness/contrast, blur, cutout.
- Tune `--hard_negative_weight` to reduce false positives.
