#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D tex;
uniform int       height;
uniform int       width;

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv          = fragCoord.xy;
    vec4 color       = texture2D(tex, fragCoord / vec2(width, height));
    vec3 colormatrix = vec3(color.rgb);
    vec3 bgr         = vec3(color.bgr);

    fragColor = vec4(bgr, 1.0);
}

void main() {
    mainImage(cogl_color_out, cogl_tex_coord_in[0].xy * vec2(width, height));
}
