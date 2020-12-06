const path = require('path');
const fs = require('fs');

/**
 * 查询依赖模块的绝对路径, 对于npm和cnpm, 依赖模块一定可以在项目的node_modules目录下找到, 对于Yarn, 则需要向上级目录查找
 * @param {string} module 
 */
function resolveModule(module) {
    var path_to_module = module; // 默认返回其自身
    var root = path.resolve(__dirname, '/node_modules'); // 系统根目录下的node_modules目录, 以此为终点
    for (let i = 0; i < 20; i++) {
        test = path.join(__dirname, `./${'../'.repeat(i)}/node_modules/${module}`); // 要测试的目录
        if (fs.existsSync(test)) {
            path_to_module = test;
            break;
        }
        if (test.startsWith(`${root}`)) {
            console.warn(`Module "${module}" not found !`);
            break;
        }
    }
    return path.normalize(path_to_module);
}

module.exports = {
    resolveModule,
};
