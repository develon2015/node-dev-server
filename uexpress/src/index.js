import express from 'express';
require('colors');

function init() {
    const app = express();
    app.use((req, res, next) => {
        next();
    });
    app.use((req, res, next) => {
        res.send({ code: 404 });
    });
    app.listen(80, () => {
        console.log('服务器已启动'.green);
    });
}

void function main() {
    init();
}()