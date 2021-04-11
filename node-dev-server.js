const { resolveModule } = require('./resolve-module');
const path_to_webpack = resolveModule('webpack');
const webpack = require(path_to_webpack);

const child_process = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 项目根目录
 */
let project = undefined;
/**
 * package.json文件描述JSON对象
 */
let packageJSON = {};
/**
 * 项目名称，从package.json读取
 * 用来设置cmd窗口标题
 */
let projectName = 'Node Project';
/**
 * Node引擎的绝对路径, 通过process.argv0获取
 * argv0和argv[0]是有区别的
 */
const path_to_node = process.argv0 || 'node';
/**
 * 是否清理dist目录
 * 目前该参数只是作为"--env rebuild=false"的形式传入webpack.confg.js模块导出函数
 * 该导出函数只在初始化时被调用一次
 */
let rebuild = false;
/**
 * 当前启动的Node项目进程ID
 */
let pid = -1; // Node进程
/**
 * 新进程的工作目录, 由项目根目录下的webpack配置文件webpack.config.js指定
 * 默认是`${project}/dist`
 */
let dirDist = process.cwd;
/**
 * 是否监测
 */
let watch = true;
/**
 * 最终的webpack配置
 */
let finalConfig = {};

/**
 * 调用webpack API, 构建自己的CLI工具
 * $ node ./cli.js ...argv
 * 在webpack-cli中, argv将被传为config(env, argv)函数形参 -- argv.entry, 并强制改写最终的config对象的entry字段
 * @param {string[]} argv Node进程命令行参数
 */
function callWebpack(argv) {
    project = path.resolve(process.cwd(), argv.length < 1 ? '.' : argv[0]);
    console.info('项目根目录:', project);
    if (!fs.existsSync(project)) throw new Error('工程不存在！');
    // 解析项目根目录的package.json项目描述文件和webpack配置文件
    let pathWebpackConfigFile = path.resolve(project, 'webpack.config'); // 后缀待定，可以是js、cjs、mjs（需要使用import函数），甚至是json（不推荐）
    const pathPackageJSONFile = path.resolve(project, 'package.json');
    if (!fs.existsSync(pathPackageJSONFile)) { // 没有定义package.json文件，不是一个标准的Node.js项目
        console.warn('没有定义 package.json 文件，请初始化 Node.js 项目');
        projectName = project;
    } else {
        packageJSON = require(pathPackageJSONFile);
        projectName = packageJSON.name || project;
    }
    let config = {};
    if (['js', /*'cjs', 'mjs'*/].some(ext => {
        let fullname = `${pathWebpackConfigFile}.${ext}`;
        if (fs.existsSync(fullname)) {
            pathWebpackConfigFile = fullname;
            return true;
        }
    })) { // 导入webpack.config.[c]js模块
        config = require(pathWebpackConfigFile); // webpack.config.[cm]js文件导出的类型有：对象、Promise、函数
    } else {
        // throw new Error('没有发现配置文件：webpack.config.js');
        // 没有必要抛异常，因为Webpack5开箱即用
        console.warn('没有定义 webpack.config.js 文件，默认入口：src/index，默认输出：dist/main.js');
    }
    // 如果项目的webpack配置文件导出的是一个函数, 则立即调用该函数, 可能直接返回webpack.config, 也可能返回一个Promise对象
    if (typeof config === 'function') {
        config = config({ rebuild }, { color: true, entry: [/*此处并不会影响config*/] });
    }
    let awaitConfig = Promise.resolve(config); // 构造缺省Promise，设置resolevdConfig缺省值为config
    if (config.constructor === Promise) { // 检测导出的config是否是一个Promise对象
        awaitConfig = config;
    }
    awaitConfig.then((resolvedConfig) => { // 如果config不是Promise或返回Promise对象的函数, 则resolevdConfig不变，仍是config
        let configFromNDS = {
            mode: 'none', // Webpack缺省模式是'production', 编译非常慢
            target: 'node',
            externals: [], // 避免mergedConfig.externals为undefined
            entry: path.resolve(project, 'src/index'),
        };
        // 当然是持续监测依赖模块, 即时编译了. 有意思的是package.json文件也会引发编译
        let mergedConfig = { ...configFromNDS, ...resolvedConfig, watch };
        // 优化output字段
        mergedConfig.output = {
            // 由于dirDist根据config.output.path决定, 此处显式声明Webpack缺省值,
            // 因为就算用户在webpack.config.js中定义了output, 也不一定有path字段
            filename: 'main.js',
            path: path.resolve(project, 'dist'), 
            ...mergedConfig.output,
        };
        dirDist = mergedConfig.output.path; // 产物输出目录dirDist确定
        // 获取excludeNodeModules函数
        const excludeNodeModules = require('./webpack-externals')(project, dirDist, mergedConfig.output.libraryTarget, mergedConfig.resolve);
        // 合并externals数组
        mergedConfig.externals = [
            excludeNodeModules,
            ...([mergedConfig.externals]/*mergedConfig.externals可能是数组,也可能是函数等,构造数组再展平*/.flat()), // 最后解构一维数组
        ];
        // _log('最终Webpack配置:', mergedConfig);
        console.info('最终Webpack配置:', mergedConfig);
        finalConfig = mergedConfig;
        if (mergedConfig.target !== 'node' && mergedConfig.target !== 'electron-main') {
            console.warn('您编译的目标平台似乎不是node, 也不是electron-main?', '您在webpack.config.js中声明的目标平台是:', mergedConfig.target);
        }
        console.info('目标平台:', mergedConfig.target);
        console.info('输出目录:', dirDist);
        // webpack()函数返回一个Compiler对象，可提供一个回调函数，接受每次编译的error和state。
        // 其中error为null时并不一定代表编译成功。还得state.compilation.errors为empty才行。
        // state包含编译时间、编译hash等信息。
        // 如果传给webpack() API的第一个参数是数组，则error为ValidationError时至少有一个配置对象不合法
        // 同时state同样是对应的数组: MultiStatsMultiStats { stats: [ Stats { compilation: [Compilation] }, Stats { compilation: [Compilation] } ] }
        let compiler = webpack(mergedConfig, (error, state) => {
            if (error) { // Webpack配置出错, 强制结束node-dev-server
                console.error(error.message);
                forceExit('配置出错, Webpack拒绝编译');
            }
            if (state.compilation.errors.length === 0) {
                console.info('编译完成！');
                pid = restartNodeProject(pid, dirDist, mergedConfig.target);
                pid !== -1 && console.info(`项目 ${projectName} 已启动, root PID：${pid}`);
            } else {
                console.error('编译失败！');
                state.compilation.errors.forEach(it => {
                    // console.error(it.message);
                    // _log(it); // 使用原生输出函数显示具体编译错误
                    printWebpackCompileError(it); // 打印各种Webpack编译异常
                });
            }
            console.log(`耗时：${(state.compilation.endTime - state.compilation.startTime)} ms`);
            if (watch) {
                console.log(`等待文件变化，或使用命令“rs"重启程序`);
            } else {
                console.log('未启用监听，等待程序结束...');
            }
        });
    }).catch((error) => {
        forceExit(error.message);
    });
}

/**
 * nds主函数，仅当使用以下命令时启动nds：
 * 
 * $ nds [dir_project]
 */
function nds() {
    process.title = 'node-dev-server';
    process.once('SIGINT', onSIGINT); // 监听^C事件
    try {
        callWebpack(process.argv.splice(2)); // node[.exe] path_to_watch.js ...param
        watch && repl();
    } catch (error) {
        console.error(error.message);
    }
}

/** 重启项目Node进程 */
function restartNodeProject(pid, dirDist, target) {
    if (process.platform.match(/win/i)) return restartNodeProject_win(pid, dirDist, target);
    if (process.platform.match(/(linux|unix)/i)) return restartNodeProject_linux(pid, dirDist, target);
}

/**
 * 重启项目Node进程在Linux操作系统下的实现
 * @os Linux
 */
function restartNodeProject_linux(pid, dirDist, target) {
    try {
        try {
            pid !== -1 && process.kill(pid, 'SIGKILL');
            // pid !== -1 && child_process.execSync(`kill -9 ${pid}`);
        } catch (error) {
            console.error(`杀进程失败, 请自行确认`);
        }
        // 构建cmd命令, 进入dist目录执行main.js或index.js或者bundle.js等目标
        let cmd = `cd "${dirDist}" `;
        let finded = false;
        let files = ['main', 'index', 'bundle'];
        for (file of files) {
            if (fs.existsSync(`${dirDist}/${file}.js`)) { // 找寻入口文件
                if (target === 'electron-main') {
                    cmd += `&& electron ./${file}.js`;
                } else { // target === 'node'
                    cmd += `&& "${path_to_node/*此处必须使用双引号将Node引擎绝对路径包含,避免有空格*/}" ./${file}.js`;
                }
                finded = true;
                break;
            }
        }
        if (!finded) throw new Error(`输出目录下没有发现以下任何一个可执行文件：${files.join('.js ')}.js`);
        // bash 与 gnome-terminal 无关，它由 /usr/lib/gnome-terminal/gnome-terminal-server 产生:
        //     sh -> gnome-terminal --!--> gnome-terminal-server -> bash
        // 使用单命令注释 ": nds{${process.pid}};" 标记进程
        // const newCmd = `exec gnome-terminal -e 'bash -c ": By nds@${process.pid}; ${cmd.replace(/"/g, '\\"')}; echo Please press Enter to exit...; read"'`;
        // 参数“-e”弃用并可能在 gnome-terminal 的后续版本中移除。使用“--”以结束选项并将要执行的命令行追加至其后。
        // const newCmd = `exec gnome-terminal -- bash -c ": By nds@${process.pid}; ${cmd.replace(/"/g, '\\"')}; echo Please press Enter to exit...; read"`;
        const newCmd = `exec gnome-terminal -- bash -c ': By nds@${process.pid}; ${cmd}; echo Please press Enter to exit...; read'`;
        console.log(newCmd);
        // 启动shell执行命令
        // 同步的。因为execSync会先调用python3，再调用sh等shell执行该newCmd命令，直到有shell成功执行或者全部shell尝试失败
        child_process.execSync(newCmd);
        try {
            // 查询node进程pid
            let grep = child_process.execSync(`ps -ef | grep nds@${process.pid}`)
                .toString()
                .split('\n');
            // console.log('grep result:\n' + grep.join('\n'));

            // user   31730 30243  0 01:52 pts/22   00:00:00 bash -c : nds@31659; cd "/home/user/test/a b/dist" && "/snap/node/2690/bin/node" ./main.js; echo Please press Enter to exit...; read
            //            |     |                                            |
            //            |    PID of gnome-terminal-server                 PID of node-dev-server
            //            |
            //           PID of bash
            for (let i = 0; i < grep.length; i++) {
                let group = grep[i].match(/^.*?\s+(.*?)\s+(.*?)\s+.*: By nds@\d+.*$/);
                if (group) {
                    let pid = group[1];
                    return pid;
                }
            }
            throw new Error('grep result:\n' + grep.join('\n'));
        } catch (error) {
            console.error(error.message);
            console.error('无法查询bash进程PID');
        }
    } catch (error) {
        console.error(error.message);
        console.error('启动失败');
    }
    return -1;
}

/**
 * 重启项目Node进程在Windows操作系统下的实现
 * @os Windows
 */
function restartNodeProject_win(pid, dirDist, target) {
    try {
        try {
            pid !== -1 && child_process.execSync(`taskkill /F /PID ${pid} /T`); // "/T"参数非常关键, 配合"start /WAIT"命令
        } catch (error) {
            console.error(`杀进程失败, 请自行确认`);
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
                if (target === 'electron-main') {
                    cmd += `&& electron ./${file}.js`; // 服务端程序需要交互
                } else { // target === 'node'
                    // cmd += `&& "${path_to_node}" ./${file}.js <nul`; // 服务端程序通常是不需要交互的, 关闭输入流
                    cmd += `&& "${path_to_node/*此处必须使用双引号将Node引擎绝对路径包含,避免有空格*/}" ./${file}.js`; // 服务端程序需要交互
                }
                finded = true;
                break;
            }
        }
        if (!finded) throw new Error(`输出目录下没有发现以下任何一个可执行文件：${files.join('.js ')}.js`);
        // 使用start命令启动一个单独的窗口运行指定的程序或命令, "taskkill /F /T /PID <pid>"可杀死cmd窗口下的子进程树
        // "/WAIT"参数非常关键, 如果启动应用程序后不等待它终止就退出运行start命令的cmd.exe进程, 那么无法通过该root进程的pid追踪进程树
        const newCmd = `start "${projectName}" /WAIT cmd /c "${cmd} & pause"`;
        // 启动shell执行命令
        console.log(newCmd);
        const cp = child_process.exec(newCmd);
        return cp.pid;
    } catch (error) {
        console.error(error.message);
        console.error('启动失败');
    }
    return -1;
}

/**
 * 处理Ctrl+C中断信号
 * 由于使用了repl技术，该函数通常不会发挥作用，除非遇到^D中断
 */
function onSIGINT() {
    try {
        console.log('请再按一次^C以退出node-der-server'); // 此时进程即将退出, 出于对Windows用户的同情进行提示
    } catch (error) {
        console.log(error.message);
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
            pid = restartNodeProject(pid, dirDist, finalConfig.target);
            pid !== -1 && console.info(`项目 ${project} 已重启, root PID: ${pid}`);
        }
    });
    // rl.on('SIGINT', () => { // ^C 中断
    rl.on('close', () => { // ^C and ^D 中断
        try {
            console.info(`关闭 ${project} ...`);
            if (process.platform.match(/win/i)) { // win32
                // pid属于cmd进程, 因此需要针对平台杀进程树
                pid !== -1 && child_process.execSync(`taskkill /F /PID ${pid} /T 2>nul`); // "/T"参数非常关键, 配合"start /WAIT"命令
            } else {
                pid !== -1 && process.kill(pid, 'SIGKILL');
            }
        } catch (error) {
            console.error(error.message);
        }
        // 无论如何, 关闭自身
        console.info('关闭 node-dev-server ...');
        process.exit(0);
    });
}

function forceExit(msg) {
    console.error(msg);
    console.info('发生了错误，node-dev-server 结束运行!');
    process.exit(-1);
    throw msg;
}

/**
 * 标红不同Webpack编译错误的详细情报
 * @param {Error} error 
 */
function printWebpackCompileError(error) {
    // console.info(error.name);
    switch (error.name) {
        case 'ModuleNotFoundError': {
            // console.error(`${error.name}:`, error.details);
            console.error(error.stack);
            break;
        }
        case 'ModuleParseError': {
            console.error(error.stack);
            break;
        }
        default: {
            // _error(error);
            console.error(error.stack);
        }
    }
}

module.exports = nds;
