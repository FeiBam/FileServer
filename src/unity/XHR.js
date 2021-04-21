    class xhr{
        constructor(url,callback, failedCallback){
            this.method = ''
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
        open(){
            this.xhr.open(this.method,this.url)
            this.XhrIsOpen = true
        }
    }
    class PutFile extends xhr{
        constructor(url,callback,failedCallback){
            super(url,callback,failedCallback)
            this.method = 'PUT'
        }
        send(File,UsePromise = true){
            console.log(File instanceof Blob)
            if(!(File instanceof Blob)){
                throw new Error('The file must be Blob')
            }
            if(!this.XhrIsOpen){
                throw new Error('Please Open Xhr request')
            }
            if(!UsePromise){
                this.xhr.onerror = this.failedCallback
                this.xhr.onload = this.callback
                try{
                    this.xhr.send(File)
                }catch(e){
                    if(this.failedCallback !== undefined){
                        this.failedCallback()
                    }
                }
            }else return this.PromiseSend(File)
        }
        PromiseSend(File){
            return new Promise((resolve,reject)=>{
                this.xhr.onerror = (err)=>{
                    reject(err)
                }
                this.xhr.onload = () =>{
                    resolve(this.xhr.responseText)
                }
                try{
                    this.xhr.send(File)
                }catch(e){
                    reject(e)
                }
            })
        }
    }
