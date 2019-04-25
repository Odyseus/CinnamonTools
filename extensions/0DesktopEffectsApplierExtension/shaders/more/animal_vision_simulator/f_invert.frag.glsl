#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D tex;
uniform int       height;
uniform int       width;

// Created by mmichal

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv    = fragCoord.xy;
    vec4 color = texture2D(tex, uv);

    color.xyz = vec3(1.0, 1.0, 1.0) - color.xyz;
    fragColor = color;
}

void main() {
    mainImage(cogl_color_out, cogl_tex_coord_in[0].xy);
}
