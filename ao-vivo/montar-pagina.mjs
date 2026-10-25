/**
 * Gera ao-vivo/pagina.html a partir do modelo, embutindo os contornos do mapa.
 * Uso: node ao-vivo/montar-pagina.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(aqui, '../web/package.json'));
const caminho = require.resolve('@svg-maps/brazil');
const { default: brasil } = await import(caminho);

const mapa = brasil.locations.map((l) => [l.id, l.name, l.path]);
const modelo = readFileSync(path.join(aqui, 'pagina.template.html'), 'utf8');
const html = modelo.replace('/*VIEWBOX*/', brasil.viewBox).replace('/*MAPA*/', JSON.stringify(mapa));
writeFileSync(path.join(aqui, 'pagina.html'), html);
console.log('ao-vivo/pagina.html gerada');
