/**
 * The mist orb: soft blobs of light drifting inside a glass sphere. Blob
 * positions and the voice level come from the component each frame; the
 * shader only paints them, so a frame costs one full-screen quad.
 */

export type MistBlob = {
	/** Offset from the center as a share of the orb's radius. */
	x: number;
	y: number;
	/** Swell, where 1 is the resting size. */
	scale: number;
};

export interface MistRenderer {
	draw(blobs: MistBlob[], dark: boolean): void;
	destroy(): void;
}

const VERTEX_SHADER = `
attribute vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// The palette is the orb's one accent: a pale blue, a violet, a cool cyan and
// a deeper blue, each with a darker partner so the mist glows on a black page
// and stays airy on a white one.
const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 u_resolution;
uniform vec3 u_blobs[4];
uniform float u_dark;

vec3 mist(int i) {
  if (i == 0) return mix(vec3(0.395, 0.654, 0.981), vec3(0.291, 0.507, 0.922), u_dark);
  if (i == 1) return mix(vec3(0.782, 0.687, 0.961), vec3(0.575, 0.448, 0.785), u_dark);
  if (i == 2) return mix(vec3(0.526, 0.884, 0.947), vec3(0.274, 0.683, 0.773), u_dark);
  return mix(vec3(0.412, 0.758, 0.989), vec3(0.122, 0.457, 0.750), u_dark);
}

void main() {
  vec2 p = (gl_FragCoord.xy / u_resolution - 0.5) * 2.0;
  float r = length(p);
  float edge = 1.0 - smoothstep(0.976, 1.0, r);
  if (edge <= 0.0) discard;

  vec3 color = mix(vec3(0.971, 0.982, 0.994), vec3(0.066, 0.087, 0.122), u_dark);

  // Each blob is a soft falloff, blurred into its neighbors so the four read
  // as one moving light. Screen y points down in the component, up here.
  for (int i = 0; i < 4; i++) {
    vec3 blob = u_blobs[i];
    float d = length(p - vec2(blob.x, -blob.y)) / (0.5 * blob.z);
    float strength = (i == 3 ? 0.7 : 0.9) * exp(-d * d * 1.25);
    color = mix(color, mist(i), strength);
  }

  // Glass: a lit upper edge, a darker lower one, a faint rim, and a soft
  // highlight, so it reads as a sphere rather than a flat disc.
  float rim = smoothstep(0.62, 1.0, r);
  float top = clamp(p.y, 0.0, 1.0);
  float bottom = clamp(-p.y, 0.0, 1.0);
  color = mix(color, vec3(1.0), rim * top * mix(0.42, 0.1, u_dark));
  color *= 1.0 - rim * bottom * mix(0.07, 0.38, u_dark);
  float line = smoothstep(0.955, 0.985, r);
  color = mix(color, mix(vec3(0.0), vec3(1.0), u_dark), line * mix(0.05, 0.08, u_dark));

  vec2 h = p - vec2(-0.18, 0.6);
  float c = cos(0.314);
  float s = sin(0.314);
  h = vec2(c * h.x - s * h.y, s * h.x + c * h.y) / vec2(0.38, 0.22);
  float highlight = 1.0 - smoothstep(0.0, 1.0, length(h));
  color = mix(color, vec3(1.0), highlight * mix(0.5, 0.2, u_dark));

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

export function createMistRenderer(canvas: HTMLCanvasElement): MistRenderer | undefined {
	const gl = canvas.getContext('webgl', {
		alpha: true,
		antialias: true,
		premultipliedAlpha: true
	});
	if (!gl) return undefined;

	const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
	const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
	const program = gl.createProgram();
	const buffer = gl.createBuffer();
	const release = () => {
		if (program) gl.deleteProgram(program);
		if (buffer) gl.deleteBuffer(buffer);
		if (vertexShader) gl.deleteShader(vertexShader);
		if (fragmentShader) gl.deleteShader(fragmentShader);
	};
	if (!vertexShader || !fragmentShader || !program || !buffer) {
		release();
		return undefined;
	}

	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		release();
		return undefined;
	}

	const positionLocation = gl.getAttribLocation(program, 'a_position');
	const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
	const blobsLocation = gl.getUniformLocation(program, 'u_blobs');
	const darkLocation = gl.getUniformLocation(program, 'u_dark');
	if (positionLocation < 0 || !resolutionLocation || !blobsLocation || !darkLocation) {
		release();
		return undefined;
	}

	gl.useProgram(program);
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(
		gl.ARRAY_BUFFER,
		new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
		gl.STATIC_DRAW
	);
	gl.enableVertexAttribArray(positionLocation);
	gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

	const packed = new Float32Array(12);
	let resolution = 0;

	return {
		draw(blobs, dark) {
			const width = Math.max(
				1,
				Math.round(Math.min(canvas.clientWidth, 512) * Math.min(window.devicePixelRatio || 1, 2))
			);
			if (width !== resolution) {
				resolution = width;
				canvas.width = width;
				canvas.height = width;
				gl.viewport(0, 0, width, width);
				gl.uniform2f(resolutionLocation, width, width);
			}
			blobs.forEach((blob, i) => {
				packed[i * 3] = blob.x;
				packed[i * 3 + 1] = blob.y;
				packed[i * 3 + 2] = blob.scale;
			});
			gl.clear(gl.COLOR_BUFFER_BIT);
			gl.uniform3fv(blobsLocation, packed);
			gl.uniform1f(darkLocation, dark ? 1 : 0);
			gl.drawArrays(gl.TRIANGLES, 0, 6);
		},
		destroy: release
	};
}
