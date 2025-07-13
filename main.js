const { app, BrowserWindow, Menu, globalShortcut, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    // メインウィンドウを作成
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: false, // ローカルファイルアクセスのため
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'icon.png'), // アイコンがある場合
        show: false, // 準備完了まで非表示
        titleBarStyle: 'default',
        frame: true
    });

    // presentation.htmlを読み込み
    mainWindow.loadFile('presentation.html');

    // ウィンドウが準備できたら表示
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        
        // 開発モードの場合はDevToolsを開く
        if (process.argv.includes('--dev')) {
            mainWindow.webContents.openDevTools();
        }
    });

    // ウィンドウが閉じられたときの処理
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // メニューを設定
    createMenu();

    // グローバルショートカットを設定
    setupGlobalShortcuts();
}

function createMenu() {
    const template = [
        {
            label: 'アプリケーション',
            submenu: [
                {
                    label: 'SBS Presentationについて',
                    role: 'about'
                },
                { type: 'separator' },
                {
                    label: '終了',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: '表示',
            submenu: [
                {
                    label: '再読み込み',
                    accelerator: 'CmdOrCtrl+R',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.reload();
                        }
                    }
                },
                {
                    label: '強制再読み込み',
                    accelerator: 'CmdOrCtrl+Shift+R',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.reloadIgnoringCache();
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: '実際のサイズ',
                    accelerator: 'CmdOrCtrl+0',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.setZoomLevel(0);
                        }
                    }
                },
                {
                    label: '拡大',
                    accelerator: 'CmdOrCtrl+Plus',
                    click: () => {
                        if (mainWindow) {
                            const currentZoom = mainWindow.webContents.getZoomLevel();
                            mainWindow.webContents.setZoomLevel(currentZoom + 0.5);
                        }
                    }
                },
                {
                    label: '縮小',
                    accelerator: 'CmdOrCtrl+-',
                    click: () => {
                        if (mainWindow) {
                            const currentZoom = mainWindow.webContents.getZoomLevel();
                            mainWindow.webContents.setZoomLevel(currentZoom - 0.5);
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: '全画面表示',
                    accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.setFullScreen(!mainWindow.isFullScreen());
                        }
                    }
                },
                {
                    label: '開発者ツール',
                    accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.toggleDevTools();
                        }
                    }
                }
            ]
        },
        {
            label: 'プレゼンテーション',
            submenu: [
                {
                    label: '次のスライド',
                    accelerator: 'Right',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.send('next-slide');
                        }
                    }
                },
                {
                    label: '前のスライド',
                    accelerator: 'Left',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.send('prev-slide');
                        }
                    }
                },
                {
                    label: '最初のスライド',
                    accelerator: 'Home',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.send('first-slide');
                        }
                    }
                },
                {
                    label: '最後のスライド',
                    accelerator: 'End',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.send('last-slide');
                        }
                    }
                }
            ]
        }
    ];

    // macOSの場合、メニュー構造を調整
    if (process.platform === 'darwin') {
        template[0].label = app.getName();
        template[0].submenu.unshift({
            label: `${app.getName()}について`,
            role: 'about'
        });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function setupGlobalShortcuts() {
    // プレゼンテーション用のグローバルショートカット
    globalShortcut.register('Space', () => {
        if (mainWindow && mainWindow.isFocused()) {
            mainWindow.webContents.send('next-slide');
        }
    });

    globalShortcut.register('Escape', () => {
        if (mainWindow && mainWindow.isFullScreen()) {
            mainWindow.setFullScreen(false);
        }
    });
}

// IPCハンドラーを設定
ipcMain.handle('slide-changed', async (event, slideNumber) => {
    // スライド変更の処理（必要に応じて）
    console.log(`Slide changed to: ${slideNumber}`);
    return true;
});

// アプリケーションの準備が完了したときの処理
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        // macOSでDockアイコンがクリックされたとき
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// すべてのウィンドウが閉じられたときの処理
app.on('window-all-closed', () => {
    // macOSでは明示的に終了しない限りアプリを実行し続ける
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// アプリが終了する前にグローバルショートカットを解除
app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

// セキュリティ: 新しいウィンドウの作成を制限
app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, navigationUrl) => {
        // 外部リンクはデフォルトブラウザで開く
        event.preventDefault();
        require('electron').shell.openExternal(navigationUrl);
    });
});