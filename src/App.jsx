import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import HealthView from './views/HealthView';
import AdvancedSettingsView from './views/AdvancedSettingsView';
import SettingsView from './views/SettingsView';
import { AccentColorProvider, useAccentColor } from './context/AccentColorContext';
import { HomeAssistantProvider, useHomeAssistant } from './context/HomeAssistantContext';
import { ToastProvider } from './context/ToastContext';
import * as storage from './utils/storage';
import MobileInstallPrompt from './components/MobileInstallPrompt';
import { APP_BRAND, APP_ESTATE_NAME, APP_VERSION_LABEL } from './config/app';
import { getActiveTabFromPath, getRouteForTab } from './utils/routes';

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
  const location = useLocation();
  const navigate = useNavigate();
  const { accentColor, colors } = useAccentColor();
  const {
    connectionStatus,
    connectionError,
    connectionStage,
    systemRestarting,
    connect,
    disconnect,
    areOnlyBedroomBathroomLightsOn,
    getSavedCredentials,
    clearConnectionError,
    isManualDisconnect,
    setManualDisconnect
  } = useHomeAssistant();

  const activeTab = getActiveTabFromPath(location.pathname);
  const setActiveTab = useCallback((tabId) => {
    navigate(getRouteForTab(tabId));
  }, [navigate]);
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
  const [screenSaverActive, setScreenSaverActive] = useState(false);
  const [screenSaverDismissing, setScreenSaverDismissing] = useState(false);
  const lastActivityRef = useRef(0);

  // Edit Mode State
  const [editMode, setEditMode] = useState(false);
  const [cardEditorOpen, setCardEditorOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const longPressTimerRef = useRef(null);
  const [isLongPressing, setIsLongPressing] = useState(false);

  // Card Configurations State
  const [cardConfigs, setCardConfigs] = useState({});


  // Load settings from storage on mount
  useEffect(() => {
    lastActivityRef.current = Date.now();
    const loadSettings = async () => {
      const animSpeed = await storage.getItem('voerynth_animation_speed');
      const partCount = await storage.getItem('voerynth_particle_count');
      const redMotion = await storage.getItem('voerynth_reduced_motion');
      const ssEnabled = await storage.getItem('voerynth_screensaver_enabled');
      const ssTimeout = await storage.getItem('voerynth_screensaver_timeout');
      const ssBrightness = await storage.getItem('voerynth_screensaver_brightness');

      if (animSpeed) setAnimationSpeed(animSpeed);
      if (partCount) setParticleCount(parseInt(partCount));
      if (redMotion) setReducedMotion(redMotion === 'true');
      if (ssEnabled) setScreenSaverEnabled(ssEnabled === 'true');
      if (ssTimeout) setScreenSaverTimeout(parseInt(ssTimeout));
      if (ssBrightness) setScreenSaverBrightness(parseInt(ssBrightness));

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


  // --- CONFIG MODAL STATE ---
  const [configOpen, setConfigOpen] = useState(false);

  // --- COLOR PICKER STATE ---
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [selectedLight, setSelectedLight] = useState(null);
  const [colorPickerOrigin, setColorPickerOrigin] = useState(null);

  const [showSplash, setShowSplash] = useState(false);
  const [splashFadingOut, setSplashFadingOut] = useState(false);
  const [startupStage, setStartupStage] = useState({
    id: 'checking_setup',
    message: 'Checking local setup state',
    detail: 'Reading Vœrynth preferences',
    progress: 8,
  });
  const [dashboardZooming, setDashboardZooming] = useState(false);
  const splashTimersRef = useRef([]); // Track all splash-related timers
  const isColdStartRef = useRef(true); // Track if this is the first app launch
  const autoConnectAttemptedRef = useRef(false);

  const visibleSplashStage = showSplash && connectionStage?.id !== 'idle'
    ? connectionStage
    : startupStage;
  const splashMessage = visibleSplashStage?.message || 'Working';
  const splashDetail = visibleSplashStage?.detail || null;
  const splashProgress = Math.max(0, Math.min(100, visibleSplashStage?.progress || 0));

  const clearSplashTimers = useCallback(() => {
    splashTimersRef.current.forEach(timer => clearTimeout(timer));
    splashTimersRef.current = [];
  }, []);

  const finishSplash = useCallback(({ zoom = true, delay = 500 } = {}) => {
    clearSplashTimers();
    const fadeTimer = setTimeout(() => {
      setSplashFadingOut(true);
      if (zoom) {
        const zoomTimer = setTimeout(() => {
          setDashboardZooming(true);
        }, 250);
        splashTimersRef.current.push(zoomTimer);
      }

      const hideTimer = setTimeout(() => {
        setShowSplash(false);
        setSplashFadingOut(false);
        const resetTimer = setTimeout(() => {
          setDashboardZooming(false);
        }, 700);
        splashTimersRef.current.push(resetTimer);
      }, 650);
      splashTimersRef.current.push(hideTimer);
    }, delay);
    splashTimersRef.current.push(fadeTimer);
  }, [clearSplashTimers]);

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

  useEffect(() => () => clearSplashTimers(), [clearSplashTimers]);

  // --- FIRST TIME SETUP STATE ---
  const [firstTimeSetup, setFirstTimeSetup] = useState(true);
  const [setupChecked, setSetupChecked] = useState(false);
  const [setupStep, setSetupStep] = useState('welcome'); // 'welcome', 'terms', 'walkthrough'

  // State for config modal credentials
  const [configCredentials, setConfigCredentials] = useState({ url: '', token: '' });

  // Check if setup is completed on mount and load credentials
  useEffect(() => {
    const checkSetup = async () => {
      try {
        setStartupStage({
          id: 'checking_setup',
          message: 'Checking local setup state',
          detail: 'Reading setup completion and saved credentials',
          progress: 8,
        });
        const setupCompleted = await storage.getItem('voerynth_setup_completed');
        setFirstTimeSetup(!setupCompleted);

        // Load credentials for config modal
        const url = await storage.getItem('voerynth_ha_url');
        const token = await storage.getItem('voerynth_ha_token');
        setConfigCredentials({ url: url || '', token: token || '' });
        setStartupStage({
          id: setupCompleted ? 'setup_loaded' : 'first_setup_required',
          message: setupCompleted ? 'Setup state loaded' : 'First-time setup required',
          detail: setupCompleted ? 'Preparing saved Control Hub connection' : 'Opening setup workflow',
          progress: setupCompleted ? 12 : 100,
        });
      } finally {
        setSetupChecked(true);
      }
    };
    checkSetup();
  }, []);

  // Connect to HA using context
  const connectToHA = useCallback((url, token) => {
    connect(url, token, {
      onConnected: () => {
        setConfigOpen(false);
      }
    });
  }, [connect]);

  useEffect(() => {
    if (!showSplash) return;

    if (connectionStatus === 'connected' && connectionStage?.id === 'ready') {
      finishSplash({ zoom: true, delay: 650 });
      return;
    }

    if (connectionStatus === 'disconnected' && connectionStage?.id === 'failed') {
      finishSplash({ zoom: false, delay: 1200 });
    }
  }, [showSplash, connectionStatus, connectionStage?.id, finishSplash]);

  // Auto-connect on mount (only show splash on cold start)
  useEffect(() => {
    if (!setupChecked || firstTimeSetup || autoConnectAttemptedRef.current) {
      return;
    }

    autoConnectAttemptedRef.current = true;
    let cancelled = false;

    const autoConnect = async () => {
      if (isColdStartRef.current) {
        setStartupStage({
          id: 'reading_credentials',
          message: 'Reading saved Control Hub credentials',
          detail: 'Checking local encrypted browser storage',
          progress: 16,
        });
        setShowSplash(true);
        setSplashFadingOut(false);
        setDashboardZooming(false);
        isColdStartRef.current = false;
      }

      const { url, token } = await getSavedCredentials();
      if (cancelled) return;

      if (url && token && !isManualDisconnect()) {
        setStartupStage({
          id: 'credentials_loaded',
          message: 'Saved Control Hub credentials found',
          detail: 'Starting websocket connection',
          progress: 18,
        });
        connectToHA(url, token);
      } else {
        setStartupStage({
          id: 'credentials_missing',
          message: 'No saved Control Hub credentials',
          detail: 'Opening the offline login screen',
          progress: 100,
        });
        setShowSplash(false);
      }
    };
    autoConnect();

    return () => {
      cancelled = true;
    };
  }, [setupChecked, firstTimeSetup, connectToHA, getSavedCredentials, isManualDisconnect]);


  const handleConfigSave = (url, token) => {
    clearSplashTimers();
    setManualDisconnect(false);
    setStartupStage({
      id: 'manual_credentials_submitted',
      message: 'Using submitted Control Hub credentials',
      detail: 'Starting websocket connection',
      progress: 18,
    });
    setSplashFadingOut(false);
    setDashboardZooming(false);
    setShowSplash(true);
    connectToHA(url, token);
  };

  const handleLogout = () => {
    clearSplashTimers();
    disconnect();
    setShowSplash(false);
    setSplashFadingOut(false);
  };

  const handleColorPicker = (entityId, origin = null) => {
    setSelectedLight(entityId);
    setColorPickerOrigin(origin);
    setColorPickerOpen(true);
  };



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

          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-8 animate-[float_3s_ease-in-out_infinite]">
              <CompanyLogo className={`w-24 h-24 ${colors.text} ${colors.glow}`} />
            </div>

            <h1 className="font-serif text-4xl text-slate-100 tracking-[0.3em] mb-2 animate-[fadeIn_1s_ease-out_0.3s_both]">
              {APP_BRAND}
            </h1>

            <p className="text-xs text-slate-300 uppercase tracking-[0.5em] mb-12 animate-[fadeIn_1s_ease-out_0.5s_both]">
              {APP_VERSION_LABEL}
            </p>

            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-1.5">
                <div className={`w-2 h-2 rounded-full ${colors.bgSolid} animate-[pulse_1.5s_ease-in-out_infinite]`}></div>
                <div className={`w-2 h-2 rounded-full ${colors.bgSolid} animate-[pulse_1.5s_ease-in-out_infinite_0.2s]`}></div>
                <div className={`w-2 h-2 rounded-full ${colors.bgSolid} animate-[pulse_1.5s_ease-in-out_infinite_0.4s]`}></div>
              </div>
              <div className="w-64 h-1 rounded-full bg-slate-800/80 overflow-hidden border border-slate-700/40">
                <div
                  className={`h-full ${colors.bgSolid} transition-[width] duration-500 ease-out`}
                  style={{ width: `${splashProgress}%` }}
                />
              </div>
              <span
                key={visibleSplashStage?.id || splashMessage}
                className="text-xs text-slate-400 uppercase tracking-widest min-w-[280px] text-center"
              >
                {splashMessage}
              </span>
              {splashDetail && (
                <span className="max-w-[340px] px-4 text-[11px] text-slate-500 text-center leading-relaxed">
                  {splashDetail}
                </span>
              )}
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

        {setupChecked && !firstTimeSetup && (
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
        {setupChecked && firstTimeSetup && (
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
                  window.dispatchEvent(new CustomEvent('voerynth:toast', {
                    detail: {
                      type: 'warning',
                      title: 'Terms Required',
                      message: 'You must accept the terms to use Vœrynth Système OS.'
                    }
                  }));
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
        {setupChecked && !firstTimeSetup && connectionStatus === 'disconnected' && !showSplash && (
          <LoginScreen
            onConnect={handleConfigSave}
            connectionError={connectionError}
            onClearError={clearConnectionError}
          />
        )}

        {/* Screen Saver */}
        {screenSaverActive && connectionStatus === 'connected' && !showSplash && (
          <ScreenSaver
            brightness={areOnlyBedroomBathroomLightsOn() ? 5 : screenSaverBrightness}
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
          onClose={() => {
            setColorPickerOpen(false);
            setColorPickerOrigin(null);
          }}
          entityId={selectedLight}
          origin={colorPickerOrigin}
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
        {setupChecked && !firstTimeSetup && (
          <div className={`flex-1 flex ${showSplash ? 'opacity-0' :
            dashboardZooming ? 'animate-[springboardZoom_1s_cubic-bezier(0.25,0.46,0.45,0.94)]' :
              'opacity-100'
            }`}>
            {/* Mobile Menu Button */}
            <div className="md:hidden fixed top-2 left-2 z-50">
              <button
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
                onTouchStart={(e) => {
                  e.preventDefault();
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
                    {APP_ESTATE_NAME}
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
                  {activeTab === 'health' && <HealthView
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
                    onOpenConfig={() => setConfigOpen(true)}
                    onLogout={handleLogout}
                  />}
                </div>
              </div>
            </main>
          </div>
        )}
        {/* End Dashboard Content */}


      </div>
    </>
  );
};

// Main App component that wraps everything with providers
const App = () => {
  return (
    <AccentColorProvider>
      <ToastProvider>
        <HomeAssistantProvider>
          <AppContent />
          <MobileInstallPrompt />
        </HomeAssistantProvider>
      </ToastProvider>
    </AccentColorProvider>
  );
};

export default App;
