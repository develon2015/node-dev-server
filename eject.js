const path = require('path');
const fs = require('fs');

const DIR_NDS = __dirname;
const DIR_NDS_MODULES = path.resolve(DIR_NDS, 'node_modules');

function eject$babel_config_json() {
    const babel_config_json = {
        "plugins": [
            `${DIR_NDS_MODULES}${path.sep}@babel/plugin-proposal-class-properties`
        ],
        "presets": [
            [
                `${DIR_NDS_MODULES}${path.sep}@babel/preset-env`,
                {
                    "targets": {
                        "esmodules": true
                    }
                }
            ],
            [
                `${DIR_NDS_MODULES}${path.sep}@babel/preset-typescript`
            ]
        ]
    };
    fs.writeFileSync(path.resolve(process.cwd(), 'babel.config.json'), JSON.stringify(babel_config_json, null, 2));
}

function eject$webpack_config_js() {
    const filename = 'webpack.config.js';
    const webpack_config_js = fs.readFileSync(path.resolve(__dirname, './public/webpack.config.js')).toString('utf-8');
    const replace = webpack_config_js.replace('`@BABEL_LOADER`', JSON.stringify(`${DIR_NDS_MODULES}${path.sep}babel-loader`));
    fs.writeFileSync(path.resolve(process.cwd(), filename), replace);
}

function eject$tsconfig_json() {
    const filename = 'tsconfig.json';
    const webpack_config_js = fs.readFileSync(path.resolve(__dirname, './public/tsconfig.json.template')).toString('utf-8');
    const replace = webpack_config_js.replace('`@BABEL_LOADER`', JSON.stringify(`${DIR_NDS_MODULES}${path.sep}babel-loader`));
    fs.writeFileSync(path.resolve(process.cwd(), filename), replace);
}

function eject() {
    console.info('弹出配置文件！');
    eject$babel_config_json();
    eject$webpack_config_js();
    eject$tsconfig_json();
}

module.exports = eject;
