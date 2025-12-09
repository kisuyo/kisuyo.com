export const perlinNoiseShader = `
precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_scale;
uniform float u_gain;
uniform float u_octaves;
uniform float u_warpStrength;
uniform float u_intensity;

// --- Perlin Building Blocks ---
vec2 randomGradient(vec2 p) {
  float x = dot(p, vec2(123.4, 234.5));
  float y = dot(p, vec2(234.5, 345.6));
  vec2 g = vec2(x, y);
  g = sin(g) * 43758.5453;
  g = sin(g + u_time); // animate
  return g;
}

vec2 quintic(vec2 p) {
  return p * p * p * (10.0 + p * (-15.0 + p * 6.0));
}

float perlinNoise(vec2 uv) {
  vec2 id = floor(uv);
  vec2 f = fract(uv);

  vec2 bl = id;
  vec2 br = id + vec2(1.0, 0.0);
  vec2 tl = id + vec2(0.0, 1.0);
  vec2 tr = id + vec2(1.0, 1.0);

  vec2 g1 = randomGradient(bl);
  vec2 g2 = randomGradient(br);
  vec2 g3 = randomGradient(tl);
  vec2 g4 = randomGradient(tr);

  float d1 = dot(g1, f - vec2(0.0, 0.0));
  float d2 = dot(g2, f - vec2(1.0, 0.0));
  float d3 = dot(g3, f - vec2(0.0, 1.0));
  float d4 = dot(g4, f - vec2(1.0, 1.0));

  f = quintic(f);

  float bot = mix(d1, d2, f.x);
  float top = mix(d3, d4, f.x);
  return mix(bot, top, f.y);
}

// --- fBM + Domain Warp ---
float fbmPerlinNoise(vec2 uv, int octs, float gain) {
  float value = 0.0;
  float amplitude = 1.0;
  for (int i = 0; i < 12; i++) {
    if (i >= octs) break;
    value += perlinNoise(uv) * amplitude;
    amplitude *= gain;
    uv *= 2.0;
  }
  return value;
}

float domainWarpFbmPerlinNoise(vec2 uv, int octs, float gain) {
  float fbm1 = fbmPerlinNoise(uv, octs, gain);
  float fbm2 = fbmPerlinNoise(uv + vec2(5.2, 1.3), octs, gain);
  vec2 warped = vec2(fbm1, fbm2);
  return fbmPerlinNoise(uv + warped * u_warpStrength, octs, gain);
}

// --- Normal Approximation ---
vec3 calcNormal(vec2 uv, int octs, float gain) {
  float diff = 0.001;
  float p1 = domainWarpFbmPerlinNoise(uv + vec2(diff, 0.0), octs, gain);
  float p2 = domainWarpFbmPerlinNoise(uv - vec2(diff, 0.0), octs, gain);
  float p3 = domainWarpFbmPerlinNoise(uv + vec2(0.0, diff), octs, gain);
  float p4 = domainWarpFbmPerlinNoise(uv - vec2(0.0, diff), octs, gain);
  return normalize(vec3(p1 - p2, p3 - p4, 0.001));
}

void main() {
  // aspect-corrected coords
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  uv.x *= u_resolution.x / u_resolution.y;
  uv *= u_scale;

  int octs = int(u_octaves);

  // noise + normals
  float dwNoise = domainWarpFbmPerlinNoise(uv, octs, u_gain);
  vec3 normal = calcNormal(uv, octs, u_gain);

  // --- Lighting ---
  vec3 lightColor = vec3(0.65, 0.85, 1.0); // bluish caustics
  vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
  float diff = max(0.0, dot(normal, lightDir));
  vec3 diffuse = diff * lightColor * 0.6;

  vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));
  vec3 reflectDir = normalize(reflect(-lightDir, normal));
  float spec = pow(max(0.0, dot(viewDir, reflectDir)), 32.0);
  vec3 specular = spec * lightColor * 0.5;

  vec3 color = diffuse + specular;

  // apply intensity
  color = pow(color, vec3(u_intensity));

  gl_FragColor = vec4(color, 1.0);
}
`;

export const worleyNoiseShader = `
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_scale;
uniform float u_gain;
uniform float u_octaves;
uniform float u_warpStrength;
uniform float u_intensity;

// Hash: 2D → pseudo-random float
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// Worley noise: distance to nearest feature point
float worley(vec2 uv) {
  vec2 g = floor(uv);
  vec2 f = fract(uv);
  float dist = 1.0;

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 cell = g + offset;
      // random feature point in cell
      vec2 feature = vec2(hash21(cell), hash21(cell + 1.0));
      vec2 diff = offset + feature - f;
      dist = min(dist, length(diff));
    }
  }
  return dist;
}

// fBM with Worley
float fbmWorley(vec2 uv, int octs, float gain) {
  float val = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  for (int i = 0; i < 12; i++) {
    if (i >= octs) break;
    val += amp * worley(uv * freq + float(i) * 37.7);
    freq *= 2.0;
    amp *= gain;
  }
  return val;
}

// Domain warped Worley
float domainWarpedWorley(vec2 uv, int octs, float gain) {
  vec2 warp = vec2(
    fbmWorley(uv + vec2(5.2, 1.3), octs, gain),
    fbmWorley(uv + vec2(1.7, 9.2), octs, gain)
  );
  uv += warp * u_warpStrength;
  return fbmWorley(uv, octs, gain);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  uv.x *= u_resolution.x / u_resolution.y; // aspect fix
  uv *= u_scale;

  int octs = int(u_octaves);

  float n = domainWarpedWorley(uv, octs, u_gain);

  // invert Worley for cracks (dark lines, light in-betweens)
  float val = 1.0 - n;

  // contrast shaping
  val = pow(val, u_intensity);

  gl_FragColor = vec4(vec3(val), 1.0);
}`;

export const shaderBlobs = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color1; // orange
uniform vec3 u_color2; // blue
uniform float u_blobScale;
uniform float u_threshold;
uniform float u_edgeSoftness;
uniform float u_grainStrength;

// --- Hash noise for pseudo-random ---
float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 34.45);
    return fract(p.x * p.y);
}

// --- Worley-like blobs (distance to nearest point) ---
float worley(vec2 uv) {
    vec2 g = floor(uv);
    vec2 f = fract(uv);
    float d = 1.0;
    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 offset = vec2(float(x), float(y));
            vec2 cell = g + offset;
            vec2 feature = vec2(hash21(cell), hash21(cell + 1.0));
            d = min(d, length(offset + feature - f));
        }
    }
    return d;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv.x *= u_resolution.x / u_resolution.y;

    // Scale space → blob size
    uv *= u_blobScale;

    // Blob pattern (animated slightly by time)
    float n = worley(uv + vec2(0.1 * u_time, 0.05 * u_time));

    // Invert so blobs are black inside
    float mask = smoothstep(u_threshold, u_threshold + u_edgeSoftness, n);

    // Gradient between colors
    vec3 col = mix(u_color1, u_color2, mask);

    // Add black for blob interiors
    col *= mask;

    // Grain overlay
    float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233))) * 43758.5453);
    col += (grain - 0.5) * u_grainStrength;

    gl_FragColor = vec4(col, 1.0);
}
`;
