# 🎓 Retraining Your Maski Model - The Right Way

## 🚨 Current Problem

Your model detects ANY robot as Maski because the training data didn't include other robots in the "Not Maski" class.

## ✅ The Solution: Better Training Data

You need to retrain with **diverse negative examples** (other robots, objects, etc.)

---

## 📸 Step-by-Step Retraining Guide

### Go to Teachable Machine

1. Visit: https://teachablemachine.withgoogle.com/train/image
2. Start a New Image Project

---

### Class 1: Maski (Positive Examples)

**Collect 50-100 images of ONLY purple Maski:**

✅ **DO Include:**
- Purple Maski from different angles (front, side, back, tilted)
- Purple Maski at different distances (close-up, medium, far)
- Purple Maski in different lighting (bright, dim, natural, indoor)
- Purple Maski with different backgrounds (table, floor, hand, wall)
- Purple Maski partially visible (half in frame)
- Purple Maski slightly blurry/out of focus

❌ **DON'T Include:**
- Other robots
- People alone
- Empty backgrounds

**Pro Tip:** Use your webcam in Teachable Machine to capture 20-30 quick variations, then add 20-30 more photos from your phone.

---

### Class 2: Not Maski (Negative Examples)

**This is THE MOST IMPORTANT PART!**

Collect 50-100 images of things that are NOT Maski:

✅ **MUST Include Other Robots:**
- Red robots
- Blue robots
- Yellow robots
- Silver/gray robots
- Green robots
- ANY robot that is not purple Maski
- Multiple robots in one shot
- Close-ups of other robots
- **This is crucial!** Include every robot you DON'T want detected

✅ **Include Common False Positives:**
- People (especially hands/arms holding objects)
- Purple objects that aren't Maski (purple toys, books, clothing)
- Other toys/figurines
- Tables/desks (common background)
- Empty room shots
- Phones/devices
- Random objects on desks

✅ **Include Edge Cases:**
- Blurry images
- Dark scenes
- Bright reflections
- Partial objects
- Multiple objects together

❌ **DON'T Include:**
- Purple Maski (save those for Class 1)

---

### Training Settings in Teachable Machine

1. **Epochs:** 50-100 (more = better learning, but slower)
2. **Batch Size:** 16 or 32
3. **Learning Rate:** 0.001 (default is fine)
4. **Enable Data Augmentation:** ✅ YES!
   - Flip images
   - Adjust brightness
   - Zoom/crop variations

---

### After Training

1. **Test in Teachable Machine first:**
   - Point webcam at purple Maski → Should show high confidence
   - Point webcam at other robots → Should show LOW confidence
   - Point webcam at yourself → Should show LOW confidence

2. **If it works in testing:**
   - Click "Export Model"
   - Choose "TensorFlow.js"
   - Download (you'll get model.json + weights.bin)

3. **Replace your model files:**
   ```bash
   cd /workspaces/mindar-calender/spotmaski
   # Backup old model
   mv public/model/model.json public/model/model.json.old
   mv public/model/weights.bin public/model/weights.bin.old

   # Copy new model files
   # (Upload your downloaded files to public/model/)
   ```

4. **Restart and test:**
   ```bash
   pkill -f "next dev"
   npm run dev
   ```

---

## 🎯 Quick Checklist

Before training, make sure you have:

**Class 1: Maski**
- [ ] 50+ images of purple Maski only
- [ ] Various angles
- [ ] Various distances
- [ ] Various lighting conditions
- [ ] Various backgrounds

**Class 2: Not Maski**
- [ ] 50+ images WITHOUT purple Maski
- [ ] **10-20 images of OTHER ROBOTS** ⚠️ CRITICAL!
- [ ] 10-20 images of people/hands
- [ ] 10-20 images of random objects
- [ ] 10-20 images of purple non-Maski things
- [ ] 10-20 empty background shots

**Total:** ~100-200 images (balanced between classes)

---

## 🔍 Testing Your New Model

After retraining, test with:

1. **Purple Maski** → Should detect ✅
2. **Red robot** → Should NOT detect ✅
3. **Blue robot** → Should NOT detect ✅
4. **Yourself** → Should NOT detect ✅
5. **Purple book** → Should NOT detect ✅
6. **Empty table** → Should NOT detect ✅

---

## 💡 Pro Tips

### Make Data Collection Easy

1. **Use Teachable Machine's webcam:**
   - Click "Webcam" under each class
   - Hold up object and click "Hold to Record"
   - Gets 20-30 images in seconds

2. **Batch collect from your phone:**
   - Take a 10-second video of the object
   - Extract frames using VLC or online tool
   - Upload all frames at once

3. **Download robot images:**
   - Google "toy robot red" / "toy robot blue" etc.
   - Download 5-10 images of various robots
   - Add to "Not Maski" class

### Common Mistakes to Avoid

❌ **Mistake:** Only training "Not Maski" with backgrounds/people
✅ **Fix:** Include other robots! This is #1 cause of false positives

❌ **Mistake:** Using same background for all Maski images
✅ **Fix:** Vary backgrounds (table, floor, hand, etc.)

❌ **Mistake:** Only close-up shots of Maski
✅ **Fix:** Include far-away shots too (people spot Maski from distance)

❌ **Mistake:** Perfect lighting only
✅ **Fix:** Include dim lighting, shadows, bright spots

❌ **Mistake:** Unbalanced classes (100 Maski, 10 Not Maski)
✅ **Fix:** Keep classes roughly equal (50/50 or 60/40 max)

---

## 🚀 Alternative: Quick Fix Without Full Retrain

If you want a temporary fix while preparing better data:

1. **Go back to Teachable Machine**
2. **Load your existing project** (if you saved it)
3. **Add 20-30 images of other robots to "Class 2"**
4. **Retrain (takes 5 minutes)**
5. **Export and replace**

This quick update can dramatically improve accuracy!

---

## 📊 Expected Results After Retraining

**Before (current):**
- Purple Maski: 100% ✅
- Red robot: 90% ❌ (false positive)
- Blue robot: 85% ❌ (false positive)
- You: 15% ✅

**After (with good data):**
- Purple Maski: 95-99% ✅
- Red robot: 5-15% ✅
- Blue robot: 5-15% ✅
- You: 5-10% ✅

---

## 📝 Summary

The key insight: **Your model needs to see what Maski is NOT.**

Right now it thinks:
- "Robot shape = Maski"

After retraining it will think:
- "Purple robot with THIS specific design = Maski"
- "Red robot = Not Maski"
- "Blue robot = Not Maski"
- "Person = Not Maski"

**The magic is in the negative examples!**

---

## 🎬 Quick Start (30 Minutes)

1. Open Teachable Machine (5 min)
2. Collect 50 Maski images with webcam (10 min)
3. Collect 50 Not-Maski images (webcam + Google Images of other robots) (10 min)
4. Train model (3-5 min)
5. Test & export (2 min)
6. Replace files & restart (3 min)

**Total: ~30 minutes for a much better model!**

---

Good luck with retraining! Once you have other robots in your negative class, the false positives should disappear. 🎯
