const path = require('path');
const fs = require('fs');
const { resolveModule } = require('./resolve-module');

const DIR_NDS = __dirname;
// const DIR_NDS_MODULES = path.resolve(DIR_NDS, 'node_modules');

let _project = '.';

function eject$babel_config_json() {
    const babel_config_json = {
        "plugins": [
            resolveModule('@babel/plugin-proposal-class-properties'),
        ],
        "presets": [
            [
                resolveModule('@babel/preset-env'),
                {
                    "targets": {
                        "esmodules": true
                    }
                }
            ],
            [
                resolveModule('@babel/preset-typescript'),
            ],
        ]
    };
    fs.writeFileSync(path.resolve(_project, 'babel.config.json'), JSON.stringify(babel_config_json, null, 2));
}

function eject$webpack_config_js() {
    const filename = 'webpack.config.js';
    const webpack_config_js = fs.readFileSync(path.resolve(__dirname, './public/webpack.config.js')).toString('utf-8');
    const replace = webpack_config_js.replace('`@BABEL_LOADER`', JSON.stringify(resolveModule('babel-loader')));
    fs.writeFileSync(path.resolve(_project, filename), replace);
}

function eject$tsconfig_json() {
    const filename = 'tsconfig.json';
    const tsconfig_json = fs.readFileSync(path.resolve(__dirname, './public/tsconfig.json.template')).toString('utf-8');
    fs.writeFileSync(path.resolve(_project, filename), tsconfig_json);
}

function eject(project = process.cwd()) {
    _project = project;
    console.info('弹出配置文件！');
    eject$babel_config_json();
    eject$webpack_config_js();
    eject$tsconfig_json();
}

module.exports = eject;
