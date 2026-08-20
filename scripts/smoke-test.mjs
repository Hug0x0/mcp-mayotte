#!/usr/bin/env node

const sources = [
  [
    "data.gouv.fr Mayotte search",
    "https://www.data.gouv.fr/fr/datasets/?q=Mayotte"
  ],
  [
    "Météo-France vigilance Mayotte",
    "https://vigilance.meteofrance.fr/fr/mayotte"
  ],
  [
    "geo.api.gouv.fr",
    "https://geo.api.gouv.fr/"
  ],
  [
    "Géorisques",
    "https://www.georisques.gouv.fr/"
  ],
  [
    "INSEE Mayotte",
    "https://www.insee.fr/fr/statistiques?debut=0&theme=1&geo=DEP-976"
  ]
];

let failures = 0;

for (const [title, url] of sources) {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'text/html,application/json,*/*',
        'User-Agent': 'mcp-mayotte-smoke/0.1',
      },
    });
    const body = await response.text();
    const ok = response.ok && body.length > 100;
    console.log(`${ok ? 'OK' : 'FAIL'} ${response.status} ${title} ${url}`);
    if (!ok) failures += 1;
  } catch (error) {
    failures += 1;
    console.log(`FAIL ${title} ${url} ${error.message}`);
  }
}

const api = new URL('https://www.data.gouv.fr/api/1/datasets/');
api.searchParams.set('q', 'Mayotte');
api.searchParams.set('page_size', '1');
try {
  const response = await fetch(api);
  const body = await response.json();
  const ok = response.ok && Array.isArray(body.data);
  console.log(`${ok ? 'OK' : 'FAIL'} ${response.status} data.gouv.fr API search`);
  if (!ok) failures += 1;
} catch (error) {
  failures += 1;
  console.log(`FAIL data.gouv.fr API search ${error.message}`);
}

process.exitCode = failures === 0 ? 0 : 1;
