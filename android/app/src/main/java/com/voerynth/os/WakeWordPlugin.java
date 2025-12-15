package com.voerynth.os;

import android.Manifest;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

import ai.picovoice.porcupine.PorcupineException;
import ai.picovoice.porcupine.PorcupineManager;
import ai.picovoice.porcupine.PorcupineManagerCallback;

@CapacitorPlugin(
    name = "WakeWord",
    permissions = {
        @Permission(alias = "microphone", strings = { Manifest.permission.RECORD_AUDIO })
    }
)
public class WakeWordPlugin extends Plugin {

    private static final String TAG = "WakeWordPlugin";
    private static final String ACCESS_KEY = "+xHKL/YiRbgZ9nCf9VUP2SytnhLnYPWcZO6HorGiLclRlfBbRnhdcA==";
    private static final String MODEL_FILE = "Hey-Ammu_en_android_v4_0_0.ppn";

    private PorcupineManager porcupineManager;
    private boolean isListening = false;

    @PluginMethod
    public void initialize(PluginCall call) {
        try {
            // Build Porcupine Manager with the "Hey Ammu" wake word model
            // The .ppn file must be in the assets folder (android/app/src/main/assets/)
            porcupineManager = new PorcupineManager.Builder()
                .setAccessKey(ACCESS_KEY)
                .setKeywordPath(MODEL_FILE)  // Path relative to assets folder
                .setSensitivity(0.5f)
                .build(getActivity(), new PorcupineManagerCallback() {
                    @Override
                    public void invoke(int keywordIndex) {
                        // Wake word "Hey Ammu" detected!
                        Log.d(TAG, "🎙️ Hey Ammu detected!");
                        notifyWakeWordDetected();
                    }
                });

            Log.d(TAG, "✅ Porcupine initialized successfully");

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("message", "Porcupine initialized successfully");
            call.resolve(ret);

        } catch (PorcupineException e) {
            Log.e(TAG, "❌ Failed to initialize Porcupine: " + e.getMessage());
            call.reject("Failed to initialize wake word detection: " + e.getMessage());
        }
    }

    @PluginMethod
    public void start(PluginCall call) {
        if (porcupineManager == null) {
            call.reject("Not initialized. Call initialize() first.");
            return;
        }

        try {
            porcupineManager.start();
            isListening = true;

            Log.d(TAG, "🎙️ Wake word detection started - listening for 'Hey Ammu'");

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("message", "Wake word detection started");
            call.resolve(ret);

        } catch (PorcupineException e) {
            Log.e(TAG, "❌ Failed to start wake word detection: " + e.getMessage());
            call.reject("Failed to start wake word detection: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (porcupineManager != null) {
            try {
                porcupineManager.stop();
                isListening = false;

                Log.d(TAG, "⏹️ Wake word detection stopped");

                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("message", "Wake word detection stopped");
                call.resolve(ret);

            } catch (PorcupineException e) {
                Log.e(TAG, "❌ Failed to stop wake word detection: " + e.getMessage());
                call.reject("Failed to stop wake word detection: " + e.getMessage());
            }
        } else {
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("message", "Already stopped");
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void isListening(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("isListening", isListening);
        call.resolve(ret);
    }

    private void notifyWakeWordDetected() {
        JSObject ret = new JSObject();
        ret.put("wakeWord", "Hey Ammu");
        ret.put("timestamp", System.currentTimeMillis());
        notifyListeners("ammuWakeDetected", ret);
    }

    @Override
    protected void handleOnDestroy() {
        if (porcupineManager != null) {
            porcupineManager.delete();
        }
    }
}
