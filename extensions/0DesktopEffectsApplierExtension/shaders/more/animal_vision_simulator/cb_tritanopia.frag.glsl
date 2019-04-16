#extension GL_OES_standard_derivatives : enable
precision highp float;

uniform sampler2D tex;

// Created by mmichal

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec4 col = texture2D(tex, fragCoord);

    // Tritanopia ("blue/yellow", <1% of males and females)
    // vec3 c_r = vec3(0.95, 0.05, 0.0);
    // vec3 c_g = vec3(0.0, 0.43333, 0.56667);
    // vec3 c_b = vec3(0.0, 0.475, 0.525);
    mat3 m = mat3(0.95, 0.05, 0.0, 0.0, 0.43333, 0.56667, 0.0, 0.475, 0.525);

    // vec3 rgb = vec3(dot(col.rgb, c_r), dot(col.rgb, c_g), dot(col.rgb, c_b));

    fragColor = vec4(col.rgb * m, col.a);
    // fragColor = vec4(rgb, col.a);
}

void main() {
    mainImage(cogl_color_out, cogl_tex_coord_in[0].xy);
}
