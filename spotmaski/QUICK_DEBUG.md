# 🔍 Quick Debug Guide - Why Isn't Maski Detecting?

## What I Just Changed

### 1. **Lowered Thresholds** (for easier detection)
- ML Threshold: 0.80 → **0.60** (now triggers at 60% confidence)
- Purple Filter: 0.10 → **0.05** (only needs 5% purple now)

### 2. **Added DEBUG MODE**
- **Bypasses the stabilizer** (no need to wait for 2/5 frames)
- **Instant detection** when conditions are met
- Shows "🐛 DEBUG MODE" badge on screen

### 3. **Enhanced Debug Overlay**
Now shows:
- ✅ **"Too low!" warnings** next to low confidence classes
- ✅ **Live suggestions** if wrong class is selected
- ✅ **Current threshold** displayed
- ✅ **Yellow border** when in debug mode

## 🎯 What To Look For

Open `/scan` and point at Maski. Watch the bottom overlay:

### Scenario A: Class 0 is HIGH (60%+) when pointing at Maski
```
🐛 DEBUG MODE - No Stabilizer

Class 0: 87.3% ← MASKI  ✅ GOOD!
Class 1: 12.7%

Purple: 18.5% ✓

Threshold: 60%
Class 0 = Maski
```

**This means:** Everything is correct! It should detect immediately.

**If not detecting:** Check browser console (F12) for errors.

---

### Scenario B: Class 1 is HIGH when pointing at Maski
```
🐛 DEBUG MODE - No Stabilizer

Class 0: 15.2% ← MASKI   ⚠️ Too low!
Class 1: 84.8%

Purple: 22.1% ✓

⚠️ Try: Set MASKI_CLASS_INDEX=1 in .env.local
```

**This means:** You have the WRONG class selected!

**Fix:**
```bash
# Edit .env.local
NEXT_PUBLIC_MASKI_CLASS_INDEX=1

# Restart
pkill -f "next dev"
npm run dev
```

---

### Scenario C: BOTH classes are low (~50/50)
```
🐛 DEBUG MODE - No Stabilizer

Class 0: 52.3% ← MASKI   ⚠️ Too low!
Class 1: 47.7%

Purple: 8.2% ✓
```

**This means:** Model is confused / not confident

**Possible causes:**
- Bad lighting
- Maski too far away
- Blurry image
- Model not well-trained on Maski

**Try:**
- Better lighting
- Get closer to Maski
- Hold camera steady
- Lower threshold even more (`NEXT_PUBLIC_THRESHOLD=0.50`)

---

### Scenario D: Purple is too low
```
🐛 DEBUG MODE - No Stabilizer

Class 0: 89.2% ← MASKI  ✅
Class 1: 10.8%

Purple: 3.1% ✗  ⚠️ Need 5%+
```

**This means:** Purple filter is blocking detection

**Fix:**
```env
# Disable purple filter
NEXT_PUBLIC_MIN_PURPLE_PERCENT=0
```

Or improve lighting so purple shows up better.

---

## 🚀 Quick Fixes

### Fix 1: Swap the Class Index
```bash
# Edit .env.local
NEXT_PUBLIC_MASKI_CLASS_INDEX=1  # Change 0 to 1 (or vice versa)

# Restart
pkill -f "next dev" && npm run dev
```

### Fix 2: Lower Threshold Even More
```bash
# Edit .env.local
NEXT_PUBLIC_THRESHOLD=0.50  # 50% confidence is enough

# Restart
pkill -f "next dev" && npm run dev
```

### Fix 3: Disable Purple Filter
```bash
# Edit .env.local
NEXT_PUBLIC_MIN_PURPLE_PERCENT=0  # No purple requirement

# Restart
pkill -f "next dev" && npm run dev
```

### Fix 4: Disable Debug Mode (Test Normal Mode)
```bash
# Edit .env.local
NEXT_PUBLIC_DEBUG_MODE=false  # Use stabilizer

# Restart
pkill -f "next dev" && npm run dev
```

## 🔧 Current Settings

Your `.env.local` now has:
```env
NEXT_PUBLIC_THRESHOLD=0.60              # 60% confidence needed
NEXT_PUBLIC_MASKI_CLASS_INDEX=0         # Class 0 is Maski
NEXT_PUBLIC_MIN_PURPLE_PERCENT=0.05     # 5% purple needed
NEXT_PUBLIC_DEBUG_MODE=true             # Debug mode ON
```

## 📊 Understanding the Debug Overlay

The overlay shows **4 key metrics**:

1. **Class 0 & Class 1** - What the ML model predicts
   - Green + bold = Selected as "Maski"
   - "Too low!" = Below 60% (won't trigger)

2. **Purple %** - Color analysis
   - Purple + ✓ = Has enough purple
   - Red + ✗ = Not enough purple (blocked)

3. **Threshold** - Current detection threshold

4. **Suggestions** - Automatic hints when something is wrong

## 🎯 Most Likely Issues

### Issue 1: Wrong Class Index ⚠️ MOST COMMON
**Symptom:** Class 0 is high when pointing at you, low when pointing at Maski

**Solution:** Change `MASKI_CLASS_INDEX` to 1

---

### Issue 2: Threshold Too High
**Symptom:** Maski class shows 55%, but not detecting

**Solution:** Lower `THRESHOLD` to 0.50 or even 0.40

---

### Issue 3: Purple Filter Too Strict
**Symptom:** Class is high, but purple is low

**Solution:** Set `MIN_PURPLE_PERCENT` to 0

---

### Issue 4: Model Not Trained Well
**Symptom:** Both classes are ~50% all the time

**Solution:** Model needs better training data (see FIXING_FALSE_POSITIVES.md)

## 🐛 Using Browser Console

Press **F12** → Console tab

Look for these logs:
```json
{
  "event": "inference",
  "class0_confidence": 0.873,
  "class1_confidence": 0.127,
  "maskiClassIndex": 0,
  "isMaski": true
}
```

This shows you EXACTLY what the model is predicting.

---

## ✅ Success Checklist

When pointing camera at Maski:

- [ ] The correct class shows **60%+**
- [ ] Purple shows **5%+** (or filter disabled)
- [ ] Debug overlay shows no "Too low!" warnings
- [ ] Console shows `"isMaski": true`
- [ ] Detection triggers!

If all checkboxes are checked but still not detecting:
- Check browser console for errors
- Try refreshing the page
- Try a different browser

---

**Server is restarting now with DEBUG MODE enabled. Go test and tell me what you see in the overlay!** 🐛
