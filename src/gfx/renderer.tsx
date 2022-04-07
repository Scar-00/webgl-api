import { Buffer } from "./buffer";
import { Shader, ViewProj } from "./shader";
import { mat4, vec2, vec4 } from "gl-matrix";
import { Texture } from "./texture";

enum ShaderType {
    BASIC_COLOR,
    BASIC_TEXTURE,
    BATCH
};

interface BatchData {
    index_count: number;
    quad_buffer: number[];
    quad_buffer_ptr: number[];
    quad_buffer_ptr_count: number;
    quad_count: number;
    textures: Texture[];
    texture_count: number;
};

let renderer_data: BatchData;

export class Renderer {
    gl: WebGL2RenderingContext;
    shader: Shader;
    shaders: Shader[] = [];
    current_shader: ShaderType;
    vbo: Buffer;
    ibo: Buffer;
    max_quad_count: number = 1000;
    max_vertex_count: number = this.max_quad_count * 4;
    max_index_count: number = this.max_quad_count * 6;
    constructor(gl: WebGL2RenderingContext) {
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
        const basic_texture_vs = `#version 300 es                               
        layout (location = 0) in vec3 pos;
        layout (location = 1) in vec2 uv; 

        uniform mat4 m, v, p;

        out vec2 v_uv;
    
        void main() {
        gl_Position = p * v * m * vec4(pos, 1.0);
          v_uv = uv;
        }
        `;
        const basic_texture_fs = `#version 300 es 
        precision highp float;
        precision highp int;

        uniform sampler2D tex;

        in vec2 v_uv;

        out vec4 frag_color;

        void main() {
            frag_color = texture(tex, v_uv);
        }
        `;

        const batch_vs =  `#version 300 es
            layout (location = 0) in vec3 pos;
            layout (location = 1) in vec2 uv;
            layout (location = 2) in float tex_index;
            layout (location = 3) in vec4 color;

            uniform mat4 m, v, p;

            out vec2 v_uv;
            out float v_tex_index;
            out vec4 v_color;

            void main() {
                gl_Position = p * v * m * vec4(pos, 1.0);
                v_uv = uv;
                v_tex_index = tex_index;
                v_color = color;
            }
        `;

        const batch_fs =  `#version 300 es
            precision highp float;
            precision highp int;

            uniform sampler2D textures[32];
            uniform sampler2D tex;

            in vec2 v_uv;
            in float v_tex_index;
            in vec4 v_color;

            out vec4 frag_color;

            void main() {
                frag_color = v_color * texture(tex, v_uv);
            }
        `;

        this.shaders[ShaderType.BASIC_COLOR] = new Shader(gl, vsSource, fsSource);
        this.shaders[ShaderType.BASIC_TEXTURE] = new Shader(gl, basic_texture_vs, basic_texture_fs);
        this.shaders[ShaderType.BATCH] = new Shader(gl, batch_vs, batch_fs);

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

    draw_quad(pos: vec2, size: vec2, color: vec4, tex: Texture) {
        if(renderer_data.index_count >= this.max_index_count){
            this.end_batch();
            this.flush();
            this.begin_batch();
        }

        let tex_index: number = -1;
        for(let i: number = 0; i < 32; i++) {
            if(renderer_data.textures[i] === tex) {
                tex_index = i;
            }
        }

        if(tex_index === -1) {
            tex_index = renderer_data.texture_count;
            renderer_data.textures[renderer_data.texture_count] = tex;
            renderer_data.texture_count++;
        }

        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 0] = pos[0];
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 1] = pos[1];
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 2] = 0.0;
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 3] = 0.0;
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 4] = 0.0;
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 5] = tex_index;
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 6] = color[0];
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 7] = color[1];
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 8] = color[2];
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 9] = color[3];
        renderer_data.quad_buffer_ptr_count += 10;

        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 0] = pos[0] + size[0];
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 1] = pos[1];
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 2] = 0.0;
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 3] = 1.0;
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 4] = 0.0;
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 5] = tex_index;
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 6] = color[0];
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 7] = color[1];
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 8] = color[2];
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 9] = color[3];
        renderer_data.quad_buffer_ptr_count += 10;

        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 0] = pos[0] + size[0];
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 1] = pos[1] + size[1];
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 2] = 0.0;
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 3] = 1.0;
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 4] = 1.0;
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 5] = tex_index;
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 6] = color[0];
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 7] = color[1];
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 8] = color[2];
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 9] = color[3];
        renderer_data.quad_buffer_ptr_count += 10;

        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 0] = pos[0];
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 1] = pos[1] + size[1];
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 2] = 0.0;
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 3] = 0.0;
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 4] = 1.0;
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 5] = tex_index;
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 6] = color[0];
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 7] = color[1];
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 8] = color[2];
        renderer_data.quad_buffer_ptr[renderer_data.quad_buffer_ptr_count + 9] = color[3];
        renderer_data.quad_buffer_ptr_count += 10;

        renderer_data.index_count += 6;
        renderer_data.quad_count++;

        // console.log("test");
    }

    init() {
        renderer_data = {
            index_count: 0,
            quad_buffer: [],
            quad_buffer_ptr: [],
            quad_buffer_ptr_count: 0,
            quad_count: 0,
            textures: [],
            texture_count: 0
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
        renderer_data.index_count = 0;
    }

    end_batch() {

    }

    flush() {
        this.use_shader(ShaderType.BATCH);
        this.set_view_proj();
        this.shader.uniform_mat4("m", mat4.create());

        this.shader.uniform_textures2D("textures");
        for(let i = 0; i < 32; i++) {
            if(renderer_data.textures[i] !== undefined) {
                // this.gl.activeTexture(this.gl.TEXTURE0 + i);
                this.gl.bindTexture(this.gl.TEXTURE_2D, renderer_data.textures[i].texture);
            }
        }

        this.vbo.buffer(renderer_data.quad_buffer_ptr);

        this.vbo.attr(0, 3, this.gl.FLOAT, 10 * 4.0, 0);
        this.vbo.attr(1, 2, this.gl.FLOAT, 10 * 4.0, 3 * 4.0);
        this.vbo.attr(2, 1, this.gl.FLOAT, 10 * 4.0, 5 * 4.0);
        this.vbo.attr(3, 4, this.gl.FLOAT, 10 * 4.0, 6 * 4.0);

        this.vbo.bind();
        this.ibo.bind();

        this.gl.drawElements(this.gl.TRIANGLES, renderer_data.index_count, this.gl.UNSIGNED_SHORT, 0);
    }
}