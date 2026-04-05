Managed ML datasets live here.

Structure:
- `raw/`: downloaded upstream source snapshots
- `processed/`: cleaned and normalized datasets consumed by training

Repository policy:
- do not commit synthetic bootstrap datasets
- fetch or ingest real upstream data into `raw/`
- persist cleaned training-ready tables in `processed/`
