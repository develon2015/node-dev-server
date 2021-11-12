const path = require('path');
const fs = require('fs-extra');

const nds = require('./node-dev-server');
const eject = require('./eject');
const { consoleHook, _log, } = require('./console-hook');

/**
 * Create a project dir and init it
 * @param {string} project 
 */
function create(project) {
    console.info(`Create project ${project}`);
    fs.mkdirSync(project); // dir: pro
    init(project);
}

/**
 * Init a project, e.g: eject the TypeScript config file.
 * @param {string} project 
 */
function init(project) {
    console.info(`Init project ${project}`);
    const DIR_APP = path.resolve(project, '.');
    const DIR_APP_TEMPLATE = path.resolve(__dirname, './public/app'); // 项目模板
    fs.copySync(DIR_APP_TEMPLATE, DIR_APP);
    eject(project);
    console.log(`A electron-main project init succeed! To continue, please:\n\ncd ${project}\nyarn setup`);
}

function main() {
    switch (process.argv[2]) {
        case '-i':
        case 'init':
        case '--init': { // Init cwd() or a project
            consoleHook();
            init(path.resolve(process.cwd(), process.argv[3] || '.'));
            break;
        }
        case '-c':
        case 'create':
        case '--create': { // Create a project directory and init
            if (!process.argv[3]) { // No a project name provided
                help();
                break;
            }
            consoleHook();
            create(path.resolve(process.cwd(), process.argv[3]));
            break;
        }
        case '-ej':
        case 'eject':
        case '--eject': {
            consoleHook();
            eject(path.resolve(process.cwd(), process.argv[3] || '.'));
            break;
        }
        case '-h':
        case 'help':
        case '-help':
        case '--help': {
            help();
            break;
        }
        case '-v':
        case '-V':
        case 'version':
        case '--version': {
            version();
            break;
        }
        case '-j':
        case '-just':
        case '--just': {
            consoleHook();
            nds(true);
            break;
        }
        default: {
            consoleHook();
            nds();
        }
    }
}

function help() {
    const info = `
Usage: nds [options] [project]
       node-dev-server [options] [project]

       Serves a Node.js app. Restart the app on changes.
    
       Options:
           [project]            The project directory
           -c, --create         Create a TypeScript project and init it
           -i, --init           Init a TypeScript project
           -ej, --eject         Eject the TypeScript supported configuration file
           -j, --just           Just auto compile, don't run
           -v, --version        Display version of node-dev-server
           -h, --help           Display help for command`;
    _log(info);
    process.exit(0);
}

function version() {
    const PACKAGE_JSON = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json')));
    console.log(PACKAGE_JSON.version);
}

main();
