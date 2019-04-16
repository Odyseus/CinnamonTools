// Source: http://blog.noblemaster.com/2013/10/26/opengl-shader-to-correct-and-simulate-color-blindness-experimental/
// Source: https://tylerdavidhoward.com/thesis/

uniform sampler2D tex;

const mat3 RGBtoOpponentMat = mat3(0.2814, -0.0971, -0.0930, 0.6938, 0.1458, -0.2529, 0.0638, -0.0250, 0.4665);
const mat3 OpponentToRGBMat = mat3(1.1677, 0.9014, 0.7214, -6.4315, 2.5970, 0.1257, -0.5044, 0.0159, 2.0517);

void main() {
    vec4 fragColor = texture2D(tex, cogl_tex_coord_in[0].xy);
    fragColor *= cogl_color_in;
    vec3 opponentColor = RGBtoOpponentMat * vec3(fragColor.r, fragColor.g, fragColor.b);
    opponentColor.x -= ((3 * opponentColor.z) - opponentColor.y) * 0.25;
    vec3 rgbColor = OpponentToRGBMat * opponentColor;
    fragColor     = vec4(rgbColor.r, rgbColor.g, rgbColor.b, fragColor.a);

    cogl_color_out = fragColor;
}
