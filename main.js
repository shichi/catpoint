const { app, BrowserWindow, Menu, globalShortcut, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// i18n setup
let i18n = {};
const userLocale = app.getLocale() ? app.getLocale().split('-')[0] : 'en'; // Fallback to 'en' if getLocale() is empty or null
const localePath = path.join(__dirname, 'locales', `${userLocale}.json`);

try {
    i18n = require(localePath);
} catch (error) {
    console.warn(`Locale file for ${userLocale} not found, falling back to en.json`);
    i18n = require(path.join(__dirname, 'locales', 'en.json'));
}

// Helper function for translation with placeholders
function t(key, ...args) {
    let translated = i18n[key] || key; // Fallback to key if not found
    args.forEach((arg, index) => {
        translated = translated.replace(`{${index}}`, arg);
    });
    return translated;
}

let mainWindow;

function createWindow() {
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

    // グローバルショートcutを設定
    setupGlobalShortcuts();
}

function createMenu() {
    const template = [
        {
            label: t('menu_file'),
            submenu: [
                {
                    label: t('menu_open_directory'),
                    accelerator: 'CmdOrCtrl+O',
                    click: async () => {
                        const result = await dialog.showOpenDialog(mainWindow, {
                            properties: ['openDirectory'],
                            title: t('dialog_select_slide_directory')
                        });

                        if (!result.canceled && result.filePaths.length > 0) {
                            mainWindow.webContents.send('open-directory', result.filePaths[0]);
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: t('menu_quit'),
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: t('menu_app'),
            submenu: [
                {
                    label: t('menu_about_app'),
                    click: () => {
                        const aboutWindow = new BrowserWindow({
                            width: 400,
                            height: 300,
                            resizable: false,
                            title: t('menu_about_app'),
                            webPreferences: {
                                preload: path.join(__dirname, 'preload.js'),
                                nodeIntegration: false,
                                contextIsolation: true
                            }
                        });
                        aboutWindow.loadFile('about.html');
                    }
                },
                { type: 'separator' },
                {
                    label: t('menu_quit'),
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: t('menu_view'),
            submenu: [
                {
                    label: t('menu_reload'),
                    accelerator: 'CmdOrCtrl+R',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.reload();
                        }
                    }
                },
                {
                    label: t('menu_force_reload'),
                    accelerator: 'CmdOrCtrl+Shift+R',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.reloadIgnoringCache();
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: t('menu_actual_size'),
                    accelerator: 'CmdOrCtrl+0',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.setZoomLevel(0);
                        }
                    }
                },
                {
                    label: t('menu_zoom_in'),
                    accelerator: 'CmdOrCtrl+Plus',
                    click: () => {
                        if (mainWindow) {
                            const currentZoom = mainWindow.webContents.getZoomLevel();
                            mainWindow.webContents.setZoomLevel(currentZoom + 0.5);
                        }
                    }
                },
                {
                    label: t('menu_zoom_out'),
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
                    label: t('menu_fullscreen'),
                    accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.setFullScreen(!mainWindow.isFullScreen());
                        }
                    }
                },
                {
                    label: t('menu_devtools'),
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
            label: t('menu_presentation'),
            submenu: [
                {
                    label: t('menu_next_slide'),
                    accelerator: 'Right',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.send('next-slide');
                        }
                    }
                },
                {
                    label: t('menu_prev_slide'),
                    accelerator: 'Left',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.send('prev-slide');
                        }
                    }
                },
                {
                    label: t('menu_first_slide'),
                    accelerator: 'Home',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.send('first-slide');
                        }
                    }
                },
                {
                    label: t('menu_last_slide'),
                    accelerator: 'End',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.send('last-slide');
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: t('menu_go_to_slide'),
                    submenu: [], // This will be populated dynamically
                    id: 'goToSlideMenu' // Add an ID for easy access
                },
                { type: 'separator' },
                {
                    label: t('menu_export_pdf'),
                    accelerator: 'CmdOrCtrl+E',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.send('export-pdf');
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
            label: t('menu_about_app'),
            click: () => {
                const aboutWindow = new BrowserWindow({
                    width: 400,
                    height: 300,
                    resizable: false,
                    title: t('menu_about_app'),
                    webPreferences: {
                        preload: path.join(__dirname, 'preload.js'),
                        nodeIntegration: false,
                        contextIsolation: true
                    }
                });
                aboutWindow.loadFile('about.html');
            }
        });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// スライドリストを更新する関数
async function updateGoToSlideMenu() {
    if (mainWindow) {
        mainWindow.webContents.send('request-slide-titles');
    }
}

function setupGlobalShortcuts() {
    // プレゼンテーション用のグローバルショートカット
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

ipcMain.handle('get-localized-string', async (event, key, ...args) => {
    return t(key, ...args);
});

ipcMain.handle('get-app-version', async () => {
    return app.getVersion();
});

// Renderer processからスライドタイトルリストを受信
ipcMain.on('send-slide-titles', (event, slideTitles) => {
    console.log('Main process received slide titles:', slideTitles);
    const menu = Menu.getApplicationMenu();
    const goToSlideMenuItem = menu.getMenuItemById('goToSlideMenu');

    if (goToSlideMenuItem) {
        console.log('Go to Slide menu item found.');
        const submenuItems = slideTitles.map((title, index) => ({
            label: `${index + 1}: ${title}`,
            click: () => {
                if (mainWindow) {
                    mainWindow.webContents.send('go-to-slide-from-menu', index + 1);
                }
            }
        }));
        console.log('Submenu items created:', submenuItems);
        goToSlideMenuItem.submenu = Menu.buildFromTemplate(submenuItems);
        Menu.setApplicationMenu(menu); // メニューを再設定して変更を反映
        console.log('Menu updated.');
    } else {
        console.error('Go to Slide menu item not found.');
    }
});

// Renderer processに特定のスライドへの移動を指示
ipcMain.on('go-to-slide-by-index', (event, index) => {
    if (mainWindow) {
        mainWindow.webContents.send('go-to-slide-from-menu', index);
    }
});

// Renderer processに特定のスライドへの移動を指示
ipcMain.on('go-to-slide-by-index', (event, index) => {
    if (mainWindow) {
        mainWindow.webContents.send('go-to-slide', index);
    }
});

// iframeからのマウスデータを受信し、レンダラープロセスに転送
ipcMain.on('send-iframe-mouse-data', (event, data) => {
    if (mainWindow) {
        mainWindow.webContents.send('update-mouse-position', data);
    }
});

// iframeからのcontextmenuイベントを受信し、レンダラープロセスに転送
ipcMain.on('send-iframe-contextmenu', (event, data) => {
    if (mainWindow) {
        mainWindow.webContents.send('toggle-zoom', data);
    }
});

// iframeからのホイールイベントを受信し、レンダラープロセスに転送
ipcMain.on('send-iframe-wheel-data', (event, data) => {
    console.log('Received wheel data from iframe:', data);
    if (mainWindow) {
        mainWindow.webContents.send('update-wheel-data', data);
    }
});

// パス解決のIPCハンドラ
ipcMain.handle('resolve-path', async (event, ...args) => {
    return path.resolve(...args);
});



ipcMain.handle('get-slides-in-directory', async (event, directoryPath) => {
    try {
        const files = fs.readdirSync(directoryPath);
        const htmlFiles = files
            .filter(file => file.endsWith('.html') || file.endsWith('.htm'))
            .sort()
            .map(file => path.join(directoryPath, file));
        
        if (htmlFiles.length === 0) {
            dialog.showErrorBox(t('dialog_error'), t('dialog_no_html_files_found'));
            return null;
        }

        return { directory: directoryPath, files: htmlFiles };
    } catch (error) {
        console.error(`${t('dialog_error_reading_directory')} ${directoryPath}:`, error);
        dialog.showErrorBox(t('dialog_error'), `${t('dialog_error_reading_directory')} ${error.message}`);
        return null;
    }
});



// PDF生成ハンドラー
ipcMain.handle('generate-pdf', async (event, options) => {
    try {
        return await generatePDF(options);
    } catch (error) {
        console.error('PDF generation failed:', error);
        return { success: false, error: error.message };
    }
});

// PDF生成関数（Playwrightベース）
async function generatePDF(options) {
    const { slides, filename } = options;
    const playwright = require('playwright');
    const { PDFDocument, rgb } = require('pdf-lib');
    const fs = require('fs');
    const path = require('path');

    if (!slides || slides.length === 0) {
        console.error(t('pdf_no_slides_provided'));
        return { success: false, error: t('pdf_no_slides_provided') };
    }

    const startTime = Date.now();
    console.log(t('pdf_generation_started', slides.length));

    // Show save dialog first
    const result = await dialog.showSaveDialog(mainWindow, {
        title: t('dialog_save_pdf'),
        defaultPath: filename,
        filters: [{ name: t('dialog_pdf_files'), extensions: ['pdf'] }]
    });

    if (result.canceled || !result.filePath) {
        return { success: false, error: t('pdf_save_cancelled') };
    }
    const finalPdfPath = result.filePath;

    const browser = await playwright.chromium.launch({ headless: true });
    try {
        const finalPdfDoc = await PDFDocument.create();

        for (let i = 0; i < slides.length; i++) {
            const slidePath = slides[i];
            console.log(t('pdf_processing_slide', i + 1));

            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('pdf-progress-update', {
                    current: i,
                    total: slides.length,
                    message: t('pdf_processing_slide', i + 1)
                });
            }

            const page = await browser.newPage();
            try {
                const absolutePath = path.resolve(__dirname, slidePath);
                if (!fs.existsSync(absolutePath)) {
                    console.warn(t('slide_file_not_found', i + 1));
                    // Add placeholder page
                    const placeholderPage = finalPdfDoc.addPage([600, 800]);
                    placeholderPage.drawText(t('slide_file_not_found', i + 1), { x: 50, y: 400, size: 20 });
                    continue;
                }

                const fileUrl = `file://${absolutePath}`;
                await page.goto(fileUrl, { waitUntil: 'networkidle', timeout: 30000 });

                // Wait for slide content to be likely rendered
                await page.waitForLoadState('domcontentloaded');
                
                // Decode Cloudflare emails
                await page.evaluate(() => {
                    function cfDecodeEmail(encoded) {
                        let email = '';
                        const r = parseInt(encoded.substr(0, 2), 16);
                        for (let n = 2; n < encoded.length; n += 2) {
                            email += String.fromCharCode(parseInt(encoded.substr(n, 2), 16) ^ r);
                        }
                        return email;
                    }
                    document.querySelectorAll('[data-cfemail]').forEach(el => {
                        const encoded = el.getAttribute('data-cfemail');
                        if (encoded) {
                            const decoded = cfDecodeEmail(encoded);
                            el.textContent = decoded;
                            el.href = 'mailto:' + decoded;
                        }
                    });
                });

                // For the first slide, wait a bit longer for animations to complete
                if (i === 0) {
                    await page.waitForTimeout(3000); // Wait for 3 seconds
                }
                // A short wait for any final rendering after scripts have run
                await page.waitForTimeout(500);

                const dimensions = await page.evaluate(() => ({
                    width: document.documentElement.scrollWidth,
                    height: document.documentElement.scrollHeight
                }));

                const pdfBuffer = await page.pdf({
                    width: `${dimensions.width}px`,
                    height: `${dimensions.height}px`,
                    printBackground: true,
                    margin: { top: 0, bottom: 0, left: 0, right: 0 }
                });

                const individualPdf = await PDFDocument.load(pdfBuffer);
                const copiedPages = await finalPdfDoc.copyPages(individualPdf, individualPdf.getPageIndices());
                
                copiedPages.forEach(copiedPage => {
                    const addedPage = finalPdfDoc.addPage(copiedPage);
                    // Add page number
                    addedPage.drawText(`${i + 1} / ${slides.length}`, {
                        x: addedPage.getWidth() - 80,
                        y: 20,
                        size: 10,
                        color: rgb(0.5, 0.5, 0.5)
                    });
                });

            } catch (error) {
                console.error(`${t('slide_generation_failed', i + 1)} (${slidePath}):`, error);
                // Add placeholder page on error
                const placeholderPage = finalPdfDoc.addPage([600, 800]);
                placeholderPage.drawText(t('slide_generation_failed', i + 1), { x: 50, y: 400, size: 20 });
                placeholderPage.drawText(error.message.substring(0, 200), { x: 50, y: 350, size: 10 });
            } finally {
                await page.close();
            }
        }

        const finalPdfBytes = await finalPdfDoc.save();
        fs.writeFileSync(finalPdfPath, finalPdfBytes);

        const endTime = Date.now();
        const totalTime = (endTime - startTime) / 1000;
        console.log(`${t('pdf_generation_successful')} ${finalPdfPath}`);
        console.log(`${t('total_time', totalTime.toFixed(1))}`);

        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('pdf-progress-update', {
                current: slides.length,
                total: slides.length,
                message: `${t('pdf_generation_complete')} (${totalTime.toFixed(1)}秒)`
            });
        }

        return { success: true, filepath: finalPdfPath, processingTime: totalTime };

    } catch (error) {
        console.error(`${t('pdf_generation_failed')}`, error);
        return { success: false, error: error.message };
    } finally {
        await browser.close();
    }
}

// アプリケーションの準備が完了したときの処理
app.whenReady().then(async () => {
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