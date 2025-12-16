# ✅ Home Assistant-Style Devices & Entities Implementation — Private Build Notes

> **Audience:** Trusted investors, collaborators, and Vœrynth Système contributors refining the Layer 5 interface. This document explains how we rebuilt the Devices & Entities surfaces to Home Assistant parity while honoring our luxury-grade reliability standards.

## 🎯 What Was Fixed (Executive Snapshot)

The prior approach attempted to read `area_id` from entity **states**—data that simply isn’t there—causing the infamous “0 devices” symptom. This rewrite mirrors Home Assistant’s own joins so the registry views stay accurate and worthy of investor demos.

### ❌ Previous Approach (WRONG)
- Used `get_states` + `state_changed` events
- Expected `area_id` to be in state objects (it's not!)
- Resulted in "0 devices" or missing area information
- Manual event bus wiring

### ✅ New Approach (CORRECT — HA-Style)
- Uses `subscribeEntities()` for live state updates
- Fetches 3 separate registries via WebSocket commands
- Proper join logic matching Home Assistant frontend
- Global Zustand store for state management

---

## 🏗️ Architecture (Investor-Grade Reliability)

### 1. Global State Store (`src/stores/haStore.js`)

**Purpose**: Single source of truth for all HA data

**Data Sources**:
```javascript
// Live entity states (auto-updating)
subscribeEntities(connection, callback)
→ statesByEntityId: { "light.bedroom": { state: "on", ... }, ... }

// Registries (fetched via WS commands)
config/area_registry/list → areas[]
config/device_registry/list → devices[]
config/entity_registry/list → entityRegistry[]
```

**Derived Maps** (for fast lookups):
```javascript
areasById[area.area_id] = area
devicesById[device.id] = device
entityRegByEntityId[entity_id] = registry_entry
```

### 2. Join Logic (Exactly Like HA)

#### **A) Devices Tab**
For each device:
```javascript
name = device.name_by_user || device.name || "Unnamed Device"
area = areasById[device.area_id]?.name || "Unassigned"
entitiesInDevice = entityRegistry.filter(e => e.device_id === device.id)
```

Shows: Name, Manufacturer, Model, Version, Area, Entity Count

#### **B) Entities Tab**
For each entity registry entry:
```javascript
entity_id = reg.entity_id
friendlyName = reg.name || statesByEntityId[entity_id]?.attributes?.friendly_name || entity_id
currentValue = statesByEntityId[entity_id]?.state ?? "unavailable"

// Area lookup (complex join)
if (reg.area_id) {
  area = areasById[reg.area_id]  // Direct assignment
} else if (reg.device_id) {
  device = devicesById[reg.device_id]
  area = areasById[device.area_id]  // Inherited from device
} else {
  area = "Unassigned"
}
```

Shows: Entity ID, Friendly Name, Current State, Platform, Area, Badges (disabled/hidden)

#### **C) Areas Tab**
For each area:
```javascript
devicesCount = devices.filter(d => d.area_id === area.area_id).length

entitiesCount = entityRegistry.filter(e => {
  // Direct assignment
  if (e.area_id === area.area_id) return true
  
  // Inherited from device
  if (e.device_id) {
    const device = devicesById[e.device_id]
    return device?.area_id === area.area_id
  }
  
  return false
}).length
```

Shows: Area Name, Aliases, Device Count, Entity Count

---

## 📋 WebSocket Commands Used

### Registries
```javascript
// Areas
{ "id": 1, "type": "config/area_registry/list" }

// Devices
{ "id": 2, "type": "config/device_registry/list" }

// Entity Registry
{ "id": 3, "type": "config/entity_registry/list" }
```

### Live States
```javascript
import { subscribeEntities } from 'home-assistant-js-websocket';

subscribeEntities(connection, (entities) => {
  // entities = { "light.bedroom": {...}, "sensor.temp": {...}, ... }
  // Auto-updates when states change
});
```

---

## 🔍 Debug Panel

The implementation includes a temporary debug panel (click "Debug" button) that shows:

✅ **Subscription Active**: Is `subscribeEntities` working?  
✅ **Entity States**: How many entities are being tracked?  
✅ **Areas**: Registry count  
✅ **Devices**: Registry count  
✅ **Entity Registry**: Registry count  
✅ **Loading State**: Is data still loading?  
✅ **Errors**: Any connection/fetch errors  

**Common Issues to Check**:
1. If "Entity States" = 0 → `subscribeEntities` not working
2. If "Devices" = 0 but you have devices → Registry fetch failed
3. If UI shows 0 but debug shows data → Join logic bug

---

## 🚀 Live Updates

### Automatic (No Refresh Needed)
- **Entity states** update automatically via `subscribeEntities`
- When you turn on a light, the state updates instantly

### Manual Refresh
- **Registries** change less often (when you add/remove devices)
- Click "Refresh" button to re-fetch registries
- Future enhancement: Subscribe to registry change events

---

## 📦 Dependencies Added

```bash
npm install zustand                    # State management
npm install home-assistant-js-websocket  # Official HA WebSocket library
```

---

## 🎨 UI Features

### Devices Tab
- Grid layout with device cards
- Shows manufacturer, model, version
- Area assignment (color-coded)
- Entity count per device
- Disabled badge for disabled devices

### Entities Tab
- List layout with entity rows
- Entity ID (monospace font)
- Current state (color-coded: cyan=active, red=unavailable)
- Platform badge
- Area assignment
- Disabled/Hidden badges

### Areas Tab
- Grid layout with area cards
- Area aliases
- Device count
- Entity count (includes inherited from devices)

---

## 🔑 Key Differences from Previous Implementation

| Aspect | ❌ Old (Wrong) | ✅ New (HA-Style) |
|--------|---------------|-------------------|
| **State Updates** | `get_states` + manual events | `subscribeEntities` (auto) |
| **Area Info** | Expected in state objects | Fetched from registries |
| **Device Info** | Missing/incomplete | Full device registry |
| **Join Logic** | None (caused "0" bug) | Proper HA-style joins |
| **State Management** | Local component state | Global Zustand store |
| **Refresh** | Manual re-fetch everything | Smart: states auto, registries manual |

---

## ✅ Testing Checklist

1. **Open Settings → Devices & Entities**
2. **Click "Debug" button** - verify all counts > 0
3. **Devices Tab** - should show all devices with correct areas
4. **Entities Tab** - should show all entities with current states
5. **Areas Tab** - should show correct device/entity counts
6. **Search** - filter works across all tabs
7. **Refresh** - re-fetches registries without losing state subscription
8. **Live Updates** - toggle a light in HA, see state update instantly

---

## 🎯 Result

You now have a **production-ready Devices & Entities view** that:
- ✅ Matches Home Assistant's official frontend behavior
- ✅ Uses the correct HA WebSocket API approach
- ✅ Shows accurate device/entity/area information
- ✅ Updates in real-time
- ✅ Includes debug tools for troubleshooting

No more "0 devices" bug! 🎉

> **Confidential:** This HA-style blueprint is shared solely for Vœrynth Système investor/contributor validation. Keep the details within the trusted circle while we perfect the luxury-grade interface.

