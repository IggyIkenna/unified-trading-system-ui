#!/bin/bash
# SSH tunnel from trading service VM to IB Gateway
# Run this on the trading service VM (NOT on the IB Gateway VM)
# Usage: ./ssh-tunnel.sh <ibkr-gateway-internal-ip>

IBKR_VM_IP="${1:-$(terraform -chdir="$(dirname "$0")" output -raw ibkr_gateway_internal_ip 2>/dev/null)}"

if [ -z "$IBKR_VM_IP" ]; then
    echo "Usage: $0 <ibkr-gateway-internal-ip>"
    echo "Or run from infra/ibkr-gateway/ with terraform output available"
    exit 1
fi

echo "Creating SSH tunnel: localhost:4002 -> ${IBKR_VM_IP}:4002"
echo "Keep this running while trading system is active."
echo "Press Ctrl+C to stop."

ssh -N -L 4002:localhost:4002 \
    -o "ServerAliveInterval=60" \
    -o "ServerAliveCountMax=3" \
    -o "ExitOnForwardFailure=yes" \
    "${IBKR_VM_IP}"
