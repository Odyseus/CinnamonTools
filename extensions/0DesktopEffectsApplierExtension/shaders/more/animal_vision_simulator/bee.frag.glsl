#extension GL_OES_standard_derivatives : enable
precision mediump float;

uniform sampler2D tex;
uniform int       height;
uniform int       width;

float pinLight(float s, float d) {
    return (2.0 * s - 1.0 > d) ? 2.0 * s - 1.0 : (s < 0.5 * d) ? 2.0 * s : d;
}

vec3 pinLight(vec3 s, vec3 d) {
    vec3 c;
    c.x = pinLight(s.x, d.x);
    c.y = pinLight(s.y, d.y);
    c.z = pinLight(s.z, d.z);
    return c;
}

mat4 colormatrix = mat4(-0.3333333, 0.6666667, 0.6666667, 0, 0.6666667, -0.3333333, 0.6666667, 0.0, 0.6666667, 0.6666667, -0.3333333, 0.0, 0.0, 0.0, 0.0, 1.0);

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec4 color           = texture2D(tex, fragCoord / vec2(width, height));
    mat4 colormatrixDiff = mat4(colormatrix);
    vec4 hue_180         = colormatrixDiff * color;

    vec3 final = vec3(pinLight(hue_180.rgb, color.rgb));

    fragColor = vec4(final, 1.0);
}

void main() {
    mainImage(cogl_color_out, cogl_tex_coord_in[0].xy * vec2(width, height));
}
