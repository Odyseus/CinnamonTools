#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D tex;
uniform int       height;
uniform int       width;

// Created by mmichal

vec4 cat_color(in vec4 col) {
    vec3 c_r = vec3(0.625, 0.375, 0.0);
    vec3 c_g = vec3(0.70, 0.30, 0.0);
    vec3 c_b = vec3(0.0, 0.30, 0.70);

    vec3 rgb = vec3(dot(col.rgb, c_r), dot(col.rgb, c_g), dot(col.rgb, c_b));
    return vec4(rgb, 1.0);
}

float remap(float value, float inputMin, float inputMax, float outputMin, float outputMax) {
    return (value - inputMin) * ((outputMax - outputMin) / (inputMax - inputMin)) + outputMin;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2  uv                 = fragCoord.xy / vec2(width, height);
    float normalizedContrast = 0.3;
    float contrast           = remap(normalizedContrast, 0.0, 1.0, 0.2 /*min*/, 4.0 /*max*/);

    vec4 srcColor = texture2D(tex, uv);
    vec4 dstColor = vec4((srcColor.rgb - vec3(0.5)) * contrast + vec3(0.5), 1.0);
    vec4 col      = clamp(dstColor, 0.0, 1.0);

    fragColor = cat_color(col);
}

void main() {
    mainImage(cogl_color_out, cogl_tex_coord_in[0].xy * vec2(width, height));
}
