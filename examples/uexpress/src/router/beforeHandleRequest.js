import { Request } from 'express';

/**
 * 处理请求之前, 打印请求信息
 * @param {Request} req 
 * @param {*} res 
 * @param {*} next 
 */
function beforeHandleRequest(req, res, next) {
    console.log('HTTP请求', req.method, req.url);
}

export default function (req, res, next) {
    try { beforeHandleRequest(...arguments); } catch (err) { } finally { next(); }
};