# -----------------------------------------------------------------------------
# Defines logic to capture live network traffic with NFStream.
# -----------------------------------------------------------------------------

from nfstream import NFStreamer

WINDOWS_DEFAULT_INTERFACE = r"\Device\NPF{45893BC7-7ABC-4309-A8DA-A2003ED2CC11}"


def capture_live(interface="eth0"):

    if interface == "eth0":
        interface = WINDOWS_DEFAULT_INTERFACE
    """
    Captures live network traffic on the specified interface using NFStreamer.
    Yields flow objects as they are generated.
    """

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
