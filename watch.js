#!/usr/bin/env node
const webpack = require('webpack');
const config = require('./webpack.config');
const child_process = require('child_process');

main(process.argv.splice(2));

function main(argv) {
    let _config = config({ rebuild: false, watch: true, });
    // webpack()函数返回一个Compiler对象，可提供一个回调函数，接受每次编译的error和state。
    // 其中error为null时并不一定代表编译成功。还得state.compilation.errors为empty才行。
    // state包含编译时间、编译hash等信息。
    let compiler = webpack(_config, (error, state) => {
        if (!error && state.compilation.errors.length === 0) {
            console.log('编译完成');
        } else {
            console.log('编译失败');
            console.log(state.compilation.errors);
        }
        console.log(`耗时：${(state.compilation.endTime - state.compilation.startTime)} ms`);
    });
}