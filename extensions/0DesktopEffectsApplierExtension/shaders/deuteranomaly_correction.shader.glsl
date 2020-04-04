// Source: https://github.com/empijei/ColorFix
#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D tex;

vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 correctFilter(vec3 hsl) {
    // Hue
    vec2 prev, cur;
    prev = vec2(1.0, 1.0);
    if (hsl.x < prev.x) {
        cur  = prev;
        prev = vec2(0.8, 0.8);
    }
    if (hsl.x < prev.x) {
        cur  = prev;
        prev = vec2(0.67, 0.73);
    }
    if (hsl.x < prev.x) {
        cur  = prev;
        prev = vec2(0.36, 0.34);
    }
    if (hsl.x < prev.x) {
        cur  = prev;
        prev = vec2(0.2, 0.245);
    }
    if (hsl.x < prev.x) {
        cur  = prev;
        prev = vec2(0.1333, 0.103);
    }
    if (hsl.x < prev.x) {
        cur  = prev;
        prev = vec2(0.0, 0.0);
    }

    float coeff = (hsl.x - prev.x) / (cur.x - prev.x);
    hsl.x       = (coeff * (cur.y - prev.y) + prev.y);

    // Saturation
    prev = vec2(0.0, 0.0);
    cur  = vec2(0.2, 0.4);
    if (hsl.y > cur.x) {
        prev = cur;
        cur  = vec2(1.0, 0.99);
    }

    coeff = (hsl.y - prev.x) / (cur.x - prev.x);
    hsl.y = (coeff * (cur.y - prev.y) + prev.y);

    return hsl;
}

void main() {
    vec2 xy        = cogl_tex_coord_in[0].xy;
    vec4 texColor  = texture2D(tex, xy);
    vec3 hsl       = rgb2hsv(vec3(texColor.r, texColor.g, texColor.b));
    hsl            = correctFilter(hsl);
    texColor.rgb   = hsv2rgb(hsl);
    cogl_color_out = texColor;
}
