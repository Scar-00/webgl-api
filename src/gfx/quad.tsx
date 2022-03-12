import { vec2 } from "gl-matrix";
let mouseX: number = 0;
let mouseY: number = 0;

// function bezier_calc(p0: vec2, p1: vec2, p2: vec2, t: number): vec2 {
//     let p_final: vec2 = vec2.create();
//     p_final[0] = Math.pow(1 - t, 2) * p0[0] + (1 - t) * 2 * t * p1[0] + t * t * p2[0];
//     p_final[1] = Math.pow(1 - t, 2) * p0[1] + (1 - t) * 2 * t * p1[1] + t * t * p2[1];
//     return p_final;
// }

function bezier_calc(p0: vec2, p1: vec2, p2: vec2, t: number): vec2 {
    let p_final: vec2 = vec2.create();
    p_final[0] = Math.pow(1 - t, 2) * p0[0] + 
                (1 - t) * 2 * t * p1[0] + 
                t * t * p2[0];
    p_final[1] = Math.pow(1 - t, 2) * p0[1] + (1 - t) * 2 * t * p1[1] + t * t * p2[1];
    return p_final;
}

export class Quad {
    pos:vec2;
    size: vec2;
    grabbed: boolean;
    constructor(pos: vec2, size: vec2) {
        this.pos = pos;
        this.size = size;
        this.grabbed = false;
    }

    set_grabbed(v: boolean) {
        this.grabbed = v;
    }

    in_bounds(): boolean {
        let mY: number;
        window.addEventListener("mousemove", function(e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
    
        mY = document.body.clientHeight - mouseY; 
        if(mouseX > this.pos[0] && mouseX < (this.pos[0] + this.size[0]) && mY > this.pos[1] && mY < (this.pos[1] + this.size[1])) {
            return true;
        }
        return false;
    }

    move(dest:vec2) {
        if(this.pos[0] !== dest[0] && this.pos[1] !== dest[1]) {
            this.pos[0] += 1;
            this.pos[1] += 1;
        }
    }

    bezier(start: vec2, control:vec2, end: vec2, i: number): number {
        let point:vec2 = vec2.create();
        point = bezier_calc(start, control, end, i);
        if(i < 1 && i !== -1) {
            i += 0.05;
            this.pos = point;

            return i;
        }
        return -1;
    }
}