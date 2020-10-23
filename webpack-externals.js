const path = require('path');

/**
 * 该函数混入webpack.config.externals字段中, 可减轻开发时的编译量
 * @param {*} param0 
 * @param {*} callback 
 * @returns void
 */
function excludeNodeModules({ context, request }, callback) { // 官网和CLI提示不一致，此处遵循CLI标准，从第一个参数解构request
    console.log(`导入：${context} => ${request}`);
    // return callback(); // 临时关闭函数以测试
    // 由宿主环境提供node_modules下的模块，但进行编译loader加载的模块
    if (!path.isAbsolute(request) && !request.match(/^\./)) { // require目标不是绝对路径，且不以dot开头，则大概率就是node_modules请求。
        // 要排除入口。直接遍历config.entry字段似乎不太可行，因为有隐含规则，比如缺省值："./src/index.js"。
        // 上下文不可以是cwd，或者__dirname，从而排除入口（此处担心入口是绝对路径，且不以dot开头，这样会造成编译完成但运行时找不到模块）
        if (context !== process.pwd && context !== __dirname) {
            // 还有一种情况：在import或require语句中指定了loader，而指定方式又有强制与非强制的区别。
            // 一般来说，即便这些依赖项可以在运行时加载，不过我们也希望进行编译打包，从而方便开发，比如说ts-loader
            // 如果指定了loader，则一定含有感叹号！这种情况需要排除掉
            if (!request.includes('!')) {
                // 替换node_modules依赖请求
                let instruction = `require('${request}')`;
                console.log('运行时依赖:', `${request}由node_modules提供 => ${request} = ${instruction}`);
                return void callback(/*没有错误*/null, instruction);
            }
        }
    }
    return void callback();
}

module.exports = {
    excludeNodeModules,
};
