#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D tex;
uniform int       height;
uniform int       width;

// Created by mmichal

vec2 distortion  = vec2(0.441, 0.156);
vec2 leftCenter  = vec2(0.5, 0.5);
vec2 rightCenter = vec2(0.5, 0.5);
vec4 background  = vec4(0.0, 0.0, 0.0, 1.0);

float poly(float val) {
    return 1.0 + (distortion.x + distortion.y * val) * val;
}

vec2 barrel(vec2 v, vec2 center) {
    vec2 w = v - center;
    return poly(dot(w, w)) * w + center;
}

vec4 glasses(out vec4 fragColor, in vec2 fragCoord) {
    vec2 vUV = fragCoord.xy;

    bool  isLeft = (vUV.x < 0.5);
    float offset = isLeft ? 0.0 : 0.5;
    vec2  a      = barrel(vec2((vUV.x - offset) / 0.5, vUV.y), isLeft ? leftCenter : rightCenter);
    if (a.x < 0.0 || a.x > 1.0 || a.y < 0.0 || a.y > 1.0) {
        fragColor = background;
    } else {
        fragColor = texture2D(tex, vec2(a.x * 0.5 + offset, a.y));
    }
    return fragColor;
}

vec4 dog(vec4 col) {
    vec3 c_r = vec3(0.625, 0.375, 0.0);
    vec3 c_g = vec3(0.70, 0.30, 0.0);
    vec3 c_b = vec3(0.0, 0.30, 0.70);

    vec3 rgb = vec3(dot(col.rgb, c_r), dot(col.rgb, c_g), dot(col.rgb, c_b));

    vec4 fragColor = vec4(rgb, 1.0);
    return fragColor;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec4 col  = vec4(glasses(fragColor, fragCoord));
    fragColor = vec4(dog(col));
}

void main() {
    mainImage(cogl_color_out, cogl_tex_coord_in[0].xy);
}
