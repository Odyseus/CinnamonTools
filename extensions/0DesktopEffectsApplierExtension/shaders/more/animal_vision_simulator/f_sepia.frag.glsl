#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D tex;
uniform int       height;
uniform int       width;

// Sepia Color
mat4 colormatrix = mat4(0.393, 0.349, 0.272, 0.0, 0.769, 0.686, 0.534, 0.0, 0.189, 0.168, 0.131, 0.0, 0.0, 0.0, 0.0, 1.0);

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv              = fragCoord.xy;
    vec4 color           = texture2D(tex, fragCoord / vec2(width, height));
    mat4 colormatrixDiff = mat4(colormatrix);
    fragColor            = colormatrixDiff * color;
}

void main() {
    mainImage(cogl_color_out, cogl_tex_coord_in[0].xy * vec2(width, height));
}
