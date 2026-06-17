/**
 * Device Pairing Modal
 * 
 * Handles device pairing for Matter, Zigbee (ZHA), and other protocols.
 */

import React, { useEffect, useRef, useState } from 'react';
import { X, Loader, CheckCircle, Wifi } from 'lucide-react';
import { useAccentColor } from '../../context/AccentColorContext';
import haClient from '../../services/haClient';

const DevicePairingModal = ({ isOpen, onClose, protocol, onSuccess }) => {
  const { colors } = useAccentColor();
  const [pairing, setPairing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const intervalRef = useRef(null);

  const clearCountdown = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => () => clearCountdown(), []);

  useEffect(() => {
    if (!isOpen) {
      clearCountdown();
      setPairing(false);
      setSuccess(false);
      setError(null);
      setCountdown(0);
    }
  }, [isOpen]);

  const startPairing = async () => {
    try {
      clearCountdown();
      setPairing(true);
      setSuccess(false);
      setError(null);
      setCountdown(60);

      // Call appropriate pairing service based on protocol
      switch (protocol) {
        case 'matter':
          await haClient.callService('matter', 'commission', {});
          break;
        
        case 'zha':
        case 'zigbee':
          await haClient.callService('zha', 'permit', { duration: 60 });
          break;
        
        case 'esphome':
          // ESPHome devices are typically added via integration flow
          await haClient.callService('esphome', 'discover', {});
          break;
        
        default:
          throw new Error(`Unknown protocol: ${protocol}`);
      }

      setSuccess(true);
      setPairing(false);
      onSuccess?.();

      intervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearCountdown();
            setSuccess(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err) {
      setError(err.message);
      setPairing(false);
      clearCountdown();
    }
  };

  if (!isOpen) return null;

  const getProtocolName = () => {
    switch (protocol) {
      case 'matter': return 'Matter';
      case 'zha':
      case 'zigbee': return 'Zigbee';
      case 'esphome': return 'ESPHome';
      default: return protocol;
    }
  };

  const getInstructions = () => {
    switch (protocol) {
      case 'matter':
        return 'Put your Matter device in pairing mode and scan the QR code or enter the pairing code.';
      case 'zha':
      case 'zigbee':
        return 'Put your Zigbee device in pairing mode (usually by pressing a button or power cycling).';
      case 'esphome':
        return 'Make sure your ESPHome device is powered on and connected to the network.';
      default:
        return 'Follow your device instructions to enter pairing mode.';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:items-center">
      <div className="my-4 max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-serif text-slate-200">Pair {getProtocolName()} Device</h2>
            <p className={`text-sm ${colors.text} mt-1`}>Add a new device to your network</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold text-slate-200">Pairing Mode Active</h3>
              <p className="text-slate-400 text-center max-w-sm">
                Home Assistant accepted the pairing command. New devices will appear when they finish joining.
              </p>
              {countdown > 0 && (
                <div className={`text-2xl font-bold ${colors.text}`}>
                  {countdown}s
                </div>
              )}
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Close
              </button>
            </div>
          ) : error ? (
            <div className="space-y-4">
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
              <button
                onClick={startPairing}
                className="w-full px-6 py-3 text-white rounded-lg transition-colors font-semibold"
                style={{ backgroundColor: colors.accent }}
              >
                Try Again
              </button>
            </div>
          ) : pairing ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="relative">
                <Wifi className="w-16 h-16 text-cyan-500 animate-pulse" />
                <Loader className="w-8 h-8 text-cyan-400 animate-spin absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <h3 className="text-xl font-semibold text-slate-200">Starting pairing mode...</h3>
              <p className="text-slate-400 text-center">{getInstructions()}</p>
              {countdown > 0 && (
                <div className={`text-2xl font-bold ${colors.text}`}>
                  {countdown}s
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-slate-800 rounded-lg">
                <p className="text-slate-300 text-sm">{getInstructions()}</p>
              </div>
              <button
                onClick={startPairing}
                className="w-full px-6 py-3 text-white rounded-lg transition-colors font-semibold"
                style={{ backgroundColor: colors.accent }}
              >
                Start Pairing
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DevicePairingModal;
