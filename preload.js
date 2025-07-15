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
    
    // メインプロセスにメッセージを送信
    sendSlideChanged: (slideNumber) => ipcRenderer.invoke('slide-changed', slideNumber),
    
    // PDF生成関連
    generatePDF: (options) => ipcRenderer.invoke('generate-pdf', options),
    getSlidesInDirectory: (directoryPath) => ipcRenderer.invoke('get-slides-in-directory', directoryPath),

    // i18n関連
    getLocalizedString: (key, ...args) => ipcRenderer.invoke('get-localized-string', key, ...args),
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    
    // リスナーを削除
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});