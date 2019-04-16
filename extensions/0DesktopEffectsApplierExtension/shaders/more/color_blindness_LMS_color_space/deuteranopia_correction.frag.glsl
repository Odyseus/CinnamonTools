#extension GL_OES_standard_derivatives : enable

precision highp float;

uniform sampler2D tex;

vec3 rgb2lms(vec3 colourRGB) {
    // RGB to LMS matrix conversion
    float l = (17.8824f * colourRGB.r) + (43.5161f * colourRGB.g) + (4.11935f * colourRGB.b);
    float m = (3.45565f * colourRGB.r) + (27.1554f * colourRGB.g) + (3.86714f * colourRGB.b);
    float s = (0.0299566f * colourRGB.r) + (0.184309f * colourRGB.g) + (1.46709f * colourRGB.b);

    return vec3(l, m, s);
}

vec3 lms2rgb(float l, float m, float s) {
    // LMS to RGB matrix conversion
    float r = (0.0809444479f * l) + (-0.130504409f * m) + (0.116721066f * s);
    float g = (-0.0102485335 * l) + (0.0540193266 * m) + (-0.113614708 * s);
    float b = (-0.000365296938f * l) + (-0.00412161469f * m) + (0.693511405f * s);

    return vec3(r, g, b);
}

vec4 daltonize(vec4 in_c) {
    // RGB to LMS matrix conversion
    vec3  lms = rgb2lms(in_c.rgb);
    float L   = lms.x;
    float M   = lms.y;
    float S   = lms.z;

    // Simulate deuteranopia - greens are greatly reduced (1% men)
    float l = (1.0f * L) + (0.0f * M) + (0.0f * S);
    float m = (0.494207f * L) + (0.0f * M) + (1.24827f * S);
    float s = (0.0f * L) + (0.0f * M) + (1.0f * S);

    // LMS to RGB matrix conversion
    vec3 colourRGB = clamp(lms2rgb(l, m, s), 0.0, 1.0);

    return vec4(colourRGB, in_c.a);
}

vec4 daltonize_correct(vec4 in_c) {
    vec4 sim_c = daltonize(in_c);

    // Isolate invisible colors to color vision deficiency (calculate error matrix)
    sim_c = (in_c - sim_c);

    // Shift colors towards visible spectrum (apply error modifications)
    vec4 shifted_c = vec4(                   //
        (sim_c.r * 1.0f) + (sim_c.g * 0.7f), //
        0.0f,                                //
        (sim_c.g * 0.7f) + (sim_c.b * 1.0f), //
        in_c.a                               //
    );

    // Add compensation to original values
    vec3 cor_c = clamp(in_c.rgb + shifted_c.rgb, 0.0, 1.0);

    return vec4(cor_c, in_c.a);
}

void main() {
    vec4 texColor  = texture2D(tex, cogl_tex_coord_in[0].xy);
    cogl_color_out = daltonize_correct(texColor).rgba;
}
