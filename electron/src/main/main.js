import { app, BrowserWindow, session } from 'electron';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import started from 'electron-squirrel-startup';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Global reference to backend process
let backendProcess = null;

// Function to start the backend Python executable
// Returns a Promise that resolves when backend is ready
const startBackend = () => {
  return new Promise((resolve, reject) => {

    // Use Electron's userData directory for logs
    const logDir = path.join(app.getPath('userData'), 'logs');
    
    // Ensure log directory exists
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }

    // Set file path for backend exectuable (configured for full
    // production build). use process.resourcesPath to locate bundled
    // backend. (forge.config puts the python exe here)
    const backendPath = path.join(process.resourcesPath, "backend_build_mac");

    // If running electron from the terminal to test whether it can
    // spawn the python exe, use this relative path instead (uncomment
    // the line below and comment out the above line). 
    // /*Uncomment*/ const backendPath =  path.join(__dirname, "..", "..", "resources", "backend", "backend_build_mac");

    console.log(`Starting backend from: ${backendPath}`);
    console.log(`Logs will be written to: ${logDir}`);
    
    // Spawn backend with log directory as first argument
    backendProcess = spawn(backendPath, [logDir], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let backendReady = false;

    // Log backend process output to console for debugging.
    // Also listen for BACKEND_READY message to confirm backend has
    // started, and resolve promise.
    backendProcess.stdout.on('data', (data) => {
      const message = data.toString();
      console.log(`[Backend]: ${message.trim()}`);
      
      if (!backendReady && message.includes("BACKEND_READY")) {
        backendReady = true;
        console.log("Backend is ready!");
        resolve(); // Resolve the promise when ready
      }
    });
    
    backendProcess.stderr.on('data', (data) => {
      console.error(`[Backend Error]: ${data.toString().trim()}`);
    });
    
    backendProcess.on('error', (err) => {
      console.error(`Failed to start backend: ${err.message}`);
      if (!backendReady) {
        reject(err); // Reject if backend fails before ready
      }
    });
    
    backendProcess.on('exit', (code, signal) => {
      console.log(`Backend process exited with code ${code} and signal ${signal}`);
      backendProcess = null;
      if (!backendReady) {
        reject(new Error(`Backend exited before ready with code ${code}`));
      }
    });
    
    // Timeout after 1 minute
    setTimeout(() => {
      if (!backendReady) {
        reject(new Error('Backend startup timeout after 1 minute'));
      }
    }, 60000);
  });
};

// Function to stop the backend process
const stopBackend = () => {
  if (backendProcess) {
    console.log('Stopping backend process...');
    backendProcess.kill();
    backendProcess = null;
  }
};

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true,
      contextIsolation: true,
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) { // development
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else { // production
    mainWindow.loadFile(path.join(__dirname, `../../.vite/renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*"]
      }
    })
  })
  
  // If in production, start the backend process and wait
  // for it to be ready (wait for promise to resolve).
  // Otherwise, if in development, the backend is started
  // independently.
  console.log(`app.isPackaged: ${app.isPackaged}, (calling startBackend() if true...)`);
  if(app.isPackaged) {
    try {
      console.log('Waiting for backend to be ready...');
      await startBackend(); // awaits promise that resolves when backend signals it's ready
      console.log('Backend started successfully, creating window...');
      createWindow();
    } catch (error) {
      console.error('Failed to start backend:', error);
      app.quit(); // Quit the app if backend fails to start
    }
  }

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    stopBackend();
    app.quit();
  }
});

// Clean up backend process before quitting
app.on('before-quit', () => {
  stopBackend();
});

// Handle app termination signals
app.on('will-quit', () => {
  stopBackend();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
