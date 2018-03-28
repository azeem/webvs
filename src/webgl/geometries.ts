import Buffer from "./Buffer";
import RenderingContext from "./RenderingContext";

/**
 * Returns a cached Buffer with points on a circle
 * @param rctx RenderingContext undef which the buffer will be created and cached
 * @param pointCount number of points in the geometry
 */
export function circleGeometry(rctx: RenderingContext, pointCount: number = 100) {
    const cacheKey = "CircleGeometry_" + pointCount;
    let buffer = rctx.getBuffer(cacheKey);
    if (buffer) {
        return buffer;
    }
    const points = new Float32Array((pointCount + 2) * 2);
    let pbi = 0;
    points[pbi++] = 0; // center
    points[pbi++] = 0;
    for (let i = 0; i < pointCount; i++) {
        points[pbi++] = Math.sin(i * 2 * Math.PI / pointCount);
        points[pbi++] = Math.cos(i * 2 * Math.PI / pointCount);
    }
    points[pbi++] = points[2]; // repeat last point again
    points[pbi++] = points[3];

    buffer = new Buffer(rctx, false, points);
    rctx.cacheBuffer(cacheKey, buffer);
    return buffer;
}

/**
 * Returns a cached buffer with points on a square
 * @param rctx RenderingContext under which the buffer will be created and cached
 * @param positiveQuad if true then square will be in [0-1][0-1] range.
 */
export function squareGeometry(rctx: RenderingContext, positiveQuad: boolean = false) {
    const cacheKey = "SquareGeometry_" + positiveQuad;
    let buffer = rctx.getBuffer(cacheKey);
    if (buffer) {
        return buffer;
    }
    let points;
    if (positiveQuad) {
        points = [
            0,  0,
            0,  1,
            1,  1,
            0,  0,
            1,  1,
            1,  0,
        ];
    } else {
        points = [
            -1,  -1,
            1,  -1,
            -1,  1,
            -1,  1,
            1,  -1,
            1,  1,
        ];
    }
    buffer = new Buffer(rctx, false, points);
    rctx.cacheBuffer(cacheKey, buffer);
    return buffer;
}
