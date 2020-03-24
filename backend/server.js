const express = require('express')
var cors = require('cors')
const { createProxyMiddleware } = require('http-proxy-middleware')

require('dotenv').config()

const app = express()
const proxy = createProxyMiddleware({
    target: process.env.SERVER_ARCHILOGIC_API_BASE_URL,
    changeOrigin: true,
    onProxyReq: onProxyReq,
    logLevel: 'debug'
});

app.use(cors({
    origin: '*'
}))

app.use('/', proxy)

function onProxyReq(proxyReq, req, res) {
    proxyReq.setHeader('x-secret-api-key', process.env.SERVER_ARCHILOGIC_SECRET_API_KEY);
    proxyReq.removeHeader('Origin')
}

app.listen(3000)