'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { getCenterCropBox, loadModel, predictCrops } from '@/lib/model';

interface TestItem {
  id: string;
  name: string;
  url: string;
  confidence?: number;
  status: 'pending' | 'scored' | 'error';
}

function generateId(): string {
  return `item_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export default function ModelTestPage() {
  const [items, setItems] = useState<TestItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const centerCrop = useMemo(() => [getCenterCropBox(0.9)], []);

  const scoreFiles = useCallback(
    async (files: FileList | File[]) => {
      setIsLoading(true);
      await loadModel();

      const fileArray = Array.from(files);
      const newItems: TestItem[] = fileArray.map((file) => ({
        id: generateId(),
        name: file.name,
        url: URL.createObjectURL(file),
        status: 'pending',
      }));

      setItems((prev) => [...newItems, ...prev]);

      for (const item of newItems) {
        try {
          const image = new Image();
          image.src = item.url;
          await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = reject;
          });

          const [confidence] = await predictCrops(image, centerCrop);
          setItems((prev) =>
            prev.map((current) =>
              current.id === item.id
                ? { ...current, confidence, status: 'scored' }
                : current
            )
          );
        } catch (error) {
          setItems((prev) =>
            prev.map((current) =>
              current.id === item.id
                ? { ...current, status: 'error' }
                : current
            )
          );
        }
      }

      setIsLoading(false);
    },
    [centerCrop]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (event.dataTransfer.files.length > 0) {
        void scoreFiles(event.dataTransfer.files);
      }
    },
    [scoreFiles]
  );

  const handleFileInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files.length > 0) {
        void scoreFiles(event.target.files);
      }
    },
    [scoreFiles]
  );

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
              Dev Tools
            </p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900">
              Model test harness
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Drag and drop local images. Everything runs in the browser.
            </p>
          </div>
          <Link href="/" className="btn btn-secondary">
            Back home
          </Link>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={(event) => event.preventDefault()}
          className="card border-dashed border-slate-300 text-center"
        >
          <p className="text-sm text-slate-600">
            Drop images here or choose files below.
          </p>
          <label className="btn btn-primary mt-4 inline-flex cursor-pointer">
            Choose images
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileInput}
            />
          </label>
          {isLoading && (
            <p className="mt-3 text-xs uppercase tracking-[0.3em] text-slate-500">
              Scoring...
            </p>
          )}
        </div>

        <div className="grid gap-4">
          {items.length === 0 && (
            <div className="card text-sm text-slate-600">
              No images yet. Drag in a folder of test shots.
            </div>
          )}
          {items.map((item) => (
            <div key={item.id} className="card flex items-center gap-4">
              <img
                src={item.url}
                alt={item.name}
                className="h-16 w-16 rounded-xl object-cover"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-500">{item.status}</p>
              </div>
              <div className="text-right text-sm text-slate-700">
                {item.confidence !== undefined
                  ? `${(item.confidence * 100).toFixed(1)}%`
                  : '--'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
