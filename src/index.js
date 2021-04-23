const Koa = require('koa')
const App = new Koa()
const fs = require('fs')
const path = require('path')
const KoaCompress = require('koa-compress')
const { loggerMiddleware,logger } = require('./Middleware/loggerMiddleware')

const HaveFileMiddleware = require('./Middleware/HaveFileMiddleware')
const GETFileMiddleware = require('./Middleware/GETFileMiddleware')
const PUTFileMiddleware = require('./Middleware/PUTFileMiddleware')
const AuthPathMiddleware = require('./Middleware/AuthMiddleware')

const Cache = require('./unity/Cache')
const CacheSpace = new Cache(true)
const config = (function (){
    const configJson = fs.readFileSync('./config.json')
    return JSON.parse(configJson)
})()


App.use(loggerMiddleware)

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
    ctx.state.CacheSpace = CacheSpace
    const Start = Date.now()
    await next()
    const ms = Date.now() - Start
    ctx.set('X-Response-Time',`${ms}ms`)
})

App.use(KoaCompress({
    filter (content_type) {
        return /text/i.test(content_type)
    },
    threshold: 2048,
    gzip: {
        flush: require('zlib').constants.Z_SYNC_FLUSH
    },
    deflate: {
        flush: require('zlib').constants.Z_SYNC_FLUSH,
    },
    br: false // disable brotli
}))

App.use(async (ctx,next)=>{
    if (ctx.URL.pathname === '/'){
        ctx.redirect('/index.html')
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

App.use(AuthPathMiddleware)

App.use(GETFileMiddleware)

App.use(PUTFileMiddleware)


App.listen(80)