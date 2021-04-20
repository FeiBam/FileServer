

class StreamUpdate{
    constructor(Url,BufferSize = 1024 * 1024 * 128) { //Url 链接地址
        this.Url = Url
        this.Buffer = new ArrayBuffer(BufferSize);

    }
}

class Stream{
    constructor() {
    }
}