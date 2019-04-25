// This shader is based on code authored by Marco Lizza.
// https://github.com/MarcoLizza/love-workouts/blob/master/anaglyph-3d/assets/shaders/colour-blindness.glsl

// NOTE: I'm forced to set a precision for floats because the shader linter that
// I'm using (Clang) forces me to. Otherwise it will stop linting at the first float declaration.
// And I'm forced to use the GL_ES condition because depending on video driver,
// OpenGL version, muffin version, Cinnamon version, or whatever other garbage with no sense of
// stability whatsoever will cause the shader to fail to compile if the precision is directly set.
// ¬¬
#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D tex;

uniform int _type;        // 1 Protanope.
                          // 2 Deuteranope.
                          // 3 Tritanope.
                          // 4 Acromatopsia (rod monochromacy).
                          // 5 Acromatopsia (blue-cone monochromacy).
                          // I couldn't make boolean uniform value work on
                          // conditions. WTF!!! ¬¬
uniform int _use_cie_rgb; // 0 (false), 1 (true).
uniform int _compensate;  // 0 (false), 1 (true).

float remove_gamma(float s) {
    float r = (s <= 0.04045) ? s / 12.92 : pow((s + 0.055) / 1.055, 2.4);
    return clamp(r, 0.0, 1.0);
}

float apply_gamma(float s) {
    float r = (s <= 0.0031308) ? 12.92 * s : 1.055 * pow(s, 1.0 / 2.4) - 0.055;
    return clamp(r, 0.0, 1.0);
}

vec3 srgb_to_rgb(vec3 srgb) {
    return vec3(remove_gamma(srgb.r), remove_gamma(srgb.g), remove_gamma(srgb.b)); // sRGB to Linear
                                                                                   // RGB.
}

vec3 rgb_to_srgb(vec3 rgb) {
    return vec3(apply_gamma(rgb.r), apply_gamma(rgb.g), apply_gamma(rgb.b)); // Linear RGB to sRGB.
}

// https://en.wikipedia.org/wiki/LMS_color_space
vec3 xyz_to_lms(vec3 xyz) {
    mat3 m = mat3( // XYZ to LMS (von Kries).
        0.4002400,
        -0.2263000,
        0.0000000,
        0.7076000,
        1.1653200,
        0.0000000,
        -0.0808100,
        0.0457000,
        0.9182200);
    return m * xyz;
}

vec3 lms_to_xyz(vec3 lms) {
    mat3 m = mat3( // XYZ to LMS (von Kries).
        1.8599364,
        0.3611914,
        0.0000000,
        -1.1293816,
        0.6388125,
        0.0000000,
        0.2198974,
        -0.0000064,
        1.0890636);
    return m * lms;
}

vec3 xyz_to_rgb(vec3 xyz) {
    if (_use_cie_rgb == 1) {
        mat3 m = mat3( // XYZ to Linear RGB.
            0.41847,
            -0.091169,
            0.00092090,
            -0.15866,
            0.25243,
            -0.0025498,
            -0.082835,
            0.015708,
            0.17860);
        return m * xyz;
    } else {
        mat3 m = mat3( // XYZ to Linear RGB.
            3.2404542,
            -0.9692660,
            0.0556434,
            -1.5371385,
            1.8760108,
            -0.2040259,
            -0.4985314,
            0.0415560,
            1.0572252);
        return m * xyz;
    }
}

vec3 rgb_to_xyz(vec3 rgb) {
    if (_use_cie_rgb == 1) {
        mat3 m = mat3( // Linear RGB to XYZ.
            0.49000,
            0.17697,
            0.00000,
            0.31000,
            0.81240,
            0.01063,
            0.20000,
            0.01063,
            0.99000);
        return (m * rgb) / 0.1762044;
    } else {
        mat3 m = mat3( // Linear RGB to XYZ.
            0.4124564,
            0.2126729,
            0.0193339,
            0.3575761,
            0.7151522,
            0.1191920,
            0.1804375,
            0.0721750,
            0.9503041);
        return m * rgb;
    }
}

vec3 daltonize(vec3 color) {
    mat3 m = mat3(1);

    if (_type == 1) { // Protanope - reds are greatly reduced.
        m = mat3(0.0, 0.0, 0.0, 1.05118294, 1.0, 0.0, -0.05116099, 0.0, 1.0);
    } else if (_type == 2) { // Deuteranope - greens are greatly reduced.
        m = mat3(1.0, 0.95130920, 0.0, 0.0, 0.0, 0.0, 0.0, 0.04866992, 1.0);
    } else if (_type == 3) { // Tritanope - blues are greatly reduced.
        m = mat3(1.0, 0.0, -0.86744736, 0.0, 1.0, 1.86727089, 0.0, 0.0, 0.0);
    } else if (_type == 4) { // Acromatopsia (Rod Monochromacy).
        m = mat3(0.212656, 0.212656, 0.212656, 0.715158, 0.715158, 0.715158, 0.072186, 0.072186, 0.072186);
    } else if (_type == 5) { // Blue-cone monochromacy.
        m = mat3(0.01775, 0.01775, 0.01775, 0.10945, 0.10945, 0.10945, 0.87262, 0.87262, 0.87262);
    }

    return m * color;
}

// Compensation matrices based on material found in:
// https://online-journals.org/index.php/i-jim/article/download/8160/5068
// CC BY 3.0 AT
vec3 compensate(vec3 in_rgb, vec3 sim_rgb) {
    vec3 diff = (in_rgb - sim_rgb);
    vec3 shifted_c;

    // Shift colors towards visible spectrum (apply error modifications).
    if (_type == 1) {                        // Protanope - reds are greatly reduced.
        shifted_c = vec3(                    //
            0.0,                             //
            (diff.r * 0.7) + (diff.g * 1.0), //
            (diff.r * 0.7) + (diff.b * 1.0)  //
        );
    } else if (_type == 2) {                 // Deuteranope - greens are greatly reduced.
        shifted_c = vec3(                    //
            (diff.r * 1.0) + (diff.g * 0.7), //
            0.0,                             //
            (diff.g * 0.7) + (diff.b * 1.0)  //
        );
    } else if (_type == 3) {                 // Tritanope - blues are greatly reduced.
        shifted_c = vec3(                    //
            (diff.r * 1.0) + (diff.b * 0.7), //
            (diff.g * 1.0) + (diff.b * 0.7), //
            0.0                              //
        );
    }

    // Add compensation to original values
    return clamp(in_rgb + shifted_c, 0.0, 1.0);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec4 texColor = texture2D(tex, fragCoord);
    vec3 rgb;
    vec3 srgb;

    if (_use_cie_rgb == 1) {
        rgb = texColor.rgb;
    } else {
        srgb = texColor.rgb;
        rgb  = srgb_to_rgb(srgb);
    }

    // Conversion of RGB coordinates into LMS.
    vec3 xyz = rgb_to_xyz(rgb);
    vec3 lms = xyz_to_lms(xyz);

    // Simulation of color blindness.
    lms = daltonize(lms);

    // Conversion of LMS coordinates back into RGB using the inverse of the RGB->LMS matrix.
    xyz            = lms_to_xyz(lms);
    vec3 final_rgb = xyz_to_rgb(xyz);

    if (_compensate == 1 && _type <= 3) {
        // Compensation for color blindness.
        final_rgb = compensate(rgb, final_rgb);
    }

    if (_use_cie_rgb == 1) {
        fragColor = vec4(final_rgb, texColor.a);
    } else {
        srgb      = rgb_to_srgb(final_rgb);
        fragColor = vec4(srgb, texColor.a);
    }
}

void main() {
    mainImage(cogl_color_out, cogl_tex_coord_in[0].xy);
}
