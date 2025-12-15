# Vœrynth OS

> **A luxury command-deck interface for Home Assistant — local-first, tablet-optimized, voice-enabled.**

Vœrynth OS is a React-based control deck UI and mobile application that connects to your existing Home Assistant instance, providing a premium, tablet-friendly alternative to the standard Home Assistant web interface. Think of it as your personal smart home command center with a luxury aesthetic designed for daily control and administrative workflows.

---

## 🎯 Vision

Vœrynth OS aims to deliver a **local-first, privacy-respecting** smart home control experience that doesn't depend on the Home Assistant web interface. It's built for users who want:

- **Premium UX**: Luxury "command-deck" aesthetic optimized for tablets and mobile devices
- **Full Control**: Complete access to entities, devices, areas, and services
- **Voice Integration**: Native Home Assistant Assist integration for voice commands
- **Privacy First**: Runs entirely on your local network with no telemetry
- **Performance**: Fast, responsive React UI with real-time WebSocket updates

---

## ✨ Key Features

### 🏠 **Smart Home Control**
- **Real-time Entity Management**: Browse, search, filter, and control all Home Assistant entities
- **Device & Area Registry**: Full device/entity registry views (similar to HA "Devices & Services")
- **Service Calls**: Execute any Home Assistant service with custom parameters
- **State History**: View entity history and state changes over time

### 📊 **Dashboard Views**
- **Room/Zone Decks**: Customizable room-based control panels
- **System Views**: Energy monitoring, server stats, security overview
- **Quick Actions**: Fast access to scenes, automations, and scripts
- **Responsive Design**: Optimized for tablets, phones, and desktop

### 🎤 **Voice & Automation**
- **HA Assist Integration**: Trigger Home Assistant Assist conversations
- **Wake Word Support**: Custom wake word detection (Android)
- **Automation Management**: View and control automations and scenes

### 🔐 **Security & Privacy**
- **Local Network Only**: All communication stays on your LAN
- **Token-Based Auth**: Secure long-lived access token authentication
- **No Telemetry**: Zero data collection or external tracking
- **Encrypted Storage**: Secure local storage for credentials

### 📱 **Multi-Platform**
- **Web App**: Vite-powered React SPA
- **Android App**: Capacitor-based native Android application
- **Electron Desktop**: Cross-platform desktop application (planned)

---

## 🏗️ Architecture

```
┌─────────────────┐
│  Vœrynth OS UI  │  (React + Vite + Tailwind CSS)
│   (This Repo)   │
└────────┬────────┘
         │
         ├─── WebSocket ───┐
         │                 │
         └──── REST API ───┤
                           │
                    ┌──────▼──────┐
                    │ Home        │
                    │ Assistant   │
                    │ Core        │
                    └──────┬──────┘
                           │
                    ┌──────▼──────────┐
                    │  Integrations   │
                    │  (Lights, etc)  │
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

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Home Assistant** instance running on your local network
- **Long-lived access token** from Home Assistant

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
Output: `dist/` folder (deploy to any static host)

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

## 🛣️ Roadmap

### ✅ Completed
- [x] Home Assistant WebSocket + REST integration
- [x] Entity browsing and control
- [x] Device & area management
- [x] Automations & scenes view
- [x] Android Capacitor build
- [x] Mobile-responsive UI
- [x] Voice assist integration

### 🚧 In Progress
- [ ] Energy dashboard
- [ ] Advanced entity history charts
- [ ] Custom dashboard builder
- [ ] Offline mode support

### 📋 Planned
- [ ] iOS Capacitor build
- [ ] Electron desktop app
- [ ] Multi-user support
- [ ] Theme customization
- [ ] Backup/restore configuration
- [ ] Integration discovery wizard

---

## 🤝 Contributing

Contributions are welcome! However, please note:

1. **Open an issue first** to discuss major changes
2. **Follow the existing code style** (ESLint + Prettier)
3. **Test thoroughly** on both web and mobile
4. **Update documentation** as needed

---

## 🔒 Security & Privacy

### Local-First Architecture
- **No Cloud Dependencies**: All data stays on your local network
- **Direct HA Connection**: WebSocket/REST communication directly to your HA instance
- **No Analytics**: Zero telemetry, tracking, or data collection
- **Secure Storage**: Credentials stored locally using browser/device secure storage

### Best Practices
- Use HTTPS for Home Assistant when possible
- Rotate long-lived access tokens periodically
- Run on a trusted local network
- Keep Home Assistant and Vœrynth OS updated

---

## ⚠️ Disclaimer

**Vœrynth OS is an independent project and is NOT affiliated with, endorsed by, or sponsored by the Home Assistant project.**

- Home Assistant® is a registered trademark of Nabu Casa, Inc.
- This project integrates with Home Assistant via its public APIs
- We respect Home Assistant's Apache 2.0 license and community guidelines
- For official Home Assistant support, visit [home-assistant.io](https://www.home-assistant.io/)

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

## 👨‍💻 Author

**Kiran Karthikeyan Achari**
Creator & Lead Developer of Vœrynth OS

- GitHub: [@kiranvenom1209](https://github.com/kiranvenom1209)
- Repository: [voerynth-os](https://github.com/kiranvenom1209/voerynth-os)

---

## 🙏 Acknowledgments

- **Home Assistant Community**: For building an incredible open-source smart home platform
- **React & Vite Teams**: For excellent developer tools
- **Capacitor Team**: For seamless native mobile integration
- **Open Source Contributors**: For the amazing libraries that make this possible

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

**Built with ❤️ for the smart home community**
