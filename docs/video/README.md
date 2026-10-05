# Video promocional

`mecanicaos-promo.mp4`: 60 segundos, 1920×1080, 30 fps, sin audio (pensado para redes, donde se reproduce sin sonido). Usa pantallas reales del sistema con datos de demostración.

## Volver a generarlo con tu contacto

El cierre muestra "Pide tu demostración". Para añadir tu WhatsApp o sitio web debajo:

```bash
cd docs/video/fuente
npm install playwright && npx playwright install chromium   # una sola vez; también necesitas ffmpeg
node render.js video ../mecanicaos-promo.mp4 "WhatsApp 099 999 9999 · tusitio.com"
```

Vista previa de cuadros sueltos (segundos): `node render.js stills "5,20,55"`.

Los textos y tiempos de cada escena están en `promo.html` (lista `ESCENAS`). Las capturas están en `shots/`.

## Música

Agrega una pista libre de derechos (por ejemplo, de la Biblioteca de audio de YouTube) con:

```bash
ffmpeg -i mecanicaos-promo.mp4 -i musica.mp3 -map 0:v -map 1:a -c:v copy -c:a aac -shortest -af "afade=t=out:st=57:d=3" mecanicaos-promo-musica.mp4
```
