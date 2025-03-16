# REDscript GitHub Action

A REDscript GitHub Action that can check for compilation and formatting errors
with support for annotating errors in the GitHub UI.

Example usage:

```yaml
on:
  push:

jobs:
  lint:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: jac3km4/redscript-action@v0.1.3
        with:
          source: src
          lint: true
          # You can also check for formatting errors
          # check-format: true
```
