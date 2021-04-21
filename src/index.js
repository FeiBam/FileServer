const Koa = require('koa')
const App = new Koa()
const fs = require('fs')
const path = require('path')
const https = require('https')
const KoaCors = require('@koa/cors')
const { loggerMiddleware,logger } = require('./unity/loggerMiddleware')

const HaveFileMiddleware = require('./Middleware/HaveFileMiddleware')
const GETFileMiddleware = require('./Middleware/GETFileMiddleware')
const PUTFileMiddleware = require('./Middleware/PUTFileMiddleware')


const config = (function (){
    const configJson = fs.readFileSync('./config.json')
    return JSON.parse(configJson)
})()

fs.existsSync(config.StorePath) ? null : fs.mkdirSync(config.StorePath)


App.use(loggerMiddleware)

App.use(KoaCors({
    origin:"*"
}))

App.use(async (ctx,next)=>{
    return next().catch(err => {
        ctx.status = err.status || 500
        ctx.body = {
            status:ctx.status,
            code:err.code || -1,
            message: err.message || '',
            data:'',
            other:err.other
        }
        if (ctx.userErr){
            return Promise.resolve()
        }
        logger.error(err)
        return Promise.reject(err)
    })
})


App.use(async (ctx,next)=>{
    const Start = Date.now()
    await next()
    const ms = Date.now() - Start
    ctx.set('X-Response-Time',`${ms}ms`)
})

App.use(async (ctx,next)=>{
    if (ctx.URL.pathname === '/'){
        ctx.redirect('/index')
    }
    else await next()
    if (ctx.status === 404){
        const NotFoundPage = fs.readFileSync(path.resolve(__dirname,config.NotFoundPagePath))
        ctx.set('Content-Type','text/html')
        ctx.status = 404
        ctx.body = NotFoundPage
    }
})

App.use(HaveFileMiddleware)

App.use(GETFileMiddleware)

App.use(PUTFileMiddleware)


const options = {
    key: fs.readFileSync('./ecc-privkey.pem'),
    cert: fs.readFileSync('./0001_chain.pem')
}

App.listen(80)
