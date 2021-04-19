const Koa = require('koa')
const App = new Koa()
const fs = require('fs')
const http = require("http")
const path = require('path')




const config = (function (){
    const configJson = fs.readFileSync('./config.json')
    return JSON.parse(configJson)
})()

class FileBase{
    constructor(filePath) {
        this.filePath = filePath
        this.fileInfo = fs.statSync(filePath)
        this.fileName = this.getFileName()
        this.fileType = this.getFileType()
    }
    getFileName(){
        const filePathSplit = this.filePath.split('\\')
        return filePathSplit[filePathSplit.length - 1]
    }
    getFileType(){
        return this.fileName.split('.')[1]
    }
}

class StreamFile extends FileBase{
    constructor(props,start,end) {
        super(props);
        this.streamFileStartAt = start ? Number(start) : undefined
        this.streamFileEndAt = end ? Number(end) : undefined
        this.streamFile = this.getStreamFile(this.streamFileStartAt,this.streamFileEndAt)
    }
    getStreamFile(start,end){
        const option  = {}
        if (start) option['start'] = start
        if (end) option['end'] = end
        return fs.createReadStream(this.filePath,option)
    }
}

class File extends FileBase{
    constructor(filePath) {
        super(filePath);
        if (this.fileInfo.size < 1024 * 1024 * 100) this.file = fs.readFileSync(this.filePath)
        else this.file = StreamFile.prototype.getStreamFile.apply(this,[0,this.fileInfo.size])
    }
}

class Range{
    constructor(rangeInfo) {
        this.rangeOriginInfo = rangeInfo
        this.rangeUnit = rangeInfo.split('=')[0]
        this.rangeOffsetInfo = {}
        this.getRangeOffsetInfo()
    }
    getRangeOffsetInfo(){
        const RangeOffsetStr = this.rangeOriginInfo.split('=')[1].split(',')
        if (RangeOffsetStr.length > 1){
            this.rangeOffsetInfo = []
            for (let RangeOffsetInfo of RangeOffsetStr){
                this.rangeOffsetInfo.push({
                    start:RangeOffsetInfo.split('-')[0],
                    end:RangeOffsetInfo.split('-')[1] === '' ? undefined : RangeOffsetInfo.split('-')[1]
                })
            }
        }
        else this.rangeOffsetInfo = {
            start:RangeOffsetStr[0].split('-')[0],
            end:RangeOffsetStr[0].split('-')[1] === '' ? undefined : RangeOffsetStr[0].split('-')[1]
        }
    }
}

function getContentType(FileType){
    const FileTypes = config.FileTypes
    const FileTypesKey = Object.keys(FileTypes)
    let ContentType = ''
    for (let TypeKey of FileTypesKey){
        const ChildTypeKey = Object.keys(FileTypes[TypeKey])
        for (let CTypeKey of ChildTypeKey){
            if (FileType === CTypeKey){
                ContentType = FileTypes[TypeKey][CTypeKey]
                break
            }
        }
    }
    if (ContentType === ''){
        ContentType = 'application/octet-stream'
    }
    return ContentType
}

App.use(async (ctx,next)=>{
    const Start = Date.now()
    await next()
    const ms = Date.now() - Start
    ctx.set('X-Response-Time',`${ms}ms`)
})

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

App.use(async (ctx,next)=>{
    const UrlInfo = ctx.URL
    const UrlPath = UrlInfo.pathname
    const PathSplit = UrlPath.split('/')
    const FilePath = path.join(config.StorePath,UrlPath)
    if (fs.existsSync(FilePath)){
        if (!fs.statSync(FilePath).isDirectory()) {
            ctx.state.FilePath = FilePath
            await next()
        }
    }
    else ctx.status = 404
})

App.use(async (ctx,next)=>{
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
        return ctx.status = 206
    }
    await next()
})

App.use(async (ctx)=>{
    const file = new StreamFile(ctx.state.FilePath)
    ctx.set('Content-Type', getContentType(file.fileType))
    ctx.set('Content-Length', file.fileInfo.size)
    if (ctx.response.get('Content-Type') === 'application/octet-stream'){
        ctx.set('Content-Disposition',`attachment; filename=${file.fileName}`)
    }
    ctx.body = file.streamFile
    ctx.status = 200
})

App.listen(80)

