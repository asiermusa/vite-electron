'use strict'

const {
  app,
  BrowserWindow,
  session,
  dialog,
  ipcMain,
  Menu
} = require('electron')

const path = require('path')
const requests = require('./src/includes/requests.js')
const requests_serial = require('./src/includes/requests_serial.js')
const cookies = require('./src/includes/cookies.js')
const axios = require('axios');
const moment = require('moment');
const gotTheLock = app.requestSingleInstanceLock();

global.mainWindow = null;
global.TAG_LEN = 38; // Total length (no EPC)


async function createWindow() {
  // Create the browser window.
  global.mainWindow = new BrowserWindow({
    width: 1000,
    height: 1000,
    icon: path.join(__dirname, 'src/assets/icon.png'), // for development
    webPreferences: {
      contextIsolation: true, // Recommended for security
      enableRemoteModule: false, // Disable remote module (if not needed)
      preload: path.join(__dirname, 'preload.js'), // Use a preload script if needed
      nodeIntegration: true, // Set this to true only if necessary
    }
  })

  // Load the correct HTML file based on the environment
  if (app.isPackaged) {
    // Ensure this path points to your built index.html
    global.mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));

  } else {
    global.mainWindow.loadURL('http://localhost:5173'); // Development URL
  }

  global.mainWindow.webContents.openDevTools();

  global.mainWindow.setMenu(null);


  // Prevent the default close action and show a confirmation dialog
  global.mainWindow.on('close', (event) => {
    event.preventDefault(); // Prevent the window from closing immediately

    // Show confirmation dialog
    dialog
      .showMessageBox(global.mainWindow, {
        buttons: ['Ez', 'Bai'],
        title: 'Aplikazioa itxi',
        message: 'Aplikaziotik atera nahi duzu?',
      })
      .then(async (result) => {
        if (result.response === 1) { // Index 1 corresponds to 'Close'
          global.mainWindow.destroy(); // Close the window if confirmed
        }
      });
  });



}

// This is for only ONE ELECTRON INSTACE
if (!gotTheLock) {
  app.quit(); // Quit if another instance is already running
} else {
  app.on('second-instance', () => {
    // Focus the existing window if a new instance is attempted
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    // Remove all menus
    createWindow();
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.on("toMain", async (event, data) => {
  requests_serial(data);
  requests(data);
  cookies(data);
});


// Funtzio honek zerbitzariko ordua eta ordenagailu honen orduaaren artek diferentzia aterako du.
// Normalean milisegundo batzuk izaten dira. Adibidez: 360ms

global.timeOffset = 0; // Store the offset between local time and server time

async function syncWithServerTime() {
  try {
    const response = await axios.get('https://denborak.biklik.eus/wp-json/v1/server-time');
    const serverTime = moment(response.data.data, 'YYYY-MM-DD HH:mm:ss.SSS').valueOf(); // Unix timestamp in ms
    const localTime = moment().valueOf();
    // Calculate the offset (serverTime - localTime)
    global.timeOffset = serverTime - localTime;
    console.log('Time synchronized with server. Offset (ms):', timeOffset);
  } catch (error) {
    console.error('Error syncing with server time:', error);
  }
}

// Initial sync at app startup
syncWithServerTime();
// Sync time every minute (60000 ms)
setInterval(syncWithServerTime, 60000);