const { StreamFile } = require('../unity/File')
const Range = require('../unity/FileByteRange')
const getContentType = require('../unity/GetContentType')

async function GETFileMiddleware (ctx, next){
    if (ctx.state.FilePath){
        if (ctx.method === 'GET'){
            if (ctx.request.get('Range')){
                const range = new Range(ctx.request.get('Range'))
                if (Array.isArray(range.rangeOffsetInfo)){
                    ctx.status = 406
                    return ctx.body = 'Currently unable to handle multiple ranges'
                }
                const file = new StreamFile(ctx.state.FilePath,range.rangeOffsetInfo.start,range.rangeOffsetInfo.end)
                const rangeEnd = range.rangeOffsetInfo.end === undefined ? file.fileInfo.size : range.rangeOffsetInfo.end

                ctx.set('Content-Type',getContentType(file.fileType))
                ctx.set('Content-Range',`bytes ${range.rangeOffsetInfo.start}-${rangeEnd - 1 }/${file.fileInfo.size}`)
                ctx.set('Content-Length',`${rangeEnd - range.rangeOffsetInfo.start}`)
                ctx.body = file.streamFile
                ctx.state.RangeOffsetInfo = range.rangeOffsetInfo
                ctx.state.fileType = file.fileType
                return ctx.status = 206
            }else {
                const file = new StreamFile(ctx.state.FilePath)
                ctx.set('Cache-Control','public, max-age=86400')
                ctx.set('Content-Type', getContentType(file.fileType))
                ctx.set('Content-Length', file.fileInfo.size)
                if (ctx.response.get('Content-Type') === 'application/octet-stream'){
                    ctx.set('Content-Disposition',`attachment; filename=${encodeURI(file.fileName)}`)
                }
                ctx.body = file.streamFile
                ctx.state.fileType = file.fileType
                ctx.status = 200
            }
        }else await next()
    }
    else await next()
}


module.exports = GETFileMiddleware