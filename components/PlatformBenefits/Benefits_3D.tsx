'use client';

import { useEffect, useRef, useState } from 'react';

type Step = { title: string; body: string; image: string };

/**
 * The 3D benefits block (owner 01.11.2026, «Справжній 3D (Three.js)»). Text is real HTML — four
 * steps in an <ol> that scroll past a sticky stage. The stage shows a poster photo at once; when
 * the section comes near and the device can (WebGL2, no reduced motion, no Save-Data), the Three.js
 * chunk loads and draws the photos as glossy prints on a ring that turns with the reading position.
 * kl Skills/Web_Effects/Web_3D_Scroll_Site: one canvas, lazy chunk, poster first, never blocks LCP.
 */
export function Benefits3D({ steps, label }: { steps: Step[]; label: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progress = useRef(0);
  const [active, setActive] = useState(0);
  const [live, setLive] = useState(false);

  // Reading position → continuous progress 0…n-1 (mutable ref) and the active step (state).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const items = Array.from(
      root.querySelectorAll<HTMLElement>('[data-b3d-step]'),
    );
    let ticking = false;
    const measure = () => {
      ticking = false;
      const anchor =
        window.innerHeight * (window.innerWidth < 900 ? 0.72 : 0.5);
      const centers = items.map((el) => {
        const r = el.getBoundingClientRect();
        return r.top + r.height / 2;
      });
      let p = 0;
      if (anchor <= centers[0]) p = 0;
      else if (anchor >= centers[centers.length - 1]) p = centers.length - 1;
      else
        for (let i = 0; i < centers.length - 1; i++)
          if (anchor >= centers[i] && anchor < centers[i + 1]) {
            p = i + (anchor - centers[i]) / (centers[i + 1] - centers[i]);
            break;
          }
      progress.current = p;
      setActive(Math.round(p));
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(measure);
      }
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  // Lazy 3D: near the viewport, after load, only where it can run well.
  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const q = new URLSearchParams(window.location.search);
    if (q.get('scene') === 'off') return;
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const net = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    const slow = Boolean(
      net && (net.saveData || /2g|3g/.test(net.effectiveType ?? '')),
    );
    if (reduce || slow) return;
    let gl2 = false;
    try {
      const probe = document.createElement('canvas').getContext('webgl2');
      gl2 = Boolean(probe);
      // A software rasteriser (no GPU: SwiftShader, llvmpipe, Microsoft Basic Render) draws the
      // scene on the CPU and freezes the page — the poster is the better page there.
      // `?scene=on` forces the 3D anyway (screenshot checks in headless Chromium).
      const info = probe?.getExtension('WEBGL_debug_renderer_info');
      const gpu = info
        ? String(probe?.getParameter(info.UNMASKED_RENDERER_WEBGL) ?? '')
        : '';
      if (
        q.get('scene') !== 'on' &&
        /swiftshader|llvmpipe|software|basic render/i.test(gpu)
      )
        gl2 = false;
      probe?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      gl2 = false;
    }
    if (!gl2) return;

    let stop: (() => void) | null = null;
    let cancelled = false;
    const start = async () => {
      const { startBenefitsScene } = await import('@/lib/three/Benefits_Scene');
      if (cancelled) return;
      const cs = getComputedStyle(root);
      stop = startBenefitsScene({
        canvas,
        images: steps.map((s) => s.image),
        getProgress: () => progress.current,
        tier: q.get('scene_tier') === 'low' ? 'low' : 'mid',
        background: cs.getPropertyValue('--b3d-bg').trim() || '#fef3fb',
        accent: cs.getPropertyValue('--b3d-accent').trim() || '#f898d0',
        onLive: () => setLive(true),
        onLost: () => setLive(false),
      });
    };
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        if (document.readyState === 'complete') void start();
        else
          window.addEventListener('load', () => void start(), { once: true });
      },
      { rootMargin: '600px 0px' },
    );
    io.observe(root);
    return () => {
      cancelled = true;
      io.disconnect();
      stop?.();
    };
  }, [steps]);

  return (
    <div ref={rootRef} className='b3d' data-live={live ? 'true' : undefined}>
      <div className='b3d_stage'>
        <div className='b3d_poster' aria-hidden='true'>
          {steps.map((s, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- poster swap; sizes are fixed WebP files
            <img
              key={s.image}
              src={s.image}
              alt=''
              loading='lazy'
              decoding='async'
              className={i === active ? 'is-on' : undefined}
            />
          ))}
        </div>
        <canvas ref={canvasRef} className='b3d_canvas' aria-hidden='true' />
        <p className='b3d_count' aria-hidden='true'>
          <b>{String(active + 1).padStart(2, '0')}</b> /{' '}
          {String(steps.length).padStart(2, '0')}
        </p>
      </div>
      <ol className='b3d_steps' aria-label={label}>
        {steps.map((s, i) => (
          <li
            key={s.title}
            data-b3d-step
            className={`b3d_step${i === active ? ' is-on' : ''}`}
          >
            <div className='b3d_card'>
              <p className='card_num' aria-hidden='true'>
                {i + 1}/
              </p>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
