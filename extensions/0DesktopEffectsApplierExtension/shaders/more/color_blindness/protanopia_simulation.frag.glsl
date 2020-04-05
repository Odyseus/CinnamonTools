#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D tex;

// Protanopia
vec3 blindVisionR = vec3(0.20, 0.99, -0.19);
vec3 blindVisionG = vec3(0.16, 0.79, 0.04);
vec3 blindVisionB = vec3(0.01, -0.01, 1.00);

void main() {
    vec4 texColor = texture2D(tex, cogl_tex_coord_in[0].xy);

    vec4 simulation = vec4(              //
        dot(texColor.rgb, blindVisionR), //
        dot(texColor.rgb, blindVisionG), //
        dot(texColor.rgb, blindVisionB), //
        texColor.a                       //
    );

    cogl_color_out = simulation;
}
