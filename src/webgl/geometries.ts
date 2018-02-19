import Buffer from './Buffer';
import RenderingContext from './RenderingContext';

export function circleGeometry(rctx: RenderingContext, pointCount: number = 100) {
    const cacheKey = 'CircleGeometry_' + pointCount;
    let buffer = rctx.getBuffer(cacheKey);
    if(buffer) {
        return buffer;
    }
    const points = new Float32Array((pointCount+2)*2);
    let pbi = 0;
    points[pbi++] = 0; // center
    points[pbi++] = 0;
    for(let i = 0;i < pointCount;i++) {
        points[pbi++] = Math.sin(i*2*Math.PI/pointCount);
        points[pbi++] = Math.cos(i*2*Math.PI/pointCount);
    }
    points[pbi++] = points[2]; // repeat last point again
    points[pbi++] = points[3];

    buffer = new Buffer(rctx, false, points);
    rctx.cacheBuffer(cacheKey, buffer);
    return buffer;
}

export function squareGeometry(rctx: RenderingContext) {
    const cacheKey = 'SquareGeometry';
    let buffer = rctx.getBuffer(cacheKey);
    if(buffer) {
        return buffer;
    }
    const squareGeometry = new Buffer(
        this.gl, false,
        [
            -1,  -1,
            1,  -1,
            -1,  1,
            -1,  1,
            1,  -1,
            1,  1
        ]
    );
    rctx.cacheBuffer(cacheKey, buffer);
    return buffer;
}