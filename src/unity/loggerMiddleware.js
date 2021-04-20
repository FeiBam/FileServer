
const fs = require('fs')
const path = require('path')
const log4js = require('log4js')
const Stream = require('stream');

const config = (function (){
    const configJson = fs.readFileSync(path.resolve(__dirname,'../config.json'))
    return JSON.parse(configJson)
})()
const Dates = new Date()
const NowMonth = Dates.getMonth() + 1
const NowDate = Dates.getDate()
const NowYear = Dates.getFullYear()


const logName = `${NowYear}-${NowMonth}-${NowDate}`
const logDir = config.logPath
let loggerDir = ''


if (!fs.existsSync(logDir)){
    fs.mkdirSync(logDir)
}

const files = fs.readdirSync(logDir)



if (files.includes(`${logName}.log`)){
    loggerDir = `${logDir}\\${logName}.log`
}

else {
    fs.writeFileSync(`${logDir}\\${logName}.log`,`This is Server Log Create at ${logName}\\\n`)
    loggerDir = `${logDir}\\${logName}.log`
}

log4js.configure({
    appenders: {
        console: { type: 'console' },
        dateFile: { type: 'dateFile', filename: loggerDir, pattern: '-yyyy-MM-dd' }
    },
    categories: {
        default: {
            appenders: ['console', 'dateFile'],
            level: 'info'
        }
    }
})

const logger = log4js.getLogger('[Default]')

const loggerMiddleware = async (ctx, next) => {
    const start = new Date()
    await next()
    const ms = new Date() - start
    const remoteAddress = ctx.headers['x-forwarded-for'] || ctx.ip || ctx.ips ||
        (ctx.socket && (ctx.socket.remoteAddress || (ctx.socket.socket && ctx.socket.socket.remoteAddress)))
    let FileType = ctx.state.fileType
    if (ctx.status === 404){
        FileType = 'html'
    }
    let logText = `${ctx.method} ${ctx.status} ${ctx.url} 响应数据: ${ JSON.stringify(ctx.body) } - ${remoteAddress} - ${ms}ms`
    if (ctx.body instanceof Stream || ctx.body instanceof Buffer){
        logText = `${ctx.method} ${ctx.status} ${ctx.url}  文件类型 ${ ctx.state.fileType } - ${remoteAddress} - ${ms}ms`
        if (ctx.status === 206){
            logText = `${ctx.method} ${ctx.status} ${ctx.url} 请求数据范围： ${ctx.response.get('Content-Range')} 文件类型 ${ ctx.state.fileType } - ${remoteAddress} - ${ms}ms`
        }
    }
    logger.info(logText)
}

module.exports ={
    loggerMiddleware,
    logger
}