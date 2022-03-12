export class Texture {
    gl: WebGL2RenderingContext;
    texture: WebGLTexture;
    constructor(gl: WebGL2RenderingContext, path: string) {
        this.gl = gl;

        this.texture = gl.createTexture()!;

        const image: TexImageSource = document.getElementById("ahhh") as HTMLImageElement;

        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    }

    bind() {
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    }
}