// Source: https://github.com/maiself/gnome-shell-extension-invert-color

uniform sampler2D tex;

void main() {
    vec4 color = texture2D(tex, cogl_tex_coord_in[0].st);
    if (color.a > 0.0) {
        color.rgb /= color.a;
    }
    color.rgb = vec3(1.0, 1.0, 1.0) - color.rgb;
    color.rgb *= color.a;
    cogl_color_out = color * cogl_color_in;
}
