// Source: https://github.com/BRX420/ALGEBRA/tree/master/SFML-2.5.1/examples/shader/resources
#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D tex;

const float blur_radius = 0.0005;

void main() {
    vec2 offx = vec2(blur_radius, 0.0);
    vec2 offy = vec2(0.0, blur_radius);

    vec4 pixel =
        texture2D(tex, cogl_tex_coord_in[0].xy) * 4.0 + texture2D(tex, cogl_tex_coord_in[0].xy - offx) * 2.0 +
        texture2D(tex, cogl_tex_coord_in[0].xy + offx) * 2.0 + texture2D(tex, cogl_tex_coord_in[0].xy - offy) * 2.0 +
        texture2D(tex, cogl_tex_coord_in[0].xy + offy) * 2.0 + texture2D(tex, cogl_tex_coord_in[0].xy - offx - offy) * 1.0 +
        texture2D(tex, cogl_tex_coord_in[0].xy - offx + offy) * 1.0 +
        texture2D(tex, cogl_tex_coord_in[0].xy + offx - offy) * 1.0 +
        texture2D(tex, cogl_tex_coord_in[0].xy + offx + offy) * 1.0;

    cogl_color_out = cogl_color_in * (pixel / 16.0);
}
