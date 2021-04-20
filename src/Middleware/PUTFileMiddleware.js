const { StreamFile } = require('../unity/File')

async function PUTFileMiddleware (ctx,next){
    if (ctx.state.FilePath){
        console.log(ctx)
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
        const file = new StreamFile(ctx.state.canWritePath,undefined,undefined,true)
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