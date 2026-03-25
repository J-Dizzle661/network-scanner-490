import subprocess
import json
import sys
import psutil

def get_network_interfaces():
    """
    Returns a list of active network interfaces.
    On Windows: uses PowerShell to get Name + NPF GUID (required by NFStream/NPcap).
    On macOS/Linux: uses psutil to enumerate active interfaces (e.g., 'en0').
    Returns a list of dicts: [{'name': 'Wi-Fi', 'guid': '\\Device\\NPF_{...}'}, ...]
    On macOS/Linux: [{'name': 'en0', 'guid': 'en0'}, ...]
    The 'guid' field holds the identifier that NFStream expects as its source.
    """
    if sys.platform == "win32":
        return _get_interfaces_windows()
    else:
        return _get_interfaces_unix()

def _get_interfaces_windows():
    """Uses PowerShell Get-NetAdapter to list active adapters with their NPF GUIDs."""
    try:
        cmd = "Get-NetAdapter | Where-Object { $_.Status -eq 'Up' } | Select-Object Name, InterfaceGuid | ConvertTo-Json"
        result = subprocess.run(["powershell", "-Command", cmd], capture_output=True, text=True)

        if not result.stdout.strip():
            return []

        adapters = json.loads(result.stdout)

        # If there is only one adapter, PowerShell returns a dict, not a list. Fix that.
        if isinstance(adapters, dict):
            adapters = [adapters]

        return [
            {
                "name": adapter['Name'],                              # e.g., "Wi-Fi"
                "guid": f"\\Device\\NPF_{adapter['InterfaceGuid']}"  # e.g., "\Device\NPF_{...}"
            }
            for adapter in adapters
        ]

    except Exception as e:
        print(f"Error detecting interfaces (Windows): {e}")
        return []

def _get_interfaces_unix():
    """Uses psutil to list active, non-loopback interfaces on macOS/Linux."""
    try:
        stats = psutil.net_if_stats()
        return [
            {
                "name": iface,   # e.g., "en0"
                "guid": iface    # NFStream accepts interface names directly on macOS/Linux
            }
            for iface, stat in stats.items()
            if stat.isup and not iface.startswith("lo")
        ]
    except Exception as e:
        print(f"Error detecting interfaces (macOS/Linux): {e}")
        return []