import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import WakeWord from '../plugins/WakeWord';

const WakeWordDebugger = () => {
  const [logs, setLogs] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

  const testPlatform = () => {
    const isNative = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform();
    addLog(`Platform: ${platform}, Native: ${isNative}`, isNative ? 'success' : 'error');
  };

  const testInitialize = async () => {
    try {
      addLog('Attempting to initialize Porcupine...', 'info');
      
      // Add listener first
      await WakeWord.addListener('ammuWakeDetected', (event) => {
        addLog(`🎙️ WAKE WORD DETECTED! Event: ${JSON.stringify(event)}`, 'success');
      });
      
      const result = await WakeWord.initialize();
      addLog(`Initialize result: ${JSON.stringify(result)}`, 'success');
      setIsInitialized(true);
    } catch (error) {
      addLog(`Initialize error: ${error.message}`, 'error');
    }
  };

  const testStart = async () => {
    try {
      addLog('Attempting to start wake word detection...', 'info');
      const result = await WakeWord.start();
      addLog(`Start result: ${JSON.stringify(result)}`, 'success');
      setIsListening(true);
    } catch (error) {
      addLog(`Start error: ${error.message}`, 'error');
    }
  };

  const testStop = async () => {
    try {
      addLog('Attempting to stop wake word detection...', 'info');
      const result = await WakeWord.stop();
      addLog(`Stop result: ${JSON.stringify(result)}`, 'success');
      setIsListening(false);
    } catch (error) {
      addLog(`Stop error: ${error.message}`, 'error');
    }
  };

  const testIsListening = async () => {
    try {
      const result = await WakeWord.isListening();
      addLog(`Is listening: ${JSON.stringify(result)}`, 'info');
    } catch (error) {
      addLog(`IsListening error: ${error.message}`, 'error');
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="p-4 bg-slate-800 rounded-lg space-y-4">
      <h2 className="text-xl font-bold text-white">Wake Word Debugger</h2>
      
      {/* Test Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={testPlatform}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Test Platform
        </button>
        
        <button
          onClick={testInitialize}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          disabled={isInitialized}
        >
          Initialize
        </button>
        
        <button
          onClick={testStart}
          className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
          disabled={!isInitialized || isListening}
        >
          Start Listening
        </button>
        
        <button
          onClick={testStop}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          disabled={!isListening}
        >
          Stop Listening
        </button>
        
        <button
          onClick={testIsListening}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Check Status
        </button>
        
        <button
          onClick={clearLogs}
          className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700"
        >
          Clear Logs
        </button>
      </div>

      {/* Status */}
      <div className="flex gap-4 text-sm">
        <div className={`px-3 py-1 rounded ${isInitialized ? 'bg-green-600' : 'bg-slate-600'} text-white`}>
          {isInitialized ? '✓ Initialized' : '✗ Not Initialized'}
        </div>
        <div className={`px-3 py-1 rounded ${isListening ? 'bg-emerald-600 animate-pulse' : 'bg-slate-600'} text-white`}>
          {isListening ? '🎙️ Listening' : '✗ Not Listening'}
        </div>
      </div>

      {/* Logs */}
      <div className="bg-slate-900 rounded p-3 h-64 overflow-y-auto font-mono text-xs">
        {logs.length === 0 ? (
          <div className="text-slate-500">No logs yet. Click buttons to test.</div>
        ) : (
          logs.map((log, i) => (
            <div
              key={i}
              className={`mb-1 ${
                log.type === 'error' ? 'text-red-400' :
                log.type === 'success' ? 'text-green-400' :
                'text-slate-300'
              }`}
            >
              <span className="text-slate-500">[{log.timestamp}]</span> {log.message}
            </div>
          ))
        )}
      </div>

      {/* Instructions */}
      <div className="text-xs text-slate-400 space-y-1">
        <p><strong>Instructions:</strong></p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Click "Test Platform" to verify you're on Android</li>
          <li>Click "Initialize" to initialize Porcupine</li>
          <li>Click "Start Listening" to begin wake word detection</li>
          <li>Say "Hey Ammu" clearly</li>
          <li>Watch for detection message in logs</li>
        </ol>
      </div>
    </div>
  );
};

export default WakeWordDebugger;

