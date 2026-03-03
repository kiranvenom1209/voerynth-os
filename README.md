# Vœrynth OS

> **The Neural Interface of Vœrynth Système — a local-first command deck for estates and superyachts. Real-time. Voice-ready. Zero-cloud by default.**

Vœrynth OS is the **Layer 5 interface** of **Vœrynth Système**: a premium control deck (web + mobile) built to operate on a private local network and connect into a local automation backbone (Home Assistant at the state/integration layer). The goal is not "more dashboards" — it's **less friction**: the environment should feel intelligently managed, and the interface should exist mainly for confirmation, exceptions, and deliberate control.

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

### 🛰️ **Tactical Visualization (New)**
- **Tactical Map Overhaul**: High-contrast, satellite-style map with blue-tint tactical overlays, grid systems, and scanline effects for a "Neural Interface" aesthetic.
- **Dynamic Zone Rendering**: Automatically visualizes all Home Assistant `zone.*` entities with distinct tactical colors (Emerald, Amber, Cyan, etc.) and dash patterns.
- **Interaction Lock System**: Advanced "Tactical Lock" that prevents accidental map manipulation. Toggleable "Manual Override" moves the map to Layer 60 for absolute interaction reliability.
- **Improved Residents Logic**: Smart "Traveling" labels for away states and conditional "Home Server" logic (hides server when you are home; renames it to "Home" when away).

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
- **Maps**: Leaflet + Custom Tactical HUD filter stack
- **Icons**: Lucide React + Custom Brand Icons
- **Mobile**: Capacitor 7 (Android)
- **Desktop**: Electron (Production Ready)

---

## 🚀 Getting Started (dev)

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

   Open [https://os.voerynth.de](https://os.voerynth.de) in your browser.

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

---

## 📁 Project Structure

```
voerynth-os/
├── src/
│   ├── components/        # Reusable UI components
│   ├── views/            # Main view components (Dashboard, Settings, etc.)
│   ├── context/          # React contexts (HA connection, accent color)
│   ├── stores/           # Zustand state stores
│   ├── services/         # HA API clients, WebSocket handlers
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   └── assets/           # Icons, images, brand assets
├── android/              # Capacitor Android project
├── electron/             # Electron main process
├── public/               # Static assets
├── capacitor.config.json # Capacitor configuration
├── vite.config.js        # Vite build configuration
└── package.json          # Dependencies and scripts
```

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
- [x] Android Capacitor build (Success on v7.4.4)
- [x] Tactical Map Overlay (Grid, Scanlines, Vignette)
- [x] Multi-Zone Visualization with dynamic coloring
- [x] "Tactical Lock" interaction management
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
- [x] Theme customization (estate/yacht branding)
- [x] Multi-platform sync (Web, Android, Desktop)
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
- For Vœrynth OS support and legal, visit [voerynth.de](https://voerynth.de)

**Marine/Safety Disclaimer:**
- Vœrynth Système is **not** a safety-critical marine controller
- Do not use for autopilot, propulsion control, or certified alarm systems
- Always maintain certified, independent safety systems
- Use at your own risk — see LICENSE for warranty disclaimer

---

## 📜 License

**Copyright © 2024-2025 Kiran Karthikeyan Achari. All Rights Reserved.**

### Code License
The source code of this project is licensed under the **Apache License 2.0** (see [LICENSE](LICENSE) file).

You may use, modify, and distribute the code under the terms of the Apache 2.0 license, which includes:
- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Patent use
- ✅ Private use

**Requirements:**
- Include the original copyright notice
- Include the Apache 2.0 license text
- State significant changes made to the code
- Include a NOTICE file if distributing (if applicable)

### Intellectual Property & Trademarks
- **"Vœrynth OS"**, **"Vœrynth"**, and associated branding, logos, and design elements are the **exclusive intellectual property** of **Kiran Karthikeyan Achari**.
- The Apache 2.0 license **does NOT grant permission** to use the trade names, trademarks, service marks, or product names of Vœrynth OS, except as required for describing the origin of the work.
- Any derivative works or forks **must rebrand** and may not use the "Vœrynth" name or associated branding without explicit written permission.

### Third-Party Licenses
This project may include or depend on third-party open-source software. See individual package licenses in `node_modules/` or `package.json` for details.

---

## 👨‍💻 Founders

**Kiran Karthikeyan Achari** — Lead Systems Architect
**Danny Sneham** — Operations & Infrastructure

- GitHub: [@kiranvenom1209](https://github.com/kiranvenom1209)
- Website: [voerynth.de](https://voerynth.de)
- Live OS: [os.voerynth.de](https://os.voerynth.de)
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
- **Email**: [contact@voerynth.de](mailto:contact@voerynth.de)
- **Discussions**: [GitHub Discussions](https://github.com/kiranvenom1209/voerynth-os/discussions)
- **Documentation**: See `/docs` folder and [voerynth.de](https://voerynth.de)

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
