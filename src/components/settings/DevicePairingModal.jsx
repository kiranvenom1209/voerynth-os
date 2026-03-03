/**
 * Device Pairing Modal
 * 
 * Handles device pairing for Matter, Zigbee (ZHA), and other protocols.
 */

import React, { useState } from 'react';
import { X, Loader, CheckCircle, Wifi } from 'lucide-react';
import { useAccentColor } from '../../context/AccentColorContext';
import haClient from '../../services/haClient';

const DevicePairingModal = ({ isOpen, onClose, protocol, onSuccess }) => {
  const { colors } = useAccentColor();
  const [pairing, setPairing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(0);

  const startPairing = async () => {
    try {
      setPairing(true);
      setError(null);
      setCountdown(60); // 60 second pairing window

      // Start countdown
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

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

      // Wait for pairing to complete or timeout
      setTimeout(() => {
        clearInterval(interval);
        setSuccess(true);
        setPairing(false);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 2000);
      }, 3000); // Simulate pairing success after 3 seconds

    } catch (err) {
      setError(err.message);
      setPairing(false);
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full mx-4">
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
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold text-slate-200 mb-2">Device Paired!</h3>
              <p className="text-slate-400 text-center">
                Your device has been successfully added
              </p>
            </div>
          ) : error ? (
            <div className="space-y-4">
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
              <button
                onClick={startPairing}
                className={`w-full px-6 py-3 bg-${colors.name}-600 text-white rounded-lg hover:bg-${colors.name}-700 transition-colors font-semibold`}
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
              <h3 className="text-xl font-semibold text-slate-200">Searching for devices...</h3>
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
                className={`w-full px-6 py-3 bg-${colors.name}-600 text-white rounded-lg hover:bg-${colors.name}-700 transition-colors font-semibold`}
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

