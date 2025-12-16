# Vœrynth OS — Private Investor & Contributor Edition

> **The Neural Interface of Vœrynth Système — a couture command deck for estates and superyachts. Local-first. Voice-ready. Zero-cloud by default.**

Vœrynth OS is the **Layer 5 interface** of **Vœrynth Système**, our luxury automation startup founded by **Danny Sneham (Founder)** and **Kiran Karthikeyan Achari (Co-Founder)**. This repository is private and shared only with investors, trusted collaborators, and approved contributors for evaluation and build-out. The product vision is not "more dashboards" — it's **less friction**: environments that manage themselves quietly, with interfaces reserved for confirmation, exceptions, and deliberate control.

---

## Why Vœrynth OS exists

Luxury automation usually breaks on the same rocks:
- **Cloud dependence** — when the internet fails, so does your home
- **Latency** — waiting for the cloud to respond to local actions
- **Brittle integrations** — vendor lock-in and fragile connections
- **Privacy compromises** — your data leaving your property
- **Marine unreliability** — at sea, the cloud is a *fair-weather friend*

Vœrynth Système is designed around a harsh promise: **the property must remain elegant and functional even when the internet is irrelevant.** Vœrynth OS is the visible surface of that promise.

---

## The Vœrynth principle

**Iceberg rule:** 90% invisible engineering, 10% interface.

Vœrynth OS is the 10%.

The home/yacht should act quietly when confidence is high and ask only when uncertainty is high. The UI is not the brain — it's the **command deck**.

---

## About Vœrynth OS

Vœrynth OS is the **neural bridge** between curated environments and the people who inhabit them. Built for **Vœrynth Système** — our private, invite-only luxury automation startup led by **Danny Sneham (Founder)** and **Kiran Karthikeyan Achari (Co-Founder)** — this app packages the calm precision of a bridge crew into a tactile, local-first command surface. Every screen is designed for decisive action, minimal ceremony, and confidence in low-connectivity conditions common to bluewater voyages and remote estates.

**Signature tags:** `#LuxuryAutomation` · `#YachtReady` · `#EstateGrade` · `#LocalFirst` · `#VoiceReady` · `#HomeAssistantLayer` · `#AndroidAPKReady` · `#ElectronEXEReady`

Use this repository as your **internal dossier**: it's prepped for investor demos, contributor onboarding, and compilation of Android APKs and Windows executables without extra wiring.

---

## What this repo is (and is not)

### ✅ This repo *is*
- The **Neural Interface App (Layer 5)**: a command-deck UI for owners/staff to view system state, execute controls, and review "what happened" (audit/trace views when provided by backend)
- A **local network** application (LAN-first, no default telemetry)
- A fast, tablet-optimized UX designed for **exception workflows** and operational clarity

### ❌ This repo is *not*
- The decision engine ("brain") — that belongs to **Vœrynth Core (Layer 4)**
- A safety-critical marine controller
- A replacement for Home Assistant (HA is Layer 3 — the state/integration engine)

---

## Safety boundaries (non-negotiable)

Vœrynth Système does **not** override certified safety-critical marine systems (autopilot, propulsion control, certified alarms). Vœrynth operates as a **comfort + orchestration + monitoring layer**, with explicit boundaries and fail-safe defaults.

---

## Core capabilities (interface-level)

### 🎛️ **Control & Visibility**
- **Real-time state via WebSocket**: LAN-fast feel, no cloud latency
- **Registry-style browsing**: Areas, devices, entities (like HA but faster)
- **Service calls with parameters**: Permission-bounded control execution
- **State history**: View entity changes and understand system behavior

### 🧭 **Deck UX (Operational)**
- **Room/zone control decks**: Staff panels and owner views
- **Exception-first flows**: "Check, confirm, act" — not micromanagement
- **"What happened and why?" surfaces**: Trace/audit data where backend provides it
- **Responsive design**: Optimized for tablets, phones, and wall-mounted displays

### 🎤 **Voice-Ready Surfaces**
- **App hooks to trigger Assist**: Voice workflow integration
- **Wake word support**: Custom wake word detection (Android)
- **Backend persona logic**: Out-of-scope for this repo (lives in Vœrynth Core)

### 🔐 **Security & Privacy**
- **Local network only**: All communication stays on your LAN
- **Token-based auth**: Secure long-lived access token authentication
- **No telemetry**: Zero data collection or external tracking by default
- **Encrypted storage**: Secure local storage for credentials

### 📱 **Multi-Platform**
- **Web App**: Vite-powered React SPA
- **Android App**: Capacitor-based native Android application
- **Electron Desktop**: Cross-platform desktop application (planned)

---

## 🏗️ Architecture (how it fits)

```
Layer 1 — Hard Metal:     Physical connectivity (KNX/DALI, marine CAN/NMEA, etc.)
Layer 2 — Translation:    Signal K + middleware → normalized streams (MQTT/JSON)
Layer 3 — State Engine:   Home Assistant Core = integrations + state registry
Layer 4 — Vœrynth Core:   Local reasoning + constraint logic + auditability
Layer 5 — Vœrynth OS:     Neural Interface App (this repo)
```

**Home Assistant is treated as the integration/state layer, not the decision-maker.**
Decisions and confidence logic belong upstream in **Vœrynth Core**.

### Communication Flow

```
┌─────────────────┐
│  Vœrynth OS UI  │  (React + Vite + Tailwind CSS)
│   Layer 5       │
└────────┬────────┘
         │
         ├─── WebSocket ───┐  (Real-time state updates)
         │                 │
         └──── REST API ───┤  (Service calls, history)
                           │
                    ┌──────▼──────┐
                    │ Home        │
                    │ Assistant   │  (Layer 3: State registry)
                    │ Core        │
                    └──────┬──────┘
                           │
                    ┌──────▼──────────┐
                    │  Vœrynth Core   │  (Layer 4: Reasoning)
                    │  + Integrations │
                    └──────┬──────────┘
                           │
                    ┌──────▼──────────┐
                    │  Physical       │  (Layers 1-2: Hardware)
                    │  Systems        │
                    └─────────────────┘
```

**Tech Stack:**
- **Frontend**: React 18, Vite 7, Tailwind CSS 4
- **State Management**: Zustand
- **HA Communication**: WebSocket API + REST API
- **Icons**: Lucide React + Custom Brand Icons
- **Mobile**: Capacitor 7 (Android)
- **Desktop**: Electron (optional)

---

## 🚀 Getting Started (dev)

> **Private access notice:** This repository is private and governed by the Vœrynth OS Proprietary License. Content is shared solely for internal evaluation by investors, approved collaborators, and contracted contributors.

### Prerequisites

- **Node.js** 18+ and npm
- **Home Assistant** instance reachable on your local network
- **Long-lived access token** for local API auth

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kiranvenom1209/voerynth-os.git
   cd voerynth-os
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Home Assistant connection**

   On first launch, you'll be prompted to enter:
   - Home Assistant URL (e.g., `http://192.168.1.100:8123`)
   - Long-lived access token (create one in HA: Profile → Security → Long-Lived Access Tokens)

4. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

**Web App:**
```bash
npm run build
```
Output: `dist/` folder (deploy to any static host or local server)

**Android App:**
```bash
npm run build
npx cap sync android
npx cap open android
```
Then build APK in Android Studio.

**Electron Desktop:**
```bash
npm run electron:build
```

**Installables (.apk & .exe are ready to compile):**
- The `android/` (Capacitor) and `electron/` (desktop shell) projects are already scaffolded and synced to the web app build; no extra wiring is needed before compiling.
- **Create an Android APK (release):**
  1. Run `npm run build` to emit `dist/` for native bundling.
  2. Run `npx cap sync android` to copy the web bundle and native plugins.
  3. Open Android Studio via `npx cap open android`, select **Build > Generate Signed Bundle / APK**, and follow the wizard.
  4. The generated `.apk` will appear under `android/app/build/outputs/apk/`.
- **Create a Windows .exe (Electron):**
  1. From a Windows environment (or a cross-compiling setup with the required SDKs), run `npm install` and `npm run electron:build`.
  2. Electron Builder will produce a `.exe` installer/portable build under `electron/dist/` (path may vary by platform target).
  3. If targeting macOS/Linux, the same command produces `.dmg`/`.AppImage` equivalents.

---

## 📁 Project Structure

```
voerynth-os/
├── src/
│   ├── App.jsx                 # Root React shell, routes, and layout scaffolding
│   ├── assets/                 # Brand assets, icons, and shared images
│   ├── components/             # Reusable UI components (cards, modals, controls)
│   ├── context/                # Global providers (Home Assistant connection, accent color)
│   ├── hooks/                  # Custom hooks for HA data, theme state, etc.
│   ├── plugins/                # Platform-specific hooks (e.g., wake-word bridge)
│   ├── services/               # Home Assistant WebSocket/REST clients and flow helpers
│   ├── stores/                 # Zustand stores for stateful HA data
│   ├── utils/                  # Cross-cutting utilities (formatters, helpers)
│   └── views/                  # Feature screens (dashboard, settings, media, etc.)
├── android/                    # Capacitor Android project
├── electron/                   # Electron main process scaffold
├── public/                     # Static assets served at root
├── capacitor.config.json       # Capacitor configuration for native builds
├── tailwind.config.js          # Tailwind CSS theme and purge settings
├── vite.config.js              # Vite build configuration
├── SETTINGS_MODULE_README.md   # Deep dive into the Home Assistant settings UI
└── package.json                # Dependencies and npm scripts
```

### Key files and what they do

- `index.html` — Vite entry HTML that mounts the React application.
- `src/main.jsx` — Bootstraps React, loads global styles, and renders `<App />` into the root element.
- `src/App.jsx` — Orchestrates high-level layout, navigation, and feature view routing.
- `src/plugins/WakeWord.js` — Capacitor bridge that connects the custom wake-word engine to the web layer.
- `src/services/haClient.js` — Unified Home Assistant client that wraps WebSocket and REST calls with reconnect handling.
- `src/services/flowEngine/index.js` — Config-flow runner that sequences Home Assistant integration steps.
- `src/components/settings/FormRenderer.jsx` — Dynamic form builder that renders Home Assistant schemas.
- `src/components/settings/IntegrationFlowModal.jsx` — UI wrapper for starting and progressing integration flows.
- `src/components/settings/DevicePairingModal.jsx` — Pairing workflow for Matter, Zigbee (ZHA), and ESPHome devices.
- `src/views/SettingsView.jsx` — Main settings hub that links into integration and device/entity management.
- `src/views/IntegrationsView.jsx` — Integration catalog and management surface backed by the config flow engine.
- `src/views/DevicesEntitiesView.jsx` — HA-style registry browser for devices, entities, and areas with live updates.
- `src/views/settings/*` — Detailed settings sub-pages (areas, automations, add-ons, system, people, etc.).

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file (optional, for advanced config):

```env
VITE_HA_URL=http://192.168.1.100:8123
VITE_HA_TOKEN=your_long_lived_token_here
```

### Capacitor Configuration

Edit `capacitor.config.json` for Android/iOS settings:
- App ID: `com.voerynth.os`
- App Name: `Voerynth OS`
- Web Directory: `dist`

---

## 🛣️ Roadmap (honest, not hype)

### ✅ Completed
- [x] Home Assistant WebSocket + REST integration
- [x] Real-time entity state updates (LAN-fast)
- [x] Device & area registry browsing
- [x] Automations & scenes view
- [x] Android Capacitor build
- [x] Mobile-responsive UI (tablet-optimized)
- [x] Voice assist integration hooks

### 🚧 In Progress
- [ ] Make device/area/entity management feel as clean as HA, but faster for daily use
- [ ] Strengthen staff workflows (minimal, explicit controls)
- [ ] Add robust reasoning/audit UX (confidence, cause, revert path)
- [ ] Degraded/offline UI states (last-known snapshot + clear health indicators)

### 📋 Planned
- [ ] iOS Capacitor build
- [ ] Electron desktop app (for wall-mounted displays)
- [ ] Multi-user/role support (owner vs. staff vs. guest)
- [ ] Theme customization (estate/yacht branding)
- [ ] Backup/restore configuration
- [ ] Integration discovery wizard

---

## 🤝 Contributing

Contributions are welcome! However, please note:

1. **Open an issue first** to discuss major changes (especially architectural ones)
2. **Follow the existing code style** (ESLint + Prettier)
3. **Test thoroughly** on both web and mobile
4. **Update documentation** as needed
5. **Respect the Vœrynth principle**: less friction, not more features

---

## 🔒 Security & Privacy

### Local-First Architecture
- **No cloud dependencies**: All data stays on your local network
- **Direct HA connection**: WebSocket/REST communication directly to your HA instance
- **No analytics**: Zero telemetry, tracking, or data collection by default
- **Secure storage**: Credentials stored locally using browser/device secure storage

### Best Practices
- Use HTTPS for Home Assistant when possible (especially on marine networks)
- Rotate long-lived access tokens periodically
- Run on a trusted, isolated local network (VLAN recommended for estates/yachts)
- Keep Home Assistant and Vœrynth OS updated
- **Never expose HA to the public internet** — use VPN for remote access

---

## ⚠️ Disclaimer

**Vœrynth OS is an independent project and is NOT affiliated with, endorsed by, or sponsored by the Home Assistant project or Nabu Casa.**

- Home Assistant® is a registered trademark of Nabu Casa, Inc.
- This project integrates with Home Assistant via its public APIs (Layer 3)
- We respect Home Assistant's Apache 2.0 license and community guidelines
- For official Home Assistant support, visit [home-assistant.io](https://www.home-assistant.io/)

**Marine/Safety Disclaimer:**
- Vœrynth Système is **not** a safety-critical marine controller
- Do not use for autopilot, propulsion control, or certified alarm systems
- Always maintain certified, independent safety systems
- Use at your own risk — see LICENSE for warranty disclaimer

---

## 📜 License & Confidentiality

**Copyright © 2024-2025 Vœrynth Système. All Rights Reserved.**

This repository is provided under the **Vœrynth OS Proprietary License** (see [LICENSE](LICENSE)).

- **Audience:** Private access for investors, trusted collaborators, and approved contributors under NDA or written agreement.
- **Permitted use:** Review, build (.apk / .exe), and run for internal evaluation, private demonstrations, or contribution back to Vœrynth Système.
- **Prohibited use:** No redistribution, public hosting, app-store submission, resale, or derivative branding without explicit written permission.
- **Confidentiality:** Treat all materials as confidential and share only with parties expressly authorized by Vœrynth Système.

### Intellectual Property & Trademarks
- **"Vœrynth," "Vœrynth OS," and "Vœrynth Système"** along with associated branding, logos, and design language remain the exclusive intellectual property of Vœrynth Système.
- No rights to use the names, marks, or visual identity are granted beyond referencing the software as provided.

### Third-Party Licenses
Third-party dependencies remain under their respective open-source licenses; see `package.json` for attributions.

---

## 👨‍💻 Founders & Story

Vœrynth Système is being built as a **bespoke automation house**—software tailored for estates, private villas, and superyachts that expect silent intelligence, impeccable uptime, and couture-grade presentation.

- **Danny Sneham — Founder**: Vision, partnerships, and operations for luxury deployments.
- **Kiran Karthikeyan Achari — Co-Founder & Lead Systems Architect**: Product architecture, neural interface design, and platform stewardship.

- GitHub: [@kiranvenom1209](https://github.com/kiranvenom1209)
- Repository: [voerynth-os](https://github.com/kiranvenom1209/voerynth-os)

---

## 🙏 Acknowledgments

- **Home Assistant Community**: For building an incredible open-source automation platform (Layer 3)
- **Signal K Project**: For marine data standardization
- **React & Vite Teams**: For excellent developer tools
- **Capacitor Team**: For seamless native mobile integration
- **Open Source Contributors**: For the libraries that make local-first possible

---

## 📞 Support

### Getting Help
- **Issues**: [GitHub Issues](https://github.com/kiranvenom1209/voerynth-os/issues)
- **Discussions**: [GitHub Discussions](https://github.com/kiranvenom1209/voerynth-os/discussions)
- **Documentation**: See `/docs` folder and inline code comments

### Reporting Bugs
Please include:
- Vœrynth OS version
- Home Assistant version
- Platform (Web/Android/Desktop)
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/logs if applicable

---

## 🌟 Star History

If you find Vœrynth OS useful, please consider giving it a ⭐ on GitHub!

---

**Built for estates and superyachts that demand intelligence without compromise.**
