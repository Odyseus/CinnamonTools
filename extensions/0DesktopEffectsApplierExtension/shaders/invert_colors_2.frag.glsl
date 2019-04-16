// Source: https://github.com/ErwanDouaille/gse-shader

uniform sampler2D tex;

void main() {
    vec3 rgb       = texture2D(tex, cogl_tex_coord_in[0].xy).rgb;
    cogl_color_out = vec4(1.0f - rgb.x, 1.0f - rgb.y, 1.0f - rgb.z, 1.0);
}
