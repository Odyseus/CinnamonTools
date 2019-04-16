#extension GL_OES_standard_derivatives : enable
precision mediump float;

uniform sampler2D tex;
uniform int       height;
uniform int       width;

float softLight(float s, float d) {
    return (s < 0.5) ? d - (1.0 - 2.0 * s) * d * (1.0 - d) : (d < 0.25) ? d + (2.0 * s - 1.0) * d * ((16.0 * d - 12.0) * d + 3.0) : d + (2.0 * s - 1.0) * (sqrt(d) - d);
}

vec3 softLight(vec3 s, vec3 d) {
    vec3 c;
    c.x = softLight(s.x, d.x);
    c.y = softLight(s.y, d.y);
    c.z = softLight(s.z, d.z);
    return c;
}

vec3 colormix(vec3 d) {
    vec3 c_r = vec3(0.0, 0.0, 0.0);
    vec3 c_g = vec3(0.0, 1.0, 0.0);
    vec3 c_b = vec3(0.0, 0.0, 0.0);

    d = vec3(dot(d.rgb, c_r), dot(d.rgb, c_g), dot(d.rgb, c_b));

    return d;
}

vec3 greenf(vec3 d) {
    vec3 c_r = vec3(0.0, 1.0, 0.0);
    vec3 c_g = vec3(0.0, 1.0, 0.0);
    vec3 c_b = vec3(0.0, 1.0, 0.0);

    d = vec3(dot(d.rgb, c_r), dot(d.rgb, c_g), dot(d.rgb, c_b));

    return d;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv    = fragCoord.xy / vec2(width, height);
    vec3 color = texture2D(tex, uv).rgb;

    vec3 colm  = colormix(color);
    vec3 green = greenf(color);

    vec3 mixer  = softLight(colm, green);
    vec3 mixer2 = softLight(mixer, green);

    fragColor = vec4(mixer2, 1.0);
}

void main() {
    mainImage(cogl_color_out, cogl_tex_coord_in[0].xy * vec2(width, height));
}
