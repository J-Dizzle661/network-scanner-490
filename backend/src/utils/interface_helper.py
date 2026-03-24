import subprocess
import json

def get_network_interfaces():
    """
    Uses PowerShell to find all network adapters and their GUIDs.
    Returns a list of dicts: [{'name': 'Wi-Fi', 'guid': '\\Device\\NPF_{...}'}, ...]
    """
    try:
        # PowerShell command to get Name and GUID in JSON format
        cmd = "Get-NetAdapter | Where-Object { $_.Status -eq 'Up' } | Select-Object Name, InterfaceGuid | ConvertTo-Json"
        
        # Run the command
        result = subprocess.run(["powershell", "-Command", cmd], capture_output=True, text=True)
        
        if not result.stdout.strip():
            return []

        adapters = json.loads(result.stdout)
        
        # If there is only one adapter, PowerShell returns a dict, not a list. Fix that.
        if isinstance(adapters, dict):
            adapters = [adapters]

        formatted_list = []
        for adapter in adapters:
            # Format: \Device\NPF_{GUID} (This is what NFStream needs)
            npf_guid = f"\\Device\\NPF_{adapter['InterfaceGuid']}"
            
            formatted_list.append({
                "name": adapter['Name'],   # e.g., "Wi-Fi"
                "guid": npf_guid           # e.g., "\Device\NPF_{...}"
            })
            
        return formatted_list

    except Exception as e:
        print(f"Error detecting interfaces: {e}")
        return []