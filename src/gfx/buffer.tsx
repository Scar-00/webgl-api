export class Buffer {
    gl: WebGL2RenderingContext;
    handle: WebGLBuffer;
    type:number;
    constructor (gl: WebGL2RenderingContext, type: number) {
        this.gl = gl;
        this.type = type;
        this.handle = gl.createBuffer()!;
    }

    bind() {
        this.gl.bindBuffer(this.type, this.handle);
    }

    buffer(data: number[]) {
        this.bind();
        if(this.type === this.gl.ARRAY_BUFFER) {
            this.gl.bufferData(this.type, new Float32Array(data), this.gl.STATIC_DRAW);
        }else {
            this.gl.bufferData(this.type, new Uint16Array(data), this.gl.STATIC_DRAW);
        }
    }

    attr(index: number, size: number, type:number, stride: number, offset: number) {
        this.bind();
        this.gl.vertexAttribPointer(index, size, type, false, stride, offset);
        this.gl.enableVertexAttribArray(index);
    }
}