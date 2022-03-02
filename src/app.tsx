import React from "react";
import Canvas from "./canvas";

// const canvas: HTMLCanvasElement = document.querySelector("#glCanvas") as HTMLCanvasElement;
// const gl= canvas.getContext("webgl");

function App() {
    // return (
    //     <h1>Hello there</h1>
    // );
    // gl?.clearColor(1, 0, 1, 1);
    return (
        <Canvas />
    );
}

// const cavas_ref = useRef(null);
// const canvas = cavas_ref.current;
// const gl = canvas.getContext("webgl");

export default App;