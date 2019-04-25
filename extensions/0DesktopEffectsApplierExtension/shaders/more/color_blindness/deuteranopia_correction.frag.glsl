#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D tex;

// Deuteranopia
vec3 blindVisionR = vec3(0.43, 0.72, -0.15);
vec3 blindVisionG = vec3(0.34, 0.57, 0.09);
vec3 blindVisionB = vec3(-0.02, 0.03, 1.00);

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
    vec4 correction = vec4(                                                 //
        (simulation.r * 1.0),                                               //
        (simulation.r * 0.7) + (simulation.g * 1.0) + (simulation.b * 0.7), //
        (simulation.b * 1.0),                                               //
        1.0                                                                 //
    );

    // Add compensation to original values
    correction   = texColor + correction;
    correction.a = texColor.a;

    cogl_color_out = correction;
}
