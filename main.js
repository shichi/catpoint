const { app, BrowserWindow, Menu, globalShortcut, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

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
                },
                { type: 'separator' },
                {
                    label: 'PDFエクスポート',
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

ipcMain.handle('get-slides-in-directory', async (event, directoryPath) => {
    let path_to_scan = directoryPath;
    
    // パスが指定されていない、または無効な場合はダイアログを表示
    while (!path_to_scan || !fs.existsSync(path_to_scan)) {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory'],
            title: 'スライドのあるディレクトリを選択してください'
        });

        if (result.canceled || result.filePaths.length === 0) {
            // ユーザーがダイアログをキャンセルした場合は、アプリを終了するか、
            // 何もせずに待機するかを選択できます。ここではnullを返します。
            return null;
        }
        path_to_scan = result.filePaths[0];
    }

    try {
        const files = fs.readdirSync(path_to_scan);
        const htmlFiles = files
            .filter(file => file.endsWith('.html') || file.endsWith('.htm'))
            .sort()
            .map(file => path.join(path_to_scan, file));
        
        // HTMLファイルが見つからない場合も、再度ダイアログを表示する
        if (htmlFiles.length === 0) {
            dialog.showErrorBox('エラー', '選択されたディレクトリにHTMLファイルが見つかりませんでした。');
            // nullを返して、再度ディレクトリ選択を促す
            return null;
        }

        return { directory: path_to_scan, files: htmlFiles };
    } catch (error) {
        console.error(`Error reading directory ${path_to_scan}:`, error);
        dialog.showErrorBox('エラー', `ディレクトリの読み込み中にエラーが発生しました: ${error.message}`);
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
        console.error('No slides provided for PDF generation');
        return { success: false, error: 'No slides provided for PDF generation' };
    }

    const startTime = Date.now();
    console.log(`PDF generation started: processing ${slides.length} slides.`);

    // Show save dialog first
    const result = await dialog.showSaveDialog(mainWindow, {
        title: 'PDFを保存',
        defaultPath: filename,
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    });

    if (result.canceled || !result.filePath) {
        return { success: false, error: 'Save cancelled by user' };
    }
    const finalPdfPath = result.filePath;

    const browser = await playwright.chromium.launch({ headless: true });
    try {
        const finalPdfDoc = await PDFDocument.create();

        for (let i = 0; i < slides.length; i++) {
            const slidePath = slides[i];
            console.log(`Processing slide ${i + 1}/${slides.length}: ${slidePath}`);

            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('pdf-progress-update', {
                    current: i,
                    total: slides.length,
                    message: `スライド ${i + 1} を処理中...`
                });
            }

            const page = await browser.newPage();
            try {
                const absolutePath = path.resolve(__dirname, slidePath);
                if (!fs.existsSync(absolutePath)) {
                    console.warn(`Slide file not found, skipping: ${absolutePath}`);
                    // Add placeholder page
                    const placeholderPage = finalPdfDoc.addPage([600, 800]);
                    placeholderPage.drawText(`Slide ${i + 1}: File not found`, { x: 50, y: 400, size: 20 });
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
                console.error(`Failed to process slide ${i + 1} (${slidePath}):`, error);
                // Add placeholder page on error
                const placeholderPage = finalPdfDoc.addPage([600, 800]);
                placeholderPage.drawText(`Slide ${i + 1}: Generation failed`, { x: 50, y: 400, size: 20 });
                placeholderPage.drawText(error.message.substring(0, 200), { x: 50, y: 350, size: 10 });
            } finally {
                await page.close();
            }
        }

        const finalPdfBytes = await finalPdfDoc.save();
        fs.writeFileSync(finalPdfPath, finalPdfBytes);

        const endTime = Date.now();
        const totalTime = (endTime - startTime) / 1000;
        console.log(`PDF generation successful: ${finalPdfPath}`);
        console.log(`Total time: ${totalTime.toFixed(1)}s`);

        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('pdf-progress-update', {
                current: slides.length,
                total: slides.length,
                message: `完了! (${totalTime.toFixed(1)}秒)`
            });
        }

        return { success: true, filepath: finalPdfPath, processingTime: totalTime };

    } catch (error) {
        console.error('PDF generation failed:', error);
        return { success: false, error: error.message };
    } finally {
        await browser.close();
    }
}

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