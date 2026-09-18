# Infrastructure

The MVP can run with only the FastAPI container. Do not add a database until saved trips/source persistence need it. The intended production progression is Postgres + object storage + scheduled workers + push notifications, with source provenance retained as first-class data.
