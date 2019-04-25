#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D tex;
uniform int       height;
uniform int       width;

// Created by mmichal

#define H 0.010
#define S ((3.0 / 2.0) * H / sqrt(6.0))

vec2 xy_coord(vec2 Index) {
    float i = Index.x;
    float j = Index.y;
    vec2  r;

    r.x = i * S;
    r.y = j * H + (mod(i, 2.0)) * H / 2.0;
    return r;
}

vec2 Index(vec2 xy_coord) {
    vec2  r;
    float x = xy_coord.x;
    float y = xy_coord.y;

    float it     = float(floor(x / S));
    float yts    = y - (mod(it, 2.0)) * H / 2.0;
    float jt     = float(floor((1.0 / H) * yts));
    float xt     = x - it * S;
    float yt     = yts - jt * H;
    float deltaj = (yt > H / 2.0) ? 1.0 : 0.0;
    float fcond  = S * (2.0 / 3.0) * abs(0.5 - yt / H);

    if (xt > fcond) {
        r.x = it;
        r.y = jt;
    } else {
        r.x = it - 1.0;
        r.y = jt - (mod(r.x, 2.0)) + deltaj;
    }
    return r;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv    = fragCoord.xy;
    vec2 hexIx = Index(uv);
    vec2 hexXy = xy_coord(hexIx);
    vec4 fcol  = texture2D(tex, hexXy);
    fragColor  = fcol;
}

void main() {
    mainImage(cogl_color_out, cogl_tex_coord_in[0].xy);
}
