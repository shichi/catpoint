const { contextBridge, ipcRenderer } = require('electron');

// メインプロセスとレンダラープロセス間の安全な通信を設定
contextBridge.exposeInMainWorld('electronAPI', {
    // メインプロセスからのメッセージを受信
    onNextSlide: (callback) => ipcRenderer.on('next-slide', callback),
    onPrevSlide: (callback) => ipcRenderer.on('prev-slide', callback),
    onFirstSlide: (callback) => ipcRenderer.on('first-slide', callback),
    onLastSlide: (callback) => ipcRenderer.on('last-slide', callback),
    onExportPDF: (callback) => ipcRenderer.on('export-pdf', callback),
    onPdfProgressUpdate: (callback) => ipcRenderer.on('pdf-progress-update', callback),
    onOpenDirectory: (callback) => ipcRenderer.on('open-directory', (event, path) => callback(path)),
    // メインプロセスからマウス位置の更新を受信
    onUpdateMousePosition: (callback) => ipcRenderer.on('update-mouse-position', callback),
    
    // iframeからのマウスデータをメインプロセスに送信
    sendIframeMouseData: (data) => ipcRenderer.send('send-iframe-mouse-data', data),
    // iframeからのcontextmenuイベントをメインプロセスに送信
    sendIframeContextmenu: (data) => ipcRenderer.send('send-iframe-contextmenu', data),
    // iframeからのホイールイベントをメインプロセスに送信
    sendIframeWheelData: (data) => ipcRenderer.send('send-iframe-wheel-data', data),
    // メインプロセスからズームトグルイベントを受信
    onToggleZoom: (callback) => ipcRenderer.on('toggle-zoom', callback),
    // メインプロセスからホイールイベントを受信
    onUpdateWheelData: (callback) => ipcRenderer.on('update-wheel-data', callback),

    // メインプロセスからスライドタイトル要求を受信
    onRequestSlideTitles: (callback) => ipcRenderer.on('request-slide-titles', callback),
    // メインプロセスから特定のスライドへの移動指示を受信
    onGoToSlideFromMenu: (callback) => ipcRenderer.on('go-to-slide-from-menu', callback),

    // メインプロセスにメッセージを送信
    sendSlideChanged: (slideNumber) => ipcRenderer.invoke('slide-changed'),
    sendSlideTitles: (titles) => ipcRenderer.send('send-slide-titles'),
    
    // PDF生成関連
    generatePDF: (options) => ipcRenderer.invoke('generate-pdf', options),
    getSlidesInDirectory: (directoryPath) => ipcRenderer.invoke('get-slides-in-directory', directoryPath),

    // i18n関連
    getLocalizedString: (key, ...args) => ipcRenderer.invoke('get-localized-string', key, ...args),
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    
    // 新しいIPCチャネル: パス解決をメインプロセスに要求
    resolvePath: (...args) => ipcRenderer.invoke('resolve-path', ...args),

    // リスナーを削除
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});