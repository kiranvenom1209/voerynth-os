package com.voerynth.os;

import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.Settings;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(WakeWordPlugin.class);
        super.onCreate(savedInstanceState);

        // Keep the screen on while this activity is running
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        
        // Request to ignore battery optimizations to keep app running in background
        requestIgnoreBatteryOptimizations();

        // Request permission to write system settings (needed for screen brightness)
        requestWriteSettingsPermission();
        
        // Enable Immersive Fullscreen Mode
        hideSystemUI();

        WebView webView = getBridge().getWebView();
        if (webView != null) {
            // Set background to black to prevent white flash before content loads
            webView.setBackgroundColor(Color.BLACK);
            
            // Ensure Hardware Acceleration is enabled for the WebView
            webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

            // Disable over-scroll glow effect for a smoother, more native feel
            webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
            
            // Hide scrollbars to reduce visual clutter and rendering overhead
            webView.setVerticalScrollBarEnabled(false);
            webView.setHorizontalScrollBarEnabled(false);
            
            // Optimize WebSettings for performance
            WebSettings settings = webView.getSettings();
            // Enable DOM storage (faster local data access)
            settings.setDomStorageEnabled(true);
            // Enable Database storage
            settings.setDatabaseEnabled(true);
            // Enable caching for better performance
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
            // Enable JavaScript optimizations
            settings.setJavaScriptEnabled(true);
            // Disable zoom controls for cleaner UI
            settings.setSupportZoom(false);
            settings.setBuiltInZoomControls(false);
            settings.setDisplayZoomControls(false);
            // Enable mixed content for local development
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            }
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemUI();
        }
    }

    private void hideSystemUI() {
        // Enables sticky immersive mode
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_FULLSCREEN);
    }

    private void requestIgnoreBatteryOptimizations() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            String packageName = getPackageName();
            if (pm != null && !pm.isIgnoringBatteryOptimizations(packageName)) {
                Intent intent = new Intent();
                intent.setAction(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                intent.setData(Uri.parse("package:" + packageName));
                startActivity(intent);
            }
        }
    }

    private void requestWriteSettingsPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!Settings.System.canWrite(this)) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_WRITE_SETTINGS);
                intent.setData(Uri.parse("package:" + getPackageName()));
                startActivity(intent);
            }
        }
    }
}
