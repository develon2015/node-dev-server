#!/usr/bin/env node
const webpack = require('webpack');
const getWebpackConfig = require('./webpack.config');
const child_process = require('child_process');
require('colors');

/**
 * 构建自己的webpack CLI工具
 * $ node ./watch.js ...param
 * param将被传为config(env, argv)函数形参 -- argv.entry
 * @param {string[]} argv Node.js命令行参数, webpack.config.js中的argv.entry
 */
function callWebpack(argv) {
    if (argv.length < 1) {
        throw new Error('请提供项目名称');
    }
    let config = getWebpackConfig({ rebuild: false, watch: true, project: argv[0] || undefined, }, { color: true, entry: [/*此处并不会影响config*/] }); // call ./webpack.config.js
    const dirDist = config.output.path;
    let pid = -1; // Node进程
    // webpack()函数返回一个Compiler对象，可提供一个回调函数，接受每次编译的error和state。
    // 其中error为null时并不一定代表编译成功。还得state.compilation.errors为empty才行。
    // state包含编译时间、编译hash等信息。
    let compiler = webpack(config, (error, state) => {
        if (!error && state.compilation.errors.length === 0) {
            console.log('编译完成'.green);
            pid = restartNodeProject(pid, dirDist);
            console.log(`项目已启动：${pid}`.green);
        } else {
            console.error('编译失败'.red);
            // console.error(state.compilation.errors);
            state.compilation.errors.forEach(it => {
                console.error(it.message.red);
            });
        }
        console.log(`耗时：${(state.compilation.endTime - state.compilation.startTime)} ms`);
    });
}

/** 主函数，立即执行 */
void function main() {
    try {
        callWebpack(process.argv.splice(2)); // node[.exe] path_to_watch.js ...param
    } catch (error) {
        console.error(error.message.red);
    }
}()

/** 重启项目Node进程 */
function restartNodeProject(pid, dirDist) {
    return restartNodeProject_win(pid, dirDist);
}

/** 重启项目Node进程在Windows操作系统下的实现 */
function restartNodeProject_win(pid, dirDist) {
    try {
        try {
            child_process.execSync(`taskkill /F /PID ${pid}`); // 没有效果
        } catch (error) { }
        let cp = child_process.exec(`cmd /c "${
            `cd "${dirDist}" && ping -t localhost`.replace(/"/g, `""`) // 工作路径等命令需要转义双引号
        }"`);
        return cp.pid;
    } catch (error) {
        console.error('启动失败'.red);
    }
    return -1;
}