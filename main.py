import subprocess
import os
import sys

# Define the path to the virtual environment
venv_path = 'venv'

# Create the virtual environment
def create_venv():
    subprocess.run([sys.executable, '-m', 'venv', venv_path], check=True)

# Install packages in the virtual environment
def install_packages(packages):
    pip_executable = os.path.join(venv_path, 'Scripts', 'pip') if sys.platform == 'win32' else os.path.join(venv_path, 'bin', 'pip')
    subprocess.run([pip_executable, 'install'] + packages, check=True)

# Run a script using the virtual environment
def run_script(script_name):
    python_executable = os.path.join(venv_path, 'Scripts', 'python') if sys.platform == 'win32' else os.path.join(venv_path, 'bin', 'python')
    subprocess.run([python_executable, script_name], check=True)

# Main workflow
if __name__ == '_main_':
    create_venv()
    install_packages(['requests', 'beautifulsoup4'])
    run_script('telegram_job_scraper.py')