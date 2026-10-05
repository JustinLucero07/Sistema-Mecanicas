// node render.js stills "1,4,..."   |   node render.js video salida.mp4 [contacto]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const [modo, arg, contacto] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto('file://' + __dirname + '/promo.html' + (contacto ? '?contacto=' + encodeURIComponent(contacto) : ''));
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(500);
  if (modo === 'stills') {
    for (const t of arg.split(',').map(Number)) {
      await p.evaluate((t) => render(t), t);
      await p.screenshot({ path: `still_${String(t).padStart(5, '0')}.png` });
    }
  } else {
    const FPS = 30, dur = await p.evaluate(() => DURACION);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', arg], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = 0; f < dur * FPS; f++) {
      await p.evaluate((t) => render(t), f / FPS);
      const buf = await p.screenshot({ type: 'jpeg', quality: 95 });
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      if (f % 300 === 0) console.log('frame', f);
    }
    ff.stdin.end();
    await new Promise((r) => ff.on('close', r));
  }
  await b.close();
})();
