/**
 * FFVoid (虚空造物) - Cosmic Fluid Nebula WebGL Shader
 * Ultra-fluid domain-warped FBM procedural background with mouse gravitational ripple
 */

(function () {
    'use strict';

    const canvas = document.getElementById('void-shader');
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
        alpha: false,
        depth: false,
        stencil: false,
        antialias: false,
        powerPreference: 'high-performance'
    });

    if (!gl) {
        console.warn('[FFVoid] WebGL not supported, falling back to CSS background');
        document.body.classList.add('no-webgl');
        return;
    }

    const vsSource = `
        attribute vec2 position;
        void main() {
            gl_Position = vec4(position, 0.0, 1.0);
        }
    `;

    // Multi-octave domain-warped FBM with cosmic chromatic dispersion
    const fsSource = `
        precision highp float;
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform vec2 u_mouse;

        // Simplex 2D noise helper functions
        vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

        float snoise(vec2 v){
            const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                               -0.577350269189626, 0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy) );
            vec2 x0 = v -   i + dot(i, C.xx);
            vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod(i, 289.0);
            vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
                + i.x + vec3(0.0, i1.x, 1.0 ));
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                dot(x12.zw,x12.zw)), 0.0);
            m = m*m ;
            m = m*m ;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
            vec3 g;
            g.x  = a0.x  * x0.x  + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
        }

        // Fractal Brownian Motion (FBM)
        float fbm(vec2 p) {
            float total = 0.0;
            float amplitude = 0.55;
            float frequency = 1.0;
            for (int i = 0; i < 5; i++) {
                total += amplitude * snoise(p * frequency);
                frequency *= 2.02;
                amplitude *= 0.48;
            }
            return total;
        }

        // Domain warping function: f(p + f(p + f(p)))
        float pattern(in vec2 p, out vec2 q, out vec2 r, float t, vec2 mouse) {
            // Mouse gravitational distortion field
            vec2 mDiff = p - mouse;
            float mDist = length(mDiff);
            float mInfluence = smoothstep(0.8, 0.0, mDist);
            vec2 mOffset = normalize(mDiff + 0.0001) * mInfluence * 0.28;

            q.x = fbm(p + vec2(0.0, 0.0) + t * 0.065 + mOffset);
            q.y = fbm(p + vec2(5.2, 1.3) + t * 0.055 - mOffset);

            vec2 q_scaled = q * 1.35;
            r.x = fbm(p + 3.8 * q_scaled + vec2(1.7, 9.2) + t * 0.075);
            r.y = fbm(p + 3.8 * q_scaled + vec2(8.3, 2.8) - t * 0.062);

            return fbm(p + 3.6 * r + t * 0.04);
        }

        void main() {
            vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
            vec2 mouse = (u_mouse - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);

            // Time scaling for dreamy slow drift
            float t = u_time * 0.16;

            vec2 q = vec2(0.0);
            vec2 r = vec2(0.0);
            float f = pattern(uv * 1.6, q, r, t, mouse);

            // Vibrant Cosmic Void Palette
            vec3 c_deepVoid = vec3(0.02, 0.025, 0.045);
            vec3 c_indigo   = vec3(0.07, 0.09, 0.24);
            vec3 c_cyan     = vec3(0.0, 0.88, 1.0);
            vec3 c_violet   = vec3(0.68, 0.28, 1.0);
            vec3 c_magenta  = vec3(1.0, 0.25, 0.68);
            vec3 c_core     = vec3(0.85, 0.95, 1.0);

            // Multi-layered nebular fluid blending
            vec3 color = mix(c_deepVoid, c_indigo, clamp(f * 2.2 + 0.35, 0.0, 1.0));
            color += c_violet * pow(clamp(length(q) * 0.85, 0.0, 1.0), 2.2) * 1.35;
            color += c_cyan * pow(clamp(length(r) * 0.82, 0.0, 1.0), 2.0) * 1.25;
            color += c_magenta * pow(clamp(f * 1.5, 0.0, 1.0), 3.0) * 0.95;
            color += c_core * pow(clamp(f * f, 0.0, 1.0), 4.0) * 0.5;

            // Soft atmospheric vignette
            float dist = length(uv);
            float vignette = smoothstep(1.9, 0.35, dist);
            color *= (0.65 + 0.35 * vignette);

            // Subtle stardust grain
            float grain = (fract(sin(dot(gl_FragCoord.xy + floor(u_time * 6.0), vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.015;
            color += grain;

            gl_FragColor = vec4(color, 1.0);
        }
    `;

    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('[FFVoid Shader] Compilation failed:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('[FFVoid Shader] Program link failed:', gl.getProgramInfoLog(program));
        return;
    }

    gl.useProgram(program);

    // Full-screen quad
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1,
    ]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const uResolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const uTimeLocation = gl.getUniformLocation(program, 'u_time');
    const uMouseLocation = gl.getUniformLocation(program, 'u_mouse');

    let mouseX = window.innerWidth * 0.5;
    let mouseY = window.innerHeight * 0.5;
    let targetMouseX = mouseX;
    let targetMouseY = mouseY;

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        const width = Math.floor(window.innerWidth * dpr);
        const height = Math.floor(window.innerHeight * dpr);
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
            gl.viewport(0, 0, width, height);
            gl.uniform2f(uResolutionLocation, width, height);
        }
    }

    window.addEventListener('resize', resize, { passive: true });
    resize();

    window.addEventListener('mousemove', (e) => {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        targetMouseX = e.clientX * dpr;
        targetMouseY = (window.innerHeight - e.clientY) * dpr; // Invert Y for GL
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            targetMouseX = e.touches[0].clientX * dpr;
            targetMouseY = (window.innerHeight - e.touches[0].clientY) * dpr;
        }
    }, { passive: true });

    const startTime = performance.now();
    let isVisible = true;

    document.addEventListener('visibilitychange', () => {
        isVisible = !document.hidden;
    });

    function render(now) {
        if (isVisible) {
            // Smooth mouse lerp
            mouseX += (targetMouseX - mouseX) * 0.05;
            mouseY += (targetMouseY - mouseY) * 0.05;

            const elapsedTime = (now - startTime) * 0.001;
            gl.uniform1f(uTimeLocation, elapsedTime);
            gl.uniform2f(uMouseLocation, mouseX, mouseY);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
})();
