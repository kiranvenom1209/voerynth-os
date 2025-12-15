const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = !app.isPackaged; // Check if running in dev mode

function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // For simple setups; use preload scripts for security in production
    },
    // Hide the menu bar (optional, for kiosk feel)
    autoHideMenuBar: true, 
  });

  // Load the app
  if (isDev) {
    // In dev mode, load from the Vite dev server
    win.loadURL('http://localhost:5173');
    // Open DevTools
    win.webContents.openDevTools();
  } else {
    // In production, load the built index.html
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});