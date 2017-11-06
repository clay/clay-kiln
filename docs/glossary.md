# Glossary

## `_description`

Every component can (and should) have a root-level `_description` in its schema, which contains markdown-formatted text describing the purpose and use of the component. Descriptions look like this:

```yaml
_description: |
  A short description of the component.

  A more detailed overview of functionality and business use cases, intended
  for an audience of writers, editors, and other CMS end users. It may include:

  * plain english descriptions of any non-obvious functionality
  * suggested workflows and advanced features
  * non-obvious interactions with other components
```

Descriptions will appear in Kiln when users click/tap the info icon in components' mini-selector.
