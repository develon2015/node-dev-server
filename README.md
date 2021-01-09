<div align="center">
  <a href="https://webpack.js.org" target="_blank"><img src="https://webpack.js.org/1fcab817090e78435061.svg" width="200" alt="Webpack Logo" /></a>
  <h1>node-dev-server</h1>
  <div>Serves a Node.js app. Restart the app on changes.</div>
  <div>
    <a href="https://www.npmjs.com/package/@develon/node-dev-server">
      <img alt="version" src="https://img.shields.io/npm/v/@develon/node-dev-server?logoColor=brightgreen"/>
    </a>
    <a href="https://www.npmjs.com/package/@develon/node-dev-server">
      <img alt="license" src="https://img.shields.io/npm/l/@develon/node-dev-server">
    </a>
    <a href="https://www.npmjs.com/package/@develon/node-dev-server">
      <img alt="downloads" src="https://img.shields.io/npm/dw/@develon/node-dev-server">
    </a>
    <a href="https://www.npmjs.com/package/@develon/node-dev-server">
      <img alt="webpack" src="https://img.shields.io/github/package-json/dependency-version/develon2015/node-dev-server/webpack?color=green">
    </a>
    <a href="https://www.npmjs.com/package/@develon/node-dev-server">
      <img alt="webpack-cli" src="https://img.shields.io/github/package-json/dependency-version/develon2015/node-dev-server/webpack-cli?color=green">
    </a>
  </div>
</div>

## Description

Serves a Node.js app. Restart the app on changes. Just like the webpack-dev-server but this is not web.

Why not use the [nodemon](https://github.com/remy/nodemon)?

1. We use webpack5, not simply watch the OS File-System events;

2. We can kill already exists process, compile and restart a cmd.exe window on source-code changes.

(Only implemented on the Windows OS currently, and Gnome-terminal)


## Install

This is a CLI program, install the global command "node-dev-server" or "nds" by:
```
$ yarn global add @develon/node-dev-server
```
or
```
$ npm install --global @develon/node-dev-server
```

Version `1.3.0` 增加了模块解析, 需要全局安装`webpack`以及`webpack-cli`:
```
$ yarn global add webpack webpack-cli
```


## Usage

Start watching a project:
```
$ nds [project]
```

For example, watch and compile the project "uexpress":
```
node-dev-server $ cd uexpress
uexpress $ yarn install       #Installation dependencies
uexpress $ nds .              #Start watching
```

Then you can see this output, and a new cmd.exe window running the project "uexpress":
```
[I] 项目根目录: D:\node-dev-server\uexpress
[I] 最终Webpack配置: {
  "mode": "none",
  "target": "node",
  "externals": [
    "[Function: excludeNodeModules]"
  ],
  "entry": {
    "main": "D:\\node-dev-server\\uexpress\\src\\index.js"
  },
  "output": {
    "path": "D:\\node-dev-server\\uexpress\\dist",
    "filename": "[name].js"
  },
  "module": {
    "rules": [
      {
        "test": "/\\.js$/",
        "use": []
      },
      {
        "test": "/\\.ts$/",
        "use": [
          "babel-loader",
          "ts-loader"
        ]
      }
    ]
  },
  "watch": true
}
[I] 输出目录: D:\Code\Node\pure-node\webpack-usage\uexpress\dist
[V] 导入：D:\Code\Node\pure-node\webpack-usage => D:\Code\Node\pure-node\webpack-usage\uexpress\src\index.js
[V] 导入：D:\Code\Node\pure-node\webpack-usage\uexpress\src => colors
[V] 运行时依赖: colors由node_modules提供 => colors = require('colors')
[V] 导入：D:\Code\Node\pure-node\webpack-usage\uexpress\src => express
[V] 运行时依赖: express由node_modules提供 => express = require('express')
[I] 编译完成！
[V] start "uexpress" /WAIT cmd /c "cd /D "D:\Code\Node\pure-node\webpack-usage\uexpress\dist" && "node" ./main.js & pause"
[I] 项目 uexpress 已启动, root PID：40996
[V] 耗时：112 ms
[V] 等待文件变化，或使用命令“rs"重启程序
[I] 关闭 D:\Code\Node\pure-node\webpack-usage\uexpress ...
[I] 关闭 node-dev-server ...
```


### 开箱即用的TypeScript支持

创建TypeScript项目：
```
$ nds create "app" && cd "app"

app $ yarn setup
app $ vi src/index.ts      #edit project entry
app $ nds .                #compile and watch
```
or
```
$ mkdir app && cd app
app $ yarn init -y         #initialize a Node.js project

app $ nds init .           #init nds project

app $ yarn setup
app $ vi src/index.ts      #edit project entry
app $ nds .                #compile and watch
```

脚本`yarn setup`做了什么事？它主要弹出一个与用户环境相关的js模块——`nds-babel.js`：
```
nds --eject && yarn add -D @types/node
```


### Electron-main支持

nds创建的模板项目自带类型声明文件`electron.d.ts`。必要时可全局安装`electron`，然后link到本地以提供相应版本的类型支持。
要开发electron-main应用程序, 直接修改webpack配置文件的目标为`electron-main`, nds会使用`electron`而不是`node`来执行`dist/main.js`:
```
const CONFIG = {
  target: 'electron-main',
  ...
}
```


### About

该程序通过读取并处理webpack.config.js文件, 使用Webpack提供的API函数 -- `webpack()` 编译并处理编译状态。
```
const webpack: (options: Configuration, callback?: CallbackWebpack<Stats>) => Compiler
const webpack: (options: Configuration[], callback?: CallbackWebpack<Stats>) => Compiler
```
