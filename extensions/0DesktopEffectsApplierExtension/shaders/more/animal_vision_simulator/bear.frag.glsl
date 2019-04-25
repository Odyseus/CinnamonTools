#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D tex;
uniform int       height;
uniform int       width;

vec3 lesRed(vec3 d) {
    // B&W Matrix
    vec3 c_r = vec3(0.2, 0.4, 0.4);
    vec3 c_g = vec3(0.0, 1.0, 0.0);
    vec3 c_b = vec3(0.1, 0.1, 1.0);

    // swaping chanel red and blue
    d = vec3(dot(d.rgb, c_r), dot(d.rgb, c_g), dot(d.rgb, c_b));

    return d;
}

mat4 brightnessMatrix(float brightness) {
    return mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, brightness, brightness, brightness, 1);
}

mat4 contrastMatrix(float contrast) {
    float t = (1.0 - contrast) / 2.0;

    return mat4(contrast, 0, 0, 0, 0, contrast, 0, 0, 0, 0, contrast, 0, t, t, t, 1);
}

mat4 saturationMatrix(float saturation) {
    vec3 luminance = vec3(0.3086, 0.6094, 0.0820);

    float oneMinusSat = 1.0 - saturation;

    vec3 red = vec3(luminance.x * oneMinusSat);
    red += vec3(saturation, 0, 0);

    vec3 green = vec3(luminance.y * oneMinusSat);
    green += vec3(0, saturation, 0);

    vec3 blue = vec3(luminance.z * oneMinusSat);
    blue += vec3(0, 0, saturation);

    return mat4(red, 0, green, 0, blue, 0, 0, 0, 0, 1);
}

const float brightness = 0.08;
const float contrast   = 1.16;
const float saturation = 1.3;

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec4 color = texture2D(tex, fragCoord / vec2(width, height));

    vec4 pixval = brightnessMatrix(brightness) * contrastMatrix(contrast) * saturationMatrix(saturation) * color;
    vec3 finalpix = lesRed(pixval.rgb);
    fragColor     = vec4(finalpix, 1.0);
}

void main() {
    mainImage(cogl_color_out, cogl_tex_coord_in[0].xy * vec2(width, height));
}
