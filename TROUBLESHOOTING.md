# Troubleshooting: Devices & Entities View

## Issue: "Not connected to Home Assistant" Error

### What to Check:

1. **Click the "Debug" button** in the Devices & Entities view
2. Look at the debug panel values:

```
Subscription Active: ❌ No / ✅ Yes
Entity States: 0 / >0
Areas: 0 / >0
Devices: 0 / >0
Entity Registry: 0 / >0
Loading: ⏳ Yes / ✅ No
```

### Common Issues & Fixes:

#### 1. "Not connected to Home Assistant"
**Symptom**: Error banner shows "Not connected to Home Assistant"

**Cause**: The store is trying to initialize before HA connection is established

**Fix**: 
- Make sure you're connected to Home Assistant first (check main dashboard)
- The store should auto-initialize when connection is established
- Check browser console for connection errors

#### 2. Entity States = 0
**Symptom**: Debug shows "Entity States: 0"

**Cause**: States not being passed from HomeAssistantContext

**Fix**:
- Check if main dashboard shows entities (if yes, states are available)
- Open browser console and look for: `"📊 Initializing store with X states"`
- If you see this message, states are being passed correctly

#### 3. Registries = 0 (Areas/Devices/Entity Registry)
**Symptom**: Debug shows "Areas: 0", "Devices: 0", or "Entity Registry: 0"

**Cause**: WebSocket commands failing or HA doesn't have any devices/areas

**Fix**:
- Check browser console for errors like:
  - `"❌ Failed to initialize HA store"`
  - `"config/area_registry/list"` errors
- Verify you actually have devices/areas in Home Assistant
- Try clicking "Refresh" button

#### 4. Loading stuck at "⏳ Yes"
**Symptom**: Debug shows "Loading: ⏳ Yes" forever

**Cause**: Registry fetch is hanging or failing silently

**Fix**:
- Check browser console for errors
- Verify WebSocket connection is stable
- Try refreshing the page

### Browser Console Debugging

Open browser console (F12) and look for these messages:

**✅ Good (Working)**:
```
🔌 Setting up HAClient with existing connection
📊 Initializing store with 150 states
🔌 Initializing HA Store...
📋 Fetching registries...
✅ Registries loaded: { areas: 5, devices: 20, entities: 150 }
```

**❌ Bad (Not Working)**:
```
❌ Failed to initialize HA store: Not connected to Home Assistant
```

### Manual Test in Console

You can test the WebSocket commands manually in the browser console:

```javascript
// Get the HAConnection
const haConn = window.__haConnection;

// Test area registry
haConn.sendMessage({ type: 'config/area_registry/list' })
  .then(areas => console.log('Areas:', areas))
  .catch(err => console.error('Error:', err));

// Test device registry
haConn.sendMessage({ type: 'config/device_registry/list' })
  .then(devices => console.log('Devices:', devices))
  .catch(err => console.error('Error:', err));

// Test entity registry
haConn.sendMessage({ type: 'config/entity_registry/list' })
  .then(entities => console.log('Entities:', entities))
  .catch(err => console.error('Error:', err));
```

### Expected Behavior

When everything is working:

1. **On page load**:
   - HAClient gets the existing HAConnection
   - Store initializes with current states
   - Registries are fetched in parallel
   - Debug panel shows all counts > 0

2. **When viewing tabs**:
   - Devices tab shows all devices with areas
   - Entities tab shows all entities with current states
   - Areas tab shows all areas with device/entity counts

3. **When states change**:
   - Entity states update automatically (e.g., toggle a light)
   - No need to refresh

4. **When clicking Refresh**:
   - Registries are re-fetched
   - Counts update if devices/areas were added/removed

### Android Build Issues

#### 1. ProGuard Deprecation
**Symptom**: Build fails with `proguard-android.txt` not found.
**Fix**: Update `build.gradle` to use `proguard-android-optimize.txt`. Check `@capacitor-community/screen-brightness` and `@danyalwe/capacitor-sensors` specifically.

#### 2. Kotlin `entries` Opt-in Requirement
**Symptom**: `SensorType.entries` requires `@OptIn(ExperimentalStdlibApi::class)`.
**Fix**: Replace `.entries` with `.values()` in the plugin's `Utils.kt` to maintain compatibility without experimental flags.

### Home Assistant Registry Parsing

If you are seeing "0 devices" even with a connection:
1. **Response Format**: Ensure your parser handles the registry list correctly. Registry responses are **arrays of objects**, not single state objects.
2. **Missing Metadata**: If an entity has no `area_id`, check its `device_id` and then check the device registry for an inherited `area_id`. This is the standard HA "join" logic.

---

### Support
- **Discussions**: [GitHub Discussions](https://github.com/kiranvenom1209/voerynth-os/discussions)
- **Email**: [contact@voerynth.de](mailto:contact@voerynth.de)

