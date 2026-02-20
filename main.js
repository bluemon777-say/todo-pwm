const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs/promises");

let mainWindow;

function getDataFilePath() {
  // OS별 앱 데이터 저장 폴더에 저장
  return path.join(app.getPath("userData"), "memos.json");
}

async function ensureDataFile() {
  const filePath = getDataFilePath();
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify({ memos: [] }, null, 2), "utf-8");
  }
}

async function readMemos() {
  await ensureDataFile();
  const raw = await fs.readFile(getDataFilePath(), "utf-8");
  const data = JSON.parse(raw);
  return Array.isArray(data.memos) ? data.memos : [];
}

async function writeMemos(memos) {
  await fs.writeFile(getDataFilePath(), JSON.stringify({ memos }, null, 2), "utf-8");
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 520,
    height: 680,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile("index.html");
}

app.whenReady().then(async () => {
  await ensureDataFile();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// IPC API
ipcMain.handle("memos:list", async () => {
  return await readMemos();
});

ipcMain.handle("memos:add", async (_evt, text) => {
  const t = (text ?? "").trim();
  if (!t) return await readMemos();

  const memos = await readMemos();
  const item = {
    id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    text: t,
    createdAt: new Date().toISOString()
  };
  memos.unshift(item);
  await writeMemos(memos);
  return memos;
});

ipcMain.handle("memos:delete", async (_evt, id) => {
  const memos = await readMemos();
  const next = memos.filter((m) => m.id !== id);
  await writeMemos(next);
  return next;
});
