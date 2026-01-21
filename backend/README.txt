Required dependencies for executing this python backend listed in requirements.txt.

For local dev env setup, create a new venv with python 3.11.11 interpreter and install all 
packages in requirements.txt. (Note: the network flow capture library nfstream requires
that python 3.11 be used)

-----------------------------------------------------------------------------------------------

STEPS FOR VENV CREATION

1. Navigate to python backend root ids-app/backend/ and create the venv with the following
command:
python3.11 -m venv venv

If python 3.11 is not installed (verify with python3.11 --version) download from python website
then run command.

2. Activate the venv with one of the following command (Mac or Windows):
source venv/bin/activate
.\venv\Scripts\activate

3. Install dependencies from requirements.txt with the following command:
pip install -r requirements.txt

4. Verify dependencies match; output of the following command should match contents of 
requirements.txt:
pip freeze

-----------------------------------------------------------------------------------------------

RUNNING THE BACKEND LOCALLY

The deployed electron app will use a bundled compiled binary of this python backend built with 
Pyinstaller which will act as a background service. This built binary will be located at 
/electron/resources and will be spawned as a process from the electron app entry point file
main.js.

For local dev however, the back end python service can be executed manually from the venv for 
easier prototyping (rebuilding a binary every iteration of dev would be inefficient). To execute 
the backend, follow these steps:

1. Activate the venv with one of the following command (Mac or Windows):
source venv/bin/activate
.\venv\Scripts\activate

2. Execute the python project with:
python app.py

The backend should now be running, and corresponding output should display in the terminal (The
websocket server should be initialized and websocket events should be open for the electron client
to use).

3. To deactivate the venv use the command:
deactivate
