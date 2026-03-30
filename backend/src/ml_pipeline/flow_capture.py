# -----------------------------------------------------------------------------
# Defines logic to capture live network traffic with NFStream.
# -----------------------------------------------------------------------------

import sys
from nfstream import NFStreamer
from src.utils.interface_helper import get_network_interfaces

def capture_live(interface=None):
    """
    Captures live network traffic on the specified interface using NFStreamer.
    If no interface is provided, auto-detects the first available one.
    Yields flow objects as they are generated.

    Args: 
        interface: Network interface identifier or None for auto-detection.
                   On Windows: NPF GUID (e.g., '\\Device\\NPF_{...}') or bare '{GUID}'.
                   On macOS/Linux: interface name (e.g., 'en0').

    Yields:
        NFStream flow objects with statistical analysis enabled
    """
    
    # Auto-detect if not provided or empty
    if not interface:
        interfaces = get_network_interfaces()
        print(f"Auto-detecting interface. Found {len(interfaces)} interface(s)")
        if interfaces:
            interface = interfaces[0]['guid']
            print(f"Auto-detected: {interfaces[0]['name']} ({interface})")
        else:
            raise ValueError(
                "No valid network interfaces detected. "
                "Ensure at least one network adapter is connected and active."
            )
    else:
        print(f"Interface provided from client: '{interface}'")
        # On Windows, a bare GUID like '{...}' needs the NPF prefix.
        # On macOS/Linux, names like 'en0' are passed through as-is.
        if sys.platform == "win32" and interface.startswith('{'):
            interface = f"\\Device\\NPF_{interface}"
            print(f"Formatted Windows GUID to: {interface}")
        print(f"Using interface: {interface}")

    print(f"Capturing live traffic on '{interface}'... Press Ctrl+C to stop.")
    
    # Initialize nfstream to start reading live network traffic and generating flows
    streamer = NFStreamer(
        source=interface,
        statistical_analysis=True,   # enable extended feature capture
        idle_timeout=5,              # expire inactive flows after 15s
        active_timeout=15,           # split long flows after 30s
        accounting_mode=1            # mode=1 best replicates CICFlowMeter data collection methodology
    )

    # Yield each flow object as it is produced by NFStreamer. Downstream
    # code will map features and run inference per-flow rather than
    # operating on a batch DataFrame.
    for flow in streamer:
        yield flow
