const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const fs = require('fs');
const path = require('path');

// 创建窗口
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200, // 适配双栏预览，加宽窗口
    height: 800,
    maximizable: true, // 允许窗口最大化
    // 如果需要启动时就最大化，取消下面这行的注释
    // show: false, // 先不显示窗口
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  
  // 加载页面
  mainWindow.loadFile('index.html');
  
  // 隐藏默认菜单
   // Menu.setApplicationMenu(null);
  
  // 仅在开发环境打开开发者工具
  // 生产环境打包时会自动关闭
  //if (process.env.NODE_ENV !== 'production') {
    //mainWindow.webContents.openDevTools();
 // }
  
  // 如果设置了启动时最大化，添加下面的代码
  // mainWindow.once('ready-to-show', () => {
  //   mainWindow.maximize();
  //   mainWindow.show();
  // });
}

// 1. 处理打开图像请求（与前端消息名称统一）
ipcMain.on('open-image-request', async (event) => {
  const result = await dialog.showOpenDialog({
    title: '选择图像',
    filters: [{ name: '图像文件', extensions: ['jpg', 'jpeg', 'png', 'bmp'] }],
    properties: ['openFile']
  });
  if (!result.canceled) {
    event.reply('open-image-response', result.filePaths[0]); // 回复前端
  }
});

// 2. 处理保存图像请求（与前端消息名称统一）
ipcMain.on('save-image-request', async (event, base64Data) => {
  const result = await dialog.showSaveDialog({
    title: '保存图像',
    defaultPath: path.join(app.getPath('desktop'), '处理后图像.jpg'),
    filters: [{ name: 'JPEG', extensions: ['jpg'] }]
  });
  if (!result.canceled && result.filePath) {
    try {
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(result.filePath, buffer);
      event.reply('save-image-response', true);
    } catch (err) {
      console.error('保存失败:', err);
      event.reply('save-image-response', false);
    }
  }
});

// 3. 处理退出请求
ipcMain.on('exit-app-request', () => {
  app.quit(); // 主进程退出应用（比前端window.close()更可靠）
});

// 应用生命周期
app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
