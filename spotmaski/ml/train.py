#!/usr/bin/env python3
import argparse
import os
import random
from pathlib import Path
from typing import List, Tuple

import numpy as np
import tensorflow as tf

IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".bmp", ".webp")


def set_determinism(seed: int) -> None:
    os.environ["PYTHONHASHSEED"] = str(seed)
    os.environ["TF_DETERMINISTIC_OPS"] = "1"
    random.seed(seed)
    np.random.seed(seed)
    tf.random.set_seed(seed)
    try:
        tf.config.experimental.enable_op_determinism()
    except Exception:
        pass


def list_images(folder: Path) -> List[Path]:
    return sorted([p for p in folder.rglob("*") if p.suffix.lower() in IMAGE_EXTS])


def load_image(path: tf.Tensor, img_size: int) -> tf.Tensor:
    image_bytes = tf.io.read_file(path)
    image = tf.image.decode_image(image_bytes, channels=3, expand_animations=False)
    image = tf.image.convert_image_dtype(image, tf.float32)
    image = tf.image.resize(image, [img_size, img_size])
    return image


def gaussian_blur(image: tf.Tensor) -> tf.Tensor:
    kernel = tf.constant(
        [[1.0, 2.0, 1.0], [2.0, 4.0, 2.0], [1.0, 2.0, 1.0]], dtype=tf.float32
    )
    kernel = kernel / tf.reduce_sum(kernel)
    kernel = kernel[:, :, tf.newaxis, tf.newaxis]
    kernel = tf.tile(kernel, [1, 1, 3, 1])
    image = tf.expand_dims(image, 0)
    image = tf.nn.depthwise_conv2d(image, kernel, strides=[1, 1, 1, 1], padding="SAME")
    return tf.squeeze(image, 0)


def random_cutout(image: tf.Tensor, img_size: int) -> tf.Tensor:
    cutout_size = tf.random.uniform([], int(img_size * 0.1), int(img_size * 0.3), tf.int32)
    offset_y = tf.random.uniform([], 0, img_size - cutout_size, tf.int32)
    offset_x = tf.random.uniform([], 0, img_size - cutout_size, tf.int32)

    mask = tf.ones([cutout_size, cutout_size, 3], dtype=tf.float32)
    mask = tf.pad(
        mask,
        paddings=[
            [offset_y, img_size - cutout_size - offset_y],
            [offset_x, img_size - cutout_size - offset_x],
            [0, 0],
        ],
        constant_values=0,
    )
    return image * (1 - mask)


def augment(image: tf.Tensor, img_size: int) -> tf.Tensor:
    scale = tf.random.uniform([], 0.7, 1.0)
    new_size = tf.cast(tf.math.round(img_size * scale), tf.int32)
    image = tf.image.resize(image, [new_size, new_size])
    image = tf.image.resize_with_crop_or_pad(image, img_size, img_size)

    pad = int(img_size * 0.1)
    image = tf.image.resize_with_crop_or_pad(image, img_size + pad, img_size + pad)
    image = tf.image.random_crop(image, [img_size, img_size, 3])

    image = tf.image.random_brightness(image, max_delta=0.1)
    image = tf.image.random_contrast(image, lower=0.9, upper=1.1)

    if tf.random.uniform([]) < 0.4:
        image = gaussian_blur(image)

    if tf.random.uniform([]) < 0.5:
        image = random_cutout(image, img_size)

    return tf.clip_by_value(image, 0.0, 1.0)


def build_dataset(
    paths: List[Path],
    label: int,
    img_size: int,
    weight: float,
    training: bool,
) -> tf.data.Dataset:
    path_ds = tf.data.Dataset.from_tensor_slices([str(p) for p in paths])
    label_ds = tf.data.Dataset.from_tensor_slices([label] * len(paths))
    weight_ds = tf.data.Dataset.from_tensor_slices([weight] * len(paths))

    ds = tf.data.Dataset.zip((path_ds, label_ds, weight_ds))

    def _process(path: tf.Tensor, label_tensor: tf.Tensor, weight_tensor: tf.Tensor):
        image = load_image(path, img_size)
        if training:
            image = augment(image, img_size)
        return image, tf.cast(label_tensor, tf.float32), tf.cast(weight_tensor, tf.float32)

    return ds.map(_process, num_parallel_calls=tf.data.AUTOTUNE)


def split_paths(paths: List[Path], val_split: float) -> Tuple[List[Path], List[Path]]:
    if not paths:
        return [], []
    val_count = max(1, int(len(paths) * val_split))
    return paths[:-val_count], paths[-val_count:]


def maybe_concat(base: tf.data.Dataset, extra: tf.data.Dataset) -> tf.data.Dataset:
    return base.concatenate(extra) if extra is not None else base


def create_model(model_name: str, img_size: int) -> tf.keras.Model:
    if model_name == "mobilenetv3":
        base = tf.keras.applications.MobileNetV3Small(
            include_top=False,
            input_shape=(img_size, img_size, 3),
            weights="imagenet",
            pooling="avg",
        )
    elif model_name == "efficientnet_lite":
        base = tf.keras.applications.EfficientNetV2B0(
            include_top=False,
            input_shape=(img_size, img_size, 3),
            weights="imagenet",
            pooling="avg",
        )
    else:
        raise ValueError("model_name must be 'mobilenetv3' or 'efficientnet_lite'")

    base.trainable = False

    inputs = tf.keras.Input(shape=(img_size, img_size, 3))
    x = base(inputs, training=False)
    x = tf.keras.layers.Dropout(0.2)(x)
    outputs = tf.keras.layers.Dense(1, activation="sigmoid")(x)

    return tf.keras.Model(inputs, outputs)


def evaluate_lookalikes(
    model: tf.keras.Model,
    lookalike_paths: List[Path],
    img_size: int,
    threshold: float,
) -> float:
    if not lookalike_paths:
        return 0.0

    ds = build_dataset(lookalike_paths, 0, img_size, 1.0, training=False)
    ds = ds.batch(32)

    preds = model.predict(ds, verbose=0).ravel()
    false_positives = np.sum(preds >= threshold)
    return float(false_positives) / float(len(lookalike_paths))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=12)
    parser.add_argument("--batch_size", type=int, default=32)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--img_size", type=int, default=224)
    parser.add_argument("--model_name", type=str, default="mobilenetv3")
    parser.add_argument("--data_dir", type=str, default="data")
    parser.add_argument("--hard_negative_weight", type=float, default=2.5)
    parser.add_argument("--val_split", type=float, default=0.2)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--export_dir", type=str, default="exports/maski_model.keras")
    parser.add_argument("--threshold", type=float, default=0.5)
    args = parser.parse_args()

    set_determinism(args.seed)

    data_dir = Path(args.data_dir)
    maski_paths = list_images(data_dir / "maski")
    not_maski_paths = list_images(data_dir / "not_maski")
    hard_neg_paths = list_images(data_dir / "hard_negatives")

    if not maski_paths or not not_maski_paths:
        raise ValueError("maski and not_maski folders must contain images")

    maski_train, maski_val = split_paths(maski_paths, args.val_split)
    not_train, not_val = split_paths(not_maski_paths, args.val_split)
    hard_train, hard_val = split_paths(hard_neg_paths, args.val_split)

    train_ds = build_dataset(maski_train, 1, args.img_size, 1.0, training=True)
    train_ds = maybe_concat(
        train_ds, build_dataset(not_train, 0, args.img_size, 1.0, training=True)
    )
    if hard_train:
        train_ds = maybe_concat(
            train_ds,
            build_dataset(
                hard_train, 0, args.img_size, args.hard_negative_weight, training=True
            ),
        )

    train_ds = train_ds.shuffle(2000, seed=args.seed).batch(args.batch_size).prefetch(tf.data.AUTOTUNE)

    val_ds = build_dataset(maski_val, 1, args.img_size, 1.0, training=False)
    val_ds = maybe_concat(
        val_ds, build_dataset(not_val, 0, args.img_size, 1.0, training=False)
    )
    if hard_val:
        val_ds = maybe_concat(
            val_ds, build_dataset(hard_val, 0, args.img_size, 1.0, training=False)
        )

    val_ds = val_ds.batch(args.batch_size).prefetch(tf.data.AUTOTUNE)

    model = create_model(args.model_name, args.img_size)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=args.lr),
        loss=tf.keras.losses.BinaryCrossentropy(),
        metrics=[
            tf.keras.metrics.BinaryAccuracy(name="accuracy"),
            tf.keras.metrics.Precision(name="precision"),
            tf.keras.metrics.Recall(name="recall"),
            tf.keras.metrics.AUC(name="auc"),
        ],
    )

    history = model.fit(train_ds, validation_data=val_ds, epochs=args.epochs)

    val_preds = model.predict(val_ds, verbose=0).ravel()
    val_labels = np.array([y.numpy() for _, y, _ in val_ds.unbatch()]).astype(int)

    pred_labels = (val_preds >= args.threshold).astype(int)
    tp = int(np.sum((pred_labels == 1) & (val_labels == 1)))
    tn = int(np.sum((pred_labels == 0) & (val_labels == 0)))
    fp = int(np.sum((pred_labels == 1) & (val_labels == 0)))
    fn = int(np.sum((pred_labels == 0) & (val_labels == 1)))

    lookalike_fpr = evaluate_lookalikes(model, hard_val, args.img_size, args.threshold)

    print("\nValidation Confusion Matrix")
    print(f"TP: {tp}  FP: {fp}")
    print(f"FN: {fn}  TN: {tn}")
    print(f"Lookalike FPR: {lookalike_fpr:.4f}")

    export_dir = Path(args.export_dir)
    if export_dir.suffix not in {".keras", ".h5"}:
        export_dir = export_dir.with_suffix(".keras")
    export_dir.parent.mkdir(parents=True, exist_ok=True)
    model.save(export_dir)

    print("\nModel saved to:", export_dir)
    print("Training metrics:")
    for key, values in history.history.items():
        print(f"- {key}: {values[-1]:.4f}")


if __name__ == "__main__":
    main()
