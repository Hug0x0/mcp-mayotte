#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const CONFIG = {
  "name": "mcp-mayotte",
  "prefix": "mayotte",
  "title": "Mayotte",
  "description": "MCP server for Mayotte public data, vigilance, administrative references, and local risk discovery.",
  "domain": "Mayotte-focused public-data discovery: communes, vigilance, risks, population, administrative and open-data sources.",
  "sources": [
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
  ],
  "examples": [
    "List official Mayotte source links.",
    "Search data.gouv.fr for Mayotte school or health datasets.",
    "Show Mayotte commune reference hints."
  ],
  "dataGouvDefaultQuery": "Mayotte",
  "localItems": [
    "Mamoudzou",
    "Dzaoudzi",
    "Pamandzi",
    "Koungou",
    "Bandraboua",
    "Acoua",
    "Mtsamboro",
    "Tsingoni",
    "Sada",
    "Chirongui",
    "Bouéni",
    "Bandrélé",
    "Dembéni",
    "Ouangani",
    "Chiconi",
    "Mtsangamouji"
  ]
} as const;

interface ToolResult {
  [key: string]: unknown;
  content: Array<{ type: 'text'; text: string }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

function jsonResult(data: Record<string, unknown>): ToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
}

function errorResult(message: string): ToolResult {
  const data = { error: message };
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
    isError: true,
  };
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function htmlToText(html: string): string {
  return normalizeText(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
  );
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json,*/*',
      'User-Agent': `${CONFIG.name}/0.1 (+https://github.com/Hug0x0/${CONFIG.name})`,
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while fetching ${url}`);
  }
  return response.json() as Promise<T>;
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      Accept: 'text/html,text/plain,*/*',
      'User-Agent': `${CONFIG.name}/0.1 (+https://github.com/Hug0x0/${CONFIG.name})`,
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while fetching ${url}`);
  }
  return response.text();
}

function sourceByKey(key: string) {
  const normalized = key.toLowerCase();
  return CONFIG.sources.find((source, index) =>
    String(index + 1) === normalized ||
    source.title.toLowerCase().includes(normalized) ||
    source.url.toLowerCase().includes(normalized)
  );
}

const server = new McpServer({
  name: CONFIG.name,
  version: '0.1.0',
});

server.tool(
  `${CONFIG.prefix}_get_sources`,
  `List curated official and high-value sources for ${CONFIG.title}.`,
  {},
  async () => jsonResult({
    server: CONFIG.name,
    domain: CONFIG.domain,
    sources: CONFIG.sources,
    examples: CONFIG.examples,
  })
);

server.tool(
  `${CONFIG.prefix}_search_data_gouv`,
  'Search public datasets on data.gouv.fr using the official public API.',
  {
    query: z.string().default(CONFIG.dataGouvDefaultQuery).describe('Search query.'),
    page_size: z.number().int().min(1).max(50).default(10).describe('Number of datasets to return.'),
  },
  async ({ query, page_size }) => {
    try {
      const url = new URL('https://www.data.gouv.fr/api/1/datasets/');
      url.searchParams.set('q', query);
      url.searchParams.set('page_size', String(page_size));
      const data = await fetchJson<{ data?: Array<Record<string, unknown>>; total?: number }>(url.toString());
      return jsonResult({
        query,
        total: data.total,
        datasets: (data.data ?? []).map((dataset) => ({
          id: dataset.id,
          slug: dataset.slug,
          title: dataset.title,
          page: dataset.page,
          organization: typeof dataset.organization === 'object' && dataset.organization
            ? (dataset.organization as Record<string, unknown>).name
            : undefined,
          resources_count: Array.isArray(dataset.resources) ? dataset.resources.length : undefined,
        })),
      });
    } catch (error) {
      return errorResult(error instanceof Error ? error.message : 'Failed to search data.gouv.fr');
    }
  }
);

server.tool(
  `${CONFIG.prefix}_get_dataset`,
  'Inspect one data.gouv.fr dataset by slug or id using the official public API.',
  {
    dataset: z.string().describe('Dataset slug or id.'),
  },
  async ({ dataset }) => {
    try {
      const url = `https://www.data.gouv.fr/api/1/datasets/${encodeURIComponent(dataset)}/`;
      const data = await fetchJson<Record<string, unknown>>(url);
      return jsonResult({
        id: data.id,
        slug: data.slug,
        title: data.title,
        description: data.description,
        page: data.page,
        tags: data.tags,
        resources: Array.isArray(data.resources)
          ? data.resources.slice(0, 25).map((resource) => ({
              id: resource.id,
              title: resource.title,
              type: resource.type,
              format: resource.format,
              url: resource.url,
              latest: resource.latest,
            }))
          : [],
      });
    } catch (error) {
      return errorResult(error instanceof Error ? error.message : 'Failed to inspect dataset');
    }
  }
);

server.tool(
  `${CONFIG.prefix}_fetch_source_excerpt`,
  'Fetch a short text excerpt from one curated source URL. Use source_key as a number, title keyword, or URL fragment from get_sources.',
  {
    source_key: z.string().describe('Source index, title keyword, or URL fragment.'),
    max_chars: z.number().int().min(200).max(4000).default(1200).describe('Maximum excerpt length.'),
  },
  async ({ source_key, max_chars }) => {
    try {
      const source = sourceByKey(source_key);
      if (!source) {
        return errorResult(`Unknown source: ${source_key}`);
      }
      const html = await fetchText(source.url);
      return jsonResult({
        source,
        excerpt: htmlToText(html).slice(0, max_chars),
      });
    } catch (error) {
      return errorResult(error instanceof Error ? error.message : 'Failed to fetch source excerpt');
    }
  }
);

server.tool(
  `${CONFIG.prefix}_explain_scope`,
  `Explain what this MCP is useful for and how an agent should combine its sources.`,
  {},
  async () => jsonResult({
    server: CONFIG.name,
    useful_for: CONFIG.domain,
    recommended_flow: [
      'Start with get_sources to understand trusted sources.',
      'Use search_data_gouv for discoverable French public datasets.',
      'Use get_dataset for dataset/resource inspection.',
      'Use fetch_source_excerpt for human-readable official pages.',
      'Cite official sources and avoid presenting source discovery as emergency or legal advice.',
    ],
    limitations: [
      'This is a discovery and summarization MCP, not an official authority.',
      'Some portals are HTML pages and can change without notice.',
      'For emergencies or administrative decisions, follow the competent official service.',
    ],
  })
);

server.tool(
  `${CONFIG.prefix}_list_reference_items`,
  'List built-in reference items for this MCP, when available.',
  {},
  async () => jsonResult({
    items: CONFIG.localItems,
    count: CONFIG.localItems.length,
    note: CONFIG.localItems.length > 0
      ? 'These are lightweight reference hints, not a complete authoritative dataset.'
      : 'No local reference list is bundled yet. Use the source and dataset search tools.',
  })
);

server.tool(
  'mayotte_list_communes',
  'List Mayotte communes from geo.api.gouv.fr with INSEE code, postal codes, population, and center geometry.',
  {},
  async () => {
    try {
      const url = 'https://geo.api.gouv.fr/departements/976/communes?fields=nom,code,codesPostaux,population,centre&format=json';
      const communes = await fetchJson<Array<Record<string, unknown>>>(url);
      return jsonResult({
        source: url,
        count: communes.length,
        communes: communes.map((commune) => ({
          name: commune.nom,
          code: commune.code,
          postal_codes: commune.codesPostaux,
          population: commune.population,
          center: commune.centre,
        })),
      });
    } catch (error) {
      return errorResult(error instanceof Error ? error.message : 'Failed to list Mayotte communes');
    }
  }
);

server.tool(
  'mayotte_find_commune',
  'Find a Mayotte commune by name, INSEE code, or postal code using geo.api.gouv.fr.',
  {
    query: z.string().describe('Commune name, INSEE code, or postal code, e.g. "Mamoudzou", "97611", "97600".'),
  },
  async ({ query }) => {
    try {
      const url = 'https://geo.api.gouv.fr/departements/976/communes?fields=nom,code,codesPostaux,population,centre&format=json';
      const communes = await fetchJson<Array<Record<string, unknown>>>(url);
      const normalized = query.toLowerCase();
      return jsonResult({
        query,
        matches: communes
          .filter((commune) => {
            const name = String(commune.nom ?? '').toLowerCase();
            const code = String(commune.code ?? '').toLowerCase();
            const postcodes = Array.isArray(commune.codesPostaux) ? commune.codesPostaux.map(String) : [];
            return name.includes(normalized) || code === normalized || postcodes.includes(query);
          })
          .map((commune) => ({
            name: commune.nom,
            code: commune.code,
            postal_codes: commune.codesPostaux,
            population: commune.population,
            center: commune.centre,
          })),
      });
    } catch (error) {
      return errorResult(error instanceof Error ? error.message : 'Failed to find Mayotte commune');
    }
  }
);

server.tool(
  'mayotte_search_datasets',
  'Search data.gouv.fr for Mayotte-specific datasets, optionally adding a topic.',
  {
    topic: z.string().optional().describe('Optional topic, e.g. "écoles", "santé", "risques", "population".'),
    page_size: z.number().int().min(1).max(50).default(10).describe('Number of datasets to return.'),
  },
  async ({ topic, page_size }) => {
    try {
      const query = topic ? `Mayotte ${topic}` : 'Mayotte';
      const url = new URL('https://www.data.gouv.fr/api/1/datasets/');
      url.searchParams.set('q', query);
      url.searchParams.set('page_size', String(page_size));
      const data = await fetchJson<{ data?: Array<Record<string, unknown>>; total?: number }>(url.toString());
      return jsonResult({
        query,
        total: data.total,
        datasets: (data.data ?? []).map((dataset) => ({
          id: dataset.id,
          slug: dataset.slug,
          title: dataset.title,
          page: dataset.page,
          organization: dataset.organization && typeof dataset.organization === 'object'
            ? (dataset.organization as Record<string, unknown>).name
            : undefined,
        })),
      });
    } catch (error) {
      return errorResult(error instanceof Error ? error.message : 'Failed to search Mayotte datasets');
    }
  }
);

server.tool(
  'mayotte_get_vigilance',
  'Return official Mayotte Météo-France vigilance URL and a short public page excerpt.',
  {
    include_excerpt: z.boolean().default(true).describe('Whether to fetch a short text excerpt from the public vigilance page.'),
  },
  async ({ include_excerpt }) => {
    const source = 'https://vigilance.meteofrance.fr/fr/mayotte';
    try {
      if (!include_excerpt) {
        return jsonResult({ source });
      }
      const html = await fetchText(source);
      return jsonResult({
        source,
        excerpt: htmlToText(html).slice(0, 1600),
        note: 'Use the official source URL for authoritative current vigilance. This MCP does not replace prefecture or Météo-France instructions.',
      });
    } catch (error) {
      return errorResult(error instanceof Error ? error.message : 'Failed to fetch Mayotte vigilance');
    }
  }
);

async function main(): Promise<void> {
  await server.connect(new StdioServerTransport());
  console.error(`${CONFIG.name} running on stdio`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
