// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { packageVersion } from "./version.js";
import * as fs from "fs";
import * as path from "path";
import AdmZip from "adm-zip";

export const apiVersion = "7.2-preview.1";
export const batchApiVersion = "5.0";
export const userAgent = `AzureDevOps.MCP/${packageVersion} (local)`


// Helper function to convert stream to buffer
export async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

// Helper function to create unique filename and paths
export function createLogPaths(buildId: number): { filename: string; folderName: string; zipFilePath: string; extractDir: string } {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `build-${buildId}-logs-${timestamp}.zip`;
  const folderName = `build-${buildId}-logs-${timestamp}`;
  
  // Use workspace-relative path instead of Downloads directory
  const workspaceDir = process.cwd();
  const logsDir = path.join(workspaceDir, '.custompipelinelogs');
  const zipFilePath = path.join(logsDir, filename);
  const extractDir = path.join(logsDir, folderName);

  return { filename, folderName, zipFilePath, extractDir };
}

// Helper function to ensure custom pipeline logs directory exists
export function ensureDownloadsDirectory(): string {
  const workspaceDir = process.cwd();
  const logsDir = path.join(workspaceDir, '.custompipelinelogs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  return logsDir;
}

// Recursive function to extract nested ZIP files
export function extractNestedZips(dir: string): void {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Recursively process subdirectories
      extractNestedZips(filePath);
    } else if (file.toLowerCase().endsWith('.zip')) {
      try {
        // Extract nested ZIP file
        const nestedZip = new AdmZip(filePath);
        const nestedExtractDir = path.join(dir, file.replace(/\.zip$/i, ''));

        // Create directory for nested extraction
        if (!fs.existsSync(nestedExtractDir)) {
          fs.mkdirSync(nestedExtractDir, { recursive: true });
        }

        // Extract nested ZIP
        nestedZip.extractAllTo(nestedExtractDir, true);

        // Remove the original ZIP file after extraction
        fs.unlinkSync(filePath);

        // Recursively check the newly extracted directory for more ZIPs
        extractNestedZips(nestedExtractDir);
      } catch (error) {
        console.warn(`Failed to extract nested ZIP file ${filePath}:`, error);
      }
    }
  }
}

// Helper function to clean up ZIP file
export function cleanupZipFile(zipFilePath: string): void {
  try {
    fs.unlinkSync(zipFilePath);
  } catch (error) {
    console.warn('Could not remove original ZIP file:', error);
  }
}