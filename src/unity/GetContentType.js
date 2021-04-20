
const fs = require('fs')
const path = require("path");

const config = (function (){
    const configJson = fs.readFileSync(path.resolve(__dirname,'../config.json'))
    return JSON.parse(configJson)
})()

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

module.exports = getContentType