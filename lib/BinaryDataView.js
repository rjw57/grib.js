class BinaryDataView {
    /**
     * 
     * @param {Buffer} buffer 
     */
    constructor(byteArray) {
        if (byteArray instanceof Buffer) {
            this.view = new DataView(byteArray.buffer, byteArray.byteOffset, byteArray.byteLength);
        }
        else {
            this.view = new DataView(byteArray);
        }
        this.view.getUnsigned = this.getUnsigned.bind(this);
        this.offset = 0;
        this.bOffset = 0;
    }
    seek(offset) {
        this.offset = offset;
    }
    skip(n) {
        this.offset += n;
    }
    tell() {
        return this.offset;
    }
    incrByte() {
        if (this.bOffset > 0) {
            this.offset++;
            this.bOffset = 0;
        }
    }
    read(type, offset) {
        if (offset) {
            const current = this.offset;
            this.offset = offset;
            const val = this[type]();
            this.offset = current;
            return val;
        }
        return this[type]();
    }
    readArray(type, size) {
        const val = new Array(size);
        for (let i = 0; i < size; i++) {
            val[i] = this[type]();
        }
        return val;
    }
    readBlob(size) {
        const val = this.view.buffer.slice(this.offset, this.offset + size);
        this.offset += size;
        return val;
    }
    grib32() {
        const raw = this.uint32();
        const sign = raw >>> 31;
        const value = raw & 0x7fffffff;
        return 1 === sign ? -value : value
    }
    grib16() {
        const raw = this.uint16();
        const sign = raw >>> 15;
        const value = raw & 0x7fff;
        return 1 === sign ? -value : value
    }
    grib8() {
        const raw = this.uint8();
        const sign = raw >>> 7;
        const value = raw & 0x7f;
        return 1 === sign ? -value : value
    }
    int8() {
        const val = this.view.getInt8(this.offset);
        this.offset++;
        return val;
    }
    int16() {
        const val = this.view.getInt16(this.offset);
        this.offset += 2;
        return val;
    }
    int32() {
        const val = this.view.getInt32(this.offset);
        this.offset += 4;
        return val;
    }
    uint8() {
        const val = this.view.getUint8(this.offset);
        this.offset++;
        return val;
       
    }
    uint16() {
        const val = this.view.getUint16(this.offset);
        this.offset += 2;
        return val;
       
    }
    uint32() {
        const val = this.view.getUint32(this.offset);
        this.offset += 4;
        return val;
    }
    uint64() {
        return {
            hi: this.uint32(),
            lo: this.uint32()
        }
    }
    float32() {
        const val = this.view.getFloat32(this.offset);
        this.offset += 4;
        return val;
    }
    getUnsigned(n) {
        const m = this.bOffset + n;
        const bytes = Math.ceil(m / 8);
        let val;
        switch (bytes) {
            case 1:
                val = (this.view.getUint8(this.offset) & (0xff >>> this.bOffset)) >>> (8 - m);
                break;
            case 2:
                val = (this.view.getUint16(this.offset) & (0xffff >>> this.bOffset)) >>> (16 - m);
                break;
            case 3:
            case 4:
                val = (this.view.getUint32(this.offset) & (0xffffffff >>> this.bOffset)) >>> (32 - m);
                break;
            case 5:
            case 6:
            case 7:
            case 8:
                val = (this.view.getBigUInt64(this.offset) & (0xffffffffffffffffn >> BigInt(this.bOffset))) >> BigInt(64 - m);
                break;
            default:
                console.error("Can't read more than 8 bytes at a time");
                break;
        }
        this.bOffset = m % 8;
        this.offset += Math.floor(m / 8);
        return val;
    }
}
module.exports = BinaryDataView;