const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true, // Adjust based on your security needs
      contextIsolation: false,
    }
  });

  // Load the correct HTML file based on the environment
  if (app.isPackaged) {
    // Ensure this path points to your built index.html
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
    
  } else {
    mainWindow.loadURL('http://localhost:5173'); // Development URL
  }

  // Open Developer Tools (for development)
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
