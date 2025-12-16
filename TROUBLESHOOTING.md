# Troubleshooting: Devices & Entities View (Private Investor Build)

> **Scope:** Internal guide for Vœrynth Système collaborators and investors validating the Devices & Entities experience. Keep this document confidential and pair it with the HA-style implementation notes for a full picture.

## Issue: "Not connected to Home Assistant" Error

### What to Check (Fast Triage):

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

### Common Issues & Fixes (Demo-Ready Outcomes):

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

### Browser Console Debugging (Preferred for Investor Demos)

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

### Manual Test in Console (If You Need to Validate Live)

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

### Expected Behavior (Gold-Standard Flow)

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

### Still Not Working? (Escalation Path)

If you've tried all the above and it's still not working:

1. **Check Home Assistant version**: Make sure you're running a recent version
2. **Check WebSocket API**: Verify the WebSocket API is enabled in HA
3. **Check browser console**: Look for any JavaScript errors
4. **Try a different browser**: Rule out browser-specific issues
5. **Check network**: Make sure there are no proxy/firewall issues

### Quick Fix: Force Refresh

If the data seems stale:

1. Click the **Refresh** button in the top right
2. This will re-fetch all registries
3. States should update automatically

### Development Mode (Verbose Logs)

If you're developing and want to see all the logs:

1. Open browser console (F12)
2. Look for messages starting with:
   - 🔌 (connection)
   - 📊 (states)
   - 📋 (registries)
   - ✅ (success)
   - ❌ (errors)

These emoji prefixes make it easy to filter and debug!

> **Confidential:** These remedies are for trusted Vœrynth Système collaborators preparing investor demos and internal rollouts. Please keep operational details within the approved circle.

