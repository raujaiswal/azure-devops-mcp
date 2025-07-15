// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
  McpServer
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CORE_TOOLS } from "./tools/core.js";
import { WORKITEM_TOOLS } from "./tools/workitems.js";
import { BUILD_TOOLS } from "./tools/builds.js";

function configurePrompts(server: McpServer) {   

  server.prompt(
    "listProjects",
    "Lists all projects in the Azure DevOps organization.",
    {},
    () => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: String.raw`
# Task
Use the '${CORE_TOOLS.list_projects}' tool to retrieve all projects in the current Azure DevOps organization.
Present the results in a table with the following columns: Project ID, Name, and Description.`,
          },
        },
      ],
    })
  );

  server.prompt(
    "listTeams",
    "Retrieves all teams for a given Azure DevOps project.",
    { project: z.string() },
    ({ project }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: String.raw`
  # Task
  Use the '${CORE_TOOLS.list_project_teams}' tool to retrieve all teams for the project '${project}'.
  Present the results in a table with the following columns: Team ID, and Name`,
          },
        },
      ],
    })
  );

  server.prompt(
    "getWorkItem",
    "Retrieves details for a specific Azure DevOps work item by ID.",
    { id: z.string().describe("The ID of the work item to retrieve."),
      project: z.string().describe("The name or ID of the Azure DevOps project."),
    },
    ({ id, project }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: String.raw`
  # Task
  Use the '${WORKITEM_TOOLS.get_work_item}' tool to retrieve details for the work item with ID '${id}' in project '${project}'.
  Present the following fields: ID, Title, State, Assigned To, Work Item Type, Description or Repro Steps, and Created Date.`,
          },
        },
      ],
    })
  );

  // ============================================================================
  // LOG ANALYSIS PROXY PROMPTS
  // ============================================================================

  server.prompt(
    "analyzeBuildFailure",
    "Downloads and analyzes build logs with Copilot-optimized insights to help diagnose build failures.",
    { 
      project: z.string().describe("The Azure DevOps project name or ID"),
      buildId: z.string().describe("The ID of the failed build to analyze")
    },
    ({ project, buildId }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: String.raw`
# Task: Analyze Build Failure with Logging Proxy

You are helping diagnose a build failure using the Azure DevOps MCP logging proxy system.

## Step 1: Download and Extract Logs
Use the '${BUILD_TOOLS.get_logs_zip}' tool to download build logs for:
- Project: '${project}'
- Build ID: ${buildId}

This will automatically:
✅ Extract logs to workspace/.custompipelinelogs directory
✅ Create COPILOT_ANALYSIS.md with AI-ready insights
✅ Set up VS Code for optimal log viewing
✅ Process logs through the lightweight analysis proxy

## Step 2: Review Analysis Results
After extraction, the proxy will have:
- Categorized errors and warnings
- Identified critical failure points
- Generated actionable recommendations
- Created search hints for VS Code

## Step 3: Provide Diagnosis
Based on the proxy analysis, provide:
1. **Root Cause**: What caused the build to fail?
2. **Impact**: Which components/steps were affected?
3. **Resolution**: Step-by-step fix recommendations
4. **Prevention**: How to avoid this issue in the future

The logging proxy has pre-processed the raw logs to make them more digestible for analysis.`,
          },
        },
      ],
    })
  );

  server.prompt(
    "compareBuildLogs",
    "Analyzes and compares logs from multiple builds to identify patterns and differences.",
    {
      project: z.string().describe("The Azure DevOps project name or ID"),
      successfulBuildId: z.string().describe("ID of a successful build for comparison"),
      failedBuildId: z.string().describe("ID of the failed build to analyze")
    },
    ({ project, successfulBuildId, failedBuildId }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: String.raw`
# Task: Compare Build Logs via Proxy Analysis

You're comparing build logs to identify what changed between a successful and failed build.

## Step 1: Download Both Build Logs
1. Use '${BUILD_TOOLS.get_logs_zip}' for successful build (ID: ${successfulBuildId})
2. Use '${BUILD_TOOLS.get_logs_zip}' for failed build (ID: ${failedBuildId})

Both will be processed through the logging proxy for structured analysis.

## Step 2: Analyze Each Build
The logs downloaded with '${BUILD_TOOLS.get_logs_zip}' include built-in analysis to get:
- Error categorization
- Warning patterns  
- Failed step identification
- Performance metrics

## Step 3: Compare and Report
Provide a comparison report covering:

### 🔍 **Differences Found**
- New errors in failed build
- Missing steps or different execution paths
- Changed dependencies or versions
- Environment differences

### 📊 **Analysis Summary**
- Error category changes
- Warning escalations
- Performance regressions

### 💡 **Recommendations**
- Specific fixes based on differences
- Code/configuration changes needed
- Process improvements

The proxy analysis will help you focus on the most relevant differences rather than parsing raw logs manually.`,
          },
        },
      ],
    })
  );

  server.prompt(
    "buildTrendAnalysis",
    "Analyzes build log trends across multiple recent builds to identify recurring issues.",
    {
      project: z.string().describe("The Azure DevOps project name or ID"),
      definitionId: z.string().describe("Build definition ID to analyze trends for"),
      analyzeCount: z.string().optional().describe("Number of recent builds to analyze (default: 5)")
    },
    ({ project, definitionId, analyzeCount }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: String.raw`
# Task: Build Trend Analysis with Logging Proxy

Analyze trends across recent builds to identify patterns and recurring issues.

## Step 1: Get Recent Builds  
Use '${BUILD_TOOLS.get_builds}' to get the last ${analyzeCount} builds for:
- Project: '${project}'
- Definition ID: ${definitionId}

## Step 2: Download Logs for Each Build
For each build found, use '${BUILD_TOOLS.get_logs_zip}' to download and process logs through the proxy.

## Step 3: Analyze Trends
For each build, the logs downloaded with '${BUILD_TOOLS.get_logs_zip}' provide structured insights, then provide:

### 📈 **Trend Analysis**
- Error frequency over time
- Most common failure categories
- Warning escalations
- Performance degradation patterns

### 🎯 **Recurring Issues**
- Errors that appear in multiple builds
- Flaky test patterns
- Dependency issues
- Infrastructure problems

### 🔧 **Actionable Insights**
- Issues to prioritize (high frequency/impact)
- Build process improvements
- Preventive measures for identified patterns

### 📊 **Summary Dashboard**
- Build success rate trend
- Top error categories
- Most problematic steps/tasks

The logging proxy will provide consistent categorization across all builds for accurate trend analysis.`,
          },
        },
      ],
    })
  );

}

export { configurePrompts };
