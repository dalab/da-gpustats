# GPUstats

## Deployment

To deploy the Meteor app, run the following:
```
docker compose build
docker compose down  # if there is an existing instance
docker compose up -d
```

### Adding a new machine (client)

To connect a GPU client to the server, run the following and follow the instructions (see https://github.com/dalab/da-gpustats-client/tree/main for details):
```
bash -c "$(curl -fsSL https://raw.githubusercontent.com/dalab/da-gpustats-client/main/install.sh)"
```
You will be asked to enter certain properties, such as the machine name and mongoDB host address.
Most of these are correct by default, but the mongoDB user and password needs to be entered manually.
The easiest way to get these is from another machine where the gpustats-client has already been set up.
SSH into such a machine and run `cat /opt/gpustats-client/.gpustatrc` to print the config used on that machine.

#### Troubleshooting

Check the status of the installed service via:
```bash
# gpustats service
sudo systemctl status gpustats.service
# auto-update service
sudo systemctl status gpustats-update.timer
```

If the services are not running, you can (re-)start them with:
```bash
sudo systemctl restart gpustats.service
sudo systemctl restart gpustats-update.timer
```

To check the (crash-)logs, run:
```bash
sudo journalctl -u gpustats.service
sudo journalctl -u gpustats-update.timer
```


### Removing an old machine from the DB

Since logs are automatically deleted after 30 days, if any machine is offline for more than 30 days, its entry will automatically disappear from the interface.

Alternatively, it's possible to manually delete their logs to remove them from the interface immediately.
To this end, connect to the mongoDB running in the `mongo` docker container on `cake`:
```bash
docker exec -it mongo bash
mongo -u <user> -p <password>
```
The username and password is the same as the one used by the gpustat clients and can be found in `/opt/gpustats-client/.gpustatrc` on any of them.

Inside the mongoDB CLI, activate the gpustat DB by running `use gpustat`.
Check the number of logs you're about to delete:
```
db.machine_logs.find({machineId: "<machine_id>"}).size()
```
And remove the targeted logs by running:
```
db.machine_logs.remove({machineId: "<machine_id>"})
```


