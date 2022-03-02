import { vec2 } from "gl-matrix";
import { Renderer } from "./gfx/renderer";
import { Texture } from "./gfx/texture";
import { Quad } from "./gfx/quad";

function percent_to_pos(p_in_perc:vec2): vec2 {
    return vec2.fromValues((document.body.clientWidth / 100) * p_in_perc[0], (document.body.clientHeight / 100) * p_in_perc[1]);
}

var gl: WebGLRenderingContext;
let renderer: Renderer;
let quad: Quad;
let quad1: Quad;

function main(gl_context:WebGLRenderingContext) {
    gl = gl_context;
    init();
    window.requestAnimationFrame(loop);
}

function loop() {
    update();
    render();
    window.requestAnimationFrame(loop);
}

function init() {
    renderer = new Renderer(gl);
    quad = new Quad(vec2.fromValues(100, 100), vec2.fromValues( 100.0, 100.0 ));
    quad1 = new Quad(vec2.fromValues(100, 100), vec2.fromValues( 100.0, 100.0 ));
}

let i = 0;

function update() {
    i = quad.bezier(vec2.fromValues(100, 100), vec2.fromValues(150, 200), vec2.fromValues(300, 200), i);
    quad1.move(vec2.fromValues(300, 300));
}

function render() {
    renderer.prepare();
    renderer.init(new Texture(gl, "test.png"));
    renderer.begin_batch();
        renderer.draw_quad(quad.pos, quad.size);
        renderer.draw_quad(quad1.pos, quad1.size);
    renderer.end_batch();
    renderer.flush();
}



export default main;