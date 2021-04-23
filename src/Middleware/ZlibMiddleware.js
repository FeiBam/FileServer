
const zlib = require('zlib')
const { pipeline,Writable } = require('stream')
const fs = require('fs')
const path = require('path')

const config = (function (){
    const configJson = fs.readFileSync(path.resolve(__dirname,'../config.json'))
    return JSON.parse(configJson)
})()

function needZip(FileType){
    for (let zipType of config.ZipFileType){
        if (FileType === zipType) return true
    }
    return false
}
const tranBody = function (){
    const WrStream = new Writable()
}

async function ZlibMiddleware(ctx,next){
    await next()
    if (ctx.request.get('Accept-Encoding')){
        const ZipTypes = ctx.request.get('Accept-Encoding').split(', ')
        if (needZip(ctx.state.fileType)){
            ctx.set('Content-Encoding',ZipTypes[0])
        }
    }
}

module.exports = ZlibMiddleware