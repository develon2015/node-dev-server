import electron from 'electron';
import path from 'path';
// @ts-ignore
import html from '!file-loader?name=[name].[ext]!./index.html';
// @ts-ignore
import renderer from '!file-loader?name=[name].js!./renderer';

var app = electron.app;
var win: electron.BrowserWindow;

async function main() {
    await app.whenReady();
    win = new electron.BrowserWindow({
        width: 1680,
        height: 800,
        webPreferences: {
            nodeIntegration: false, // 集成Node.js
            nodeIntegrationInWorker: false, // WebWorker中集成Node.js
            // 即使使用了nodeIntegration: false，为了真正执行强隔离并防止使用Node基元，还必须使用contextIsolation。
            contextIsolation: true, // 上下文隔离
            enableRemoteModule: false, // 远程模块
            preload: path.resolve(__dirname, `preload.js`), // 预加载脚本
        },
    });
    console.log({ __dirname, html, renderer });
    win.loadFile(html);
    win.webContents.openDevTools();
    enableAPI();
}

function enableAPI() {
    electron.ipcMain.on('bye', (_, millis) => {
        console.log(`System will exit after ${millis} ms.`);
        setTimeout(() => {
            process.exit(0);
        }, millis);
    });
}

main();
