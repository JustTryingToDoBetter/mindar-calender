#!/usr/bin/env python3
import argparse
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd
import tensorflow as tf

IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".bmp", ".webp")


def list_images(folder: Path) -> List[Path]:
    return sorted([p for p in folder.rglob("*") if p.suffix.lower() in IMAGE_EXTS])


def load_image(path: Path, img_size: int) -> tf.Tensor:
    image_bytes = tf.io.read_file(str(path))
    image = tf.image.decode_image(image_bytes, channels=3, expand_animations=False)
    image = tf.image.convert_image_dtype(image, tf.float32)
    image = tf.image.resize(image, [img_size, img_size])
    return image


def build_records(data_dir: Path) -> List[Tuple[Path, int, str]]:
    records = []
    for label_name, label_id in [("maski", 1), ("not_maski", 0), ("hard_negatives", 0)]:
        folder = data_dir / label_name
        if folder.exists():
            for path in list_images(folder):
                records.append((path, label_id, label_name))
    return records


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model_path", type=str, required=True)
    parser.add_argument("--data_dir", type=str, required=True)
    parser.add_argument("--img_size", type=int, default=224)
    parser.add_argument("--threshold", type=float, default=0.5)
    parser.add_argument("--output_csv", type=str, default="eval_results.csv")
    args = parser.parse_args()

    model = tf.keras.models.load_model(args.model_path)

    records = build_records(Path(args.data_dir))
    if not records:
        raise ValueError("No images found under the data directory")

    rows = []
    confidences = []
    labels = []
    lookalike_flags = []

    for path, label, group in records:
        image = load_image(path, args.img_size)
        image = tf.expand_dims(image, 0)
        pred = model.predict(image, verbose=0).ravel()[0]
        pred_label = int(pred >= args.threshold)

        rows.append(
            {
                "path": str(path),
                "label": label,
                "group": group,
                "confidence": float(pred),
                "prediction": pred_label,
            }
        )
        confidences.append(pred)
        labels.append(label)
        lookalike_flags.append(group == "hard_negatives")

    df = pd.DataFrame(rows)
    df.to_csv(args.output_csv, index=False)

    confidences = np.array(confidences)
    labels = np.array(labels)
    preds = (confidences >= args.threshold).astype(int)

    tp = int(np.sum((preds == 1) & (labels == 1)))
    tn = int(np.sum((preds == 0) & (labels == 0)))
    fp = int(np.sum((preds == 1) & (labels == 0)))
    fn = int(np.sum((preds == 0) & (labels == 1)))

    lookalike_mask = np.array(lookalike_flags)
    lookalike_total = int(np.sum(lookalike_mask))
    lookalike_fp = int(np.sum((preds == 1) & lookalike_mask))
    lookalike_fpr = float(lookalike_fp) / float(lookalike_total) if lookalike_total else 0.0

    auc = tf.keras.metrics.AUC()
    auc.update_state(labels, confidences)

    print("Confusion Matrix")
    print(f"TP: {tp}  FP: {fp}")
    print(f"FN: {fn}  TN: {tn}")
    print(f"AUC: {auc.result().numpy():.4f}")
    print(f"Lookalike FPR: {lookalike_fpr:.4f}")
    print("CSV written to:", args.output_csv)


if __name__ == "__main__":
    main()
