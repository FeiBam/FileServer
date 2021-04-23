const fs = require('fs')
const path = require('path')
const { AuthPath } = require('../unity/FileTree')

const config = (function (){
    const configJson = fs.readFileSync(path.resolve(__dirname,'../config.json'))
    return JSON.parse(configJson)
})()

async function Login(ctx){
    const AuthorizationData = ctx.get('Authorization')
    const UserInfo = new Buffer.from(AuthorizationData.split(' ')[1],'base64')
    const UserName = UserInfo.toString().split(':')[0]
    const UserPassword = UserInfo.toString().split(':')[1]
    if (await ctx.state.CacheSpace.select(UserName)){
        return true
    }
    if (config.Account.hasOwnProperty(UserName)){
        if (config.Account[UserName] === UserPassword){
            await ctx.state.CacheSpace.add(UserName, {PassWord: UserPassword}, 7200000)
            return true
        }
    }
    return false
}

async function AuthMiddleWare(ctx,next){
    const authPath  = new AuthPath(path.resolve(__dirname,'../../Files'),config.BlockList)
    if (ctx.method === 'GET'){
        if (authPath.isBlock(ctx.state.UrlPath)){
            if (!ctx.request.get('Authorization')){
                ctx.status = 401
                ctx.set('WWW-Authenticate','Basic realm="This Files need Authorization"')
                return ctx.body = "This Files need Authorization"
            }else {
                if (await Login(ctx)){
                    await next()
                }else {
                    ctx.set('WWW-Authenticate','Basic realm="This Files need Authorization"')
                    ctx.status = 401
                    return ctx.body = 'UserName Or PassWord Error'
                }
            }
        }else await next()
    }
    else {
        if (await Login(ctx)){
            await next()
        }else {
            ctx.set('WWW-Authenticate','Basic realm="This Files need Authorization"')
            ctx.status = 401
            return ctx.body = 'UserName Or PassWord Error'
        }
    }
}

module.exports = AuthMiddleWare