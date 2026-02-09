# 🤖 Fixing False Positives: Non-Maski Robots

## 🚨 Problem

Your model is detecting **other robots** (non-purple ones) as Maski. This is a **training data issue** - the model learned "robot shape" but not "purple robot specifically."

## ✅ Short-Term Fix: Purple Color Filter

I've added a **purple color detection filter** that helps reduce false positives:

### What I Added

1. **Purple detection algorithm** (`lib/colorDetection.ts`)
   - Analyzes HSL color space
   - Detects purple hue (270-320 degrees)
   - Requires 10%+ of image to be purple

2. **Updated scanner** to filter by color
   - Only triggers detection if purple is present
   - Shows purple percentage in debug overlay

3. **New env variable**: `NEXT_PUBLIC_MIN_PURPLE_PERCENT`
   - Default: 0.10 (10% purple required)
   - Set to 0 to disable filtering

### How It Works

```
Model says "Maski" → Check for purple → If purple present → Trigger detection
                                      → If no purple → Ignore (filter out)
```

### Testing the Filter

1. **Restart your server**:
   ```bash
   pkill -f "next dev"
   npm run dev
   ```

2. **Open the scanner** (`/scan`)

3. **New debug overlay shows**:
   ```
   Class 0: 85.3% ← MASKI
   Class 1: 14.7%
   ────────────────────
   Purple: 8.2% ✗ (Need 10%+)
   ```

4. **Test with non-purple robot**:
   - Model might say "Maski"
   - But purple % will be low (red ✗)
   - Detection won't trigger

5. **Test with purple Maski**:
   - Model says "Maski"
   - Purple % will be high (purple ✓)
   - Detection triggers!

### Adjusting the Filter

Edit `.env.local`:

```env
# More strict (require 20% purple)
NEXT_PUBLIC_MIN_PURPLE_PERCENT=0.20

# Less strict (require 5% purple)
NEXT_PUBLIC_MIN_PURPLE_PERCENT=0.05

# Disable color filtering completely
NEXT_PUBLIC_MIN_PURPLE_PERCENT=0
```

## 🎯 Long-Term Fix: Retrain Your Model

The color filter is a **band-aid** - the real fix is better training data.

### Why It's Detecting Other Robots

Your training data probably:
- ✗ Had only Maski images in "Maski" class
- ✗ Had mixed backgrounds/people in "Not Maski" class
- ✗ Didn't have other robots in "Not Maski" class

So the model learned:
- "Robot shape" = Maski ❌
- Instead of "Purple robot design" = Maski ✓

### How to Retrain

Go back to **Teachable Machine** (or your training tool):

#### Class 1: Maski (Positive Examples)
Collect 50-100 images of:
- Purple Maski from different angles
- Purple Maski in different lighting
- Purple Maski at different distances
- Purple Maski with different backgrounds

#### Class 2: Not Maski (Negative Examples)
This is the KEY - you need diverse negatives:
- ✅ **Other robots** (red, blue, yellow, silver - any non-purple robot)
- ✅ People holding robots
- ✅ Random objects
- ✅ Similar purple objects (but not Maski shape)
- ✅ Empty backgrounds
- ✅ Hands/arms (common in camera view)

### Training Tips

1. **Balance your dataset**:
   - 50-100 images per class
   - Equal distribution

2. **Add negative robots**:
   - This is crucial!
   - Every robot you DON'T want detected goes in "Not Maski"

3. **Vary lighting**:
   - Bright light
   - Dim light
   - Indoor/outdoor

4. **Vary angles**:
   - Front
   - Side
   - Tilted
   - Close-up
   - Far away

5. **Data augmentation**:
   - Teachable Machine has built-in augmentation
   - Enable it during training

### After Retraining

1. Download new model files (model.json, weights.bin)
2. Replace files in `/public/model/`
3. Restart server
4. Test again

You should see:
- Purple Maski → HIGH confidence
- Other robots → LOW confidence
- People → LOW confidence

## 🔬 Understanding the Debug Overlay

The debug overlay now shows 3 metrics:

### 1. Class Confidences
```
Class 0: 92.5% ← MASKI
Class 1: 7.5%
```
Shows what the ML model thinks

### 2. Purple Detection
```
Purple: 15.3% ✓
```
- **Green with ✓** = Has enough purple (will allow detection)
- **Red with ✗** = Not enough purple (will block detection)

### 3. Current Config
```
Using class 0 as Maski
```
Confirms your settings

## 🎨 Understanding Purple Detection

### What Counts as "Purple"?

The algorithm looks for:
- **Hue**: 270-320 degrees (violet to magenta range)
- **Saturation**: > 30% (not gray/desaturated)
- **Lightness**: 20-80% (not too dark or too bright)

### Edge Cases

**Might trigger false positives:**
- Purple backgrounds (walls, clothing)
- Purple lighting
- Other purple objects

**Might miss Maski:**
- Very dark/shadowy purple (looks black)
- Very light purple (looks white/pink)
- Strong yellow lighting (makes purple look brown)

**Solutions:**
- Good even lighting
- Neutral background
- Position Maski in center of frame

## 🛠️ Configuration Summary

Edit `.env.local`:

```env
# Which class is Maski (0 or 1)
NEXT_PUBLIC_MASKI_CLASS_INDEX=0

# ML confidence threshold
NEXT_PUBLIC_THRESHOLD=0.80

# Purple filter (0.0 to 1.0, set to 0 to disable)
NEXT_PUBLIC_MIN_PURPLE_PERCENT=0.10

# Inference speed (lower = less CPU)
NEXT_PUBLIC_INFERENCE_FPS=8
```

## 📊 Recommended Settings

### Conservative (Fewer False Positives)
```env
NEXT_PUBLIC_THRESHOLD=0.85           # Higher ML threshold
NEXT_PUBLIC_MIN_PURPLE_PERCENT=0.15  # Require 15% purple
```

### Moderate (Balanced)
```env
NEXT_PUBLIC_THRESHOLD=0.80           # Default
NEXT_PUBLIC_MIN_PURPLE_PERCENT=0.10  # Default
```

### Liberal (Catch More Maskis, Risk False Positives)
```env
NEXT_PUBLIC_THRESHOLD=0.70           # Lower ML threshold
NEXT_PUBLIC_MIN_PURPLE_PERCENT=0.05  # Only 5% purple needed
```

### ML Only (No Color Filter)
```env
NEXT_PUBLIC_THRESHOLD=0.85           # High confidence needed
NEXT_PUBLIC_MIN_PURPLE_PERCENT=0     # Disable purple filter
```

## 🔄 Testing Workflow

1. **Test with purple Maski**:
   - Should show high Class confidence
   - Should show high purple %
   - Should trigger detection ✓

2. **Test with non-purple robot** (red, blue, etc.):
   - Might show high Class confidence (model confused)
   - Should show LOW purple %
   - Should NOT trigger (filtered out) ✓

3. **Test with yourself**:
   - Should show low Class confidence
   - Should show low purple %
   - Should NOT trigger ✓

4. **Test with purple object** (not Maski):
   - Should show LOW Class confidence (model knows it's not Maski)
   - Might show high purple %
   - Should NOT trigger (model filtered it) ✓

## 🎯 Summary

**Short term**: Use the purple color filter
- Quick fix
- Helps immediately
- May have edge cases

**Long term**: Retrain your model
- Proper solution
- Add other robots to "Not Maski" class
- Will work much better

**Both together**: Use color filter + retrained model
- Best accuracy
- Handles all edge cases
- Production-ready

---

**The color filter is now active!** Restart your server and test with different robots. The debug overlay will show you what's happening in real-time. 🤖💜
