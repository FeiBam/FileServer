class xhr{
    constructor(url,callback, failedCallback){
        this.method = 'GET'
        this.url = url
        this.callback = callback
        this.failedCallback = failedCallback
        this.originHeaders = {}
        this.XhrIsOpen = false
        this.xhr = new XMLHttpRequest()
    }
    setHeader(headers){
        this.originHeaders = {...this.originHeaders,...headers}
        if (headers !== undefined) {
            Object.getOwnPropertyNames(headers).forEach((key) => {
            if (typeof headers[key] == "string")
                this.xhr.setRequestHeader(key, headers[key])
            })
        }
    }
    open(url){
        if(url){
            this.url = url
        }
        this.xhr.open(this.method,this.url)
        this.XhrIsOpen = true
    }
    send(data,UsePromise = true){
        if(!this.XhrIsOpen){
            throw new Error('Please Open Xhr request')
        }
        if(!UsePromise){
            if(this.callback !== undefined && this.failedCallback !== undefined){
                this.xhr.onerror = this.failedCallback
                this.xhr.onload = this.callback
                try{
                    this.xhr.send(data)
                }catch(e){
                    if(this.failedCallback !== undefined){
                        this.failedCallback()
                    }
                }
            }else throw new Error('if you want not us Promise , plase set callback')
        }else return this.PromiseSend(data)
    }
    PromiseSend(data){
        return new Promise((resolve,reject)=>{
            this.xhr.onerror = (err)=>{
                reject(err)
            }
            this.xhr.onload = () =>{
                resolve(this.xhr.responseText)
            }
            try{
                this.xhr.send(data)
            }catch(e){
                reject(e)
            }
        })
    }
}
class PutFile extends xhr{
    constructor(url,callback,failedCallback){
        super(url,callback,failedCallback)
        this.method = 'PUT'
    }
    sendBlob(BlobData,UsePromise){
        if (!BlobData instanceof Blob){
            throw new Error('The file must be Blob')
        }
        this.send(BlobData,UsePromise)
    }
}