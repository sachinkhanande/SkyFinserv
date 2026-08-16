const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { startServer } = require('./server');

let mainWindow;
let serverInstance;

const PORT = process.env.PORT || 3000;

async function createWindow() {
  let boundPort = PORT;
  try {
    const res = await startServer(PORT);
    serverInstance = res.server;
    boundPort = res.port;
  } catch (err) {
    console.error('Failed to start embedded server:', err);
  }

  const windowConfig = {
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'SkyFinserv — Loan Application Portal',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: false,
  };
  if (require('fs').existsSync(path.join(__dirname, 'assets', 'icon.ico'))) {
    windowConfig.icon = path.join(__dirname, 'assets', 'icon.ico');
  }

  // Create native browser window
  mainWindow = new BrowserWindow(windowConfig);

  // Custom application menu
  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        { label: 'Reload App', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.webContents.reloadIgnoringCache() },
        { type: 'separator' },
        { label: 'Exit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About SkyFinserv Desktop',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'SkyFinserv Desktop',
              message: 'SkyFinserv — Loan Application Portal',
              detail: 'Desktop Application v1.0.0\nRunning natively on Windows.',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  // Load the web app running on local express server
  mainWindow.loadURL(`http://localhost:${boundPort}`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (serverInstance && serverInstance.close) {
      serverInstance.close();
    }
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
