// Source: https://github.com/BRX420/ALGEBRA/tree/master/SFML-2.5.1/examples/shader/resources
#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D tex;
const float       pixel_threshold = 0.0001;

void main() {
    float factor   = 1.0 / (pixel_threshold + 0.001);
    vec2  pos      = floor(cogl_tex_coord_in[0].xy * factor + 0.5) / factor;
    cogl_color_out = texture2D(tex, pos) * cogl_color_in;
}
