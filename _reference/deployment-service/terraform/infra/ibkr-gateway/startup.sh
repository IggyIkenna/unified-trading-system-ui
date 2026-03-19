#!/bin/bash
set -euo pipefail
LOG="/var/log/ibkr-gateway-startup.log"
exec >> "$LOG" 2>&1

echo "[$(date -u)] Starting IB Gateway setup..."

# Install Java 17 (IB Gateway dependency)
apt-get update -q
apt-get install -y openjdk-17-jre-headless xvfb wget unzip

# Install IB Gateway stable
IB_GW_URL="https://download2.interactivebrokers.com/installers/ibgateway/stable-standalone/ibgateway-stable-standalone-linux-x64.sh"
wget -q -O /tmp/ibgateway-installer.sh "$IB_GW_URL"
chmod +x /tmp/ibgateway-installer.sh
/tmp/ibgateway-installer.sh -q -dir /opt/ibgateway

# Create IB Gateway config directory
mkdir -p /root/IBJts/conf

# Write ibgateway.conf — enables API, sets ports, disables popups
cat > /root/IBJts/conf/ibgateway.conf << 'CONF'
TradingMode=live
IbLoginId=
IbPassword=
TwsApiPort=4002
ReadOnlyLogin=false
AcceptNonBrokerageAccountWarning=true
AutoRestartTime=11:59 PM
MinimizeTrayIconWhenWindowClosed=false
ShowAllTrades=false
ExistingSessionDetectedAction=primaryYes
OverrideTwsApiPort=4002
ReadOnlyApi=false
CONF

# Create Xvfb service (for first-time GUI login)
cat > /etc/systemd/system/xvfb.service << 'SVC'
[Unit]
Description=Xvfb virtual display server
After=network.target

[Service]
ExecStart=/usr/bin/Xvfb :1 -screen 0 1024x768x24
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
SVC

# Create IB Gateway service (starts after first-time login via Xvfb)
cat > /etc/systemd/system/ibgateway.service << 'SVC'
[Unit]
Description=Interactive Brokers IB Gateway
After=network.target xvfb.service
Wants=xvfb.service

[Service]
Type=simple
User=root
Environment=DISPLAY=:1
WorkingDirectory=/opt/ibgateway
ExecStart=/opt/ibgateway/ibgateway
Restart=on-failure
RestartSec=30
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SVC

# Enable services (ibgateway requires first-time login before starting)
systemctl daemon-reload
systemctl enable xvfb
systemctl start xvfb

# Create healthcheck script
cat > /usr/local/bin/ibgateway-healthcheck.sh << 'HEALTH'
#!/bin/bash
nc -z 127.0.0.1 4002 2>/dev/null
if [ $? -eq 0 ]; then
    echo "OK: IB Gateway port 4002 is listening"
    exit 0
else
    echo "FAIL: IB Gateway port 4002 not reachable"
    exit 1
fi
HEALTH
chmod +x /usr/local/bin/ibgateway-healthcheck.sh

# Add healthcheck cron (every 5 minutes, logs to Cloud Monitoring via stackdriver)
echo "*/5 * * * * root /usr/local/bin/ibgateway-healthcheck.sh >> /var/log/ibgw-health.log 2>&1" > /etc/cron.d/ibgateway-health

echo "[$(date -u)] IB Gateway setup complete. NEXT STEP: SSH with X11 forwarding for first-time login."
echo "[$(date -u)] Command: gcloud compute ssh ibkr-gateway-vm --zone=us-central1-a -- -X"
