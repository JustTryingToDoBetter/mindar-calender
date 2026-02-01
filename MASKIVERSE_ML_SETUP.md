# 🎯 Maskiverse: ML-Based "Spot Maski" Setup Guide

## Overview
This document explains how to train and deploy a machine learning model that recognizes the Maski character in the wild, enabling the nationwide "Spot Maski" campaign.

---

## 🚀 Quick Start (MVP Path)

### Option A: Google Teachable Machine (Easiest - No Code)
**Best for**: Quick prototype, testing the concept

1. **Go to**: https://teachablemachine.withgoogle.com/train/image
2. **Create two classes**:
   - Class 1: "Maski" (upload 50-100 photos of the purple mascot from different angles)
   - Class 2: "Not Maski" (upload random background images, other logos, etc.)
3. **Train the model** (takes 2-5 minutes in browser)
4. **Export**:
   - Click "Export Model"
   - Select "TensorFlow.js"
   - Choose "Download" (not upload to cloud)
   - You'll get a `model.json` file + weight files (.bin)
5. **Deploy**:
   - Create folder: `c:\Users\Bron\mindar-calender\models\maski-detector\`
   - Copy all downloaded files there
   - Update `js/ml-detector.js` line 8: `modelUrl: "./models/maski-detector/model.json"`
6. **Test**: Open the app, point camera at the Maski image → should trigger detection!

---

### Option B: Custom Training with TensorFlow.js (Production Quality)
**Best for**: Higher accuracy, optimized for mobile

#### Step 1: Collect Dataset
You need **500-1000+ images**:
- ✅ Maski character in different:
  - Lighting conditions (bright, dim, backlit)
  - Angles (front, side, tilted)
  - Sizes (close-up, far away)
  - Backgrounds (indoor, outdoor, busy, plain)
  - On different surfaces (paper, screen, wall, product packaging)
- ✅ "Negative" examples (not Maski):
  - Other mascots, logos
  - Random scenes where Maski might appear
  - Similar purple objects

**Tips**:
- Take photos with phone camera (matches your target environment)
- Include partial views (half-visible Maski)
- Vary backgrounds to avoid overfitting

#### Step 2: Annotate Data
**Tool**: Roboflow (free tier works)
1. Create account at https://roboflow.com
2. Create new project → Object Detection
3. Upload all your Maski images
4. Draw bounding boxes around each Maski instance
5. Export in "TensorFlow Object Detection" format

**Alternative**: LabelImg (offline tool)
```bash
pip install labelImg
labelImg
```

#### Step 3: Train Model
**Option 3a**: Use Roboflow's Auto-Train
- After annotating, click "Train Model" in Roboflow
- Choose "Fast" preset (good for real-time)
- Wait ~20 minutes
- Export as "TensorFlow.js"

**Option 3b**: Custom Training (Python)
```python
# Install dependencies
pip install tensorflow tensorflowjs pillow numpy

# train_maski_detector.py
import tensorflow as tf
from tensorflow import keras

# Load MobileNetV2 (lightweight for mobile)
base_model = keras.applications.MobileNetV2(
    input_shape=(224, 224, 3),
    include_top=False,
    weights='imagenet'
)
base_model.trainable = False  # Freeze base

# Add custom head
model = keras.Sequential([
    base_model,
    keras.layers.GlobalAveragePooling2D(),
    keras.layers.Dense(128, activation='relu'),
    keras.layers.Dropout(0.2),
    keras.layers.Dense(2, activation='softmax')  # 2 classes: Maski vs Not
])

# Compile
model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

# Load your dataset here (using tf.data or ImageDataGenerator)
# ... training code ...

# Save
model.save('maski_model.h5')

# Convert to TensorFlow.js
import tensorflowjs as tfjs
tfjs.converters.save_keras_model(model, './models/maski-detector/')
```

#### Step 4: Optimize for Mobile
```bash
# Quantize model (reduces size, speeds up inference)
tensorflowjs_converter \
  --input_format=keras \
  --output_format=tfjs_graph_model \
  --quantization_bytes=1 \
  maski_model.h5 \
  ./models/maski-detector/
```

#### Step 5: Deploy
1. Copy `models/maski-detector/` folder to your web server
2. Update `js/ml-detector.js` if needed (model input/output format)
3. Test on real devices (phone camera, not laptop webcam)

---

## 🎛️ Tuning Parameters

Edit `js/ml-detector.js` → `DETECTION_CONFIG`:

```javascript
export const DETECTION_CONFIG = {
  confidenceThreshold: 0.7,  // Lower = more sensitive (more false positives)
                             // Higher = stricter (may miss some real Maski)
  
  detectionInterval: 500,    // ms between checks (lower = more battery drain)
  
  cooldownMs: 5000,          // Delay between repeat detections (avoid spam)
};
```

**Recommended values**:
- Testing: `threshold: 0.5, interval: 1000`
- Production: `threshold: 0.75, interval: 500`

---

## 🧪 Testing Strategy

### Phase 1: Controlled Testing
- Print the Maski image on paper
- Test in different lighting
- Move camera closer/farther
- Tilt paper at angles

### Phase 2: Real-World Testing
- Place Maski sticker on products
- Test in store environments
- Have friends spot Maski and scan
- Check false positive rate (does it trigger on random purple stuff?)

### Phase 3: Nationwide Rollout
- Deploy to select cities first
- Monitor detection stats via backend
- Tune threshold based on user feedback
- Scale gradually

---

## 📊 Advanced: Detection Analytics

Add to `js/ml-detector.js`:

```javascript
function logDetection(detection) {
  // Send to your backend for analytics
  fetch('https://api.maski.co.za/v1/detections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      confidence: detection.confidence,
      timestamp: detection.timestamp,
      // Optional: add geolocation with user consent
      lat: position?.coords?.latitude,
      lng: position?.coords?.longitude,
    })
  }).catch(() => {}); // Silent fail - don't break user experience
}
```

This lets you:
- See where Maski is being spotted
- Build a heatmap of popular locations
- Reward top "spotters" with leaderboard
- Detect if model needs retraining (low confidence patterns)

---

## 🚨 Troubleshooting

### "TensorFlow.js not loaded"
- Check browser console for network errors
- CDN may be blocked → download TF.js locally

### "Model not found"
- Verify `./models/maski-detector/model.json` exists
- Check file paths (case-sensitive on some servers)
- Try full URL: `modelUrl: "https://yoursite.com/models/..."`

### Low accuracy / false positives
- Need more training data (especially negatives)
- Retrain with data augmentation (rotations, brightness, etc.)
- Increase `confidenceThreshold`

### Phone performance issues
- Reduce `detectionInterval` (check less frequently)
- Use smaller input size (160x160 instead of 224x224)
- Quantize model more aggressively

### Works on laptop but not phone
- Phone camera has different resolution/colors
- Retrain using **phone photos** not laptop webcam
- Test on actual device, not emulator

---

## 🎯 Next Steps

1. ✅ **MVP**: Use Teachable Machine with 50 images → test in 1 day
2. 📈 **Scale**: Collect 500+ images → custom training → deploy
3. 🌍 **Nationwide**: Add geolocation, leaderboard, rewards
4. 🤖 **Auto-improve**: Collect failed detections → retrain monthly

---

## 🔗 Resources

- [Teachable Machine](https://teachablemachine.withgoogle.com/)
- [Roboflow](https://roboflow.com)
- [TensorFlow.js Tutorials](https://www.tensorflow.org/js/tutorials)
- [MobileNet Paper](https://arxiv.org/abs/1704.04861) (efficient mobile models)
- [Object Detection Guide](https://www.tensorflow.org/lite/examples/object_detection/overview)

---

**Questions?** Ask on the Maski developer Discord or WhatsApp group 🚀
