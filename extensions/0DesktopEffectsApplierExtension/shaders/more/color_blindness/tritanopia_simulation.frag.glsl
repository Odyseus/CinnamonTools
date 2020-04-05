#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D tex;

// Tritanopia
vec3 blindVisionR = vec3(0.97, 0.11, -0.08);
vec3 blindVisionG = vec3(0.02, 0.82, 0.16);
vec3 blindVisionB = vec3(-0.06, 0.88, 0.18);

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
