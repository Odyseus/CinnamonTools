#extension GL_OES_standard_derivatives : enable
precision mediump float;

uniform sampler2D tex;
uniform int       height;
uniform int       width;

vec3 lighten(vec3 s, vec3 d) {
    return max(s, d);
}

vec3 test(vec3 d) {
    // Color Matrix
    vec3 c_r = vec3(1., -.5, -.5);
    vec3 c_g = vec3(-0.5, 1.0, -0.5);
    vec3 c_b = vec3(-.5, -0.5, 1.0);

    d = vec3(dot(d.rgb, c_r), dot(d.rgb, c_g), dot(d.rgb, c_b));

    return d;
}

vec3 bandw(vec3 d) {
    // B&W Matrix
    vec3 c_r = vec3(0.4, 0.4, 0.3);
    vec3 c_g = vec3(0.4, 0.4, 0.3);
    vec3 c_b = vec3(0.4, 0.4, 0.3);

    d = vec3(dot(d.rgb, c_r), dot(d.rgb, c_g), dot(d.rgb, c_b));

    return d;
}

vec3 inten(vec3 d) {
    // Intensity Matrix
    vec3 c_r = vec3(2.2, -0.6, -0.6);
    vec3 c_g = vec3(-0.6, 2.2, -0.6);
    vec3 c_b = vec3(-0.6, -0.6, 2.2);

    d = vec3(dot(d.rgb, c_r), dot(d.rgb, c_g), dot(d.rgb, c_b));

    return d;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec3 d = texture2D(tex, fragCoord.xy / vec2(width, height)).rgb;

    vec3 mono   = bandw(d);
    vec3 testa  = test(d);
    vec3 c      = lighten(mono, testa);
    vec3 intens = inten(c);

    fragColor = vec4(intens, 1.0);
}

void main() {
    mainImage(cogl_color_out, cogl_tex_coord_in[0].xy * vec2(width, height));
}
