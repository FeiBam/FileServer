const fs = require('fs')
const path = require('path')

const config = (function (){
    const configJson = fs.readFileSync(path.resolve(__dirname,'../config.json'))
    return JSON.parse(configJson)
})()

async function HaveFileMiddleware(ctx,next){
    const UrlInfo = ctx.URL
    const UrlPath = decodeURI(UrlInfo.pathname)
    const PathSplit = UrlPath.split('/')
    const FilePath = path.join(config.StorePath,UrlPath)
    if (fs.existsSync(FilePath)){
        if (!fs.statSync(FilePath).isDirectory()) {
            ctx.state.FilePath = FilePath
            await next()
        }
    }
    else {
        ctx.state.canWritePathInfo = { UrlPath:UrlPath,FilePath:FilePath }
        await next()
    }
}


module.exports = HaveFileMiddleware