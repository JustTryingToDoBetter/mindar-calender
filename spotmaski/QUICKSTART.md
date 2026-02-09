# SpotMaski - Quick Start Guide

## ✅ Project Status: Complete!

Your SpotMaski MVP is fully built and running. The development server is live on **http://localhost:3000** (or your forwarded Codespaces URL).

## 🎯 What's Been Built

### Core Features
✅ **Landing page** (`/`) - Premium UI with call-to-action
✅ **Camera scanner** (`/scan`) - Real-time Maski detection
✅ **TensorFlow.js integration** - Client-side ML inference
✅ **Prediction stabilizer** - Reduces false positives
✅ **Microsoft Form integration** - Competition registration CTA
✅ **Mobile-first responsive design** - Works on all devices
✅ **Error handling** - Camera permissions, model loading, etc.

### Project Structure
```
spotmaski/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   ├── scan/page.tsx       # Scanner page
│   └── globals.css         # Global styles
├── components/
│   └── CameraScanner.tsx   # Camera + ML component
├── lib/
│   ├── model.ts            # TensorFlow.js model utilities
│   └── stabilizer.ts       # Detection stabilizer
├── public/
│   └── model/              # ML model files (224x224 MobileNetV2)
│       ├── model.json
│       ├── weights.bin
│       └── metadata.json
└── .env.local              # Environment variables
```

## 🚀 Next Steps

### 1. Update Environment Variables

Edit `.env.local` and replace the placeholder Microsoft Form URL:

```env
NEXT_PUBLIC_FORM_URL=https://forms.office.com/YOUR_ACTUAL_FORM_URL
```

### 2. Access the App

**In Codespaces:**
1. Click the "Ports" tab in VS Code
2. Find port 3000
3. Click the globe icon to open in browser
4. The URL will be HTTPS (required for camera access)

**Locally:**
- Just open http://localhost:3000

### 3. Test the Detection

1. Navigate to the scan page
2. Allow camera permissions when prompted
3. Point camera at a Maski image/object
4. Wait for stable detection (2+ frames out of 5 with >80% confidence)
5. Click "Enter Competition" when detected

## 📱 Testing on Mobile

The app works best on mobile devices with rear cameras:

1. Open the forwarded Codespaces URL on your phone
2. Allow camera access
3. Use rear camera to scan Maski
4. The app is optimized for `facingMode: "environment"`

## ⚙️ Configuration

All settings can be adjusted in `.env.local`:

```env
# Detection threshold (0.0-1.0, higher = stricter)
NEXT_PUBLIC_THRESHOLD=0.80

# Inference frames per second (lower = less CPU)
NEXT_PUBLIC_INFERENCE_FPS=8

# Model path
NEXT_PUBLIC_MODEL_URL=/model/model.json
```

## 🔧 Common Issues

### Scan page takes long to load first time
**Normal!** TensorFlow.js has many dependencies. First compilation takes 30-60 seconds. Subsequent loads are instant.

### Camera not working
- Ensure HTTPS is enabled (Codespaces provides this automatically)
- Click "Allow" when browser asks for camera permission
- Check that your camera isn't in use by another app

### Detection not triggering
- Ensure good lighting
- Lower the threshold in `.env.local` to 0.60 for testing
- Check browser console for `inference` events

## 📊 Monitoring

All events are logged to browser console in JSON format:

```javascript
// In browser DevTools → Console, you'll see:
{
  "event": "inference",
  "timestamp": "2026-02-06T...",
  "isMaski": true,
  "confidence": 0.923
}
```

## 🎨 Customization

### Change colors
Edit CSS variables in `app/globals.css`:
```css
:root {
  --primary: #8B5CF6;    /* Purple */
  --success: #10B981;    /* Green */
  /* ... */
}
```

### Adjust stabilizer
Edit `components/CameraScanner.tsx`:
```typescript
// Line ~90: Change these values
stabilizerRef.current = new PredictionStabilizer(
  5,    // window size (number of frames to track)
  0.80, // threshold
  2     // min Maski predictions needed
);
```

## 📦 Deployment

### Deploy to Vercel (recommended)
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm run build
# Deploy the .next folder
```

## 📝 Notes

- **First compilation**: The `/scan` page will compile slowly the first time (TensorFlow.js is large). Subsequent loads are instant.
- **Model**: Your model is already in `/public/model/` and working (MobileNetV2, 224×224 input, binary classifier)
- **No database**: This MVP has no backend - everything runs client-side
- **Analytics**: All events are logged to console. Hook them up to your API if needed.

## ✨ What's Next?

Consider adding:
- Image capture on detection (save a photo of spotted Maski)
- Geolocation tracking (where was Maski spotted?)
- Leaderboard (top spotters)
- Backend analytics (store detection events)
- Offline support (service worker)
- Multiple Maski models (different characters)

## 🐛 Troubleshooting

See the detailed **Troubleshooting** section in README.md for:
- Camera access issues
- Model loading errors
- Performance optimization
- Detection tuning
- TypeScript errors

## 🎉 You're All Set!

Your SpotMaski MVP is complete and running. The development server should now be fully responsive at http://localhost:3000.

**Test it now:**
1. Open the app in your browser
2. Click "Start Scanning"
3. Allow camera access
4. Point at Maski
5. Watch the magic happen! 🎭✨

---

**Need help?** Check README.md or review the comprehensive documentation in each file.
