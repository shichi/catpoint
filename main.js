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
    
    try {
        if (!slides || slides.length === 0) {
            console.error('No slides provided for PDF generation');
            return { success: false, error: 'No slides provided for PDF generation' };
        }
        
        const startTime = Date.now();
        console.log(`PDF生成開始: ${slides.length}枚のスライドを処理します`);
        
        // 個別PDF配列を準備
        const individualPdfs = [];
        
        // Playwrightブラウザを起動
        const browser = await playwright.chromium.launch({ headless: true });
        
        try {
            // 各スライドを個別に処理
            for (let i = 0; i < slides.length; i++) {
                console.log(`Processing slide ${i + 1}/${slides.length}: ${slides[i]}`);
                
                // プログレス更新をメインウィンドウに送信
                if (mainWindow && !mainWindow.isDestroyed()) {
                    try {
                        mainWindow.webContents.send('pdf-progress-update', {
                            current: i,
                            total: slides.length,
                            message: `スライド ${i + 1} を処理中...`
                        });
                    } catch (progressError) {
                        console.warn('Progress update failed:', progressError.message);
                    }
                }
                
                const slidePath = path.join(__dirname, slides[i]);
                if (!fs.existsSync(slidePath)) {
                    console.warn(`Slide file not found: ${slidePath}, skipping...`);
                    continue;
                }
                
                try {
                    const page = await browser.newPage();
                    const absolutePath = path.resolve(slidePath);
                    const fileUrl = `file://${absolutePath}`;
                    
                    // ページを読み込み、ネットワークアイドルまで待機
                    await page.goto(fileUrl, { waitUntil: 'networkidle' });
                    
                    // 画像とアセットの読み込み完了を確認
                    await page.waitForLoadState('domcontentloaded');
                    
                    // すべての画像とアセットが読み込まれるまで待機
                    const assetLoadResult = await page.evaluate(async () => {
                        const images = Array.from(document.querySelectorAll('img'));
                        const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
                        const scripts = Array.from(document.querySelectorAll('script[src]'));
                        
                        console.log(`Found ${images.length} images, ${links.length} CSS links, ${scripts.length} scripts`);
                        
                        // 画像の読み込み完了を待機
                        const imagePromises = images.map((img, index) => {
                            return new Promise((resolve) => {
                                if (img.complete && img.naturalWidth > 0) {
                                    console.log(`Image ${index} already loaded: ${img.src}`);
                                    resolve({ index, src: img.src, status: 'loaded' });
                                } else {
                                    console.log(`Waiting for image ${index}: ${img.src}`);
                                    img.onload = () => {
                                        console.log(`Image ${index} loaded successfully: ${img.src}`);
                                        resolve({ index, src: img.src, status: 'loaded' });
                                    };
                                    img.onerror = () => {
                                        console.log(`Image ${index} failed to load: ${img.src}`);
                                        resolve({ index, src: img.src, status: 'error' });
                                    };
                                    // 10秒でタイムアウト
                                    setTimeout(() => {
                                        console.log(`Image ${index} timeout: ${img.src}`);
                                        resolve({ index, src: img.src, status: 'timeout' });
                                    }, 10000);
                                }
                            });
                        });
                        
                        // CSS の読み込み完了を待機
                        const cssPromises = links.map((link, index) => {
                            return new Promise((resolve) => {
                                if (link.sheet) {
                                    console.log(`CSS ${index} already loaded: ${link.href}`);
                                    resolve({ index, href: link.href, status: 'loaded' });
                                } else {
                                    console.log(`Waiting for CSS ${index}: ${link.href}`);
                                    link.onload = () => {
                                        console.log(`CSS ${index} loaded successfully: ${link.href}`);
                                        resolve({ index, href: link.href, status: 'loaded' });
                                    };
                                    link.onerror = () => {
                                        console.log(`CSS ${index} failed to load: ${link.href}`);
                                        resolve({ index, href: link.href, status: 'error' });
                                    };
                                    // 5秒でタイムアウト
                                    setTimeout(() => {
                                        console.log(`CSS ${index} timeout: ${link.href}`);
                                        resolve({ index, href: link.href, status: 'timeout' });
                                    }, 5000);
                                }
                            });
                        });
                        
                        // すべてのアセットの読み込み完了を待機
                        const [imageResults, cssResults] = await Promise.all([
                            Promise.all(imagePromises),
                            Promise.all(cssPromises)
                        ]);
                        
                        // 追加で動的コンテンツの読み込み完了を待機
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        return {
                            images: imageResults,
                            css: cssResults,
                            totalImages: images.length,
                            totalCSS: links.length
                        };
                    });
                    
                    // アセット読み込み結果をログ出力
                    console.log(`Slide ${i + 1} asset loading results:`, assetLoadResult);
                    
                    // 読み込み失敗した画像があれば警告
                    const failedImages = assetLoadResult.images.filter(img => img.status === 'error' || img.status === 'timeout');
                    if (failedImages.length > 0) {
                        console.warn(`Slide ${i + 1}: ${failedImages.length} images failed to load:`, failedImages.map(img => img.src));
                    }
                    
                    // 3秒間レンダリング完了を待機
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    
                    // Cloudflare Email Obfuscation を解除（pdf.pyを参考）
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
                            const decoded = cfDecodeEmail(encoded);
                            el.textContent = decoded;
                            el.href = 'mailto:' + decoded;
                        });
                    });
                    
                    // ページサイズを取得（pdf.pyを参考）
                    const dimensions = await page.evaluate(() => ({
                        width: document.documentElement.scrollWidth,
                        height: document.documentElement.scrollHeight
                    }));
                    
                    // DPI 96で計算してインチに変換
                    const widthIn = dimensions.width / 96;
                    const heightIn = dimensions.height / 96;
                    
                    console.log(`Slide ${i + 1}: ${dimensions.width}x${dimensions.height}px (${widthIn.toFixed(2)}x${heightIn.toFixed(2)}in)`);
                    
                    // 個別PDFを生成
                    const pdfBuffer = await page.pdf({
                        width: `${widthIn.toFixed(2)}in`,
                        height: `${heightIn.toFixed(2)}in`,
                        printBackground: true,
                        margin: { top: 0, bottom: 0, left: 0, right: 0 }
                    });
                    
                    individualPdfs.push({
                        slideNumber: i + 1,
                        buffer: pdfBuffer,
                        success: true
                    });
                    
                    await page.close();
                    console.log(`Generated PDF for slide ${i + 1}, buffer size: ${pdfBuffer.length}`);
                    
                } catch (error) {
                    console.error(`Error processing slide ${i + 1}:`, error);
                    individualPdfs.push({
                        slideNumber: i + 1,
                        buffer: null,
                        success: false,
                        error: error.message
                    });
                }
            }
            
            // 全ての個別PDFをマージ
            console.log('Merging individual PDFs...');
            const { PDFDocument } = require('pdf-lib');
            const finalPdf = await PDFDocument.create();
            
            for (let pdfData of individualPdfs) {
                if (pdfData.success && pdfData.buffer) {
                    try {
                        // 個別PDFを読み込んでマージ
                        const individualPdf = await PDFDocument.load(pdfData.buffer);
                        const pages = await finalPdf.copyPages(individualPdf, individualPdf.getPageIndices());
                        
                        pages.forEach(page => {
                            const addedPage = finalPdf.addPage(page);
                            
                            // ページ番号を追加
                            const { rgb } = require('pdf-lib');
                            addedPage.drawText(`${pdfData.slideNumber} / ${slides.length}`, {
                                x: addedPage.getWidth() - 80,
                                y: 20,
                                size: 10,
                                color: rgb(0.5, 0.5, 0.5)
                            });
                        });
                        
                        console.log(`Merged slide ${pdfData.slideNumber}`);
                    } catch (mergeError) {
                        console.error(`Error merging slide ${pdfData.slideNumber}:`, mergeError);
                        
                        // マージ失敗時はプレースホルダーページを追加
                        const placeholderPage = finalPdf.addPage([600, 800]);
                        placeholderPage.drawText(`Slide ${pdfData.slideNumber}: Merge failed`, {
                            x: 50,
                            y: 400,
                            size: 20
                        });
                        const { rgb } = require('pdf-lib');
                        placeholderPage.drawText(`${pdfData.slideNumber} / ${slides.length}`, {
                            x: placeholderPage.getWidth() - 80,
                            y: 20,
                            size: 10,
                            color: rgb(0.5, 0.5, 0.5)
                        });
                    }
                } else {
                    // 失敗したスライドはプレースホルダーページ
                    const placeholderPage = finalPdf.addPage([600, 800]);
                    placeholderPage.drawText(`Slide ${pdfData.slideNumber}: Generation failed`, {
                        x: 50,
                        y: 400,
                        size: 20
                    });
                    if (pdfData.error) {
                        placeholderPage.drawText(pdfData.error, {
                            x: 50,
                            y: 350,
                            size: 12
                        });
                    }
                    const { rgb } = require('pdf-lib');
                    placeholderPage.drawText(`${pdfData.slideNumber} / ${slides.length}`, {
                        x: placeholderPage.getWidth() - 80,
                        y: 20,
                        size: 10,
                        color: rgb(0.5, 0.5, 0.5)
                    });
                }
            }
            
            // 統合PDFをバイト配列として保存
            console.log('Saving merged PDF...');
            const finalPdfBytes = await finalPdf.save();
            console.log(`Final PDF saved, size: ${finalPdfBytes.length} bytes`);
            
            // ファイル保存ダイアログを表示
            const result = await dialog.showSaveDialog(mainWindow, {
                title: 'PDFを保存',
                defaultPath: filename,
                filters: [
                    { name: 'PDF Files', extensions: ['pdf'] }
                ]
            });
            
            if (!result.canceled && result.filePath) {
                fs.writeFileSync(result.filePath, finalPdfBytes);
                
                const endTime = Date.now();
                const totalTime = (endTime - startTime) / 1000;
                const avgTimePerSlide = totalTime / slides.length;
                
                console.log(`PDF生成完了: ${result.filePath}`);
                console.log(`処理時間: ${totalTime.toFixed(1)}秒 (平均 ${avgTimePerSlide.toFixed(1)}秒/スライド)`);
                
                // 完了通知をメインウィンドウに送信
                if (mainWindow && !mainWindow.isDestroyed()) {
                    try {
                        mainWindow.webContents.send('pdf-progress-update', {
                            current: slides.length,
                            total: slides.length,
                            message: `完了! (${totalTime.toFixed(1)}秒)`
                        });
                    } catch (progressError) {
                        console.warn('Completion progress update failed:', progressError.message);
                    }
                }
                
                return { success: true, filepath: result.filePath, processingTime: totalTime };
            } else {
                return { success: false, error: 'Save cancelled by user' };
            }
            
        } finally {
            // ブラウザを閉じる
            await browser.close();
        }
        
    } catch (error) {
        console.error('PDF generation error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        return { success: false, error: error.message };
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