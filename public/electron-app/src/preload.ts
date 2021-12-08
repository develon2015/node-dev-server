import { contextBridge, ipcRenderer } from "electron";
import { userInfo } from "os";

// 暴露接口
const myAPI = {
    getUserName() {
        // 即使开启上下文隔离，预加载脚本仍然可以通过contextBridge将Node.js功能暴露给渲染脚本
        return userInfo().username;
    },
    ipcRenderer,
};
contextBridge.exposeInMainWorld('myAPI', myAPI);

window.addEventListener('DOMContentLoaded', () => {
    // 预加载脚本可以访问document
    var h1: HTMLHeadElement = document.querySelector('h1#info');
    h1.innerText = `Hello, ${myAPI.getUserName()}`;
});
