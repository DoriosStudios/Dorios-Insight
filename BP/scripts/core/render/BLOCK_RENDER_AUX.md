# Block Render Aux

Insight renders block icons in the WAILA panel through Minecraft UI's
`inventory_item_renderer`. That renderer does not take a block type id directly;
it needs the numeric `#item_id_aux` used by the client item registry.

The runtime resolver is `blockRender.js`:

- Vanilla ids use `generated/vanillaAuxValues.js`.
- Vanilla ids with raw ids above 256 are shifted by `generated/auxOffset.js`.
- Custom block ids use `generated/customBlockAuxValues.js`.

Regenerate the custom table after adding/removing custom items or blocks in the
Dorios workspace:

```powershell
npm run generate:block-render-aux
```

The generator scans sibling projects with `BP` or `packs/BP` folders. If a world
uses a very different pack stack/order, the custom aux table may need to be
regenerated or the Block Render setting can be disabled from Block Settings.
