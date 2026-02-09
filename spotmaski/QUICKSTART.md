# Quick Start

## Run the Web App

```bash
cd apps/web
npm install
npm run dev
```

Open http://localhost:3000 (or your forwarded HTTPS URL in Codespaces).

## Update Environment Variables

Create `apps/web/.env.local` and set `NEXT_PUBLIC_FORM_URL`, thresholds, and model path as needed. See the root README for the full list.

## Re-train the Model

```bash
cd ml
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python train.py --epochs 12 --batch_size 32
./export_tfjs.sh exports/maski_model ../apps/web/public/model
```
