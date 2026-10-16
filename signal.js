/**
 * FFVoid (虚空造物) — Signal field
 * A full-page field of lines that follows the pointer (or finger):
 * lines bend into a gravity well, ripple when you move fast, and warm from
 * bone to cyan to magenta near the cursor. A soft glow trails the pointer.
 * Pauses when the tab is hidden; static under reduced motion.
 */

(function () {
    'use strict';

    var canvas = document.getElementById('signal');
    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext('2d');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    var w = 0;
    var h = 0;
    var dpr = 1;
    var rows = 44;
    var step = 5;

    var pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999, active: false };
    var glow = { x: -9999, y: -9999 };
    var energy = 0;
    var lastMove = { x: 0, y: 0, t: 0 };
    var raf = 0;
    var t0 = performance.now();

    // Colours: bone -> cyan -> magenta
    var BONE = [233, 230, 222];
    var CYAN = [159, 244, 255];
    var MAGENTA = [255, 90, 217];

    function mix(a, b, k) {
        return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
    }

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        rows = w < 640 ? 30 : 46;
        step = w < 640 ? 8 : 5;
    }

    // Lines are strongest in the hero and calmer further down the page, so text stays readable.
    function pageFade() {
        var y = window.scrollY || 0;
        var k = Math.min(Math.max((y - h * 0.3) / (h * 0.7), 0), 1);
        return 1 - 0.5 * k;
    }

    function draw(now) {
        var t = (now - t0) / 1000;
        var fade = pageFade();

        pointer.x += (pointer.tx - pointer.x) * 0.14;
        pointer.y += (pointer.ty - pointer.y) * 0.14;
        glow.x += (pointer.tx - glow.x) * 0.06;
        glow.y += (pointer.ty - glow.y) * 0.06;
        energy *= 0.94;

        ctx.clearRect(0, 0, w, h);

        // Trailing glow
        if (pointer.active) {
            ctx.globalCompositeOperation = 'lighter';
            var g1 = ctx.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, 360);
            g1.addColorStop(0, 'rgba(120, 90, 255, ' + (0.16 * fade) + ')');
            g1.addColorStop(1, 'rgba(120, 90, 255, 0)');
            ctx.fillStyle = g1;
            ctx.fillRect(0, 0, w, h);

            var g2 = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 200);
            g2.addColorStop(0, 'rgba(159, 244, 255, ' + (0.14 * fade) + ')');
            g2.addColorStop(1, 'rgba(159, 244, 255, 0)');
            ctx.fillStyle = g2;
            ctx.fillRect(0, 0, w, h);
            ctx.globalCompositeOperation = 'source-over';
        }

        var gap = h / (rows + 1);
        var sigma = 210;
        var twoSig2 = 2 * sigma * sigma;
        ctx.lineWidth = 1;

        for (var i = 1; i <= rows; i++) {
            var baseY = i * gap;
            var dy = baseY - pointer.y;
            var rowLift = Math.exp(-(dy * dy) / (2 * 110 * 110));

            // Colour warms with proximity: bone -> cyan -> magenta
            var warm = pointer.active ? rowLift : 0;
            var col = warm < 0.5 ? mix(BONE, CYAN, warm * 2) : mix(CYAN, MAGENTA, (warm - 0.5) * 2);
            ctx.strokeStyle = 'rgb(' + (col[0] | 0) + ',' + (col[1] | 0) + ',' + (col[2] | 0) + ')';
            ctx.globalAlpha = Math.min((0.12 + 0.55 * rowLift) * fade, 0.8);

            ctx.beginPath();
            for (var x = 0; x <= w + step; x += step) {
                var dx = x - pointer.x;
                var d2 = dx * dx + dy * dy;
                var well = Math.exp(-d2 / twoSig2);

                var wave = Math.sin(x * 0.0035 + t * 0.55 + i * 0.32) * 8 +
                           Math.sin(x * 0.0102 - t * 0.8 + i * 0.18) * 2.6;
                var breath = 0.7 + 0.3 * Math.sin(t * 0.3 + i * 0.12);

                // Ripples radiate from the pointer; faster movement means bigger ripples.
                var dist = Math.sqrt(d2);
                var ripple = Math.sin(dist * 0.035 - t * 7) * energy * well * 26;

                var y = baseY + wave * breath + ripple + (pointer.y - baseY) * well * 0.7;

                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }

        ctx.globalAlpha = 1;
    }

    function frame(now) {
        draw(now);
        raf = window.requestAnimationFrame(frame);
    }

    function run() {
        if (reduceMotion.matches) {
            draw(performance.now());
            return;
        }
        if (!raf && !document.hidden) {
            raf = window.requestAnimationFrame(frame);
        }
    }

    function halt() {
        if (raf) {
            window.cancelAnimationFrame(raf);
            raf = 0;
        }
    }

    function setTarget(x, y) {
        if (reduceMotion.matches) return;
        var now = performance.now();
        var dt = Math.max(now - lastMove.t, 8);
        var speed = Math.hypot(x - lastMove.x, y - lastMove.y) / dt; // px per ms
        energy = Math.min(energy + speed * 0.35, 1.4);
        lastMove.x = x;
        lastMove.y = y;
        lastMove.t = now;

        if (!pointer.active) {
            pointer.x = glow.x = x;
            pointer.y = glow.y = y;
        }
        pointer.active = true;
        pointer.tx = x;
        pointer.ty = y;
        run();
    }

    window.addEventListener('pointermove', function (e) { setTarget(e.clientX, e.clientY); }, { passive: true });
    window.addEventListener('pointerdown', function (e) { setTarget(e.clientX, e.clientY); energy = 1.2; }, { passive: true });
    window.addEventListener('touchmove', function (e) {
        if (e.touches && e.touches[0]) setTarget(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', function () {
        pointer.active = false;
        pointer.tx = pointer.ty = -9999;
    });

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            halt();
        } else {
            run();
        }
    });

    window.addEventListener('resize', function () {
        resize();
        run();
    });

    var onMotionChange = function () {
        halt();
        resize();
        run();
    };
    if (reduceMotion.addEventListener) {
        reduceMotion.addEventListener('change', onMotionChange);
    } else if (reduceMotion.addListener) {
        reduceMotion.addListener(onMotionChange);
    }

    resize();
    run();
})();
