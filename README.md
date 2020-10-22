# node-dev-server

Node.js后端开发自动重启以apply更新, 对标前端开发工具webpack-dev-server.


## 原理

读取并处理webpack.config.js文件, 使用 ![webpack](https://webpack.js.org/1fcab817090e78435061.svg) 提供的API函数 -- `webpack()` 编译并处理编译状态。
```
const webpack: (options: Configuration, callback?: CallbackWebpack<Stats>) => Compiler
const webpack: (options: Configuration[], callback?: CallbackWebpack<Stats>) => Compiler
```


## Install

```
$ yarn install && yarn link
$ node-dev-serve
```


## Usage

```
$ cd uexpress && yarn install
...
$ node-dev-serve uexpress
[I] 工作目录: C:\Users\ly\Desktop\uexpress
[I] 导入：C:\Users\ly\Desktop\uexpress => C:\Users\ly\Desktop\uexpress\src
[I] 导入：C:\Users\ly\Desktop\uexpress\src => colors
[I] 运行时依赖: colors由node_modules提供 => colors = require('colors')
[I] 导入：C:\Users\ly\Desktop\uexpress\src => express
[I] 运行时依赖: express由node_modules提供 => express = require('express')
[I] 编译完成
[I] start "C:\Users\ly\Desktop\uexpress" /WAIT cmd /c "cd /D "C:\Users\ly\Desktop\uexpress\dist" && "C:\Program Files\nodejs\node.exe" ./main.js & pause"
[I] 项目 C:\Users\ly\Desktop\uexpress 已启动, root PID：14104
[I] 耗时：78 ms
[I] 等待文件变化，或使用命令“rs"重启程序
[I] 关闭 node-dev-server ...
[I] 关闭 C:\Users\ly\Desktop\uexpress ...
error Command failed with exit code 1.
info Visit https://yarnpkg.com/en/docs/cli/run for documentation about this command.
```
