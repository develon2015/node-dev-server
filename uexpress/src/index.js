import express from 'express';
import os from 'os';

console.log(os.networkInterfaces());

console.log(888);
const app = express();
app.all((req, res, next) => {
    next();
});
app.all((req, res, next) => {
    res.send({ code: 404 });
});
app.listen(80, () => {
    console.log('服务器已启动');
});