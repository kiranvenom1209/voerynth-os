# Wake Word Detection Debugging Guide (Internal)

> **Audience:** Vœrynth Système investors and collaborators validating the Android wake word experience. Keep these notes confidential; they are intended for demo readiness and engineering follow-through.

## 🔍 Step-by-Step Troubleshooting

### **Step 1: Verify the Build (APK-ready)**

Did you rebuild and sync the Android app after making the changes?

```bash
# Run these commands:
npm run build
npx cap sync android
npx cap open android
```

Then in Android Studio:
- Build > Clean Project
- Build > Rebuild Project
- Run the app on your device

---

### **Step 2: Check Android Logcat (Investor Demo Hygiene)**

Open Android Studio Logcat and filter by `WakeWordPlugin` to see what's happening:

**Expected logs when wake word is enabled:**
```
D/WakeWordPlugin: ✅ Porcupine initialized successfully
D/WakeWordPlugin: 🎙️ Wake word detection started - listening for 'Hey Ammu'
```

**If you see errors:**
```
❌ Failed to initialize Porcupine: [error message]
```

Common errors and solutions:

1. **"Model file not found"** or **"Asset not found"**
   - The `Hey-Ammu_en_android_v4_0_0.ppn` file is missing from `android/app/src/main/assets/`
   - Solution: Copy the .ppn file to the assets folder

2. **"Invalid access key"** or **"Authentication failed"**
   - The Picovoice access key is invalid or expired
   - Solution: Verify the access key in WakeWordPlugin.java line 26

3. **"PorcupineException"**
   - Porcupine SDK not downloaded or ProGuard stripped it
   - Solution: Sync Gradle and add ProGuard rules

---

### **Step 3: Check Microphone Permission**

The app needs RECORD_AUDIO permission:

1. Go to Android Settings > Apps > VŒRYNTH OS > Permissions
2. Verify **Microphone** permission is **Allowed**
3. If not, grant it manually

---

### **Step 4: Verify Wake Word is Enabled in App**

1. Open the app
2. Go to **Advanced Settings**
3. Enable **Wake Word Detection** toggle
4. You should see: "Listening for 'Hey Ammu'..." with a green pulsing dot

---

### **Step 5: Check Browser Console (if testing in browser)**

If you're testing in a browser (not on Android device):

Open browser console (F12) and you should see:
```
⚠️ Wake word detection only works on Android
```

**Wake word detection ONLY works on Android devices, not in browser!**

---

### **Step 6: Verify Asset File Exists**

Check that the wake word model file is in the correct location:

**File path:** `android/app/src/main/assets/Hey-Ammu_en_android_v4_0_0.ppn`

**Verify in Android Studio:**
1. Open Android Studio
2. Navigate to: `app > src > main > assets`
3. You should see: `Hey-Ammu_en_android_v4_0_0.ppn`

**Verify in APK:**
1. Build > Build Bundle(s) / APK(s) > Build APK(s)
2. Build > Analyze APK
3. Navigate to `assets/` folder
4. Confirm `Hey-Ammu_en_android_v4_0_0.ppn` is present

---

### **Step 7: Test Porcupine Initialization**

Add this test code to verify Porcupine is working:

In Android Studio, open Logcat and filter by "Porcupine" or "WakeWord"

When you enable wake word detection, you should see:
```
D/WakeWordPlugin: ✅ Porcupine initialized successfully
D/WakeWordPlugin: 🎙️ Wake word detection started - listening for 'Hey Ammu'
```

When you say "Hey Ammu":
```
D/WakeWordPlugin: 🎙️ Hey Ammu detected!
```

---

### **Step 8: Check Home Assistant Connection**

The wake word detection requires an active Home Assistant connection:

1. Verify you're connected to Home Assistant (check connection status in app)
2. The entity `assist_satellite.home_assistant_voice_09af65_assist_satellite` must exist
3. Check Home Assistant logs for any errors when the service is called

---

### **Step 9: Verify ProGuard Rules (Release Build Only)**

If testing a **release build**, ensure ProGuard rules are added:

**File:** `android/app/proguard-rules.pro`

Should contain:
```proguard
# Porcupine Wake Word Detection
-keep class ai.picovoice.porcupine.** { *; }
-dontwarn ai.picovoice.porcupine.**
-keepclasseswithmembernames class * {
    native <methods>;
}
-keep class ai.picovoice.porcupine.PorcupineManager { *; }
-keep class ai.picovoice.porcupine.PorcupineManagerCallback { *; }
-keep class ai.picovoice.porcupine.PorcupineException { *; }
```

---

## 🐛 Common Issues and Solutions (Luxury-Grade Stability Checklist)

### Issue 1: "Nothing happens when I say 'Hey Ammu'"

**Checklist:**
- [ ] App is running on Android device (not browser)
- [ ] Wake word detection is enabled in Advanced Settings
- [ ] Microphone permission is granted
- [ ] Logcat shows "Porcupine initialized successfully"
- [ ] Logcat shows "Wake word detection started"
- [ ] Speaking clearly and loudly enough
- [ ] No background noise interfering

### Issue 2: "Wake word detection toggle doesn't work"

**Check:**
- [ ] Connected to Home Assistant
- [ ] Logcat for initialization errors
- [ ] Porcupine dependency downloaded (check Gradle sync)

### Issue 3: "App crashes when enabling wake word"

**Check:**
- [ ] Logcat for crash stack trace
- [ ] ProGuard rules added (if release build)
- [ ] Porcupine SDK version compatibility

---

## 📱 Quick Test Procedure

1. **Build and install** the app on Android device
2. **Open Logcat** in Android Studio
3. **Launch the app** on device
4. **Go to Advanced Settings**
5. **Enable Wake Word Detection**
6. **Watch Logcat** for initialization messages
7. **Say "Hey Ammu"** clearly
8. **Check Logcat** for detection message

---

## 🔧 Manual Test Commands

You can test the plugin directly from browser console (when running on Android):

```javascript
// Test initialization
WakeWord.initialize().then(r => console.log('Init:', r)).catch(e => console.error('Error:', e));

// Test start
WakeWord.start().then(r => console.log('Started:', r)).catch(e => console.error('Error:', e));

// Check if listening
WakeWord.isListening().then(r => console.log('Listening:', r)).catch(e => console.error('Error:', e));
```

---

## 📞 Next Steps (If You Need Help Before a Demo)

If wake word still doesn't work after following all steps:

1. **Share Logcat output** - Filter by "WakeWord" and "Porcupine"
2. **Verify file exists** - Screenshot of assets folder in Android Studio
3. **Check permissions** - Screenshot of app permissions in Android settings
4. **Test microphone** - Verify microphone works in other apps

> **Confidential:** Internal-only debugging trail for Vœrynth Système. Use it to keep investor and client demos flawless; do not share externally.

