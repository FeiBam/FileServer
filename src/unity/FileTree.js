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
        this.DirTree.push(...this.Files,...this.Directorys)
    }
    onDirectory(DirectoryName){
        const Child = new FileTree(path.join(this.Path, DirectoryName))
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
}

class FileTree extends FileTreeBase{
    constructor(props) {
        super(props);
    }
    haveSomeDirectory(Path){
        const PathSplit = this.getPathSplit(Path)
        if (PathSplit.length === 1){
            for (let DirectoryInfo of this.Directorys) {
                if (DirectoryInfo.DirectoryName === PathSplit[0]) return true
            }
            return false
        }else {
            for (let DirectoryInfo of this.Directorys){
                if (DirectoryInfo.DirectoryName === PathSplit[0]){
                    return DirectoryInfo.DirectoryChild.haveSomeDirectory(this.GenPath(PathSplit))
                }
            }return false
        }
    }
    haveSomeFile(Path){
        const PathSplit = this.getPathSplit(Path)
        if (PathSplit.length === 1){
            for (let FileInfo of this.Files){
                if (FileInfo.FileName === PathSplit[PathSplit.length - 1]){
                    return true
                }
            }
            return false
        }else {
            for (let DirectoryInfo of this.Directorys){
                if (DirectoryInfo.DirectoryName === PathSplit[0]){
                    return DirectoryInfo.DirectoryChild.haveSomeFile(this.GenPath(PathSplit))
                }
            }return false
        }
    }
    createDirectoryAt(Path){
        const PathSplit = this.getPathSplit(Path)
        if (PathSplit.length === 1){
            if (!this.haveSomeDirectory(PathSplit[PathSplit.length -1])){
                fs.mkdirSync(path.join(this.Path,PathSplit[0]))
                return true
            }else return false
        }else {
            if (!this.haveSomeDirectory(PathSplit[0])) fs.mkdirSync(path.join(this.Path,PathSplit[0]))
            for (let DirectoryInfo of this.Directorys){
                if (DirectoryInfo.DirectoryName === PathSplit[0]){
                    return DirectoryInfo.DirectoryChild.createDirectoryAt(this.GenPath(PathSplit))
                }
            }
        }
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
}

const fileTree = new FileTree(path.resolve(__dirname,'../../Files'))
module.exports = { FileTreeBase,FileTree }

