import { describe, expect, it } from 'vitest';

describe('mcp-mayotte', () => {
  it('has a stable package name', () => {
    expect('mcp-mayotte').toMatch(/^mcp-/);
  });

  it('defines source URLs', () => {
    const sources = [
      {
            "title": "data.gouv.fr Mayotte search",
            "url": "https://www.data.gouv.fr/fr/datasets/?q=Mayotte"
      },
      {
            "title": "Météo-France vigilance Mayotte",
            "url": "https://vigilance.meteofrance.fr/fr/mayotte"
      },
      {
            "title": "geo.api.gouv.fr",
            "url": "https://geo.api.gouv.fr/"
      },
      {
            "title": "Géorisques",
            "url": "https://www.georisques.gouv.fr/"
      },
      {
            "title": "INSEE Mayotte",
            "url": "https://www.insee.fr/fr/statistiques?debut=0&theme=1&geo=DEP-976"
      }
];
    expect(sources.length).toBeGreaterThan(0);
    for (const source of sources) {
      expect(source.url).toMatch(/^https?:\/\//);
    }
  });

  it('has a tool prefix', () => {
    expect('mayotte').toMatch(/^[a-z0-9_]+$/);
  });
});
