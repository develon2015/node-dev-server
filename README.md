# node-dev-server

Node.js后端开发自动重启以apply更新, 对标前端开发工具webpack-dev-server.


## 原理

读取并处理webpack.config.js文件, 使用 ![webpack](https://github.com/webpack/webpack) 提供的API函数 -- `webpack()` 编译并处理编译状态。
```
const webpack: (options: Configuration, callback?: CallbackWebpack<Stats>) => Compiler
const webpack: (options: Configuration[], callback?: CallbackWebpack<Stats>) => Compiler
```


## usage

```
$ yarn start:dev uexpress
Active code page: 65001
导入：D:\Code\Node\pure-node\webpack-usage => D:\Code\Node\pure-node\webpack-usage\uexpress\src
导入：D:\Code\Node\pure-node\webpack-usage\uexpress\src => colors
运行时依赖: colors由node_modules提供 => colors = require('colors')
导入：D:\Code\Node\pure-node\webpack-usage\uexpress\src => express
运行时依赖: express由node_modules提供 => express = require('express')
编译完成
项目已启动, root PID：34672
耗时：129 ms
```
