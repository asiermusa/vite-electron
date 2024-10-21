const {
    contextBridge,
    ipcRenderer,
    session
} = require('electron');

// contextBridge lets us define a varible ('window.ipc' here) which
// can include functions that call ipcRenderer functions.


contextBridge.exposeInMainWorld('ipc', {
    //https://stackoverflow.com/questions/57807459/how-to-use-preload-js-properly-in-electron
    send: (channel, data) => ipcRenderer.send(channel, data),
    handle: (channel, callable, event, data) => ipcRenderer.on(channel, callable(event, data))
});