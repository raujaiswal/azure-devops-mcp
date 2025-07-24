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
    "Analyzes build logs with comprehensive failure analysis, automatically downloading logs for thorough analysis.",
    { 
      project: z.string().describe("The Azure DevOps project name or ID"),
      buildId: z.string().describe("The ID of the failed build to analyze")
    },
    ({ project, buildId }) => {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: String.raw`
# Task: Build Failure Analysis for Build ${buildId}

You are analyzing a failed build in project '${project}' to identify root causes and provide actionable solutions.

## Analysis Method: 🔽 Full Log Download (Comprehensive Analysis)

I'll download all build logs to your workspace (.custompipelinelogs folder) for comprehensive analysis.

**Step 1: Download Build Logs**
Use the '${BUILD_TOOLS.get_logs_zip}' tool to download and extract all logs for build ${buildId} in project '${project}'.

**Step 2: Get Build Status and Overview**
Use the '${BUILD_TOOLS.get_status}' tool to get the current build status and details for build ${buildId} in project '${project}'.

**Step 3: Get Log Overview**  
Use the '${BUILD_TOOLS.get_log}' tool to get the log overview and identify failed steps for build ${buildId} in project '${project}'.

## Error Pattern Detection

I'll systematically search for these critical failure indicators:

🚨 **Critical Errors:**
- **'##[error]'** - Azure Pipelines task failures
- **'FAILED'** or **'ERROR'** - General failure messages
- **'exit code [1-9]'** - Non-zero process exit codes

🔍 **Common Issues:**
- **'not found'** - Missing files, commands, or dependencies
- **'Exception'** - Application runtime exceptions
- **'timeout'** - Process or network timeouts
- **'permission denied'** - Access/authorization issues

## Analysis Report Format

I'll provide a comprehensive analysis in this format:

### 🔍 **BUILD FAILURE ANALYSIS**

#### **ISSUE #1: [Clear Issue Title]**
**🔴 Root Cause Analysis:**
- **Error Message:** \`[Exact error text with timestamps]\`
- **Log Evidence:** 
  \`\`\`
  [Relevant log excerpts with line numbers]
  \`\`\`
- **Technical Cause:** [Detailed explanation of why this occurred]

**💡 Solution Options:**
1. **⚡ Quick Fix:** [Immediate workaround to unblock]
2. **🛠️ Recommended Fix:** [Proper long-term solution]  
3. **🔄 Alternative:** [Different approach if applicable]

#### **ISSUE #2: [Clear Issue Title]**
*[Same detailed format for each issue found]*

### 📊 **EXECUTIVE SUMMARY**
- **🔢 Total Issues Found:** [Number]
- **⚠️ Severity Ranking:** [Issues ordered by impact/difficulty]
- **🎯 Next Action:** [Specific recommendation on what to fix first]
- **⏱️ Estimated Fix Time:** [Time estimate for primary fixes]

### 🧹 **LOG CLEANUP**

After completing the analysis, I'll ask:

**"Analysis complete! Would you like me to clean up the downloaded logs?"**
- **Type 'yes'** to delete the .custompipelinelogs directory
- **Type 'no'** to keep the logs for further investigation

This helps keep your workspace clean while giving you the option to retain logs for deeper analysis.`,
            },
          },
        ],
      };
    }
  );

}

export { configurePrompts };