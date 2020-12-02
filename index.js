const nds = require('./node-dev-server');
const eject = require('./eject');
const { consoleHook, _log, } = require('./console-hook');

function main() {
    switch (process.argv[2]) {
        case '-ej':
        case '--eject': {
            consoleHook();
            eject();
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
Usage: nds [project | options]
       node-dev-server [project | options]

       Serves a Node.js app. Restart the app on changes.
    
       Options:
           [project]            project directory
           -ej, --eject         eject the TypeScript supported configuration file
           -h, --help           display help for command`;
    _log(info);
}

main();
