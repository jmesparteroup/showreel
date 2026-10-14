#!/usr/bin/env node
import { serveFilm } from './frames.mjs';

const dir = process.argv[2];
if (!dir) { console.error('usage: preview.mjs <filmDir>'); process.exit(2); }
const { url } = await serveFilm(dir);
console.log(`preview: ${url}\nctrl-c to stop`);
