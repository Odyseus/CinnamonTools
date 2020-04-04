#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D tex;

vec3 rgb2lms(vec3 colourRGB) {
    // RGB to LMS matrix conversion
    float l = (17.8824 * colourRGB.r) + (43.5161 * colourRGB.g) + (4.11935 * colourRGB.b);
    float m = (3.45565 * colourRGB.r) + (27.1554 * colourRGB.g) + (3.86714 * colourRGB.b);
    float s = (0.0299566 * colourRGB.r) + (0.184309 * colourRGB.g) + (1.46709 * colourRGB.b);

    return vec3(l, m, s);
}

vec3 lms2rgb(float l, float m, float s) {
    // LMS to RGB matrix conversion
    float r = (0.0809444479 * l) + (-0.130504409 * m) + (0.116721066 * s);
    float g = (-0.0102485335 * l) + (0.0540193266 * m) + (-0.113614708 * s);
    float b = (-0.000365296938 * l) + (-0.00412161469 * m) + (0.693511405 * s);

    return vec3(r, g, b);
}

vec4 daltonize(vec4 in_c) {
    // RGB to LMS matrix conversion
    vec3  lms = rgb2lms(in_c.rgb);
    float L   = lms.x;
    float M   = lms.y;
    float S   = lms.z;

    // Simulate protanopia - reds are greatly reduced (1% men)
    float l = (0.0 * L) + (2.02344 * M) + (-2.52581 * S);
    float m = (0.0 * L) + (1.0 * M) + (0.0 * S);
    float s = (0.0 * L) + (0.0 * M) + (1.0 * S);

    // LMS to RGB matrix conversion
    vec3 colourRGB = clamp(lms2rgb(l, m, s), 0.0, 1.0);

    return vec4(colourRGB, in_c.a);
}

vec4 daltonize_correct(vec4 in_c) {
    vec4 sim_c = daltonize(in_c);

    // Isolate invisible colors to color vision deficiency (calculate error matrix)
    vec4 diff = (in_c - sim_c);

    // Shift colors towards visible spectrum (apply error modifications)
    vec4 shifted_c = vec4(               //
        0.0,                             //
        (diff.r * 0.7) + (diff.g * 1.0), //
        (diff.r * 0.7) + (diff.b * 1.0), //
        in_c.a                           //
    );

    // Add compensation to original values
    vec3 cor_c = clamp(in_c.rgb + shifted_c.rgb, 0.0, 1.0);

    return vec4(cor_c, in_c.a);
}

void main() {
    vec4 texColor  = texture2D(tex, cogl_tex_coord_in[0].xy);
    cogl_color_out = daltonize_correct(texColor).rgba;
}
