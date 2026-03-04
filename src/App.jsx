import { useState, useEffect, useRef } from 'react';
import { Menu, X, ChevronRight, RefreshCw, Check } from 'lucide-react';
import WelcomeScreen from './components/WelcomeScreen';
import TermsScreen from './components/TermsScreen';
import SetupWalkthrough from './components/SetupWalkthrough';
import LoginScreen from './components/LoginScreen';
import ScreenSaver from './components/ScreenSaver';
import ConfigModal from './components/ConfigModal';
import ColorPickerModal from './components/ColorPickerModal';
import CardEditorModal from './components/CardEditorModal';
import Sidebar from './components/Sidebar';
import CompanyLogo from './components/CompanyLogo';
import DashboardView from './views/DashboardView';
import LightsView from './views/LightsView';
import MediaView from './views/MediaView';
import SecurityView from './views/SecurityView';
import EnergyView from './views/EnergyView';
import UpdatesView from './views/UpdatesView';
import NetworkView from './views/NetworkView';
import AdvancedSettingsView from './views/AdvancedSettingsView';
import SettingsView from './views/SettingsView';
import { AccentColorProvider, useAccentColor } from './context/AccentColorContext';
import { HomeAssistantProvider, useHomeAssistant } from './context/HomeAssistantContext';
import * as storage from './utils/storage';
import WakeWordService from './services/WakeWordService';
import MobileInstallPrompt from './components/MobileInstallPrompt';

// Lightweight clock component so only this small piece re-renders every second
const HeaderClock = () => {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-[10px] text-slate-500 tracking-widest transition-all duration-500">
      {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
    </div>
  );
};

// Inner component that uses the contexts
const AppContent = () => {
  const { accentColor, colors } = useAccentColor();
  const {
    hassStates,
    connectionStatus,
    systemRestarting,
    connect,
    disconnect,
    callService,
    areOnlyBedroomBathroomLightsOn,
    getSavedCredentials,
    isManualDisconnect,
    setManualDisconnect
  } = useHomeAssistant();

  const [activeTab, setActiveTab] = useState('dashboard');
  // Sidebar is controlled by the hamburger on mobile, but should always be expanded on wider screens
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const mainContentRef = useRef(null); // Ref for scrollable main content

  // --- ADVANCED SETTINGS STATE ---
  const [animationSpeed, setAnimationSpeed] = useState('normal');
  const [particleCount, setParticleCount] = useState(3);
  const [reducedMotion, setReducedMotion] = useState(false);

  // --- SCREEN SAVER STATE ---
  const [screenSaverEnabled, setScreenSaverEnabled] = useState(false);
  const [screenSaverTimeout, setScreenSaverTimeout] = useState(30);
  const [screenSaverBrightness, setScreenSaverBrightness] = useState(5);
  const [autoBrightnessMode, setAutoBrightnessMode] = useState(true); // Auto mode enabled by default
  const [screenSaverActive, setScreenSaverActive] = useState(false);
  const [screenSaverDismissing, setScreenSaverDismissing] = useState(false);
  const lastActivityRef = useRef(Date.now());

  // Edit Mode State
  const [editMode, setEditMode] = useState(false);
  const [cardEditorOpen, setCardEditorOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const longPressTimerRef = useRef(null);
  const [isLongPressing, setIsLongPressing] = useState(false);

  // Card Configurations State
  const [cardConfigs, setCardConfigs] = useState({});

  // --- WAKE WORD STATE ---
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
  const [wakeWordListening, setWakeWordListening] = useState(false);
  const [wakeWordTriggered, setWakeWordTriggered] = useState(false);

  // Load settings from storage on mount
  useEffect(() => {
    const loadSettings = async () => {
      const animSpeed = await storage.getItem('voerynth_animation_speed');
      const partCount = await storage.getItem('voerynth_particle_count');
      const redMotion = await storage.getItem('voerynth_reduced_motion');
      const ssEnabled = await storage.getItem('voerynth_screensaver_enabled');
      const ssTimeout = await storage.getItem('voerynth_screensaver_timeout');
      const ssBrightness = await storage.getItem('voerynth_screensaver_brightness');
      const autoBrightness = await storage.getItem('voerynth_auto_brightness_mode');
      const wakeWordEn = await storage.getItem('voerynth_wake_word_enabled');

      if (animSpeed) setAnimationSpeed(animSpeed);
      if (partCount) setParticleCount(parseInt(partCount));
      if (redMotion) setReducedMotion(redMotion === 'true');
      if (ssEnabled) setScreenSaverEnabled(ssEnabled === 'true');
      if (ssTimeout) setScreenSaverTimeout(parseInt(ssTimeout));
      if (ssBrightness) setScreenSaverBrightness(parseInt(ssBrightness));
      if (autoBrightness !== null) setAutoBrightnessMode(autoBrightness === 'true');
      if (wakeWordEn !== null) setWakeWordEnabled(wakeWordEn === 'true');

      // Load all card configurations
      const keys = await storage.keys();
      const configs = {};
      for (const key of keys) {
        if (key.startsWith('voerynth_card_')) {
          const cardId = key.replace('voerynth_card_', '');
          const configStr = await storage.getItem(key);
          if (configStr) {
            try {
              configs[cardId] = JSON.parse(configStr);
            } catch (e) {
              console.error(`Failed to parse card config for ${cardId}:`, e);
            }
          }
        }
      }
      setCardConfigs(configs);
      console.log('📦 Loaded card configurations:', configs);
    };
    loadSettings();
  }, []);

  // Scroll to top when tab changes
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  // Ensure sidebar is always expanded on wider/landscape screens
  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        setSidebarOpen(true);
      }
    };

    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    handleResize();
    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // --- SCREEN SAVER EFFECT ---
  useEffect(() => {
    if (!screenSaverEnabled) {
      setScreenSaverActive(false);
      return;
    }

    const resetActivity = () => {
      lastActivityRef.current = Date.now();
      // Don't dismiss if screen saver is currently playing its dismiss animation
      // The ScreenSaver component will call onDismiss when animation is complete
      if (screenSaverActive && !screenSaverDismissing) {
        // Don't auto-dismiss here - let the ScreenSaver handle it with animation
      }
    };

    const checkInactivity = () => {
      const inactiveTime = Date.now() - lastActivityRef.current;
      if (inactiveTime >= screenSaverTimeout * 1000 && !screenSaverActive && !screenSaverDismissing) {
        setScreenSaverActive(true);
      }
    };

    // Activity events - only track for resetting the inactivity timer, not for dismissing
    const events = ['mousemove', 'keydown', 'scroll', 'wheel'];
    events.forEach(event => window.addEventListener(event, resetActivity));

    // Check inactivity every second
    const interval = setInterval(checkInactivity, 1000);

    return () => {
      events.forEach(event => window.removeEventListener(event, resetActivity));
      clearInterval(interval);
    };
  }, [screenSaverEnabled, screenSaverTimeout, screenSaverActive, screenSaverDismissing]);

  // --- SCREEN BRIGHTNESS CONTROL FOR CAPACITOR ---
  const originalBrightnessRef = useRef(null);

  // --- CONFIG MODAL STATE ---
  const [configOpen, setConfigOpen] = useState(false);

  // --- COLOR PICKER STATE ---
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [selectedLight, setSelectedLight] = useState(null);

  const [showSplash, setShowSplash] = useState(false);
  const [splashFadingOut, setSplashFadingOut] = useState(false);
  const [splashMessage, setSplashMessage] = useState('Initializing');
  const [dashboardZooming, setDashboardZooming] = useState(false);
  const splashSequenceRef = useRef(false); // Prevents double animation
  const splashTimersRef = useRef([]); // Track all splash-related timers
  const isColdStartRef = useRef(true); // Track if this is the first app launch

  // Prevent body scroll when splash screen is active
  useEffect(() => {
    if (showSplash) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showSplash]);

  // --- FIRST TIME SETUP STATE ---
  const [firstTimeSetup, setFirstTimeSetup] = useState(true);
  const [setupStep, setSetupStep] = useState('welcome'); // 'welcome', 'terms', 'walkthrough'

  // State for config modal credentials
  const [configCredentials, setConfigCredentials] = useState({ url: '', token: '' });

  // Check if setup is completed on mount and load credentials
  useEffect(() => {
    const checkSetup = async () => {
      const setupCompleted = await storage.getItem('voerynth_setup_completed');
      setFirstTimeSetup(!setupCompleted);

      // Load credentials for config modal
      const url = await storage.getItem('voerynth_ha_url');
      const token = await storage.getItem('voerynth_ha_token');
      setConfigCredentials({ url: url || '', token: token || '' });
    };
    checkSetup();
  }, []);

  // Splash sequence handler
  const runSplashSequence = () => {
    // Prevent double splash sequence (React Strict Mode or reconnect)
    if (splashSequenceRef.current) {
      return;
    }
    splashSequenceRef.current = true;

    // Clear any existing timers
    splashTimersRef.current.forEach(timer => clearTimeout(timer));
    splashTimersRef.current = [];

    // Show splash screen with sequential messages
    setShowSplash(true);
    setSplashFadingOut(false);
    setDashboardZooming(false);
    setSplashMessage('Initializing');

    // Message sequence with elegant, slower timings
    const messages = [
      { text: 'Initializing', delay: 0 },
      { text: 'Connecting to Control Hub', delay: 1500 },
      { text: 'Loading Neural Interface', delay: 4500 },
      { text: 'Synchronizing Systems', delay: 6000 },
      { text: 'Ready', delay: 7500 }
    ];

    // Set up message timers
    messages.forEach(({ text, delay }) => {
      const timer = setTimeout(() => setSplashMessage(text), delay);
      splashTimersRef.current.push(timer);
    });

    // Fade out after all messages (elegant 9 second total)
    const fadeTimer = setTimeout(() => {
      setSplashFadingOut(true);
      const zoomTimer = setTimeout(() => {
        setDashboardZooming(true);
      }, 400);
      splashTimersRef.current.push(zoomTimer);

      const hideTimer = setTimeout(() => {
        setShowSplash(false);
        const resetTimer = setTimeout(() => {
          setDashboardZooming(false);
          splashSequenceRef.current = false;
        }, 1000);
        splashTimersRef.current.push(resetTimer);
      }, 1000);
      splashTimersRef.current.push(hideTimer);
    }, 9000);
    splashTimersRef.current.push(fadeTimer);
  };

  // Connect to HA using context
  const connectToHA = (url, token) => {
    connect(url, token, {
      onConnected: () => {
        setConfigOpen(false);
        runSplashSequence();
      }
    });
  };

  // Auto-connect on mount (only show splash on cold start)
  useEffect(() => {
    const autoConnect = async () => {
      const { url, token } = await getSavedCredentials();

      if (url && token && !isManualDisconnect()) {
        // Only show splash on cold start (first app launch)
        if (isColdStartRef.current) {
          setShowSplash(true);
          isColdStartRef.current = false; // Mark that we've done the cold start
        }
        connectToHA(url, token);
      } else {
        setShowSplash(false);
      }
    };
    autoConnect();
  }, []);

  // Wake word detection initialization
  useEffect(() => {
    if (connectionStatus !== 'connected' || !wakeWordEnabled) {
      // Stop wake word if disconnected or disabled
      if (wakeWordListening) {
        WakeWordService.stop();
        setWakeWordListening(false);
      }
      return;
    }

    const initWakeWord = async () => {
      console.log('🎙️ Initializing Hey Ammu wake word detection...');

      const initialized = await WakeWordService.initialize(async (event) => {
        console.log('🎙️ "Hey Ammu" detected! Triggering voice assistant...', event);

        // Show visual indicator
        setWakeWordTriggered(true);

        try {
          // Trigger the Home Assistant voice conversation with Malayalam prompts
          await callService('assist_satellite', 'start_conversation', {
            entity_id: 'assist_satellite.home_assistant_voice_09af65_assist_satellite',
            preannounce: false,
            extra_system_prompt: 'ഉപയോക്താവ് നിങ്ങളുടെ പേര് വിളിച്ചു.',
            start_message: 'പറയു ചേട്ടാ'
          });
          console.log('✅ Voice assistant conversation started');
        } catch (error) {
          console.error('❌ Failed to trigger voice assistant:', error);
        }

        // Hide visual indicator after 3 seconds
        setTimeout(() => {
          setWakeWordTriggered(false);
        }, 3000);
      });

      if (initialized) {
        const started = await WakeWordService.start();
        if (started) {
          setWakeWordListening(true);
          console.log('✅ Wake word detection active - say "Hey Ammu" to activate');
        }
      }
    };

    initWakeWord();

    // Cleanup on unmount or when dependencies change
    return () => {
      WakeWordService.stop();
      setWakeWordListening(false);
    };
  }, [connectionStatus, wakeWordEnabled, callService]);

  const handleConfigSave = (url, token) => {
    setManualDisconnect(false);
    setShowSplash(true); // Show splash on manual login
    connectToHA(url, token);
  };

  const handleLogout = () => {
    disconnect();
    setShowSplash(false);
    setSplashFadingOut(false);
  };

  const handleColorPicker = (entityId) => {
    setSelectedLight(entityId);
    setColorPickerOpen(true);
  };

  // Ambient light sensor state
  const [ambientLux, setAmbientLux] = useState(null);

  // Calculate brightness based on ambient light (lux)
  const calculateBrightnessFromLux = (lux) => {
    if (lux === null) return screenSaverBrightness; // Fallback to user setting if no sensor data

    // Lux ranges and corresponding brightness levels:
    // 0-10 lux: Very dark (night) -> 5%
    // 10-50 lux: Dark room -> 10%
    // 50-200 lux: Dim room -> 15-20%
    // 200-500 lux: Normal indoor -> 25-30%
    // 500+ lux: Bright room -> 35-40%

    if (lux < 10) return 5;
    if (lux < 50) return 10;
    if (lux < 200) return Math.min(15 + Math.floor((lux - 50) / 30), 20);
    if (lux < 500) return Math.min(25 + Math.floor((lux - 200) / 60), 30);
    return Math.min(35 + Math.floor((lux - 500) / 100), 40);
  };

  // Calculate effective screen saver brightness based on lights status and mode
  const getEffectiveScreenSaverBrightness = () => {
    // Nighttime scenario: Dark outside + BOTH bedroom AND bathroom lights are on (and no others)
    if (areOnlyBedroomBathroomLightsOn()) {
      return 5; // Force minimum brightness for nighttime
    }

    // Normal scenario: Any other condition - check mode
    if (autoBrightnessMode) {
      // Auto mode: use ambient light sensor to auto-adjust
      return calculateBrightnessFromLux(ambientLux);
    } else {
      // Manual mode: use user-configured brightness
      return screenSaverBrightness;
    }
  };

  // Initialize ambient light sensor
  useEffect(() => {
    const isCapacitor = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();
    if (!isCapacitor) return;

    let listenerHandle = null;

    const initSensor = async () => {
      try {
        const { Sensors } = await import('@danyalwe/capacitor-sensors');

        // Initialize the ambient light sensor
        await Sensors.init({ type: 'AMBIENT_LIGHT' });

        // Start the sensor
        await Sensors.start({ type: 'AMBIENT_LIGHT' });

        // Add listener for ambient light data
        listenerHandle = await Sensors.addListener('AMBIENT_LIGHT', (data) => {
          if (data.values && data.values.lux !== undefined) {
            console.log('📱 Ambient light sensor:', data.values.lux, 'lux');
            setAmbientLux(data.values.lux);
          }
        });
      } catch (err) {
        console.warn('Ambient light sensor not available:', err);
      }
    };

    initSensor();

    return () => {
      // Cleanup sensor on unmount
      const cleanup = async () => {
        try {
          const { Sensors } = await import('@danyalwe/capacitor-sensors');
          await Sensors.stop({ type: 'AMBIENT_LIGHT' });
          if (listenerHandle) {
            await listenerHandle.remove();
          }
        } catch (err) {
          console.warn('Error cleaning up ambient light sensor:', err);
        }
      };
      cleanup();
    };
  }, []);

  // Screen brightness control effect
  useEffect(() => {
    // Only run on Capacitor (Android/iOS)
    const isCapacitor = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();
    if (!isCapacitor) return;

    const controlBrightness = async () => {
      try {
        // Dynamically import the brightness plugin
        const { ScreenBrightness } = await import('@capacitor-community/screen-brightness');

        if (screenSaverActive) {
          // Save original brightness before dimming
          if (originalBrightnessRef.current === null) {
            const { brightness } = await ScreenBrightness.getBrightness();
            originalBrightnessRef.current = brightness;
            console.log('💾 Saved original brightness:', brightness);
          }

          // Calculate brightness based on lights status and mode
          let effectiveBrightness;
          if (areOnlyBedroomBathroomLightsOn()) {
            // Nighttime: Dark outside + BOTH bedroom AND bathroom lights are on (no others)
            effectiveBrightness = 5;
            console.log('🌙 Nighttime mode (dark + bedroom + bathroom) - Minimum brightness: 5%');
          } else if (autoBrightnessMode) {
            // Normal + Auto mode: use ambient light sensor
            effectiveBrightness = calculateBrightnessFromLux(ambientLux);
            console.log('💡 Auto brightness:', effectiveBrightness + '%', '(Lux:', ambientLux, ')');
          } else {
            // Normal + Manual mode: use user setting
            effectiveBrightness = screenSaverBrightness;
            console.log('🔧 Manual brightness:', effectiveBrightness + '%');
          }

          console.log('📱 Setting screen brightness to:', effectiveBrightness + '%');
          await ScreenBrightness.setBrightness({ brightness: effectiveBrightness / 100 });
        } else {
          // Restore original brightness
          if (originalBrightnessRef.current !== null) {
            console.log('🔄 Restoring original brightness:', originalBrightnessRef.current);
            await ScreenBrightness.setBrightness({ brightness: originalBrightnessRef.current });
            originalBrightnessRef.current = null;
          }
        }
      } catch (err) {
        console.warn('⚠️ Screen brightness control not available:', err);
      }
    };

    controlBrightness();
  }, [screenSaverActive, screenSaverBrightness, ambientLux, autoBrightnessMode, areOnlyBedroomBathroomLightsOn]);

  return (
    <>
      {/* Splash Screen - Rendered at root level for proper fixed positioning */}
      {showSplash && (
        <div className={`fixed inset-0 z-[9999] bg-slate-950 flex items-center justify-center overflow-hidden transition-opacity duration-600 ${splashFadingOut ? 'opacity-0' : 'opacity-100'}`}>
          <div className="absolute inset-0 overflow-hidden">
            <div className={`absolute top-1/4 left-1/4 w-96 h-96 ${colors.bgSoft} rounded-full blur-[150px] animate-[pulse_4s_ease-in-out_infinite]`}></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-[150px] animate-[pulse_5s_ease-in-out_infinite_1s]"></div>
            <div className="absolute inset-0 opacity-50" style={{ background: `radial-gradient(circle at 50% 50%, rgba(${colors.rgb}, 0.05), transparent 70%)` }}></div>
          </div>

          <div className="relative z-10 flex flex-col items-center animate-[fadeIn_0.8s_ease-out]">
            <div className="mb-8 animate-[float_3s_ease-in-out_infinite]">
              <CompanyLogo className={`w-24 h-24 ${colors.text} ${colors.glow}`} />
            </div>

            <h1 className="font-serif text-4xl text-slate-100 tracking-[0.3em] mb-2 animate-[fadeIn_1s_ease-out_0.3s_both]">
              VŒRYNTH
            </h1>

            <p className="text-xs text-slate-300 uppercase tracking-[0.5em] mb-12 animate-[fadeIn_1s_ease-out_0.5s_both]">
              Système OS v5.0.1
            </p>

            <div className="flex flex-col items-center gap-4 animate-[fadeIn_1s_ease-out_0.7s_both]">
              <div className="flex gap-1.5">
                <div className={`w-2 h-2 rounded-full ${colors.bgSolid} animate-[pulse_1.5s_ease-in-out_infinite]`}></div>
                <div className={`w-2 h-2 rounded-full ${colors.bgSolid} animate-[pulse_1.5s_ease-in-out_infinite_0.2s]`}></div>
                <div className={`w-2 h-2 rounded-full ${colors.bgSolid} animate-[pulse_1.5s_ease-in-out_infinite_0.4s]`}></div>
              </div>
              <span
                key={splashMessage}
                className="text-xs text-slate-500 uppercase tracking-widest animate-[fadeIn_0.6s_ease-in-out] min-w-[240px] text-center"
              >
                {splashMessage}
              </span>
            </div>
          </div>
        </div>
      )}

      <div
        className={`flex h-screen w-full bg-slate-950 text-slate-300 font-kumbh overflow-hidden`}
        style={{
          '--animation-speed': animationSpeed === 'slow' ? '1.5' : animationSpeed === 'fast' ? '0.7' : '1',
          '--particle-animation-duration': reducedMotion ? '0s' : '4s',
          '--accent-rgb': accentColor === 'amber' ? '251, 191, 36' :
            accentColor === 'emerald' ? '16, 185, 129' :
              accentColor === 'blue' ? '59, 130, 246' :
                accentColor === 'purple' ? '168, 85, 247' :
                  accentColor === 'rose' ? '244, 63, 94' : '251, 191, 36'
        }}
      >
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,rgba(88,28,135,0.1),transparent_60%)] animate-[pulse_8s_infinite]"></div>
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_100%,rgba(120,53,15,0.1),transparent_60%)] animate-[pulse_10s_infinite]"></div>
          <div className="absolute inset-0 opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        </div>

        {!firstTimeSetup && (
          <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700/50 transition-all duration-500">
            {systemRestarting ? (
              <>
                <span className="text-[10px]  tracking-widest text-blue-400">
                  Restarting...
                </span>
                <RefreshCw size={10} className="text-blue-400 animate-spin" />
              </>
            ) : (
              <>
                <span className={`text-[10px]  tracking-widest ${connectionStatus === 'connected' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {connectionStatus === 'connected' ? 'System Online' : 'Offline'}
                </span>
                <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'} animate-[pulse_2s_infinite]`}></div>
              </>
            )}
          </div>
        )}

        {/* First Time Setup Flow */}
        {firstTimeSetup && (
          <>
            {setupStep === 'welcome' && (
              <WelcomeScreen
                onContinue={() => setSetupStep('terms')}
              />
            )}
            {setupStep === 'terms' && (
              <TermsScreen
                onAccept={() => setSetupStep('walkthrough')}
                onDecline={() => {
                  // User declined terms - exit the app or show a message
                  alert('You must accept the terms to use Vœrynth Système OS');
                }}
              />
            )}
            {setupStep === 'walkthrough' && (
              <SetupWalkthrough
                onComplete={async () => {
                  // Mark setup as completed
                  await storage.setItem('voerynth_setup_completed', 'true');
                  setFirstTimeSetup(false);
                  setSetupStep('welcome');

                  // Auto-connect if credentials are available
                  const savedUrl = await storage.getItem('voerynth_ha_url');
                  const savedToken = await storage.getItem('voerynth_ha_token');
                  if (savedUrl && savedToken) {
                    handleConfigSave(savedUrl, savedToken);
                  }
                }}
              />
            )}
          </>
        )}

        {/* Login Screen (when disconnected) */}
        {!firstTimeSetup && connectionStatus === 'disconnected' && !showSplash && (
          <LoginScreen onConnect={handleConfigSave} />
        )}

        {/* Screen Saver */}
        {screenSaverActive && connectionStatus === 'connected' && !showSplash && (
          <ScreenSaver
            brightness={getEffectiveScreenSaverBrightness()}
            onStartDismiss={() => setScreenSaverDismissing(true)}
            onDismiss={() => {
              setScreenSaverDismissing(false);
              setScreenSaverActive(false);
            }}
          />
        )}

        {/* Config Modal (for changing settings when connected) */}
        {connectionStatus === 'connected' && (
          <ConfigModal
            isOpen={configOpen}
            onClose={() => setConfigOpen(false)}
            onSave={handleConfigSave}
            initialUrl={configCredentials.url}
            initialToken={configCredentials.token}
          />
        )}

        <ColorPickerModal
          isOpen={colorPickerOpen}
          onClose={() => setColorPickerOpen(false)}
          entityId={selectedLight}
        />

        <CardEditorModal
          isOpen={cardEditorOpen}
          onClose={() => setCardEditorOpen(false)}
          initialCard={editingCard}
          onSave={(cardConfig) => {
            console.log('� Card configuration saved:', cardConfig);
            // Save card configuration to storage
            storage.setItem(`voerynth_card_${editingCard?.id}`, JSON.stringify(cardConfig));
            // Update state to trigger re-render
            setCardConfigs(prev => ({
              ...prev,
              [editingCard?.id]: cardConfig
            }));
            setCardEditorOpen(false);
            setEditingCard(null);
          }}
        />

        {/* Dashboard Content with iOS-style zoom animation */}
        {!firstTimeSetup && (
          <div className={`flex-1 flex ${showSplash ? 'opacity-0' :
            dashboardZooming ? 'animate-[springboardZoom_1s_cubic-bezier(0.25,0.46,0.45,0.94)]' :
              'opacity-100'
            }`}>
            {/* Mobile Menu Button */}
            <div className="md:hidden fixed top-2 left-2 z-50">
              <button
                style={{ touchAction: 'none' }}
                onClick={() => {
                  if (!isLongPressing) {
                    if (editMode) {
                      console.log('❌ Exiting edit mode...');
                      setEditMode(false); // Exit edit mode on click
                    } else {
                      setSidebarOpen(!sidebarOpen);
                    }
                  }
                }}
                onTouchStart={() => {
                  setIsLongPressing(false);
                  longPressTimerRef.current = setTimeout(() => {
                    console.log('🔧 Activating edit mode...');
                    setIsLongPressing(true);
                    setEditMode(true);
                    setSidebarOpen(false); // Close sidebar when entering edit mode
                    // Haptic feedback if available
                    if (window.navigator?.vibrate) {
                      window.navigator.vibrate(50);
                    }
                  }, 500); // 500ms long press
                }}
                onTouchEnd={() => {
                  if (longPressTimerRef.current) {
                    clearTimeout(longPressTimerRef.current);
                  }
                  setTimeout(() => setIsLongPressing(false), 100);
                }}
                onTouchCancel={() => {
                  if (longPressTimerRef.current) {
                    clearTimeout(longPressTimerRef.current);
                  }
                  setIsLongPressing(false);
                }}
                onMouseDown={() => {
                  setIsLongPressing(false);
                  longPressTimerRef.current = setTimeout(() => {
                    setIsLongPressing(true);
                    setEditMode(true);
                    setSidebarOpen(false); // Close sidebar when entering edit mode
                  }, 500);
                }}
                onMouseUp={() => {
                  if (longPressTimerRef.current) {
                    clearTimeout(longPressTimerRef.current);
                  }
                  setTimeout(() => setIsLongPressing(false), 100);
                }}
                onMouseLeave={() => {
                  if (longPressTimerRef.current) {
                    clearTimeout(longPressTimerRef.current);
                  }
                  setIsLongPressing(false);
                }}
                className={`flex items-center justify-center w-11 h-11 bg-slate-900/90 backdrop-blur border rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl ${editMode
                  ? `${colors.bg} ${colors.border} ${colors.text} animate-pulse`
                  : `${colors.border}/30 ${colors.text}`
                  } ${isLongPressing ? 'scale-110 ring-2 ring-offset-2 ring-offset-slate-950' : 'active:scale-95'
                  } ${isLongPressing ? colors.ring : ''}`}
                aria-label={editMode ? 'Exit edit mode' : (sidebarOpen ? 'Close menu' : 'Open menu')}
              >
                {editMode ? <Check size={18} /> : (sidebarOpen ? <X size={18} /> : <Menu size={18} />)}
              </button>
            </div>

            {/* Mobile Sidebar Backdrop */}
            {sidebarOpen && (
              <div
                className="md:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30 animate-[fadeIn_0.3s_ease-out]"
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
              />
            )}

            <Sidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              editMode={editMode}
              setEditMode={setEditMode}
            />

            <main ref={mainContentRef} className="flex-1 overflow-y-auto relative z-10 bg-gradient-to-br from-transparent to-slate-900/50 scroll-smooth" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
              <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50 h-14 md:h-16 px-4 md:px-10 flex items-center justify-between transition-all duration-300">
                <div className="flex items-center text-base md:text-xs font-kumbh text-slate-500 ml-14 md:ml-0">
                  <span
                    className={`hidden sm:inline tracking-widest transition-all duration-300 cursor-pointer select-none ${editMode
                      ? `${colors.text} animate-pulse font-medium`
                      : 'hover:text-slate-300'
                      } ${isLongPressing ? 'scale-110 ring-2 ring-offset-2 ring-offset-slate-950' : ''
                      } ${isLongPressing ? colors.ring : ''}`}
                    onClick={() => {
                      if (editMode) {
                        setEditMode(false);
                        console.log('❌ Exiting edit mode...');
                      }
                    }}
                    onTouchStart={() => {
                      setIsLongPressing(false);
                      longPressTimerRef.current = setTimeout(() => {
                        setIsLongPressing(true);
                        setEditMode(true);
                        setSidebarOpen(false);
                        if (window.navigator.vibrate) {
                          window.navigator.vibrate(50);
                        }
                        console.log('🔧 Activating edit mode...');
                      }, 500);
                    }}
                    onTouchEnd={() => {
                      if (longPressTimerRef.current) {
                        clearTimeout(longPressTimerRef.current);
                      }
                      setTimeout(() => setIsLongPressing(false), 100);
                    }}
                    onMouseDown={() => {
                      setIsLongPressing(false);
                      longPressTimerRef.current = setTimeout(() => {
                        setIsLongPressing(true);
                        setEditMode(true);
                        setSidebarOpen(false);
                      }, 500);
                    }}
                    onMouseUp={() => {
                      if (longPressTimerRef.current) {
                        clearTimeout(longPressTimerRef.current);
                      }
                      setTimeout(() => setIsLongPressing(false), 100);
                    }}
                    onMouseLeave={() => {
                      if (longPressTimerRef.current) {
                        clearTimeout(longPressTimerRef.current);
                      }
                      setIsLongPressing(false);
                    }}
                  >
                    Vœrynth Estate
                  </span>
                  <ChevronRight size={12} className="mx-2 md:mx-3 text-slate-700 hidden sm:inline" />
                  <span className={`${colors.text} text-base md:text-xs tracking-widest animate-[fadeIn_0.5s_ease-out] capitalize`}>
                    {activeTab === 'dashboard' ? 'Overview' : activeTab}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <HeaderClock />
                </div>
              </header>

              <div className="px-3 pt-5 sm:px-5 sm:pt-6 md:px-8 md:py-8 lg:px-10 lg:py-10 max-w-[1600px] mx-auto pb-20 md:pb-24 min-h-screen overflow-x-hidden">
                <div className="h-full">
                  {activeTab === 'dashboard' && <DashboardView
                    editMode={editMode}
                    onCardEdit={(cardId) => {
                      console.log('📝 Card edit requested for:', cardId);
                      setEditingCard({ id: cardId });
                      setCardEditorOpen(true);
                    }}
                  />}
                  {activeTab === 'lights' && <LightsView
                    onColorPicker={handleColorPicker}
                    editMode={editMode}
                    cardConfigs={cardConfigs}
                    onCardEdit={(cardId) => {
                      console.log('📝 Card edit requested for:', cardId);
                      const savedConfig = cardConfigs[cardId];
                      setEditingCard({
                        id: cardId,
                        ...savedConfig
                      });
                      setCardEditorOpen(true);
                    }}
                  />}
                  {activeTab === 'media' && <MediaView
                    editMode={editMode}
                    onCardEdit={(cardId) => {
                      console.log('📝 Card edit requested for:', cardId);
                      setEditingCard({ id: cardId });
                      setCardEditorOpen(true);
                    }}
                  />}
                  {activeTab === 'security' && <SecurityView
                    editMode={editMode}
                    onCardEdit={(cardId) => {
                      console.log('📝 Card edit requested for:', cardId);
                      setEditingCard({ id: cardId });
                      setCardEditorOpen(true);
                    }}
                  />}
                  {activeTab === 'energy' && <EnergyView
                    particleCount={particleCount}
                    editMode={editMode}
                    onCardEdit={(cardId) => {
                      console.log('📝 Card edit requested for:', cardId);
                      setEditingCard({ id: cardId });
                      setCardEditorOpen(true);
                    }}
                  />}
                  {activeTab === 'updates' && <UpdatesView
                    editMode={editMode}
                    onCardEdit={(cardId) => {
                      console.log('📝 Card edit requested for:', cardId);
                      setEditingCard({ id: cardId });
                      setCardEditorOpen(true);
                    }}
                  />}
                  {activeTab === 'network' && <NetworkView
                    editMode={editMode}
                    onCardEdit={(cardId) => {
                      console.log('📝 Card edit requested for:', cardId);
                      setEditingCard({ id: cardId });
                      setCardEditorOpen(true);
                    }}
                  />}
                  {activeTab === 'settings' && <SettingsView />}
                  {activeTab === 'advanced' && <AdvancedSettingsView
                    animationSpeed={animationSpeed}
                    setAnimationSpeed={setAnimationSpeed}
                    particleCount={particleCount}
                    setParticleCount={setParticleCount}
                    reducedMotion={reducedMotion}
                    setReducedMotion={setReducedMotion}
                    screenSaverEnabled={screenSaverEnabled}
                    setScreenSaverEnabled={setScreenSaverEnabled}
                    screenSaverTimeout={screenSaverTimeout}
                    setScreenSaverTimeout={setScreenSaverTimeout}
                    screenSaverBrightness={screenSaverBrightness}
                    setScreenSaverBrightness={setScreenSaverBrightness}
                    autoBrightnessMode={autoBrightnessMode}
                    setAutoBrightnessMode={setAutoBrightnessMode}
                    wakeWordEnabled={wakeWordEnabled}
                    setWakeWordEnabled={setWakeWordEnabled}
                    wakeWordListening={wakeWordListening}
                    wakeWordTriggered={wakeWordTriggered}
                    onOpenConfig={() => setConfigOpen(true)}
                    onLogout={handleLogout}
                  />}
                </div>
              </div>
            </main>
          </div>
        )}
        {/* End Dashboard Content */}


      </div >
    </>
  );
};

// Main App component that wraps everything with providers
const App = () => {
  return (
    <AccentColorProvider>
      <HomeAssistantProvider>
        <AppContent />
        <MobileInstallPrompt />
      </HomeAssistantProvider>
    </AccentColorProvider>
  );
};

export default App;
