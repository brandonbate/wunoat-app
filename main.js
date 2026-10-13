const { app, BrowserWindow, shell, session } = require('electron');

let mainWindow;
const TARGET_URL = 'https://www.wunoat.com'; // Your web app

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        kiosk: true, // Uncomment this to force full-screen mode (harder to cheat/minimize)
        webPreferences: {
            nodeIntegration: false, // CRITICAL: Prevents the website from accessing the student's computer
            contextIsolation: true, // CRITICAL: Isolates window object
            sandbox: true,          // CRITICAL: Enforces OS-level sandbox
            webSecurity: true,      // Enforces CORS and same-origin policies
        }
    });

    // Automatically approve Camera and Microphone permissions
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        const url = webContents.getURL();
        
        // Only grant permissions if the request is coming from YOUR exact domain
        if (url.startsWith(TARGET_URL)) {
            if (permission === 'media') { // 'media' covers both camera and microphone
                return callback(true); 
            }
        }
        callback(false); // Deny everything else (geolocation, notifications, etc.)
    });

    // Load your application
    mainWindow.loadURL(TARGET_URL);

    // ---------------------------------------------------------
    // THE LOCKDOWN: Prevent navigating away from your app
    // ---------------------------------------------------------
    mainWindow.webContents.on('will-navigate', (event, url) => {
        const parsedUrl = new URL(url);
        const targetHost = new URL(TARGET_URL).hostname;

        // If they click a link that leaves your domain, cancel the navigation
        if (parsedUrl.hostname !== targetHost) {
            event.preventDefault();
            console.log(`Blocked attempt to navigate to: ${url}`);
        }
    });

    // ---------------------------------------------------------
    // POPUP BLOCKER: Prevent opening new browser windows
    // ---------------------------------------------------------
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        const parsedUrl = new URL(url);
        const targetHost = new URL(TARGET_URL).hostname;
        
        // If it's an external link (like a help article), open it in their normal Chrome/Edge browser
        if (parsedUrl.hostname !== targetHost) {
            shell.openExternal(url); 
        }
        
        // Never allow the Electron app itself to spawn a second window
        return { action: 'deny' }; 
    });
});
