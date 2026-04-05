Production ML artifacts live here.

Structure:
- `crop/`: crop recommendation model bundle and metadata
- `price/`: per-pair price forecast bundles and metadata
- `disease/`: disease classifier weights, labels, and metadata

Repository policy:
- generated models are not committed by default
- training pipelines recreate them into this directory
- services read from this directory first
