# GPUstats

## Deployment

To deploy the Meteor app, run the following:
```
docker compose build
docker compose down  # if there is an existing instance
docker compose up -d
```

To connect a GPU client to the server, run the following and follow the instructions:
```
bash -c "$(curl -fsSL https://raw.githubusercontent.com/dalab/da-gpustats-client/main/install.sh)"
```
