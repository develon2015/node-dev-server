/*
 * 这是一个 electron-main 应用程序示例.
 * 
 * 要运行, 请先修改webpack目标为: target: 'electron-main'.
 * 
 * 要抑制IDE报错, 请安装@types/node.
 */

import * as electron from 'electron';
import * as path from 'path';

var app = electron.app;
var win: electron.BrowserWindow;

async function main() {
    await app.whenReady();
    console.log('Hello, Electron with TypeScript!');
    win = new electron.BrowserWindow();
    let file = path.resolve(__dirname, '../src/index.html');
    console.log({ file });
    win.loadFile(file);
}

main();
