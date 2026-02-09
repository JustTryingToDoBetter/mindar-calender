# 🔧 SpotMaski - Debug & Fix Class Detection

## 🚨 Problem: Model Detecting You as Maski

Your model is detecting **you** as Maski when you're not - this means we're reading the wrong class index!

## ✅ Solution: Debug Overlay Added

I've added a **debug overlay** at the bottom of the camera view that shows:
- **Class 0 confidence** (in %)
- **Class 1 confidence** (in %)
- **Which class is currently marked as "Maski"**

## 📱 How to Fix It

### Step 1: Open the Scanner

1. Go to `http://localhost:3000` (or your Codespaces URL)
2. Click "Start Scanning"
3. Allow camera access

### Step 2: Watch the Debug Overlay

The bottom of the screen will show something like:

```
Class 0: 85.3% ← MASKI
Class 1: 14.7%

Currently using class 0 as Maski
```

### Step 3: Test with Yourself

Point the camera at **YOURSELF** (not Maski) and watch the percentages:

**If Class 0 goes HIGH (like 80%+) when pointing at you:**
- This means Class 0 is actually "Not Maski" (you)
- We need to switch to Class 1 as Maski

**If Class 1 goes HIGH when pointing at you:**
- This means Class 1 is actually "Not Maski" (you)
- We need to switch to Class 0 as Maski

### Step 4: Fix the Configuration

Edit `.env.local` and change `NEXT_PUBLIC_MASKI_CLASS_INDEX`:

```env
# If Class 0 detects YOU (wrong), change to 1:
NEXT_PUBLIC_MASKI_CLASS_INDEX=1

# If Class 1 detects YOU (wrong), change to 0:
NEXT_PUBLIC_MASKI_CLASS_INDEX=0
```

### Step 5: Restart

After changing `.env.local`:
```bash
# Stop the server (Ctrl+C in terminal or)
pkill -f "next dev"

# Start again
npm run dev
```

### Step 6: Test with Maski

Now point the camera at **actual Maski**:
- The correct class should now show HIGH confidence
- Detection should trigger properly

## 🔍 Example Scenarios

### Scenario A: You're being detected as Maski
```
YOU in camera:
  Class 0: 92.5% ← MASKI    // WRONG! This should be low
  Class 1: 7.5%

SOLUTION: Change to NEXT_PUBLIC_MASKI_CLASS_INDEX=1
```

### Scenario B: Maski not being detected
```
MASKI in camera:
  Class 0: 15.3%
  Class 1: 84.7% ← MASKI    // This should be triggering but isn't

CHECK: Is threshold too high? Lower it to 0.60 for testing
```

## 🎯 Quick Test Flow

1. **Point at yourself** → Check which class goes HIGH
2. **Point at Maski** → Check which class goes HIGH
3. **Whichever class detects MASKI should be your `MASKI_CLASS_INDEX`**

## 📊 Understanding the Classes

Your model has 2 classes from Teachable Machine:
- **Class 0** could be either "Maski" OR "Not Maski"
- **Class 1** could be either "Not Maski" OR "Maski"

The labels in `metadata.json` just say "Class 1" and "Class 2" - not helpful!

**So we need to test with real data to figure out which is which.**

## 🔧 Current Configuration

Check `.env.local`:
```env
NEXT_PUBLIC_MASKI_CLASS_INDEX=0    # Currently using Class 0 as Maski
NEXT_PUBLIC_THRESHOLD=0.80         # Requires 80% confidence
NEXT_PUBLIC_INFERENCE_FPS=8        # 8 frames per second
```

## 🐛 Still Having Issues?

### Option 1: Open Browser Console
Press **F12** → Console tab

You'll see JSON logs like:
```json
{
  "event": "inference",
  "class0_confidence": 0.923,
  "class1_confidence": 0.077,
  "maskiClassIndex": 0,
  "isMaski": true
}
```

This shows you exactly what the model is predicting.

### Option 2: Lower the Threshold

If detection isn't triggering even with correct class:
```env
NEXT_PUBLIC_THRESHOLD=0.60    # Lower = easier to detect
```

### Option 3: Check Training Data

If BOTH classes show ~50% all the time:
- Model might not be well-trained on Maski vs Not-Maski
- Need more diverse training images
- Ensure training images had good contrast

## ✨ After Fixing

Once you have the right `MASKI_CLASS_INDEX`:

1. Detection should trigger only on **actual Maski**
2. You (the user) should NOT trigger detection
3. The debug overlay will show high confidence for the correct class

## 📝 Summary

**The debug overlay is your friend!**

Watch the real-time percentages to understand:
- Which class represents what
- If your model is confident
- If the threshold is appropriate

**Remember:** Change `NEXT_PUBLIC_MASKI_CLASS_INDEX` in `.env.local` to swap which class is considered "Maski".

---

**Dev server is running now - go test it!** 🎭
