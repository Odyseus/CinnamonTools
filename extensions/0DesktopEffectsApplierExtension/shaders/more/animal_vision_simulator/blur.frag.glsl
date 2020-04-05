#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D tex;
uniform int       height;
uniform int       width;

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec4 tex1Color = texture2D(tex, fragCoord.xy / vec2(width, height));

    const int kSize = 7;
    vec3      avg   = vec3(0.0);
    for (int i = -kSize; i <= kSize; ++i) {
        for (int j = -kSize; j <= kSize; ++j) {
            avg = avg +
                  texture2D(tex, (fragCoord.xy + vec2(float(i), float(j))) / vec2(width, height)).xyz;
        }
    }
    int area = (2 * kSize + 1) * (2 * kSize + 1);
    avg = avg.xyz / vec3(area); // interestingly divider is not x^2 but x^3. since the area of a box
                                // is x^2..

    fragColor = vec4(avg, tex1Color.a);
}

void main() {
    mainImage(cogl_color_out, cogl_tex_coord_in[0].xy * vec2(width, height));
}
