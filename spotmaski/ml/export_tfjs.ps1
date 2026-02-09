Param(
  [string]$ModelDir = "exports/maski_model",
  [string]$OutputDir = "../apps/web/public/model"
)

python -m tensorflowjs_converter `
  --input_format=tf_saved_model `
  --output_format=tfjs_layers_model `
  --signature_name=serving_default `
  --saved_model_tags=serve `
  $ModelDir `
  $OutputDir

Write-Host "TFJS model exported to $OutputDir"
