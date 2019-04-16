#extension GL_OES_standard_derivatives : enable
precision mediump float;

uniform sampler2D tex;
uniform int       height;
uniform int       width;

float overlay(float s, float d) {
    return (d < 0.5) ? 2.0 * s * d : 1.0 - 2.0 * (1.0 - s) * (1.0 - d);
}

vec3 overlay(vec3 s, vec3 d) {
    vec3 c;
    c.x = overlay(s.x, d.x);
    c.y = overlay(s.y, d.y);
    c.z = overlay(s.z, d.z);
    return c;
}

vec2 barrelDistort(vec2 pos, float power) {
    float t = atan(pos.y, pos.x);
    float r = pow(length(pos), power);
    pos.x   = r * cos(t);
    pos.y   = r * sin(t);
    return 0.5 * (pos + 1.0);
}

vec3 color(vec3 d) {
    // Color Matrix
    vec3 c_r = vec3(1.0, 0.0, 0.0);
    vec3 c_g = vec3(0.0, 1.0, 0.0);
    vec3 c_b = vec3(-1.8, 1.8, 1.0);

    d = vec3(dot(d.rgb, c_r), dot(d.rgb, c_g), dot(d.rgb, c_b));

    return d;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2  q          = fragCoord.xy / vec2(width, height);
    vec2  p          = -1.0 + 2.0 * q;
    float d          = length(p);
    float s          = 1.0 - min(1.0, d * d);
    float t          = -1.5;
    float barrel_pow = 1.0 + 0.5 * (1.0 + cos(t));
    p                = barrelDistort(p, barrel_pow);
    vec4 col         = texture2D(tex, s * (p - q) + q);

    vec3 natural    = col.rgb;
    vec3 birduv     = color(natural);
    vec4 finalcolor = vec4(overlay(birduv, natural), 1.);

    fragColor = finalcolor;
}

void main() {
    mainImage(cogl_color_out, cogl_tex_coord_in[0].xy * vec2(width, height));
}
