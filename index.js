const path = require('path');
const fs = require('fs');

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
    const DIR_SRC = path.resolve(project, 'src');
    fs.mkdirSync(DIR_SRC); // dir: pro/src
    fs.writeFileSync(path.resolve(DIR_SRC, 'index.ts'), `console.log('Hello, TypeScript!');\n`); // file: pro/src/index.ts
    eject(project);
    console.log(`Project init succeed! To continue, please:\n\ncd ${project}\nyarn init -y\nyarn add @types/node`);
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
           -h, --help           Display help for command`;
    _log(info);
    process.exit(0);
}

main();
