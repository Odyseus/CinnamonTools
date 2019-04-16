#extension GL_OES_standard_derivatives : enable
precision mediump float;

uniform sampler2D tex;
uniform int       height;
uniform int       width;

// Created by mmichal

vec3 thermal_vision(in vec3 color) {
    vec3 c_r = vec3(0.0, 0.0, 1.0);
    vec3 c_g = vec3(1.0, 1.0, 0.0);
    vec3 c_b = vec3(1.0, 0.0, 0.0);

    float lum = dot(vec3(0.20, 0.3, 0.25), color);
    if (lum < 0.5) {
        color = mix(c_r, c_g, lum / 0.5);
    } else {
        color = mix(c_g, c_b, (lum - 0.5) / 0.5);
    }
    return color;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv    = fragCoord.xy;
    vec3 color = texture2D(tex, uv).rgb;
    // for color inversion comment:
    // color.rgb = 1.0 - color.rgb;
    fragColor = vec4(thermal_vision(color), 1.0);
}

void main() {
    mainImage(cogl_color_out, cogl_tex_coord_in[0].xy);
}
