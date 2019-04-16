#extension GL_OES_standard_derivatives : enable
precision mediump float;

uniform sampler2D tex;
uniform int       height;
uniform int       width;

// Created by mmichal

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

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec4 textureColor = texture2D(tex, (fragCoord.xy / vec2(width, height)));
    vec3 fragRGB      = textureColor.rgb;
    vec3 fragHSV      = rgb2hsv(fragRGB).rgb;

    float H = fragHSV.r;
    float S = fragHSV.g;
    float V = fragHSV.b;

    //   HShift  -  0.0*-360*
    //   SShift  -  sugested -100.0-100.0
    //   VShift  -  sugested -100.0-100.0

    // No shift.
    // float HShift = 000.0;
    // float SShift = 000.0;
    // float VShift = 000.0;

    float HShift = 180.0;
    float SShift = 1.0;
    float VShift = 1.0;

    H = H + (HShift / 360.0);
    S = S + (SShift / 100.0);
    V = V + (VShift / 100.0);

    vec3 newRGB = vec3(H, S, V);

    newRGB    = hsv2rgb(newRGB);
    fragColor = vec4(newRGB, 1.0);
}

void main() {
    mainImage(cogl_color_out, cogl_tex_coord_in[0].xy * vec2(width, height));
}
