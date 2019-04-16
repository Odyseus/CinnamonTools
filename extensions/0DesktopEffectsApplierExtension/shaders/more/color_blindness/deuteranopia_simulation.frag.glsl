uniform sampler2D tex;

// Deuteranopia
vec3 blindVisionR = vec3(0.43f, 0.72f, -0.15f);
vec3 blindVisionG = vec3(0.34f, 0.57f, 0.09f);
vec3 blindVisionB = vec3(-0.02f, 0.03f, 1.00f);

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
