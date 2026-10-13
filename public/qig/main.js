const N_NB = 24;
const N_V = 72;
const ROUND_MS = 6000;
const SPAWN_MS = 2000;
const ROT_MS = 240000;
const BREATH_MS = 14000;
const BREATH = 0.05;
const TRAIL_MS = 30000;
const TRAIL_TINT_MS = 800;
const FRAME_MS = 1000 / 20 - 2;
const ARC_BEND = 0.18;
const FADE_T = 0.88;
const WARM_MS = 20000;
const PALETTE = [
    ["#001514", "#f0f0f0"], ["#3d5654", "#c4c4c4"], ["#7a8f8d", "#8f8f8f"], ["#b9c6c4", "#5c5c5c"],
    ["#b23a48", "#e0616f"], ["#00151459", "#f0f0f0cc"], ["#00151414", "#f0f0f066"],
];
const INK = 0, LABEL = 1, NEG = 4, BASE = 5, EDGE = 6;
const ALICE = "#F9A03F";
const BOB = "#3b754c";
const themed = (light, dark) => `light-dark(${light}, ${dark})`;
const PAPER_URL = "https://doi.org/10.48550/arXiv.2507.06225";
const INFO_HTML = `You see a simulation of a perfect quantum strategy for the isomorphism game between two matroids
that are quantum isomorphic but not isomorphic, taken from my paper
<a href="${PAPER_URL}" target="_blank"><em>Matroid isomorphism games</em></a> with D. Corey and S. Schmidt.
In every round <span class="qig_alice">Alice</span> and <span class="qig_bob">Bob</span> receive vertices of one graph,
measure a shared entangled state and answer with vertices of the other.`;
const INFO_CSS = `
.qig_ui { pointer-events: none; z-index: 1; }
.qig_info {
  position: absolute; right: 16px; bottom: 16px; pointer-events: auto;
  --qig_fg: var(--color-off-black, #010D28); --qig_fg_inv: var(--color-off-white, #f5f5f5);
  --qig_bg: var(--color-white, #ffffff); --qig_box: #fffffff2;
  --qig_link: var(--color-primary-dark, #445D7E); --qig_shadow: #0000001a; --qig_border: transparent;
}
@supports (color: ${themed("#000", "#fff")}) {
  .qig_info {
    --qig_fg: var(--color-off-black, ${themed("#010D28", "#ececef")}); --qig_fg_inv: var(--color-off-white, ${themed("#f5f5f5", "#0d0d0f")});
    --qig_bg: var(--color-white, ${themed("#ffffff", "#0d0d0f")}); --qig_box: ${themed("#fffffff2", "#1a1a1df2")};
    --qig_link: var(--color-primary-dark, ${themed("#445D7E", "#9db7dc")}); --qig_shadow: ${themed("#0000001a", "#ffffff0f")}; --qig_border: ${themed("transparent", "#2a2a2e")};
  }
}
.qig_info [hidden] { display: none; }
.qig_info_button {
  position: relative; overflow: hidden; display: inline-flex; align-items: center; justify-content: center;
  box-sizing: border-box; min-width: 2.4rem; height: 2.4rem; padding: 0; border: none; border-radius: 1.2rem;
  background: var(--qig_bg); box-shadow: 0 4px 8px var(--qig_shadow), 0 0 0 1px var(--qig_border);
  color: var(--qig_fg); font-family: "Roboto-Bold", sans-serif; font-size: 1rem; font-weight: 700; cursor: pointer;
  transition: color .3s ease .2s, border-radius .35s cubic-bezier(.165, .84, .44, 1), padding .35s cubic-bezier(.165, .84, .44, 1);
}
.qig_info_button:hover, .qig_info_button:focus-visible { border-radius: 0; padding: 0 0.9rem; }
.qig_info_button::before {
  content: ""; position: absolute; inset: 0; background: var(--qig_fg);
  clip-path: polygon(-1% 0, 0 0, -25% 100%, -1% 100%);
  transition: clip-path .7s cubic-bezier(.65, 0, .35, 1);
}
.qig_info_button:hover, .qig_info_button:focus-visible { color: var(--qig_fg_inv); outline: none; }
.qig_info_button:hover::before, .qig_info_button:focus-visible::before { clip-path: polygon(0 0, 101% 0, 101% 101%, 0 101%); }
.qig_info_mark, .qig_info_label { position: relative; z-index: 1; }
.qig_info_label {
  max-width: 0; opacity: 0; white-space: nowrap; overflow: hidden;
  transition: max-width .35s cubic-bezier(.165, .84, .44, 1), opacity .35s, margin-left .35s;
}
.qig_info_button:hover .qig_info_label, .qig_info_button:focus-visible .qig_info_label { max-width: 22em; opacity: 1; margin-left: 0.5em; }
.qig_info_box {
  position: relative; box-sizing: border-box; max-width: min(360px, calc(100vw - 32px));
  padding: 0.9rem 1rem; background: var(--qig_box); box-shadow: 0 4px 8px var(--qig_shadow), 0 0 0 1px var(--qig_border);
  color: var(--qig_fg); font-family: inherit; font-size: 0.9rem; line-height: 1.5;
  transform-origin: bottom right; animation: qig_grow .25s cubic-bezier(.165, .84, .44, 1);
}
.qig_info_box { margin-bottom: var(--qig_lift, 0px); }
.qig_info_box p { margin: 0; }
.qig_info_box a { color: var(--qig_link); text-decoration: underline; }
.qig_alice { color: ${ALICE}; font-weight: 700; }
.qig_bob { color: ${BOB}; font-weight: 700; }
@keyframes qig_grow { from { transform: scale(0.2); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .qig_info_button, .qig_info_button::before, .qig_info_label { transition: none; }
  .qig_info_box { animation: none; }
}
`;

const WASM_URL = new URL("game.wasm", document.currentScript.src);
const canvas = document.getElementById("qig_canvas");
const ctx = canvas.getContext("2d");
const reduce = matchMedia("(prefers-reduced-motion: reduce)");

const local = Array.from({ length: N_V }, () => [0, 0]);
const pos_p = Array.from({ length: N_V }, () => [0, 0]);
const pos_q = Array.from({ length: N_V }, () => [0, 0]);
let dot_r = 2, dpr = 1;
let geo = { cp: [0, 0], cq: [0, 0], R: 1, mirror: [1, 1] };
let edges_p = [], edges_q = [];
let layers = [];
let rot = 0;
let breath = 1;
let rounds = 0;
let strip = { x: 0, y: 0, cell: 8 };
let info = false;
let ui = null;
let probe = null;
const colors = [];

function layout() {
    dpr = 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const strip_h = Math.min(170, Math.max(90, 0.18 * h));
    const ha = h - strip_h;
    const wide = w >= ha;
    const R = 0.38 * Math.min(wide ? w / 2 : w, wide ? ha : ha / 2);
    const cell = Math.min(0.6 * strip_h / 4, (w - 32) / 26);
    strip = { x: (w - 24 * cell) / 2, y: ha + (strip_h - 4 * cell) / 2, cell };
    const low = wide ? ha / 2 : 3 * ha / 4;
    const drop = Math.max(0, strip.y - 28 - (low + 1.1 * R));
    const cp = wide ? [w / 4, ha / 2 + drop] : [w / 2, ha / 4 + drop];
    const cq = wide ? [3 * w / 4, ha / 2 + drop] : [w / 2, 3 * ha / 4 + drop];
    dot_r = Math.max(2, R / 70);
    geo = { cp, cq, R, mirror: wide ? [-1, 1] : [1, -1] };
    circle_layout(R);
    if (ui) {
        cover(ui);
        const overlaps = w - 16 - 360 < strip.x + 24 * cell;
        ui.style.setProperty("--qig_lift", overlaps ? `${strip_h}px` : "0px");
    }
    if (edges_p.length) render_base();
}

function read_colors() {
    const before = colors.join();
    PALETTE.forEach(([light, dark], i) => {
        probe.style.color = light;
        probe.style.color = themed(light, dark);
        colors[i] = getComputedStyle(probe).color;
    });
    return colors.join() !== before;
}

function cover(el) {
    el.style.left = `${canvas.offsetLeft}px`;
    el.style.top = `${canvas.offsetTop}px`;
    el.style.width = `${canvas.offsetWidth}px`;
    el.style.height = `${canvas.offsetHeight}px`;
}

function build_ui() {
    const style = document.createElement("style");
    style.id = "qig_style";
    style.textContent = INFO_CSS;
    document.head.append(style);
    const position = getComputedStyle(canvas).position === "fixed" ? "fixed" : "absolute";
    ui = document.createElement("div");
    ui.className = "qig_ui";
    ui.style.position = position;
    ui.innerHTML = `
<div class="qig_info">
  <button class="qig_info_button" aria-expanded="false" aria-label="What's going on in the background?">
    <span class="qig_info_mark">?</span><span class="qig_info_label">What's going on in the background?</span>
  </button>
  <div class="qig_info_box" role="dialog" aria-label="About the background" hidden>
    <p>${INFO_HTML}</p>
  </div>
</div>`;
    const button = ui.querySelector(".qig_info_button");
    const box = ui.querySelector(".qig_info_box");
    const widget = ui.querySelector(".qig_info");
    function set_info(open) {
        if (info === open) return;
        info = open;
        document.documentElement.classList.toggle("qig_focus", open);
        button.setAttribute("aria-expanded", String(open));
        if (open) {
            box.hidden = false;
            box.querySelector("a").focus();
            button.hidden = true;
        } else {
            button.hidden = false;
            box.hidden = true;
        }
    }
    button.addEventListener("click", () => set_info(true));
    widget.addEventListener("mouseleave", () => set_info(false));
    widget.addEventListener("focusout", e => {
        if (!widget.contains(e.relatedTarget)) set_info(false);
    });
    addEventListener("keydown", e => {
        if (e.key === "Escape" && info) {
            set_info(false);
            button.focus();
        }
    });
    canvas.after(ui);
    probe = document.createElement("span");
    probe.hidden = true;
    ui.append(probe);
    read_colors();
    const retheme = () => {
        if (read_colors() && edges_p.length) render_base();
    };
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", retheme);
    new MutationObserver(retheme).observe(document.documentElement, { attributes: true });
}

function circle_layout(R) {
    const r = R * 0.09;
    for (let nb = 0; nb < N_NB; nb++) {
        const t = 2 * Math.PI * nb / N_NB - Math.PI / 2;
        for (let k = 0; k < 3; k++) {
            const s = t + Math.PI + 2 * Math.PI * k / 3;
            local[3 * nb + k][0] = R * Math.cos(t) + r * Math.cos(s);
            local[3 * nb + k][1] = R * Math.sin(t) + r * Math.sin(s);
        }
    }
}

function draw_graph(g, pos, edges) {
    g.strokeStyle = colors[EDGE];
    g.lineWidth = 1.1;
    g.beginPath();
    for (const [u, v] of edges) {
        g.moveTo(pos[u][0], pos[u][1]);
        g.lineTo(pos[v][0], pos[v][1]);
    }
    g.stroke();
    g.strokeStyle = colors[BASE];
    g.lineWidth = 1.5;
    g.beginPath();
    for (let nb = 0; nb < N_NB; nb++) {
        g.moveTo(pos[3 * nb][0], pos[3 * nb][1]);
        g.lineTo(pos[3 * nb + 1][0], pos[3 * nb + 1][1]);
        g.lineTo(pos[3 * nb + 2][0], pos[3 * nb + 2][1]);
        g.closePath();
    }
    g.stroke();
    g.fillStyle = colors[BASE];
    g.beginPath();
    for (let v = 0; v < N_V; v++) {
        g.moveTo(pos[v][0] + dot_r, pos[v][1]);
        g.arc(pos[v][0], pos[v][1], dot_r, 0, 2 * Math.PI);
    }
    g.fill();
}

function render_base() {
    if (!layers.length) {
        const cs = getComputedStyle(canvas);
        const box = document.createElement("div");
        box.style.cssText = `position: ${cs.position === "fixed" ? "fixed" : "absolute"}; overflow: hidden; pointer-events: none; z-index: ${cs.zIndex};`;
        box.className = "qig_layers";
        canvas.before(box);
        layers = [0, 1].map(() => {
            const c = document.createElement("canvas");
            c.style.position = "absolute";
            box.append(c);
            return c;
        });
    }
    cover(layers[0].parentElement);
    const size = Math.ceil(2 * 1.15 * geo.R);
    const specs = [[layers[0], geo.cp, [1, 1], edges_p], [layers[1], geo.cq, geo.mirror, edges_q]];
    for (const [c, center, m, edges] of specs) {
        c.width = c.height = size;
        c.style.left = `${center[0] - size / 2}px`;
        c.style.top = `${center[1] - size / 2}px`;
        const g = c.getContext("2d");
        g.setTransform(1, 0, 0, 1, size / 2, size / 2);
        draw_graph(g, local, edges);
        c.style.transform = `scale(${m[0]}, ${m[1]})`;
        c.style.willChange = "rotate, scale";
    }
}

function place(pos, c, mirror) {
    const cs = Math.cos(rot) * breath, sn = Math.sin(rot) * breath;
    for (let v = 0; v < N_V; v++) {
        const x = local[v][0], y = local[v][1];
        pos[v][0] = c[0] + mirror[0] * (cs * x - sn * y);
        pos[v][1] = c[1] + mirror[1] * (sn * x + cs * y);
    }
}

function update_positions(now) {
    rot = reduce.matches ? 0 : 2 * Math.PI * (now % ROT_MS) / ROT_MS;
    breath = reduce.matches ? 1 : 1 + BREATH * Math.sin(2 * Math.PI * (now % BREATH_MS) / BREATH_MS);
    place(pos_p, geo.cp, [1, 1]);
    place(pos_q, geo.cq, geo.mirror);
    for (let i = 0; i < layers.length; i++) {
        const dir = i ? geo.mirror[0] * geo.mirror[1] : 1;
        layers[i].style.rotate = `${dir * rot}rad`;
        layers[i].style.scale = `${breath}`;
    }
}

function relation_edges(rel) {
    const out = [];
    for (let u = 0; u < N_V; u++)
        for (let v = u + 1; v < N_V; v++)
            if (rel(u, v) === 1) out.push([u, v]);
    return out;
}

function dot(p, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p[0], p[1], r, 0, 2 * Math.PI);
    ctx.fill();
}

function player_dots(pa, pb, r) {
    if (pa !== pb) {
        dot(pa, r, ALICE);
        dot(pb, r, BOB);
        return;
    }
    ctx.fillStyle = ALICE;
    ctx.beginPath();
    ctx.arc(pa[0], pa[1], r, Math.PI / 2, 3 * Math.PI / 2);
    ctx.fill();
    ctx.fillStyle = BOB;
    ctx.beginPath();
    ctx.arc(pa[0], pa[1], r, -Math.PI / 2, Math.PI / 2);
    ctx.fill();
}

function segment(a, b, color, width, t) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t);
    ctx.stroke();
}

function arc_point(a, b, bend, t) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const cx = (a[0] + b[0]) / 2 - bend * dy, cy = (a[1] + b[1]) / 2 + bend * dx;
    const u = 1 - t;
    return [
        u * u * a[0] + 2 * u * t * cx + t * t * b[0],
        u * u * a[1] + 2 * u * t * cy + t * t * b[1],
    ];
}

function arc(a, b, bend, color, width, t) {
    if (t <= 0) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    const n = Math.max(1, Math.ceil(32 * t));
    for (let i = 1; i <= n; i++) {
        const p = arc_point(a, b, bend, t * i / n);
        ctx.lineTo(p[0], p[1]);
    }
    ctx.stroke();
}

function clamp01(x) {
    return Math.min(1, Math.max(0, x));
}

function ease(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function phases(t) {
    return {
        ask: ease(clamp01(t / 0.12)),
        alice: ease(clamp01((t - 0.18) / 0.14)),
        bob: ease(clamp01((t - 0.38) / 0.14)),
        travel: ease(clamp01((t - 0.58) / 0.12)),
        answer: ease(clamp01((t - 0.72) / 0.1)),
        fade: 1 - ease(clamp01((t - FADE_T) / (1 - FADE_T))),
    };
}

function draw_trails(trails, now) {
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = colors[LABEL];
    for (const tr of trails) {
        const age = now - tr.born;
        ctx.globalAlpha = 0.12 * clamp01(1 - age / TRAIL_MS);
        ctx.beginPath();
        for (const [pos, [u, v]] of [[pos_p, tr.q], [pos_q, tr.a]]) {
            ctx.moveTo(pos[u][0], pos[u][1]);
            ctx.lineTo(pos[v][0], pos[v][1]);
        }
        ctx.stroke();
    }
    for (const tr of trails) {
        const tint = 0.4 * Math.exp(-(now - tr.born) / TRAIL_TINT_MS);
        if (tint < 0.01) continue;
        ctx.globalAlpha = tint;
        for (const [pos, [u, v, rel]] of [[pos_p, tr.q], [pos_q, tr.a]]) {
            ctx.strokeStyle = colors[rel];
            ctx.beginPath();
            ctx.moveTo(pos[u][0], pos[u][1]);
            ctx.lineTo(pos[v][0], pos[v][1]);
            ctx.stroke();
        }
    }
    ctx.globalAlpha = 1;
}

function draw_round(s, t) {
    const [e, g, f, h, rel_q, rel_a] = s;
    const { ask, travel, answer, fade } = phases(t);
    ctx.globalAlpha = fade;
    segment(pos_p[e], pos_p[g], colors[rel_q], 2.25, ask);
    player_dots(pos_p[e], pos_p[g], dot_r * (1 + 2 * ask));
    ctx.globalAlpha = fade * 0.5;
    arc(pos_p[e], pos_q[f], ARC_BEND, ALICE, 1.5, travel);
    arc(pos_p[g], pos_q[h], -ARC_BEND, BOB, 1.5, travel);
    ctx.globalAlpha = fade;
    if (travel > 0 && travel < 1 && !reduce.matches) {
        dot(arc_point(pos_p[e], pos_q[f], ARC_BEND, travel), 1.8 * dot_r, ALICE);
        dot(arc_point(pos_p[g], pos_q[h], -ARC_BEND, travel), 1.8 * dot_r, BOB);
    }
    if (answer > 0) {
        segment(pos_q[f], pos_q[h], colors[rel_a], 2.25, answer);
        player_dots(pos_q[f], pos_q[h], dot_r * (1 + 2 * answer));
    }
    ctx.globalAlpha = 1;
}

function read_mat(wasm, e, f) {
    return Array.from(new Float64Array(wasm.memory.buffer, wasm.qig_proj(e, f), 16));
}

function mul4(a, b) {
    const c = new Array(16).fill(0);
    for (let i = 0; i < 4; i++)
        for (let j = 0; j < 4; j++)
            for (let k = 0; k < 4; k++)
                c[4 * i + j] += a[4 * i + k] * b[4 * k + j];
    return c;
}

function normalise(m) {
    const n = Math.hypot(...m);
    return m.map(x => x / n);
}

function measure(wasm, s) {
    const [e, g, f, h] = s;
    const pf = read_mat(wasm, e, f), ph = read_mat(wasm, g, h);
    const base_f = Math.floor(e / 12) * 12 + e % 3;
    const base_h = Math.floor(g / 12) * 12 + g % 3;
    const grid = [];
    for (let i = 0; i < 4; i++)
        for (let j = 0; j < 4; j++)
            grid.push(wasm.qig_prob(e, g, base_f + 3 * i, base_h + 3 * j));
    const half_id = [0.5, 0, 0, 0, 0, 0.5, 0, 0, 0, 0, 0.5, 0, 0, 0, 0, 0.5];
    return {
        psi: [half_id, pf, normalise(mul4(pf, ph))],
        grid,
        fi: (f - base_f) / 3,
        hj: (h - base_h) / 3,
    };
}

function draw_matrix(x, y, m, alpha) {
    const c = strip.cell;
    const top = Math.max(...m.map(Math.abs));
    for (let i = 0; i < 16; i++) {
        const v = m[i];
        if (Math.abs(v) < 1e-9) continue;
        ctx.globalAlpha = alpha * Math.abs(v) / top;
        ctx.fillStyle = v > 0 ? colors[INK] : colors[NEG];
        ctx.fillRect(x + c * (i % 4), y + c * Math.floor(i / 4), c, c);
    }
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = colors[BASE];
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, 4 * c, 4 * c);
}

function label(text, x, y, alpha) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = colors[LABEL];
    ctx.font = "12px monospace";
    ctx.textAlign = "center";
    ctx.fillText(text, x, y);
}

function arrow(x, y, len, prog, color, text, alpha) {
    if (prog <= 0) return;
    const end = x + len * prog;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(end, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(end, y);
    ctx.lineTo(end - 6, y - 4);
    ctx.lineTo(end - 6, y + 4);
    ctx.closePath();
    ctx.fill();
    if (len >= 44) label(text, x + len / 2, y - 8, alpha);
}

function draw_strip(m, t) {
    const c = strip.cell, x = strip.x, y = strip.y;
    const { ask, alice, bob, fade } = phases(t);
    const mid = y + 2 * c;
    const xs = [x, x + 7 * c, x + 14 * c, x + 20 * c];
    draw_matrix(xs[0], y, m.psi[0], fade * ask);
    label("Ψ", xs[0] + 2 * c, y - 6, fade * ask);
    arrow(xs[0] + 4.5 * c, mid, 2 * c, alice, ALICE, "P_f⊗1", fade);
    draw_matrix(xs[1], y, m.psi[1], fade * clamp01((alice - 0.6) / 0.4));
    arrow(xs[1] + 4.5 * c, mid, 2 * c, bob, BOB, "1⊗P_h", fade);
    draw_matrix(xs[2], y, m.psi[2], fade * clamp01((bob - 0.6) / 0.4));
    const gx = xs[3];
    for (let i = 0; i < 16; i++) {
        ctx.globalAlpha = fade * ask * 4 * m.grid[i];
        ctx.fillStyle = colors[INK];
        ctx.fillRect(gx + c * (i % 4), y + c * Math.floor(i / 4), c, c);
    }
    ctx.globalAlpha = fade * ask;
    ctx.strokeStyle = colors[BASE];
    ctx.lineWidth = 1;
    ctx.strokeRect(gx, y, 4 * c, 4 * c);
    ctx.fillStyle = ALICE;
    for (let i = 0; i < 4; i++) ctx.fillRect(gx - 0.35 * c, y + c * (i + 0.2), 0.2 * c, 0.6 * c);
    ctx.fillStyle = BOB;
    for (let j = 0; j < 4; j++) ctx.fillRect(gx + c * (j + 0.2), y - 0.35 * c, 0.6 * c, 0.2 * c);
    label("p(f,h)", gx + 2 * c, y - 0.35 * c - 6, fade * ask);
    const row = clamp01((alice - 0.6) / 0.4);
    const cell_on = clamp01((bob - 0.6) / 0.4);
    if (row > 0) {
        ctx.globalAlpha = fade * row;
        ctx.strokeStyle = ALICE;
        ctx.lineWidth = 2;
        ctx.strokeRect(gx, y + c * m.fi, 4 * c, c);
    }
    if (cell_on > 0) {
        ctx.globalAlpha = fade * cell_on;
        ctx.strokeStyle = BOB;
        ctx.lineWidth = 2;
        ctx.strokeRect(gx + c * m.hj, y + c * m.fi, c, c);
        label(`p = ${m.grid[4 * m.fi + m.hj].toFixed(3)}`, gx + 2 * c, y + 4 * c + 16, fade * cell_on);
    }
    ctx.globalAlpha = 1;
}

async function main() {
    const { instance } = await WebAssembly.instantiateStreaming(fetch(WASM_URL), {});
    const wasm = instance.exports;
    wasm.qig_init((Math.random() * 0xffffffff) >>> 0);
    edges_p = relation_edges(wasm.qig_rel_p);
    edges_q = relation_edges(wasm.qig_rel_q);
    let live = [], trails = [], last_spawn = -Infinity, last_draw = -Infinity, visible = true, pending = false;
    new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        schedule();
    }).observe(canvas);

    function schedule() {
        if (pending || !visible) return;
        pending = true;
        setTimeout(() => requestAnimationFrame(frame), Math.max(0, FRAME_MS - (performance.now() - last_draw)));
    }

    function spawn(now) {
        const s = Array.from(new Int32Array(wasm.memory.buffer, wasm.qig_round(), 6));
        const scale = reduce.matches ? 2 : 1;
        live.push({ s, start: now, dur: ROUND_MS * scale, meas: rounds % 3 === 0 ? measure(wasm, s) : null });
        last_spawn = now;
        rounds++;
    }

    function step(now) {
        if (now - last_spawn >= SPAWN_MS * (reduce.matches ? 2 : 1)) spawn(now);
        for (const r of live)
            if (!r.trailed && now - r.start >= FADE_T * r.dur) {
                trails.push({ q: [r.s[0], r.s[1], r.s[4]], a: [r.s[2], r.s[3], r.s[5]], born: now });
                r.trailed = true;
            }
        live = live.filter(r => now - r.start < r.dur);
        trails = trails.filter(tr => now - tr.born < TRAIL_MS);
    }

    function frame(now) {
        pending = false;
        if (!visible) return;
        if (last_draw === -Infinity)
            for (let v = now - WARM_MS; v < now; v += FRAME_MS) step(v);
        last_draw = now;
        step(now);
        update_positions(now);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        draw_trails(trails, now);
        for (const r of live) {
            const t = (now - r.start) / r.dur;
            draw_round(r.s, t);
            if (r.meas && info) draw_strip(r.meas, t);
        }
        schedule();
    }

    build_ui();
    layout();
    new ResizeObserver(layout).observe(canvas);
    schedule();
}

main();
