const path = require('path');

function getWebpackConfigByName(projectName) {
    const DIR_PROJECT = path.resolve(__dirname, projectName);
    const DIR_SRC = path.resolve(DIR_PROJECT, 'src');
    const DIR_DIST = path.resolve(DIR_PROJECT, 'dist');

    const config = {
        target: 'node', // webpack默认构建目标是web，我们需要构建的是后端应用
        mode: 'development', // 开发模式编译速度最快，但文件体积较大
        entry: {
            // main: path.resolve(DIR_SRC, 'index.js'),
            main: DIR_SRC, // main: pro/src[/index.js]
        },
        output: {
            filename: '[name].js',
            path: DIR_DIST,
        },
        module: {
            rules: [
                { test: /\.js$/, use: [] },
                { test: /\.ts$/, use: ['babel-loader', 'ts-loader'] },
            ],
        },
        externals: [
            function ({ context, request }, callback) { // 官网和CLI提示不一致，此处遵循CLI标准
                console.log(`导入：${context} => ${request}`);
                // return callback(); // 临时关闭函数以测试
                // 排除node_modules模块以及loader
                if (!path.isAbsolute(request) && !request.match(/^\./)) { // require目标不是绝对路径，且不以dot开头，则大概率就是node_modules请求。
                    // 要排除入口，直接遍历config.entry字段似乎不太可行，因为有隐含规则，比如"./src/index.js"。
                    // 上下文不可以是cwd，或者__dirname，从而排除入口（此处担心入口是绝对路径，且不以dot开头，这样会造成编译完成但运行时找不到模块）
                    if (context !== process.pwd && context !== __dirname) {
                        // 还有一种情况：在import或require语句中指定了loader，而指定方式又有强制与非强制的区别。
                        // 一般来说，即便这些依赖项可以在运行时加载，不过我们也希望进行编译打包，从而方便开发
                        // 如果指定了loader，则一定含有感叹号！这种情况需要排除掉
                        if (!request.includes('!')) {
                            // 替换node_modules依赖请求
                            let instruction = `require('${request}')`;
                            console.log('运行时依赖:', `${request}由node_modules提供 => ${request} = ${instruction}`);
                            return callback(/*没有错误*/null, instruction);
                        }
                    }
                }
                return callback();
            },
        ],
    };
    return { config, DIR_DIST, };
}

/**
 * 导出一个提供config的函数，从而访问命令行参数，但是要区分Webpack-CLI参数和直接调用该导出的区别
 * Webpack-CLI会解析"--env production"为env: { production: true}，而不是argv: { entry: ["--env", "production"] }
 * Webpack-CLI会替换我们导出的config.entry为命令行中提供的entry，从而成为一个编译命令："webpack ./entry_a.js"
 * @param {*} env 由CLI解析的选项参数
 * @param {*} argv 
 */
module.exports = (env = {}, argv = { entry: [] }) => {
    // console.log({ env, argv });
    if (typeof env.project !== 'string') {
        throw new Error('请提供项目名称：--env project=name');
    }
    const { config, DIR_DIST, } = getWebpackConfigByName(env.project);
    if (env.rebuild) { // 重建dist产物
        const child_process = require('child_process');
        let removeDistCmd = `rm -rf ${DIR_DIST}`;
        console.log(`执行清理：${removeDistCmd}`.red);
        try { child_process.execSync(removeDistCmd); } catch (error) { console.error('清理失败'.red); }
    }
    if (env.rebuild || env.build) { // 编译最终产物
        config.mode = 'production';
        // delete config.externals; // 捆绑依赖
    }
    if (env.watch) { // watch模式持续编译，如果调用webpack(config, callback)时提供了回调，则可监听编译完成事件
        config.watch = true;
    }
    return config;
};