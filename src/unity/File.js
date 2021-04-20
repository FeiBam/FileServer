const fs = require('fs')
const path = require('path')

class FileBase{
    constructor(filePath,Write) {
        this.filePath = filePath
        if (!Write){
            this.fileInfo = fs.statSync(filePath)
            this.fileName = this.getFileName()
            this.fileType = this.getFileType()
        }
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
    constructor(props,start,end,Write = false) {
        super(props,Write);
        this.streamFileStartAt = start ? Number(start) : undefined
        this.streamFileEndAt = end ? Number(end) : undefined
        try {
            if (!Write){
                this.streamFile = this.getStreamFile(this.streamFileStartAt,this.streamFileEndAt)
            }else this.streamFile = this.createWriteFile(this.streamFileStartAt)
        }catch (e){
            throw e
        }
    }
    getStreamFile(start,end){
        const option  = {}
        if (start) option['start'] = start
        if (end) option['end'] = end
        return fs.createReadStream(this.filePath,option)
    }
    createWriteFile(start){
        const option  = {}
        if (start) option['start'] = start
        return fs.createWriteStream(this.filePath)
    }
    writeComplete(){
        this.streamFile.close()
    }
    deleteFile(){
        fs.unlinkSync(this.filePath)
    }
}


module.exports = { FileBase,StreamFile }