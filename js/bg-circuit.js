/**
 * LocalClaw — Circuit Board Background Animation
 * Shared across all pages for consistent visual identity
 * Usage: Include <canvas id="bg-circuit"> + <script src="js/bg-circuit.js"></script>
 */
(function() {
    const canvas = document.getElementById('bg-circuit');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, nodes = [], edges = [], pulses = [];
    const GRID = 70;
    const NODE_CHANCE = 0.4;
    const PULSE_INTERVAL = 40;
    let frame = 0;
    
    // Color configuration based on theme
    function getThemeColors() {
        const isLight = document.documentElement.classList.contains('light');
        return {
            edgeColor: isLight ? 'rgba(0, 0, 0, 0.025)' : 'rgba(255, 255, 255, 0.07)',
            pulseColor: isLight ? '200, 200, 200' : '255, 69, 58',
            nodeColor: isLight ? '200, 200, 200' : '255, 255, 255',
            chipColor: isLight ? '180, 180, 180' : '255, 69, 58',
            pulseAlpha: isLight ? 0.15 : 0.7,
            glowAlpha: isLight ? 0.04 : 0.15,
            traceAlpha: isLight ? 0.04 : 0.12,
            nodeBaseAlpha: isLight ? 0.05 : 0.12,
            haloAlpha: isLight ? 0.05 : 0.2
        };
    }

    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
        build();
    }

    function build() {
        nodes = []; edges = []; pulses = [];
        const cols = Math.ceil(W / GRID) + 1;
        const rows = Math.ceil(H / GRID) + 1;
        const grid = [];

        for (let r = 0; r < rows; r++) {
            grid[r] = [];
            for (let c = 0; c < cols; c++) {
                if (Math.random() < NODE_CHANCE) {
                    const node = {
                        x: c * GRID + (Math.random() - 0.5) * 16,
                        y: r * GRID + (Math.random() - 0.5) * 16,
                        r: Math.random() < 0.15 ? 2.8 : 1.5,
                        glow: 0,
                        glowTarget: 0,
                        isChip: Math.random() < 0.1,
                    };
                    nodes.push(node);
                    grid[r][c] = node;
                } else {
                    grid[r][c] = null;
                }
            }
        }

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const n = grid[r][c];
                if (!n) continue;
                for (let dc = 1; dc <= 3; dc++) {
                    if (c + dc < cols && grid[r][c + dc]) {
                        edges.push({ a: n, b: grid[r][c + dc] });
                        break;
                    }
                }
                for (let dr = 1; dr <= 3; dr++) {
                    if (r + dr < rows && grid[r + dr] && grid[r + dr][c]) {
                        edges.push({ a: n, b: grid[r + dr][c] });
                        break;
                    }
                }
            }
        }
    }

    function spawnPulse() {
        if (edges.length === 0) return;
        const e = edges[Math.floor(Math.random() * edges.length)];
        pulses.push({
            edge: e,
            t: 0,
            speed: 0.006 + Math.random() * 0.01,
            forward: Math.random() > 0.5,
        });
    }

    function loop() {
        ctx.clearRect(0, 0, W, H);
        frame++;

        if (frame % PULSE_INTERVAL === 0) {
            const count = 2 + Math.floor(Math.random() * 3);
            for (let i = 0; i < count; i++) spawnPulse();
        }

        const colors = getThemeColors();
        
        // Draw edges (circuit traces)
        ctx.lineWidth = 0.8;
        edges.forEach(e => {
            const mx = e.b.x, my = e.a.y;
            ctx.beginPath();
            ctx.moveTo(e.a.x, e.a.y);
            ctx.lineTo(mx, my);
            ctx.lineTo(e.b.x, e.b.y);
            ctx.strokeStyle = colors.edgeColor;
            ctx.stroke();
        });

        // Update & draw pulses
        for (let i = pulses.length - 1; i >= 0; i--) {
            const p = pulses[i];
            p.t += p.speed;

            if (p.t >= 1) {
                const dest = p.forward ? p.edge.b : p.edge.a;
                dest.glowTarget = 1;
                pulses.splice(i, 1);
                continue;
            }

            const e = p.edge;
            const progress = p.forward ? p.t : (1 - p.t);
            const mx = e.b.x, my = e.a.y;
            const segH = Math.abs(mx - e.a.x);
            const segV = Math.abs(e.b.y - my);
            const totalLen = segH + segV;
            const traveled = progress * totalLen;

            let px, py;
            if (traveled <= segH) {
                const f = segH > 0 ? traveled / segH : 0;
                px = e.a.x + (mx - e.a.x) * f;
                py = e.a.y;
            } else {
                px = mx;
                const f = segV > 0 ? (traveled - segH) / segV : 0;
                py = my + (e.b.y - my) * f;
            }

            // Bright pulse dot
            const pulseAlpha = colors.pulseAlpha + 0.3 * Math.sin(p.t * Math.PI);
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${colors.pulseColor}, ${pulseAlpha})`;
            ctx.fill();

            // Glow trail
            const g = ctx.createRadialGradient(px, py, 0, px, py, 25);
            g.addColorStop(0, `rgba(${colors.pulseColor}, ${colors.glowAlpha})`);
            g.addColorStop(1, 'transparent');
            ctx.fillStyle = g;
            ctx.fillRect(px - 25, py - 25, 50, 50);

            // Light up trace near pulse
            ctx.beginPath();
            ctx.moveTo(e.a.x, e.a.y);
            ctx.lineTo(mx, my);
            ctx.lineTo(e.b.x, e.b.y);
            ctx.strokeStyle = `rgba(${colors.pulseColor}, ${colors.traceAlpha * (1 - p.t)})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
        }

        // Draw nodes
        nodes.forEach(n => {
            n.glow += (n.glowTarget - n.glow) * 0.06;
            if (n.glowTarget > 0) n.glowTarget *= 0.96;
            if (n.glowTarget < 0.01) n.glowTarget = 0;

            const alpha = colors.nodeBaseAlpha + n.glow * 0.7;

            if (n.isChip) {
                const s = 5;
                ctx.fillStyle = `rgba(${colors.chipColor}, ${alpha * 0.6})`;
                ctx.fillRect(n.x - s, n.y - s, s * 2, s * 2);
                ctx.strokeStyle = `rgba(${colors.chipColor}, ${alpha * 0.4})`;
                ctx.lineWidth = 0.6;
                ctx.strokeRect(n.x - s, n.y - s, s * 2, s * 2);
            } else {
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
                ctx.fillStyle = n.glow > 0.08
                    ? `rgba(${colors.pulseColor}, ${alpha})`
                    : `rgba(${colors.nodeColor}, ${alpha})`;
                ctx.fill();
            }

            // Glow halo
            if (n.glow > 0.08) {
                const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 30);
                g.addColorStop(0, `rgba(${colors.pulseColor}, ${n.glow * colors.haloAlpha})`);
                g.addColorStop(1, 'transparent');
                ctx.fillStyle = g;
                ctx.fillRect(n.x - 30, n.y - 30, 60, 60);
            }
        });

        requestAnimationFrame(loop);
    }

    window.addEventListener('resize', resize);
    
    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                // Force redraw with new colors on next frame
            }
        });
    });
    observer.observe(document.documentElement, { attributes: true });
    
    resize();
    loop();
})();
