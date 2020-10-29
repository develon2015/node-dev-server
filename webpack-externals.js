const path = require('path');
/** 项目的根目录 */
let _projectRootDir = undefined;
/** 项目的产物目录 */
let _projectDistDir = undefined;
/** webpack.config.output.libaryTarget字段，umd和commonjs[2]和var的处理方式不同 */
let _libraryTarget = undefined;

/**
 * 该函数混入webpack.config.externals字段中, 可减轻开发时的编译量
 * @param {*} param0 
 * @param {*} callback 
 * @returns void
 */
function excludeNodeModules({ context, request }, callback) { // 官网和CLI提示不一致，此处遵循CLI标准，从第一个参数解构request
    // console.log(`导入：${context} => ${request}`);
    // return callback(); // 临时关闭函数以测试
    // 由宿主环境提供node_modules下的模块，但进行编译loader加载的模块
    // 放行用户模块
    if (!path.isAbsolute(request) && !request.match(/^\.\.?[\/\\]/)) { // require目标不是绝对路径，且不以'./'或'../'开头，则大概率就是node_modules请求。
        // 要排除入口。直接遍历config.entry字段似乎不太可行，因为有隐含规则，比如缺省值："./src/index.js"。
        // 上下文不可以是项目根目录projectRootDir，从而才能编译入口（此处担心入口是相对路径，且不以'./'或'../'开头，这样会造成编译完成但运行时找不到模块）
        if (true /*弃用判断*/ || context !== _projectRootDir) { // 放行webpack.config.js中定义的不以dot开头的相对路径，并警告
            // 还有一种情况：在import或require语句中指定了loader，而指定方式又有强制与非强制的区别。
            // 一般来说，即便这些依赖项可以在运行时加载，不过我们也希望进行编译打包，从而方便开发，比如说ts-loader
            // 如果指定了loader，则一定含有感叹号！这种情况需要排除掉
            if (!request.includes('!')) { // 放行loader模块
                // 替换node_modules依赖请求
                let instruction = `require('${request}')`;
                console.log('运行时模块:', `${request}由node_modules提供 => ${request} = ${instruction}`);
                if (_libraryTarget === 'umd' || _libraryTarget === 'commonjs' || _libraryTarget === 'commonjs2') {
                    console.info('UMD 或 CommonJS 模式');
                    return void callback(/*没有错误*/null, request);
                }
                return void callback(/*没有错误*/null, instruction);
            } else {
                console.log(`导入loader模块：${request}`);
            }
        } else { // 该警告已弃用
            console.warn(`非法的入口模块：${request}，请使用绝对路径、以"./"或"../"开头的相对路径定义入口`);
        }
    } else {
        let relativeDist = path.relative(_projectDistDir, path.resolve(context, request));
        let relativeRoot = path.relative(_projectRootDir, path.resolve(context, request));
        // console.log(`导入用户模块：${path.resolve(context, request)}`);
        console.log(`导入用户模块：${relativeRoot}`);
        if (!relativeDist.startsWith('..')) {
            throw new Error(`不建议使用产物目录 ${_projectDistDir} 中的模块: ${relativeDist}`);
        }
    }
    return void callback(); // 放行入口、loader、用户模块
}

/**
 * 初始化projectRootDir, 从而获取excludeNodeModules函数的引用
 * @param {string} projectRootDir 项目的根目录
 * @param {string} projectDistDir 项目的产物目录
 * @param {string} libaryTarget webpack.config.output.libaryTarget字段，umd和commonjs[2]和var的处理方式不同
 */
module.exports = function (projectRootDir, projectDistDir, libraryTarget) {
    _projectRootDir = projectRootDir;
    _projectDistDir = projectDistDir;
    _libraryTarget = libraryTarget;
    return excludeNodeModules;
};
