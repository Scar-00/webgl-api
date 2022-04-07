import { vec2, vec4 } from "gl-matrix";
import { Renderer } from "./gfx/renderer";
import { Quad } from "./gfx/quad";
import blank from "./res/blank.png";
import { Shader } from "./gfx/shader";
import { Texture } from "./gfx/texture";

function percent_to_pos(p_in_perc:vec2): vec2 {
    return vec2.fromValues((document.body.clientWidth / 100) * p_in_perc[0], (document.body.clientHeight / 100) * p_in_perc[1]);
}

var gl: WebGL2RenderingContext;
let renderer: Renderer;
let quad: Quad;
let quad1: Quad;


function main(gl_context:WebGL2RenderingContext) {
    gl = gl_context;
    init();
    window.requestAnimationFrame(loop);
}

let time = 1000 / 180;

function loop() {
    setTimeout(tick, 1);
    update();
    render();
    window.requestAnimationFrame(loop);
}

function init() {
    percent_to_pos(vec2.fromValues(100, 100));
    renderer = new Renderer(gl);
    renderer.init();
    quad = new Quad(vec2.fromValues(100, 100), vec2.fromValues( 100.0, 100.0 ));
    quad1 = new Quad(vec2.fromValues(100, 100), vec2.fromValues( 100.0, 100.0 ));
}

let i = 0;

function tick() {
    // console.log("test");
}

function update() {
    i = quad.bezier(vec2.fromValues(100, 100), vec2.fromValues(150, 200), vec2.fromValues(300, 200), i);
    // quad1.move(vec2.fromValues(300, 300));

    if(quad.in_bounds()) {
        quad.pos[0] += 100;
    }
}

function render() {
    renderer.prepare();
    renderer.begin_batch();
        renderer.draw_quad(quad.pos, quad.pos, vec4.fromValues(1, 1, 1, 1), new Texture(gl, document.getElementById("ahhh") as HTMLImageElement));
    renderer.end_batch();
    renderer.flush();
}



export default main;