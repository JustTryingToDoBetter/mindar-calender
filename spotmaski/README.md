# SpotMaski MVP

A camera-based web application that uses TensorFlow.js to detect "Maski" in real-time and allows users to register for a competition via Microsoft Forms.

## Features

- **Camera-only detection**: No image upload fallback - live camera feed only
- **Client-side ML inference**: TensorFlow.js runs entirely in the browser (no server required)
- **Stable detection**: Built-in stabilizer reduces false positives
- **Mobile-first design**: Optimized for smartphones with rear camera preference
- **Competition registration**: Direct integration with Microsoft Forms
- **Privacy-focused**: No data storage, all processing happens locally

## Tech Stack

- **Next.js 16** (App Router) with TypeScript
- **TensorFlow.js** for ML inference
- **Tailwind CSS** for styling
- **getUserMedia API** for camera access

## Prerequisites

- Node.js 18+ and npm
- A modern browser with camera access (Chrome, Safari, Edge, Firefox)
- HTTPS connection (required for camera access)
- The TensorFlow.js model files (provided in `/public/model/`)

## Installation

1. **Clone this repository** (if not already in it):
   ```bash
   cd /workspaces/mindar-calender/spotmaski
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:

   Edit `.env.local` and update the values:
   ```env
   # Microsoft Form URL for competition registration
   NEXT_PUBLIC_FORM_URL=https://forms.office.com/YOUR_ACTUAL_FORM_URL

   # Detection threshold (0.0 to 1.0) - higher = stricter detection
   NEXT_PUBLIC_THRESHOLD=0.85

   # Minimum per-frame confidence to be considered for detection
   NEXT_PUBLIC_MIN_CONFIDENCE=0.85

   # Minimum margin between Maski and Not Maski confidence
   NEXT_PUBLIC_MIN_MARGIN=0.15

   # Stabilizer settings (higher = fewer false positives)
   NEXT_PUBLIC_STABILIZER_WINDOW=7
   NEXT_PUBLIC_MIN_MASKI_COUNT=4

   # Minimum purple percentage required (0.0 to 1.0)
   NEXT_PUBLIC_MIN_PURPLE_PERCENT=0.05

   # Model URL path (relative to public directory)
   NEXT_PUBLIC_MODEL_URL=/model/model.json

   # Inference frames per second (lower = less CPU usage)
   NEXT_PUBLIC_INFERENCE_FPS=8
   ```

4. **Place your model files** (already done):

   The model files should be in `/public/model/`:
   ```
   /public/model/
     ├── model.json      (model architecture)
     ├── weights.bin     (model weights)
     └── metadata.json   (optional)
   ```

   The current model is a MobileNetV2-based binary classifier trained to detect "Maski" vs "Not Maski".

## Running the App

### Development Mode

```bash
npm run dev
```

The app will start on `http://localhost:3000`.

### Production Build

```bash
npm run build
npm start
```

### Running in GitHub Codespaces

1. The dev server will automatically forward port 3000
2. Click the "Ports" tab in VS Code
3. Find port 3000 and click the globe icon to open in browser
4. **Important**: The forwarded URL will be HTTPS (required for camera access)

## Project Structure

```
spotmaski/
├── app/
│   ├── layout.tsx          # Root layout (Next.js App Router)
│   ├── page.tsx            # Landing page (/)
│   ├── scan/
│   │   └── page.tsx        # Scan page (/scan)
│   └── globals.css         # Global styles
├── components/
│   └── CameraScanner.tsx   # Main camera + ML component
├── lib/
│   ├── model.ts            # TensorFlow.js model loading & inference
│   └── stabilizer.ts       # Prediction stabilizer
├── public/
│   └── model/              # TensorFlow.js model files
│       ├── model.json
│       ├── weights.bin
│       └── metadata.json
├── .env.local              # Environment variables (not committed)
├── next.config.js          # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies
```

## User Flow

1. **Landing page** (`/`):
   - User clicks "Start Scanning"
   - Redirected to `/scan`

2. **Scan page** (`/scan`):
   - Requests camera permission (rear camera preferred on mobile)
   - Loads TensorFlow.js model
   - Displays live video preview
   - Runs inference at 8 FPS (configurable)
   - Shows status: "Scanning...", "No Maski yet...", etc.

3. **Detection**:
   - Stabilizer tracks last 5 predictions
   - Triggers detection if:
     - At least 2 of last 5 frames predict "Maski"
     - Average confidence ≥ 0.80 (configurable)
   - Scanning stops, UI freezes in "detected" state

4. **CTA**:
   - Shows "You spotted Maski 🎉" card
   - "Enter Competition" button opens Microsoft Form in new tab
   - Form URL includes query parameters:
     - `sessionId`: unique UUID for this scan session
     - `detectedAt`: ISO timestamp of detection
     - `avgConfidence`: average confidence (0.000-1.000)

5. **Restart**:
   - User can click "Scan Again" to generate new sessionId and restart

## Environment Variables

| Variable                     | Default                | Description                                      |
|------------------------------|------------------------|--------------------------------------------------|
| `NEXT_PUBLIC_FORM_URL`           | (placeholder)          | Microsoft Form URL for competition registration  |
| `NEXT_PUBLIC_THRESHOLD`          | `0.85`                 | Detection threshold (0.0-1.0)                    |
| `NEXT_PUBLIC_MIN_CONFIDENCE`     | `0.85`                 | Minimum per-frame confidence gate                |
| `NEXT_PUBLIC_MIN_MARGIN`         | `0.15`                 | Minimum margin between Maski and Not Maski       |
| `NEXT_PUBLIC_STABILIZER_WINDOW`  | `7`                    | Stabilizer window size                           |
| `NEXT_PUBLIC_MIN_MASKI_COUNT`    | `4`                    | Minimum Maski predictions in window              |
| `NEXT_PUBLIC_MIN_PURPLE_PERCENT` | `0.05`                 | Minimum purple percentage filter                 |
| `NEXT_PUBLIC_MODEL_URL`          | `/model/model.json`    | Path to TensorFlow.js model                      |
| `NEXT_PUBLIC_INFERENCE_FPS`      | `8`                    | Inference frames per second                      |

**Note**: All variables must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser.

## Model Information

The current model is a **MobileNetV2-based image classifier** trained with Teachable Machine:

- **Input**: 224×224 RGB images
- **Output**: 2 classes (softmax):
  - Class 0: "Not Maski"
  - Class 1: "Maski"
- **Format**: TensorFlow.js Layers Model
- **Size**: ~2.1 MB

### Replacing the Model

To use a different model:

1. Place new model files in `/public/model/`
2. Update `NEXT_PUBLIC_MODEL_URL` if needed
3. Ensure model input shape is 224×224×3 (or update `MODEL_INPUT_SIZE` in `lib/model.ts`)
4. Verify output format matches (2-class softmax with Maski as class 1)

## Performance Tuning

### Reduce False Positives

Edit `.env.local`:
```env
# Increase threshold (requires higher confidence)
NEXT_PUBLIC_THRESHOLD=0.90
NEXT_PUBLIC_MIN_CONFIDENCE=0.90
NEXT_PUBLIC_MIN_MARGIN=0.20
NEXT_PUBLIC_STABILIZER_WINDOW=9
NEXT_PUBLIC_MIN_MASKI_COUNT=5
NEXT_PUBLIC_MIN_PURPLE_PERCENT=0.08
```

### Improve Performance on Low-End Devices

```env
# Reduce inference frequency
NEXT_PUBLIC_INFERENCE_FPS=5

# Or in lib/model.ts:
# - Reduce MODEL_INPUT_SIZE from 224 to 160
# - Use CPU backend instead of WebGL (slower but more stable)
```

### Increase Sensitivity

```env
# Lower threshold (easier to trigger)
NEXT_PUBLIC_THRESHOLD=0.70
```

## Troubleshooting

### Camera Not Working

**Issue**: "Camera permission denied" or black screen

**Solutions**:
1. **Check HTTPS**: Camera access requires HTTPS (except localhost). Codespaces provides HTTPS by default.
2. **Grant permission**: Click "Allow" when browser asks for camera access
3. **Check browser settings**: Ensure camera is not blocked for this site
4. **Try incognito mode**: Some extensions block camera access
5. **Check device**: Ensure camera is not in use by another app

### Model Not Loading

**Issue**: "Failed to load model" error

**Solutions**:
1. **Check files**: Ensure `/public/model/model.json` exists
2. **Check console**: Open browser DevTools → Console for detailed errors
3. **Verify URL**: Model URL must be relative to `/public/` (e.g., `/model/model.json`)
4. **Check network**: Ensure no firewall/proxy blocking model downloads
5. **Try different model**: Test with a fresh model from Teachable Machine

### Detection Not Triggering

**Issue**: Scanning but never detecting Maski

**Solutions**:
1. **Lower threshold**: Reduce `NEXT_PUBLIC_THRESHOLD` to 0.60
2. **Check lighting**: Ensure good lighting conditions
3. **Check model**: Test model with known good image of Maski
4. **Check logs**: Open DevTools → Console and look for `inference` events
5. **Retrain model**: Model may need more training data

### Poor Performance / Lag

**Issue**: App is slow or freezes

**Solutions**:
1. **Reduce FPS**: Lower `NEXT_PUBLIC_INFERENCE_FPS` to 5 or lower
2. **Close other tabs**: Free up browser resources
3. **Use desktop**: Mobile devices may struggle with real-time inference
4. **Check backend**: Open Console and check TensorFlow.js backend (should be `webgl`)
5. **Optimize model**: Use a smaller model or quantize weights

### Microsoft Form Not Opening

**Issue**: CTA button doesn't work

**Solutions**:
1. **Check URL**: Verify `NEXT_PUBLIC_FORM_URL` is set correctly in `.env.local`
2. **Check pop-up blocker**: Browser may block new tab
3. **Use desktop**: Some mobile browsers restrict `window.open()`
4. **Check format**: Form URL should be complete (e.g., `https://forms.office.com/...`)

### TypeScript Errors

**Issue**: Build fails with type errors

**Solutions**:
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Build again
npm run dev
```

## Codespaces-Specific Notes

### Port Forwarding

- Port 3000 is automatically forwarded
- HTTPS is enabled by default (required for camera access)
- Find forwarded URL in "Ports" tab

### Camera Access in Codespaces

- You're accessing from **your local browser**, which uses **your local camera**
- Codespaces provides a web preview, not a remote desktop
- Camera permissions are granted to the forwarded domain (e.g., `username-repo-xxx.githubpreview.dev`)

### Persistent Storage

- Model files in `/public/` persist across Codespace restarts
- `.env.local` is gitignored but persists in your Codespace
- `node_modules/` should be reinstalled after major changes

## Event Logging

All significant events are logged to console in structured JSON format:

```json
{
  "event": "inference",
  "timestamp": "2026-02-06T10:30:00.000Z",
  "isMaski": true,
  "confidence": 0.923,
  "predictions": [0.077, 0.923]
}
```

Event types:
- `camera_request`: Camera access requested
- `camera_ready`: Camera stream active
- `camera_error`: Camera access failed
- `inference`: Model prediction made
- `stabilizer_update`: Stabilizer state changed
- `detection_triggered`: Maski detected
- `competition_entry_initiated`: User clicked CTA

To implement backend analytics, modify `lib/model.ts` and `components/CameraScanner.tsx` to send these events to your API.

## Accessibility

- Large tap targets (min 44×44px)
- Clear focus states (`focus-visible` rings)
- Semantic HTML (`<button>`, `<main>`, etc.)
- ARIA labels where needed
- Error messages clearly communicated
- Keyboard navigation support

## Security Considerations

- **No server-side inference**: All ML runs client-side
- **No data storage**: Camera frames are not saved or uploaded
- **Form data**: Handled by Microsoft Forms (your responsibility)
- **Query params**: Only sessionId, timestamp, and confidence are passed
- **HTTPS only**: Camera access requires secure context

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Netlify

```bash
npm run build
# Deploy the .next folder
```

### Static Export (Not Recommended)

Next.js App Router requires a Node.js server for optimal performance. Static export is possible but not ideal for this use case.

## Future Enhancements

Potential improvements for future versions:

1. **Geolocation tracking**: Track where Maski is spotted (with user consent)
2. **Leaderboard**: Rank top "spotters" with most detections
3. **Image capture**: Save a photo of detected Maski for verification
4. **Multi-model support**: Allow switching between different Maski models
5. **Offline support**: Service worker for offline capability
6. **Backend analytics**: Store detection events in database
7. **A/B testing**: Test different thresholds and UI variations
8. **Localization**: Support multiple languages

## License

MIT License - feel free to use and modify for your needs.

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review browser console logs
3. Test on a different device/browser
4. Open an issue in this repository

## Credits

- Built with Next.js, TensorFlow.js, and Tailwind CSS
- Model trained with Google Teachable Machine
- Icon: 🎭 (Performing Arts emoji as placeholder mascot)

---

Made with ❤️ for the Maski campaign. Happy spotting! 🎉
