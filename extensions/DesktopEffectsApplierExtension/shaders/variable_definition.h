#ifdef GL_ES
precision highp float;
#endif
#define COGL_VERSION 100

uniform mat4 cogl_modelview_matrix;
uniform mat4 cogl_modelview_projection_matrix;
uniform mat4 cogl_projection_matrix;

varying vec4 _cogl_color;

#define cogl_color_in _cogl_color
#define cogl_tex_coord_in _cogl_tex_coord

#define cogl_color_out gl_FragColor
#define cogl_depth_out gl_FragDepth

#define cogl_front_facing gl_FrontFacing

#define cogl_point_coord gl_PointCoord
