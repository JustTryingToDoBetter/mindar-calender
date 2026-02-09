#!/usr/bin/env bash
set -euo pipefail

MODEL_DIR=${1:-exports/maski_model}
OUTPUT_DIR=${2:-../apps/web/public/model}

python -m tensorflowjs_converter \
  --input_format=tf_saved_model \
  --output_format=tfjs_layers_model \
  --signature_name=serving_default \
  --saved_model_tags=serve \
  "$MODEL_DIR" \
  "$OUTPUT_DIR"

echo "TFJS model exported to $OUTPUT_DIR"
