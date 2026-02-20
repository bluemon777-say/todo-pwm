const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("memoAPI", {
  list: () => ipcRenderer.invoke("memos:list"),
  add: (text) => ipcRenderer.invoke("memos:add", text),
  delete: (id) => ipcRenderer.invoke("memos:delete", id)
});
