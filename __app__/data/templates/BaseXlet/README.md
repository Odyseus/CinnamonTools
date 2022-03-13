## *Variables* to replace on generation time

Use of **$** to define `$$VARIABLE_NAME$$` so it can be used in strings and expressions alike.

- `$$XLET_NAME$$`: A name for the xlet.
- `$$XLET_DESCRIPTION$$`: A description for the xlet.
- `$$XLET_TYPE$$`: Xlet type in lower case.
- `$$XLET_TYPE_TITLE_CASE$$`: Xlet type in title case.

## metadata.json

Parse metadata.json file and add properties to it depending on xlet type.

- **max-instances**: for applets only.

## settings-schema.json

Generate extension without this file.
