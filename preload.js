const { contextBridge, ipcRenderer } = require('electron');

// メインプロセスとレンダラープロセス間の安全な通信を設定
contextBridge.exposeInMainWorld('electronAPI', {
    // メインプロセスからのメッセージを受信
    onNextSlide: (callback) => ipcRenderer.on('next-slide', callback),
    onPrevSlide: (callback) => ipcRenderer.on('prev-slide', callback),
    onFirstSlide: (callback) => ipcRenderer.on('first-slide', callback),
    onLastSlide: (callback) => ipcRenderer.on('last-slide', callback),
    
    // メインプロセスにメッセージを送信
    sendSlideChanged: (slideNumber) => ipcRenderer.invoke('slide-changed', slideNumber),
    
    // リスナーを削除
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});