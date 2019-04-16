// Source: https://github.com/ErwanDouaille/gse-shader

uniform sampler2D tex;
uniform int       height;
uniform int       width;
uniform int       mouseX;
uniform int       mouseY;
uniform float     brightness_level = 0.6;

void main() {
    float value = brightness_level;

    if (value < 0.2) {
        value = 0.2;
    }

    cogl_color_out = vec4(texture2D(tex, cogl_tex_coord_in[0].xy).rgb * value, 1.0);
}
