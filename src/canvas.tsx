import React, { useEffect, useRef } from "react";
import main from "./main";

const Canvas = props => {
    const canvas_ref = useRef(null);

    useEffect(() => {
        const canvas = canvas_ref.current;
        // @ts-ignore: Object is possibly 'null'.
        const gl:WebGL2RenderingContext = canvas.getContext("webgl2");

        main(gl);
        // gl.clearColor(1, 0, 1, 1);
        // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    }, []);


    return <canvas ref={canvas_ref} {...props} width={ 1080 } height={ 720 } padding = {0} margin = {0}/>;
}

export default Canvas;