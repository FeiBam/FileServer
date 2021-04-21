const fs = require('fs')
const path = require('path')

const { StreamFile } = require('../unity/File')
const { FileTree } = require('../unity/FileTree')

const config = (function (){
    const configJson = fs.readFileSync(path.resolve(__dirname,'../config.json'))
    return JSON.parse(configJson)
})()

async function PUTFileMiddleware (ctx,next){
    if (ctx.state.FilePath){
        ctx.status = 409
        return ctx.body = {
            code:0,
            message:'Already own this file',
            data:{
                FileUrl: ctx.request.headers.referer
            }
        }
    }
    if (ctx.method === 'PUT'){
        const fileTree = new FileTree(config.StorePath)
        fileTree.getDirTree()
        const FileDirectoryAt = fileTree.FilePathToDirectoryPath(ctx.state.canWritePathInfo.UrlPath)
        if (!fileTree.haveSomeDirectory(FileDirectoryAt)) fileTree.createDirectoryAt(FileDirectoryAt)
        const file = new StreamFile(ctx.state.canWritePathInfo.FilePath,undefined,undefined,true)
        ctx.req.pipe(file.streamFile)
        try {
            await new Promise(((resolve, reject) => {
                ctx.req.on('end',()=>{
                    resolve()
                })
                ctx.req.on('error',(err)=>{
                    reject(err)
                })
            }))
            file.writeComplete()
            ctx.status = 200
            ctx.body = {
                code:0,
                message: 'ok',
                data: {
                    FileUrl:ctx.request.headers.referer
                }
            }
        }
        catch (e){
            file.streamFile.destroy()
            file.deleteFile()
            throw e
        }
    }
}

module.exports = PUTFileMiddleware