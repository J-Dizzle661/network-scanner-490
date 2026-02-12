IDS Desktop Application

Overview

This project is a desktop-based Intrusion Detection System (IDS) app
built using an Electron.js frontend and a Python backend service. Local
network traffic of the host machine is monitored and analyzed with 
anomaly-based detection by leveraging machine learning. The application
emphasizes ease of use, data visualization, and a custom retraining 
pipeline enabling users to tailor the default model to their network's 
unique characteristics for enhanced accuracy. The frontend and backend
communicate locally via websockets for realtime, continuous communication.

Architecture

At runtime, the application consists of three primary components: (1) the 
Electron Renderer, which renders the UI and visualizes incoming data and
alerts, (2) the Electron Main Process, which manages the core application
lifecycle and spawns the Python backend process, and (3) the Python Backend
Service, which performs network monitoring, machine learning analysis, and
initializes websocket communication.

The python backend component is deployed as a compiled binary and spawned by
the Electron main process in order to facilitate reproducibilty, consistent
deployment across varied environments, and self-contained dependencies. With 
this design, the user system does not require a python interpreter to execute
uncompiled python scripts. Additionally, a particular version of python is
needed to run the project, so enforcing it by compiling ourselves is the best
approach. During development, the backend python service is launched manually
as opposed to automatically by the Electron app, which would require
rebuilding a new binary every development iteration. Instructions for running
the project can be found at backend/README.txt

Communication between the Electron frontend and backend python services is
implemented via websockets. The backend initializes a websocket server and
defines socket events mapped to services, to which the frontend emits
requests on user input. A detailed component-level diagram representing the
flow of execution can be found at docs/sequence-diagram-1-11-26.png.

The project structure represents these architectural design choices. The
electron frontend is separated from the python backend which is built during
deployment and placed in a resources folder accessible by the electron
app main process. A detailed project structure diagram can be found at
docs/project-structure-diagram-1-11-26.png.

Build Lifecycle

To create a built executable of the app, the python backend must first be 
packaged using pyinstaller and copied into electron's expected resources 
folder. During the build, electron forge stores that binary in the bundled 
app's resources location, and the electron main process accesses that
location (if in production) to spawn the python executable. Below are more
detailed steps.

(1) Create python backend executable with pyinstaller
    - Verify pyinstaller is installed in your local venv with the following
     commands:
        cd backend/                     # navigate to backend
        source venv/bin/activate        # activate the venv
        pip install -r requirements.txt # ensures venv has all dependencies 
                                        # listed in requirements.txt (now 
                                        # includes pyinstaller)
    - Run pyinstaller using the spec file. Run the following command from
    backend/ with the venv activate:
        pyinstaller backend_build_mac.spec
(2) Copy the python build into the expected electron resources folder
    - Pyinstaller outputs the built executable in backend/dist/. Copy the  
    file in this folder into electron/resources/backend/.
(3) Optional: verify electron can spawn the backend process
    - Have the electron main process use the relative path electron/resources/
    backend to spawn the backend, and run electron through the terminal (as in
    development) to verify the backend process can be spawned.
(4) Build the electron app
    - Use the following command from electron/ to run the electron forge
    build script:
        npm run make
    - Electron forge places the final build artifacts in electron/out/make/...

Note: gitignore is configured to ignore directories containing build files and
artifacts generate by pyinstaller and electron forge to keep the repo clean
(except for electron/resources/backend/ whose folder structure is preserved
but contents ignored).
