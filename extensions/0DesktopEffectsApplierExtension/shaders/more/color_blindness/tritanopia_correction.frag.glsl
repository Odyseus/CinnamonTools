uniform sampler2D tex;

// Tritanopia
vec3 blindVisionR = vec3(0.97f, 0.11f, -0.08f);
vec3 blindVisionG = vec3(0.02f, 0.82f, 0.16f);
vec3 blindVisionB = vec3(-0.06f, 0.88f, 0.18f);

void main() {
    vec4 texColor = texture2D(tex, cogl_tex_coord_in[0].xy);

    vec4 simulation = vec4(              //
        dot(texColor.rgb, blindVisionR), //
        dot(texColor.rgb, blindVisionG), //
        dot(texColor.rgb, blindVisionB), //
        texColor.a                       //
    );

    simulation = (texColor - simulation);

    // Shift colors towards visible spectrum (apply simulation modifications).
    vec4 correction = vec4(                                                    //
        (simulation.r * 1.0f),                                                 //
        (simulation.g * 1.0f),                                                 //
        (simulation.r * 0.7f) + (simulation.g * 0.7f) + (simulation.b * 1.0f), //
        1.0f                                                                   //
    );

    // Add compensation to original values
    correction   = texColor + correction;
    correction.a = texColor.a;

    cogl_color_out = correction;
}
