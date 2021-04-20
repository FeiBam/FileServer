class Range{
    constructor(rangeInfo) {
        this.rangeOriginInfo = rangeInfo
        this.rangeUnit = rangeInfo.split('=')[0]
        this.rangeOffsetInfo = {}
        this.getRangeOffsetInfo()
    }
    getRangeOffsetInfo(){
        const RangeOffsetStr = this.rangeOriginInfo.split('=')[1].split(',')
        if (RangeOffsetStr.length > 1){
            this.rangeOffsetInfo = []
            for (let RangeOffsetInfo of RangeOffsetStr){
                this.rangeOffsetInfo.push({
                    start:RangeOffsetInfo.split('-')[0],
                    end:RangeOffsetInfo.split('-')[1] === '' ? undefined : RangeOffsetInfo.split('-')[1]
                })
            }
        }
        else this.rangeOffsetInfo = {
            start:RangeOffsetStr[0].split('-')[0],
            end:RangeOffsetStr[0].split('-')[1] === '' ? undefined : RangeOffsetStr[0].split('-')[1]
        }
    }
}

module.exports = Range