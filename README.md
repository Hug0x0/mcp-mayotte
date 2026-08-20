# mcp-mayotte

MCP server for Mayotte public data, vigilance, administrative references, and local risk discovery.

## Scope

Mayotte-focused public-data discovery: communes, vigilance, risks, population, administrative and open-data sources.

## Tools

- `mayotte_get_sources`
- `mayotte_search_data_gouv`
- `mayotte_get_dataset`
- `mayotte_fetch_source_excerpt`
- `mayotte_explain_scope`
- `mayotte_list_reference_items`
- `mayotte_list_communes`
- `mayotte_find_commune`
- `mayotte_search_datasets`
- `mayotte_get_vigilance`

## Install

```bash
npm install
npm run build
npm test
npm run dev
```

## Claude Desktop

```json
{
  "mcpServers": {
    "mayotte": {
      "command": "npx",
      "args": ["mcp-mayotte"]
    }
  }
}
```

## Sources

- data.gouv.fr Mayotte search: https://www.data.gouv.fr/fr/datasets/?q=Mayotte
- Météo-France vigilance Mayotte: https://vigilance.meteofrance.fr/fr/mayotte
- geo.api.gouv.fr: https://geo.api.gouv.fr/
- Géorisques: https://www.georisques.gouv.fr/
- INSEE Mayotte: https://www.insee.fr/fr/statistiques?debut=0&theme=1&geo=DEP-976

## Example Prompts

- "List official Mayotte source links."
- "Search data.gouv.fr for Mayotte school or health datasets."
- "Show Mayotte commune reference hints."

## Safety

This MCP helps agents discover and summarize public sources. It is not an official authority. For emergency, legal, or administrative decisions, follow the competent public service.

## Glama / Docker

The repo includes `Dockerfile` and `glama.json`.

Publishing notes: [`docs/publishing.md`](docs/publishing.md).

Build steps:

```json
["npm install", "npm run build"]
```

CMD arguments:

```json
["node", "dist/index.js"]
```

## License

MIT
