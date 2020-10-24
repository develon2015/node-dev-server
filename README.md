# node-dev-server

Node.js后端开发自动重启以apply更新, 对标前端开发工具webpack-dev-server.
后人有诗云：
> node-dev-server之于后端，webpack-dev-server之于前端


## Install

Install the global command "node-dev-server" or "nds":
```
$ yarn global add @develon/node-dev-server
```
or
```
$ npm install --global @develon/node-dev-server
```


## Usage

For example, watch and compile the project "uexpress":
```
$ nds uexpress
```
or
```
$ cd uexpress && node-dev-server
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


### 原理

读取并处理webpack.config.js文件, 使用Webpack提供的API函数 -- `webpack()` 编译并处理编译状态。
```
const webpack: (options: Configuration, callback?: CallbackWebpack<Stats>) => Compiler
const webpack: (options: Configuration[], callback?: CallbackWebpack<Stats>) => Compiler
```
![webpack](https://webpack.js.org/1fcab817090e78435061.svg)
