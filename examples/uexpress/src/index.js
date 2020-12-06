import express from 'express';
import 'colors';
// import beforeHandleRequest from './router/beforeHandleRequest';
import beforeHandleRequest from '@/router/beforeHandleRequest';

function init() {
    const app = express();
    app.use(beforeHandleRequest);
    app.use((req, res, next) => {
        res.send({ code: 404 });
    });
    app.listen(80, () => {
        console.log('服务器已启动'.green);
    });
}

void function main() {
    init();
}();