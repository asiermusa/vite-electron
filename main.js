'use strict'

const {
  app,
  BrowserWindow,
  session,
  dialog,
  ipcMain
} = require('electron')

const path = require('path')
const requests = require('./src/includes/requests.js')
const requests_serial = require('./src/includes/requests_serial.js')
const cookies = require('./src/includes/cookies.js')

let win = null;

async function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
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

  console.log(path.join(__dirname, 'src/assets/icon.png'))
  // Load the correct HTML file based on the environment
  if (app.isPackaged) {
    // Ensure this path points to your built index.html
    win.loadFile(path.join(__dirname, 'dist/index.html'));
    
  } else {
    win.loadURL('http://localhost:5173'); // Development URL
  }

  //win.webContents.openDevTools();

  // Prevent the default close action and show a confirmation dialog
  win.on('close', (event) => {
    event.preventDefault(); // Prevent the window from closing immediately

    // Show confirmation dialog
    dialog
      .showMessageBox(win, {
        type: 'warning',
        buttons: ['Cancel', 'Close'],
        title: 'Confirm Close',
        message: 'Are you sure you want to close the application?',
      })
      .then((result) => {
        if (result.response === 1) { // Index 1 corresponds to 'Close'
          win.destroy(); // Close the window if confirmed
        }
      });
  });

}

app.whenReady().then(createWindow);



app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.on("toMain", async (event, data) => {
  requests_serial(data, win);
  requests(data, app, win);
  cookies(data, win);
});