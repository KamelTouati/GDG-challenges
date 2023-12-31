# Panic Recovery Web Server

This is a basic web server that demonstrates panic recovery. It logs errors and stack traces and provides different error handling behaviors based on the environment setting.

## Features

- Logs the error and stack trace to the console.
- Renders an error message in production mode.
- Renders the stack trace with source file links in development mode.
- Allows you to simulate panics to test the recovery mechanism.

## Prerequisites

- Python 3.x

## Getting Started

1. Clone or download this repository to your local machine.

2. Open a terminal and navigate to the project directory.

3. Set the environment variable `ENVIRONMENT` to either "production" or "development" before running the server. For example, to run in development mode:

   ```sh
   export ENVIRONMENT=development
   ```

   To run in production mode, set `ENVIRONMENT` to "production".

4. Run the server using the following command:

   ```sh
   python server.py
   ```

5. Access the server in your web browser at `http://localhost:8000` (by default). Replace the port number if needed.

## Usage

- After starting the server, access it in your web browser.

- If the environment is set to "production," you will see an error message when a panic occurs.

- If the environment is set to "development," you will see a detailed stack trace with links to source files.

- You can simulate a panic by accessing a route that raises an exception, as shown in the code.