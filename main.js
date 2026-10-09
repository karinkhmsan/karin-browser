const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');

app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

let mainWindow;

// รายการ Ad Block Patterns พื้นฐาน
const AD_BLOCK_PATTERNS = [
  '*://*.doubleclick.net/*',
  '*://*.googlesyndication.com/*',
  '*://*.googleadservices.com/*',
  '*://*.adservice.google.com/*',
  '*://*.taboola.com/*',
  '*://*.outbrain.com/*',
  '*://*.popads.net/*',
  '*://*.adnxs.com/*',
  '*://*.adroll.com/*',
  '*://*.criteo.com/*',
  '*://*.scorecardresearch.com/*'
];

function setupAdBlocker() {
  const defaultSession = session.defaultSession;

  // ดักจับก่อนที่ Request จะถูกส่งออกไป
  defaultSession.webRequest.onBeforeRequest(
    { urls: AD_BLOCK_PATTERNS },
    (details, callback) => {
      // สั่ง cancel: true เพื่อบล็อกโฆษณาไม่ให้โหลด
      callback({ cancel: true });
    }
  );
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
  mainWindow.setMenuBarVisibility(false);

  ipcMain.on('window:minimize', () => mainWindow.minimize());
  ipcMain.on('window:maximize', () => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.on('window:close', () => mainWindow.close());
}

app.whenReady().then(() => {
  setupAdBlocker(); // เปิดใช้งานระบบบล็อกโฆษณา
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});