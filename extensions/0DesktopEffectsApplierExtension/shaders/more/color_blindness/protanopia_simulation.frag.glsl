uniform sampler2D tex;

// Protanopia
vec3 blindVisionR = vec3(0.20f, 0.99f, -0.19f);
vec3 blindVisionG = vec3(0.16f, 0.79f, 0.04f);
vec3 blindVisionB = vec3(0.01f, -0.01f, 1.00f);

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
