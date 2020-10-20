const path = require('path');

const DIR_PROJECT = path.resolve(__dirname, '.');
const DIR_SRC = path.resolve(DIR_PROJECT, 'src');
const DIR_DIST = path.resolve(DIR_PROJECT, 'dist');

const config = {
    target: 'node', // webpack默认构建目标是web，我们需要构建的是后端应用
    mode: 'development', // 开发模式编译速度最快，但文件体积较大
    module: {
        rules: [
            { test: /\.js$/, use: [] },
            { test: /\.ts$/, use: ['babel-loader', 'ts-loader'] },
        ],
    },
};

module.exports = (env = {}, argv) => { // 导出的是一个函数
    if (env.rebuild) { // 重建dist产物
        const child_process = require('child_process');
        child_process.execSync(`rm -rf ${DIR_DIST}`);
    }
    if (env.rebuild || env.build) { // 编译最终产物
        config.mode = 'production';
    }
    if (env.watch) { // watch模式持续编译，如果调用webpack(config, callback)时提供了回调，则可监听编译完成事件
        config.watch = true;
    }
    return config;
};