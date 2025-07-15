# Custom Pipeline Logs Directory

This directory contains extracted Azure DevOps build logs downloaded using the `get_logs_zip` MCP tool.

## Structure

Each build's logs are extracted into a separate subdirectory named:
- `build-{buildId}-logs-{timestamp}/`

## Features

- **Nested ZIP Extraction**: Automatically extracts any nested ZIP files found within the logs
- **Analysis Guide**: Each extraction includes an `ANALYSIS_PROMPT.txt` file with guidance for investigating build failures
- **Workspace Integration**: Logs are stored within your VS Code workspace for easy access and searching

## Usage

1. Use the `get_logs_zip` MCP tool to download and extract build logs
2. Logs will appear in this directory structure
3. Use VS Code's search functionality (Ctrl+Shift+F) to search across all log files
4. Refer to the `ANALYSIS_PROMPT.txt` file in each build folder for analysis guidance

## Note

This directory is automatically added to `.gitignore` to prevent build logs from being committed to the repository.
