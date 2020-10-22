#!/usr/bin/env node
const webpack = require('webpack');
const getWebpackConfig = require('./webpack.config');
const child_process = require('child_process');
const fs = require('fs');
require('colors');

/**
 * 项目目录名称
 * 我想应该没有人用双引号等特殊字符吧
 */
let project = undefined;
/**
 * Node引擎的绝对路径, 通过process.argv0获取
 */
let path_to_node = 'node';
/**
 * 是否清理dist目录
 */
let rebuild = false;
/**
 * 当前启动的Node项目进程IP
 */
let pid = -1; // Node进程
/**
 * 新进程的工作目录
 */
let dirDist = process.cwd;

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
    project = argv[0] || undefined;
    let config = getWebpackConfig({ rebuild, watch: true, project, }, { color: true, entry: [/*此处并不会影响config*/] }); // call ./webpack.config.js
    dirDist = config.output.path;
    // webpack()函数返回一个Compiler对象，可提供一个回调函数，接受每次编译的error和state。
    // 其中error为null时并不一定代表编译成功。还得state.compilation.errors为empty才行。
    // state包含编译时间、编译hash等信息。
    let compiler = webpack(config, (error, state) => {
        if (!error && state.compilation.errors.length === 0) {
            console.log('编译完成'.green);
            pid = restartNodeProject(pid, dirDist);
            pid !== -1 && console.log(`项目 ${project} 已启动, root PID：${pid}`.green);
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
    consoleHook();
    process.title = 'node-dev-server';
    path_to_node = process.argv0;
    process.once('SIGINT', onSIGINT); // 监听^C事件
    try {
        callWebpack(process.argv.splice(2)); // node[.exe] path_to_watch.js ...param
        repl();
    } catch (error) {
        console.error(error.message.red);
    }
}()

/** 重启项目Node进程 */
function restartNodeProject(pid, dirDist) {
    return restartNodeProject_win(pid, dirDist);
}

/**
 * 重启项目Node进程在Windows操作系统下的实现
 * @os Windows
 */
function restartNodeProject_win(pid, dirDist) {
    try {
        try {
            pid !== -1 && child_process.execSync(`taskkill /F /PID ${pid} /T`); // "/T"参数非常关键, 配合"start /WAIT"命令
        } catch (error) {
            console.error(`杀进程失败, 请自行确认`.red);
        }
        // 构建cmd命令, 进入dist目录执行main.js或index.js或者bundle.js等目标
        // let cmd = `cd /D "${dirDist.replace(/"/g, `""`)/*cmd下可以使用两个双引号转义双引号,但不适用于一些特殊的内置命令*/}" && false 2>nul `;
        let cmd = `cd /D "${dirDist}" `; // cd命令居然可以不加双引号地跳转到路径中含有空格的目录, 不过不建议这样做
        let finded = false;
        let files = ['main', 'index', 'bundle'];
        for (file of files) {
            // cmd += `|| "${path_to_node}" ./${file}.js`; // 找不到文件时会报错
            // cmd += `|| "${path_to_node}" ./${file}.js 2>nul`; // 无法使用console.error()
            // cmd += `|| "${path_to_node}" ./${file}.js 2>nul <nul`;
            if (fs.existsSync(`${dirDist}/${file}.js`)) { // 找寻入口文件
                // cmd += `&& "${path_to_node}" ./${file}.js <nul`; // 服务端程序通常是不需要交互的, 关闭输入流
                cmd += `&& "${path_to_node/*此处必须使用双引号将Node引擎绝对路径包含,避免有空格*/}" ./${file}.js`; // 服务端程序需要交互
                finded = true;
                break;
            }
        }
        if (!finded) throw new Error(`没有发现以下入口文件：${files.join('.js ')}`);
        // 使用start命令启动一个单独的窗口运行指定的程序或命令, "taskkill /F /T /PID <pid>"可杀死cmd窗口下的子进程树
        // "/WAIT"参数非常关键, 如果启动应用程序后不等待它终止就退出运行start命令的cmd.exe进程, 那么无法通过该root进程的pid追踪进程树
        const newCmd = `start "${project}" /WAIT cmd /c "${cmd} & pause"`;
        // 启动shell执行命令
        console.log(newCmd);
        const cp = child_process.exec(newCmd);
        return cp.pid;
    } catch (error) {
        console.error(error);
        console.error('启动失败'.red);
    }
    return -1;
}

/**
 * 处理Ctrl+C中断信号
 */
function onSIGINT() {
    try {
        console.log('请再按一次^C以退出node-der-server'); // 此时进程即将退出, 出于对Windows用户的同情进行提示
    } catch (error) {
        console.log(error);
    }
    process.exit(0);
}

/**
 * 交互界面
 */
function repl() {
    const readline = require('readline');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.on('line', (input) => {
        if (input === 'rs') {
            console.log('重启应用程序...');
            pid = restartNodeProject(pid, dirDist);
            console.log(`项目 ${project} 已重启, root PID: ${pid}`);
        }
    })
    // rl.on('SIGINT', () => {
    rl.on('close', () => {
        console.log('关闭 node-dev-server...');
        if (process.platform.match(/win/)) { // win32
            console.log(`关闭 ${project}...`);
            child_process.execSync(`taskkill /F /PID ${process.ppid} /T`); // "/T"参数非常关键, 配合"start /WAIT"命令
        }
        process.kill(process.ppid, 'SIGINT');
    });
}

function consoleHook() {
    const _log = console.log;
    const _err = console.error;
    console.log = (...params) => {
        _log('[I]'.green, ...params);
    };
    console.error = (...params) => {
        _err('[E]'.red, ...params);
    };
    if (process.platform.match(/win/)) { // win32
        child_process.execSync('chcp 65001'); // 解决Windows下输出乱码问题
    }
}
