const fs = require('fs')
const path = require('path')

class FileTreeBase{
    constructor(Path) {
        this.Path = Path
        this.DirTree = []
        this.Directorys = []
        this.Files = []
        this.Paths = []
    }
    getDirTree(){
        this.Paths = fs.readdirSync(this.Path)
        for (let PathItem of this.Paths) {
            if (fs.statSync(path.join(this.Path, PathItem)).isFile()) this.onFile(PathItem)
            if (fs.statSync(path.join(this.Path, PathItem)).isDirectory()) this.onDirectory(PathItem)
        }
        this.DirTree.push(...this.Files , ...this.Directorys)
    }
    onDirectory(DirectoryName){
        const Child = new FileTree(path.join(this.Path , DirectoryName))
        Child.getDirTree()
        const DirectoryInfo = {
            DirectoryName:DirectoryName,
            DirectoryChild:Child
        }
        this.Directorys.push(DirectoryInfo)
    }
    onFile(FileName){
        const FileInfo = {
            FilePath:path.join(this.Path,FileName),
            FileName:FileName
        }
        this.Files.push(FileInfo)
    }
    GenPath(Arr){
        let Path = ''
        Arr.shift()
        for (let item of Arr){
            Path  = Path + item + '/'
        }
        return Path
    }
    getPathSplit(Path){
        let PathSplit = Path.split('/')
        if (PathSplit.length === 1) PathSplit = Path.split('\\')
        if (PathSplit[PathSplit.length - 1] === '') PathSplit.pop()
        if (PathSplit[0] === '') PathSplit.shift()
        return PathSplit
    }
    FilePathToDirectoryPath(Path){
        const PathSplit = this.getPathSplit(Path)
        let StrPath = ''
        PathSplit.pop()
        for (let item of PathSplit){
            StrPath  = StrPath + item + '/'
        }
        return StrPath
    }
    haveSomePath(Path){
        if (fs.existsSync(path.join( this.Path,Path ))) return true
        else return false
    }
}

class FileTree extends FileTreeBase{
    constructor(props) {
        super(props);
    }
    createDirectoryAt(Path){
        const PathSplit = this.getPathSplit(Path)
        if (PathSplit.length === 1){
            if (!this.haveSomePath(PathSplit[PathSplit.length -1])){
                fs.mkdirSync(path.join(this.Path,PathSplit[0]))
                return true
            }else return false
        }else {
            if (!this.haveSomePath(PathSplit[0])) {
                fs.mkdirSync(path.join(this.Path,PathSplit[0]))
                this.onDirectory(PathSplit[0])
            }
            for (let DirectoryInfo of this.Directorys){
                if (DirectoryInfo.DirectoryName === PathSplit[0]){
                    return DirectoryInfo.DirectoryChild.createDirectoryAt(this.GenPath(PathSplit))
                }
            }
        }
    }
}

class AuthPath extends FileTree{
    constructor(Path,config,isChild = false) {
        super(Path);
        this.isChild = isChild
        this.originConfig = config
        this.globalBlock = config.global ? config.global : undefined
        this.BlockDirectory = config.BlockDirectory ? config.BlockDirectory : undefined
        this.BlockFiles = config.BlockFiles ? config.BlockFiles : undefined
        this.ConfigChild = config.Child ? config.Child : undefined
        this.getDirTree()
    }
    isBlock(Path) {
        const PathSplit = this.getPathSplit(Path)
        if (!this.isChild){
            const globalFileName = (()=>{
                const FileName = PathSplit.slice().pop()
                if (FileName.split('.').length > 1){
                    return FileName
                } return undefined
            })()
        }
        const FileName = (()=>{
            if (PathSplit.length === 1){
                const FileName = PathSplit.slice().pop()
                if (FileName.split('.').length > 1){
                    return FileName
                }
            }
        })()
        if (!this.isChild){
            if (this.globalBlock){
                for (let globalItem of this.globalBlock){
                    if (globalItem instanceof RegExp){
                        if (Path.search(globalItem)) return true
                    }
                    else {
                        if (globalItem.Type.toUpperCase() === 'FILE'){
                            if (globalFileName) {
                                if (globalFileName === globalItem.Name) return true
                                if (globalItem.Regx){
                                    if (globalFileName.search( globalItem.Regx )) return true
                                }
                            }
                        }
                        if (globalItem.Type.toUpperCase() === 'DIRECTORY'){
                            for (let PathName of PathSplit){
                                if (globalItem.Name === PathName) return true
                                if (globalItem.Regx){
                                    if (PathName.search(globalItem.Regx)) return true
                                }
                            }
                        }
                    }
                }
            }
        }
        if (this.BlockFiles && this.BlockFiles.length > 0){
            for (let BlockFileData of this.BlockFiles){
                for (let HaveFileData of this.Files){
                    if (BlockFileData instanceof RegExp){
                        if (FileName.search(BlockFileData)) return true
                    }
                    if (BlockFileData === FileName) return true
                }
            }
        }
        if (this.BlockDirectory && this.BlockDirectory.length > 0){
            for (let BlockDirectoryData of this.BlockDirectory){
                if (BlockDirectoryData instanceof RegExp){
                    if (PathSplit.slice().shift().search(BlockDirectoryData)) return true
                }
                if (PathSplit.slice().shift() === BlockDirectoryData) return true
            }
        }
        if (this.ConfigChild && this.ConfigChild.length > 0){
            for (let ChildConfig of this.ConfigChild){
                for (let HaveChild of this.Directorys){
                    if (ChildConfig.DirectoryName === PathSplit.slice().shift() && ChildConfig.DirectoryName === HaveChild.DirectoryName){
                        return HaveChild.DirectoryChild.isBlock(this.GenPath(PathSplit))
                    }
                }
            }
        }
        return false
    }
    getDirTree() {
        this.Paths = fs.readdirSync(this.Path)
        for (let PathItem of this.Paths) {
            if (fs.statSync(path.join(this.Path,PathItem)).isDirectory()){
                if (this.ConfigChild && this.ConfigChild.length > 0){
                    for (let ChildConfigItem of this.ConfigChild){
                        if (ChildConfigItem.DirectoryName === PathItem) {
                            if (this.BlockDirectory && this.BlockDirectory.length > 0) {
                                for (let isBlockDirectoryName of this.BlockDirectory) {
                                    if (isBlockDirectoryName === '')throw new Error('The DirectoryName should not be ""')
                                    else {
                                        if (isBlockDirectoryName === ChildConfigItem.DirectoryName) this.onDirectory(PathItem, {})
                                        else this.onDirectory(PathItem, {...ChildConfigItem})
                                    }
                                }
                            } else this.onDirectory(PathItem, {...ChildConfigItem})
                        }
                    }
                }else this.onDirectory(PathItem , {})
            }else this.onFile(PathItem)
        }
        this.DirTree.push(...this.Files , ...this.Directorys)
    }
    onDirectory(DirectoryName,Config){
        const Child = new AuthPath(path.join(this.Path , DirectoryName) , Config ,true)
        const DirectoryInfo = {
            DirectoryName:DirectoryName,
            DirectoryChild:Child
        }
        this.Directorys.push(DirectoryInfo)
    }
}


//const config = {
//    global:[], // ['Regx',{Type:'File', Name:'',Regx:''},{Type:'Directory',name:'',Regx:''}]
//    BlockDirectory:[], // ['DirectoryName','Regx']
//    BlockFiles:[],//['FileName','Regx']
//    Child:[
//        {
//            DirectoryName: 'css',
//            BlockDirectory:[],
//        }
//    ]
//}



module.exports = {
    FileTree,
    FileTreeBase,
    AuthPath
}


