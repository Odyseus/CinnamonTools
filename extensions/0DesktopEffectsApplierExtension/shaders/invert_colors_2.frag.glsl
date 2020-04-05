// Source: https://github.com/ErwanDouaille/gse-shader
#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D tex;

void main() {
    vec3 rgb       = texture2D(tex, cogl_tex_coord_in[0].xy).rgb;
    cogl_color_out = vec4(1.0 - rgb.x, 1.0 - rgb.y, 1.0 - rgb.z, 1.0);
}
