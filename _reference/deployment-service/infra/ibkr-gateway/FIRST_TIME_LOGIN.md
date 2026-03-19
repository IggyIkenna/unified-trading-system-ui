# IB Gateway First-Time Login

Run ONCE after VM is provisioned. After this, Gateway runs headlessly forever.

## Step 1: SSH with X11 forwarding

```bash
gcloud compute ssh ibkr-gateway-vm --zone=us-central1-a -- -X
```

## Step 2: Start IB Gateway GUI

```bash
export DISPLAY=:1
/opt/ibgateway/ibgateway &
```

## Step 3: Log in

- Enter IBKR username and password
- Approve IB Key 2FA on your mobile app

## Step 4: Configure API settings

In the IB Gateway GUI:

- Configure > Settings > API > Enable ActiveX and Socket Clients: ON
- Port: 4002
- Allow connections from localhost only: ON
- Read-only API: OFF
- Disable all confirmation popups

## Step 5: Enable auto-start

```bash
sudo systemctl enable ibgateway
sudo systemctl start ibgateway
```

## Step 6: Verify

```bash
/usr/local/bin/ibgateway-healthcheck.sh
# Should output: OK: IB Gateway port 4002 is listening
```

Close the X11 window. IB Gateway now runs headlessly via systemd.

## Weekly re-auth

IBKR auto-restarts Gateway nightly at 11:59 PM. IB Key handles re-auth automatically.
You may receive a push notification — approve it on your phone (~30 seconds).
