/*
Adapted from orb-ui CloudTheme by Alexander Chen.
https://github.com/alexanderqchen/orb-ui

MIT License

Copyright (c) 2026 Alexander Chen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

interface CloudRenderer {
	draw(time: number, activity: number): void;
	destroy(): void;
}

const VERTEX_SHADER = `
attribute vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_activity;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.52;
  mat2 rotation = mat2(0.80, 0.60, -0.60, 0.80);

  for (int octave = 0; octave < 5; octave++) {
    value += amplitude * noise(p);
    p = rotation * p * 1.92 + vec2(9.7, 4.3);
    amplitude *= 0.5;
  }

  return value;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 centered = uv - 0.5;
  float radius = length(centered);
  float edge = 1.0 - smoothstep(0.488, 0.5, radius);

  if (edge <= 0.0) discard;

  vec2 p = centered * 2.0;
  float t = u_time;

  vec2 warp = vec2(
    fbm(p * 1.02 + vec2(t * 0.34, -t * 0.24)),
    fbm(p * 1.08 + vec2(-t * 0.27, t * 0.32) + vec2(6.7, 2.9))
  );
  vec2 curl = vec2(
    sin(p.y * 2.4 + t * 0.68 + warp.y * 3.2),
    cos(p.x * 2.1 - t * 0.61 + warp.x * 3.0)
  );
  vec2 warped =
    p +
    (warp - 0.5) * (1.18 + u_activity * 0.38) +
    curl * (0.035 + u_activity * 0.07);
  float broad = fbm(warped * 0.92 + vec2(t * 0.14, -t * 0.18));
  float folded = fbm(warped * 1.66 + vec2(-t * 0.23, t * 0.19) + 5.2);
  float field = mix(broad, folded, 0.3 + u_activity * 0.14);

  float horizon =
    0.46 +
    0.08 * sin((uv.x + warp.x * 0.2) * 5.4 + t * 0.42) +
    0.16 * (broad - 0.5);
  float upper = smoothstep(horizon - 0.12, horizon + 0.08, uv.y);
  float band = exp(-pow((uv.y - horizon) * (5.2 + u_activity * 0.8), 2.0));
  float cloud = smoothstep(0.24, 0.79, field);

  vec3 deepPeriwinkle = vec3(0.36, 0.39, 0.985);
  vec3 upperPeriwinkle = vec3(0.48, 0.56, 0.985);
  vec3 lowerLavender = vec3(0.72, 0.78, 0.975);
  vec3 milk = vec3(0.89, 0.92, 0.995);

  vec3 color = mix(lowerLavender, upperPeriwinkle, upper);
  float upperDepth = upper * (0.14 + smoothstep(0.42, 0.78, folded) * 0.5);
  color = mix(color, deepPeriwinkle, upperDepth);

  float milkAmount = clamp(band * (0.42 + cloud * 0.62), 0.0, 0.88);
  color = mix(color, milk, milkAmount);

  float lowerMist = (1.0 - upper) * smoothstep(0.58, 0.9, broad) * 0.18;
  color = mix(color, milk, lowerMist);

  float grain = (noise(gl_FragCoord.xy * 0.64) - 0.5) / 255.0;
  color += grain;

  gl_FragColor = vec4(color * edge, edge);
}
`;

function compileShader(
	gl: WebGLRenderingContext,
	type: number,
	source: string
): WebGLShader | undefined {
	const shader = gl.createShader(type);
	if (!shader) return undefined;

	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		gl.deleteShader(shader);
		return undefined;
	}

	return shader;
}

export function createCloudRenderer(
	canvas: HTMLCanvasElement,
	diameter: number
): CloudRenderer | undefined {
	const gl = canvas.getContext('webgl', {
		alpha: true,
		antialias: true,
		premultipliedAlpha: true
	});
	if (!gl) return undefined;

	const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
	const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
	if (!vertexShader || !fragmentShader) {
		if (vertexShader) gl.deleteShader(vertexShader);
		if (fragmentShader) gl.deleteShader(fragmentShader);
		return undefined;
	}

	const program = gl.createProgram();
	const buffer = gl.createBuffer();
	if (!program || !buffer) {
		if (program) gl.deleteProgram(program);
		if (buffer) gl.deleteBuffer(buffer);
		gl.deleteShader(vertexShader);
		gl.deleteShader(fragmentShader);
		return undefined;
	}

	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		gl.deleteProgram(program);
		gl.deleteBuffer(buffer);
		gl.deleteShader(vertexShader);
		gl.deleteShader(fragmentShader);
		return undefined;
	}

	const positionLocation = gl.getAttribLocation(program, 'a_position');
	const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
	const timeLocation = gl.getUniformLocation(program, 'u_time');
	const activityLocation = gl.getUniformLocation(program, 'u_activity');
	if (positionLocation < 0 || !resolutionLocation || !timeLocation || !activityLocation) {
		gl.deleteProgram(program);
		gl.deleteBuffer(buffer);
		gl.deleteShader(vertexShader);
		gl.deleteShader(fragmentShader);
		return undefined;
	}

	const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
	const pixelSize = Math.max(1, Math.round(diameter * pixelRatio));
	canvas.width = pixelSize;
	canvas.height = pixelSize;

	gl.viewport(0, 0, pixelSize, pixelSize);
	gl.useProgram(program);
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(
		gl.ARRAY_BUFFER,
		new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
		gl.STATIC_DRAW
	);
	gl.enableVertexAttribArray(positionLocation);
	gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
	gl.uniform2f(resolutionLocation, pixelSize, pixelSize);

	return {
		draw(time, activity) {
			const width = Math.max(
				1,
				Math.round(Math.min(canvas.clientWidth, 512) * Math.min(window.devicePixelRatio || 1, 2))
			);
			if (canvas.width !== width) {
				canvas.width = width;
				canvas.height = width;
				gl.viewport(0, 0, width, width);
				gl.uniform2f(resolutionLocation, width, width);
			}
			gl.clear(gl.COLOR_BUFFER_BIT);
			gl.uniform1f(timeLocation, time);
			gl.uniform1f(activityLocation, activity);
			gl.drawArrays(gl.TRIANGLES, 0, 6);
		},
		destroy() {
			gl.deleteProgram(program);
			gl.deleteBuffer(buffer);
			gl.deleteShader(vertexShader);
			gl.deleteShader(fragmentShader);
		}
	};
}
