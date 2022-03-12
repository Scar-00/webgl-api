import { mat4 } from "gl-matrix";
import { vec4 } from "gl-matrix";
import { Texture } from "./texture";

export interface ViewProj {
    proj: mat4, view: mat4
};

export class Shader {
    gl: WebGL2RenderingContext;
    handle: WebGLShader;
    vs_handle: WebGLShader;
    fs_handle: WebGLShader;
    constructor(gl: WebGL2RenderingContext, vs_path: string, fs_path: string) {
        this.gl = gl;

        this.vs_handle = this._compile(vs_path, gl.VERTEX_SHADER)!;
        this.fs_handle = this._compile(fs_path, gl.FRAGMENT_SHADER)!;
        this.handle = gl.createProgram()!;
    
        gl.attachShader(this.handle, this.vs_handle);
        gl.attachShader(this.handle, this.fs_handle);
        gl.linkProgram(this.handle);
    }

    private _compile(path: string, type: number) {
        let handle: WebGLShader = this.gl.createShader(type)!;

        this.gl.shaderSource(handle, path);

        this.gl.compileShader(handle);

        if(!this.gl.getShaderParameter(handle, this.gl.COMPILE_STATUS)) {
            alert("error compiling Shaders: " + this.gl.getShaderInfoLog(handle));
            this.gl.deleteShader(handle);
            return null;
        }
    
        return handle;
    }

    bind() {
        this.gl.useProgram(this.handle);
    }

    uniform_mat4(name: string, m: mat4) {
        this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.handle, name), false, m);
    }

    uniform_vec4(name: string, v: vec4) {
        this.gl.uniform4f(this.gl.getUniformLocation(this.handle, name), v[0] , v[1], v[2], v[3]);
    }

    uniform_texture2D(name: string, texture: Texture, n: number) {
        this.gl.activeTexture(this.gl.TEXTURE0 + n);
        texture.bind();
        this.gl.uniform1i(this.gl.getUniformLocation(this.handle, name), n);
    }

    uniform_view_proj(view_proj: ViewProj) {
        this.uniform_mat4("p", view_proj.proj);
        this.uniform_mat4("v", view_proj.view);
    }

    uniform_textures2D(name: string) {
        let samplers: number[] = [];
        for(let i: number = 0; i < 32; i++) {
            samplers[i] = i;
        }
        this.gl.uniform1iv(this.gl.getUniformLocation(this.handle, name), samplers, 0, 32);
    }
}