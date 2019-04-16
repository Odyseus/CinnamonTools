// Source: https://github.com/IGJoshua/ghoti-engine/tree/master/resources/shaders

uniform sampler2D tex;

void main() {
    vec3  rgb      = texture2D(tex, cogl_tex_coord_in[0].xy).rgb;
    float average  = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
    cogl_color_out = vec4(average, average, average, 1.0);
}
