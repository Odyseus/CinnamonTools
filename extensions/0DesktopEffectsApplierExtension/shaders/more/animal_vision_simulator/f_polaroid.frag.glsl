#extension GL_OES_standard_derivatives : enable
precision mediump float;

uniform sampler2D tex;
uniform int       height;
uniform int       width;

// Polaroid Color
mat4 colormatrix = mat4(1.438, -0.062, -0.062, 0.0, -0.122, 1.378, -0.122, 0.0, -0.016, -0.016, 1.483, 0.0, -0.030, 0.050, -0.020, 0.0);

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv              = fragCoord.xy;
    vec4 color           = texture2D(tex, fragCoord / vec2(width, height));
    mat4 colormatrixDiff = mat4(colormatrix);

    fragColor = colormatrixDiff * color;
}

void main() {
    mainImage(cogl_color_out, cogl_tex_coord_in[0].xy * vec2(width, height));
}
