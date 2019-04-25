#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D tex;
uniform int       height;
uniform int       width;

mat3 gx = mat3(1.5, 2.5, 1.5, 0.0, 0.0, 0.0, -1.5, -2.5, -1.5);

mat3 gy = mat3(-1.5, 0.0, 1.5, -2.5, 0.0, 2.5, -1.5, 0.0, 1.5);

vec3 edgeColor = vec3(1.0, 0.6, 0.0);

float intensity(vec3 pixel) {
    return (pixel.r + pixel.g + pixel.b) / 3.0;
}

float pixelIntensity(vec2 uv, vec2 d) {
    vec3 pix = texture2D(tex, uv + d / vec2(width, height)).rgb;
    return intensity(pix);
}

float convolv(mat3 a, mat3 b) {
    float result = 0.0;

    for (int i = 0; i < 3; i++) {
        for (int j = 0; j < 3; j++) {
            result += a[i][j] * b[i][j];
        }
    }

    return result;
}

float sobel(vec2 uv) {
    mat3 pixel = mat3(0.0);

    for (int x = -1; x < 2; x++) {
        for (int y = -1; y < 2; y++) {
            pixel[x + 1][y + 1] = pixelIntensity(uv, vec2(float(x), float(y)));
        }
    }

    float x = convolv(gx, pixel);
    float y = convolv(gy, pixel);

    return sqrt(x * x + y * y);
}

float softLight(float s, float d) {
    return (s < 0.5) ? d - (1.0 - 2.0 * s) * d * (1.0 - d) : (d < 0.25) ? d + (2.0 * s - 1.0) * d * ((16.0 * d - 12.0) * d + 3.0) : d + (2.0 * s - 1.0) * (sqrt(d) - d);
}

vec3 colormix(vec3 d) {
    // Intensity Matrix
    vec3 c_r = vec3(0.8, 0.2, 0.2);
    vec3 c_g = vec3(0.0, 1.2, -0.2);
    vec3 c_b = vec3(0.1, 0.2, 0.7);

    d = vec3(dot(d.rgb, c_r), dot(d.rgb, c_g), dot(d.rgb, c_b));

    return d;
}

vec3 bluef(vec3 d) {
    // Intensity Matrix
    vec3 c_r = vec3(1.0, 0.0, 0.0);
    vec3 c_g = vec3(0.0, 1.0, 0.0);
    vec3 c_b = vec3(0.0, 0.0, 1.0);

    d = vec3(dot(d.rgb, c_b), dot(d.rgb, c_g), dot(d.rgb, c_r));

    return d;
}

vec3 softLight(vec3 s, vec3 d) {
    vec3 c;
    c.x = softLight(s.x, d.x);
    c.y = softLight(s.y, d.y);
    c.z = softLight(s.z, d.z);
    return c;
}
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

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2  uv = fragCoord.xy / vec2(width, height);
    float x  = 0.5;
    float y  = 0.5;

    vec3  color = texture2D(tex, uv).rgb;
    float s     = sobel(uv);
    vec3  colm  = colormix(color);

    vec3 blue = bluef(color);

    color += edgeColor * s;
    // color = edgeColor * s;
    // color = edgeColor * (1.0 - s);

    vec3 mixer  = softLight(color, colm);
    vec3 mixer2 = overlay(blue, mixer);

    fragColor = vec4(mixer2, 1.0);
}

void main() {
    mainImage(cogl_color_out, cogl_tex_coord_in[0].xy * vec2(width, height));
}
