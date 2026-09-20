const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
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

// IPC Handlers for Native File and Directory Operations
ipcMain.handle('dialog:selectDirectory', async (event, currentPath) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Folder for Saving Final Data & Exports',
    defaultPath: currentPath || app.getPath('downloads'),
    properties: ['openDirectory', 'createDirectory']
  });
  if (result.canceled || !result.filePaths.length) {
    return { canceled: true };
  }
  return { canceled: false, folderPath: result.filePaths[0] };
});

ipcMain.handle('dialog:saveFile', async (event, { defaultFilename, targetFolder, filters }) => {
  const defaultPath = targetFolder
    ? path.join(targetFolder, defaultFilename)
    : path.join(app.getPath('downloads'), defaultFilename);

  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Export File',
    defaultPath: defaultPath,
    filters: filters || [
      { name: 'Excel Workbook (*.xlsx)', extensions: ['xlsx'] },
      { name: 'CSV File (*.csv)', extensions: ['csv'] },
      { name: 'JSON Data (*.json)', extensions: ['json'] },
      { name: 'All Files (*.*)', extensions: ['*'] }
    ]
  });
  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }
  return { canceled: false, filePath: result.filePath };
});

ipcMain.handle('file:writeExport', async (event, { filePath, folderPath, fileName, data, isBase64 }) => {
  try {
    let finalPath = filePath;
    if (!finalPath && folderPath && fileName) {
      finalPath = path.join(folderPath, fileName);
    }
    if (!finalPath) {
      return { success: false, error: 'No destination file path provided.' };
    }

    const dir = path.dirname(finalPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let buffer;
    if (isBase64) {
      buffer = Buffer.from(data, 'base64');
    } else if (typeof data === 'string') {
      buffer = Buffer.from(data, 'utf-8');
    } else if (Array.isArray(data) || data instanceof Uint8Array) {
      buffer = Buffer.from(data);
    } else {
      buffer = Buffer.from(data);
    }

    await fs.promises.writeFile(finalPath, buffer);
    return { success: true, filePath: finalPath, folderPath: path.dirname(finalPath) };
  } catch (err) {
    console.error('Failed to write export file:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('shell:openPath', async (event, targetPath) => {
  try {
    if (!targetPath) return { success: false, error: 'No path specified.' };
    if (fs.existsSync(targetPath)) {
      const stat = fs.statSync(targetPath);
      if (stat.isDirectory()) {
        await shell.openPath(targetPath);
      } else {
        shell.showItemInFolder(targetPath);
      }
      return { success: true };
    } else {
      return { success: false, error: 'Path does not exist.' };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('app:getDefaultPaths', async () => {
  return {
    downloads: app.getPath('downloads'),
    documents: app.getPath('documents'),
    desktop: app.getPath('desktop')
  };
});

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
