#extension GL_OES_standard_derivatives : enable
precision mediump float;

uniform sampler2D tex;
uniform int       height;
uniform int       width;

vec4 blackwhite(in vec4 col) {
    vec3 c_r = vec3(0.3, 0.6, 0.1);
    vec3 c_g = vec3(0.3, 0.6, 0.1);
    vec3 c_b = vec3(0.3, 0.6, 0.1);

    vec3 rgb = vec3(dot(col.rgb, c_r), dot(col.rgb, c_g), dot(col.rgb, c_b));
    return vec4(rgb, 1.0);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord.xy / vec2(width, height);
    vec2 xy = vec2(uv.x, uv.y);

    float clarity = (-2.0);

    vec3 col1 = texture2D(tex, xy).rgb;
    vec3 col2 = texture2D(tex, xy, abs(clarity)).rgb;

    vec4 col = vec4(col1 * 2.0 - col2, 1.0); // -clarity

    fragColor = blackwhite(col);
}

void main() {
    mainImage(cogl_color_out, cogl_tex_coord_in[0].xy * vec2(width, height));
}
