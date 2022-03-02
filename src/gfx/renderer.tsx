import { Buffer } from "./buffer";
import { Shader, ViewProj } from "./shader";
import { mat4, vec2 } from "gl-matrix";
import { Texture } from "./texture";

enum ShaderType {
    BASIC_COLOR,
    BASIC_TEXTURE
};

interface BatchData {
    index_count: number;
    quad_buffer: number[];
    quad_buffer_ptr: number[];
    quad_buffer_ptr_count: number;
    quad_count: number;
};

let renderer_data: BatchData;

export class Renderer {
    gl: WebGLRenderingContext;
    shader: Shader;
    shaders: Shader[] = [];
    current_shader: ShaderType;
    vbo: Buffer;
    ibo: Buffer;
    max_quad_count: number = 1000;
    max_vertex_count: number = this.max_quad_count * 4;
    max_index_count: number = this.max_quad_count * 6;
    constructor(gl: WebGLRenderingContext) {
        this.gl = gl;

        const vsSource = `                               
        attribute vec3 pos; 

        uniform mat4 model;
        uniform mat4 proj;
    
        void main() {
          gl_Position = model * vec4(pos, 1.0);
        }
        `;
        const fsSource = ` 
        precision highp float;

        uniform vec4 color;

        void main() {
          gl_FragColor = color;
        }
        `;
        const basic_texture_vs = `                               
        attribute vec3 pos;
        attribute vec2 uv; 

        uniform mat4 m, v, p;

        varying vec2 v_uv;
    
        void main() {
        gl_Position = p * v * m * vec4(pos, 1.0);
          v_uv = uv;
        }
        `;
        const basic_texture_fs = ` 
        precision highp float;
        uniform sampler2D tex;

        varying vec2 v_uv;

        void main() {
          gl_FragColor = texture2D(tex, v_uv);
        }
        `;

        this.shaders[ShaderType.BASIC_COLOR] = new Shader(gl, vsSource, fsSource);
        this.shaders[ShaderType.BASIC_TEXTURE] = new Shader(gl, basic_texture_vs, basic_texture_fs);


        this.current_shader = ShaderType.BASIC_COLOR;
        this.shader = this.shaders[ShaderType.BASIC_COLOR];
        this.vbo = new Buffer(gl, gl.ARRAY_BUFFER);
        this.ibo = new Buffer(gl, gl.ELEMENT_ARRAY_BUFFER);
    }

    prepare() {
        this.gl.clearColor( 0.1, 0.1, 0.1, 1 );
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        // this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
        // this.gl.disable(this.gl.DEPTH_TEST);
        // this.gl.disable(this.gl.CULL_FACE);
        // this.gl.enable(this.gl.BLEND);
        // this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    }

    use_shader(shader: ShaderType) {
        if(this.current_shader === shader) {
            return;
        }

        this.current_shader = shader;
        this.shader = this.shaders[shader];
        this.shader.bind();
    }

    set_view_proj() {
        let view_proj: ViewProj = {proj: mat4.create(), view: mat4.create()};

        mat4.ortho(view_proj.proj, 0, this.gl.canvas.clientWidth, 0, this.gl.canvas.clientHeight, -100.0, 100.0);
        
        this.shader.uniform_view_proj(view_proj);
    }

    quad_texture(texture: Texture, model: mat4) {
        this.use_shader(ShaderType.BASIC_TEXTURE);
        this.shader.uniform_mat4("m", model);
        this.shader.uniform_texture2D("tex", texture, 0);

        let pos = { x: 0.5, y: 0.5 }; 
        let size = { x: 1.0, y: 1.0 }; 
        let uv_min = { x: 0.0, y: 0.0 };
        let uv_max = { x: 1.0, y: 1.0 };

        let vertecies: number[] = [
            pos.x           , pos.y             , 0, uv_min.x, uv_min.y,        
            pos.x           , pos.y + size.y    , 0, uv_min.x, uv_max.y,
            pos.x + size.x  , pos.y + size.y    , 0, uv_max.x, uv_max.y,
            pos.x + size.x  , pos.y             , 0, uv_max.x, uv_min.y
        ];

        let indicies: number[] = [
            3, 0, 1, 3, 1, 2
        ];

        this.vbo.buffer(vertecies);
        this.ibo.buffer(indicies);

        this.vbo.attr(0, 3, this.gl.FLOAT, 5 * 4.0, 0);
        this.vbo.attr(1, 2, this.gl.FLOAT, 5 * 4.0, 3 * 4.0);

        this.vbo.bind();
        this.ibo.bind();

        this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    }

    draw_quad(pos: vec2, size: vec2) {
        if(renderer_data.index_count >= this.max_index_count){
            this.end_batch();
            this.flush();
            this.begin_batch();
        }

        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 0] = pos[0];
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 1] = pos[1];
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 2] = 0.0;
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 3] = 0.0;
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 4] = 0.0;
        renderer_data.quad_buffer_ptr_count += 5;

        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 0] = pos[0] + size[0];
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 1] = pos[1];
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 2] = 0.0;
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 3] = 1.0;
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 4] = 0.0;
        renderer_data.quad_buffer_ptr_count += 5;

        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 0] = pos[0] + size[0];
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 1] = pos[1] + size[1];
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 2] = 0.0;
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 3] = 1.0;
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 4] = 1.0;
        renderer_data.quad_buffer_ptr_count += 5;

        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 0] = pos[0];
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 1] = pos[1] + size[1];
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 2] = 0.0;
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 3] = 0.0;
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 4] = 1.0;
        renderer_data.quad_buffer_ptr_count += 5;

        renderer_data.index_count += 6;
        renderer_data.quad_count++;

        // console.log("test");
    }

    init(texture: Texture) {
        this.use_shader(ShaderType.BASIC_TEXTURE);
        this.set_view_proj();
        this.shader.uniform_texture2D("tex", texture, 0);
        renderer_data = {
            index_count: 0,
            quad_buffer: [],
            quad_buffer_ptr: [],
            quad_buffer_ptr_count: 0,
            quad_count: 0
        };
        renderer_data.index_count = 0;
        renderer_data.quad_buffer = [];

        let indicies: number[] = [];
        let offset: number = 0;
        for(let i: number = 0; i < this.max_index_count; i += 6) {
            indicies[i + 0] = 3 + offset;
            indicies[i + 1] = 0 + offset;
            indicies[i + 2] = 1 + offset;

            indicies[i + 3] = 3 + offset;
            indicies[i + 4] = 1 + offset;
            indicies[i + 5] = 2 + offset;

            offset += 4;
        }

        this.ibo.buffer(indicies);
    }

    begin_batch() {
        renderer_data.quad_buffer_ptr = renderer_data.quad_buffer;
        renderer_data.quad_buffer_ptr_count = 0;
    }

    end_batch() {

    }

    flush() {
        this.shader.uniform_mat4("m", mat4.create());

        this.vbo.buffer(renderer_data.quad_buffer_ptr);

        this.vbo.attr(0, 3, this.gl.FLOAT, 5 * 4.0, 0);
        this.vbo.attr(1, 2, this.gl.FLOAT, 5 * 4.0, 3 * 4.0);

        this.vbo.bind();
        this.ibo.bind();

        this.gl.drawElements(this.gl.TRIANGLES, renderer_data.index_count, this.gl.UNSIGNED_SHORT, 0);
    }
}