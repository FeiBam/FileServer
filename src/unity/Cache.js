// cache对象   初始化实例的时候请务必传递 是否允许自动删除超时元素 new Cache(bool,number)
//const base = new Cache(true)
function Cache(autoRemoveTimeOutEvent,timeout = 60000) {
    this.CacheSpace = []
    //查找对象 base.select(114514) 如果存在 索引值，返回索引对象，否则返回 false
    this.select = async (key) => {
        let index = 0
        for (let item of this.CacheSpace){
            if (item.key === key){
                return {
                    item:this.CacheSpace[index],
                    index:index
                }
            }
            index++
        }
        return false
    } //提供key名字查找对象
    //添加元素
    //base.add(114513,{time:name,data:'野兽前辈！'},1000) 无返回值
    this.add = async  (key,value,timeout = Infinity) => {
        let object ={
            key,
            ...value,
            timeout
        }
        this.CacheSpace.push(object)
    }
    //删除元素
    //base.remove(114514) 删除成功返回 true 否则返回false
    this.remove = async (key) => {
        const index = await this.select(key)
        const arr = this.CacheSpace.splice(index.index,1)
        return arr.length !== 0;
    }
    //base.replace(114514,{time:Date.Now(),data:'啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊！'},2000)
    //替换元素 无返回值
    this.replace = async (key,value,timeout = Infinity) => {
        const arr = await this.select(key)
        const replaceObject = {
            key,
            ...value,
            timeout
        }
        if (arr){
            return this.CacheSpace.splice(arr.index,1,replaceObject).length !==0
        }
    }
    //删除超时元素
    this.removeTimeoutData = ()=> {
        for (let item of this.CacheSpace){
            if ((Date.now() - item.timeout) > item.timeout){
                this.remove(item.key)
            }
        }
    }
    this.init = ()=> {
        if (typeof autoRemoveTimeOutEvent ==='undefined'){
            throw TypeError('You Must set autoRemoveTimeOutEvent state/ true or false')
        }
        else {
            if (autoRemoveTimeOutEvent){
                setInterval(this.removeTimeoutData,timeout)
            }
        }
    }
    this.init()//初始化
}

module.exports = Cache
//const a = new Cache(true,3000)
