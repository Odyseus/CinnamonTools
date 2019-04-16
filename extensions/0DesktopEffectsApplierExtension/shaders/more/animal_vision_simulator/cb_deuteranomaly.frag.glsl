#extension GL_OES_standard_derivatives : enable
precision mediump float;

uniform sampler2D tex;

// Created by mmichal

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec4 col = texture2D(tex, fragCoord);

    // Deuteranomaly ("red/green" 6% of males, 0.4% of females)
    vec3 c_r = vec3(0.80, 0.20, 0.0);
    vec3 c_g = vec3(0.25833, 0.74167, 0.0);
    vec3 c_b = vec3(0.0, 0.14167, 0.85833);

    vec3 rgb = vec3(dot(col.rgb, c_r), dot(col.rgb, c_g), dot(col.rgb, c_b));

    fragColor = vec4(rgb, 1.0);
}

void main() {
    mainImage(cogl_color_out, cogl_tex_coord_in[0].xy);
}
