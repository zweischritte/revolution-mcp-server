# Claude Flow / Hive Mind Integration Specification for MCP Servers

**Version:** 1.0.0
**Date:** 2025-10-02
**Author:** System Architecture Designer
**Status:** Comprehensive Analysis Complete

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Database Schemas](#database-schemas)
4. [Memory System Architecture](#memory-system-architecture)
5. [Hive Mind Coordination](#hive-mind-coordination)
6. [Neural Network Integration](#neural-network-integration)
7. [Performance Metrics System](#performance-metrics-system)
8. [MCP Tool Specifications](#mcp-tool-specifications)
9. [Security Considerations](#security-considerations)
10. [Integration Examples](#integration-examples)
11. [Implementation Guide](#implementation-guide)

---

## 1. Executive Summary

This specification defines the complete architecture of the Claude Flow / Hive Mind ecosystem and provides a comprehensive blueprint for integrating external LLMs via Model Context Protocol (MCP) servers. The system combines:

- **SQLite-based persistent storage** for swarm coordination and memory
- **Hive Mind coordination** with queen-worker architecture
- **Neural network training artifacts** with SAFLA (Self-Aware Feedback Loop Algorithm)
- **Cross-session memory persistence** with namespace isolation
- **Real-time performance metrics** and health monitoring
- **Hooks-based lifecycle management** for automated coordination

### Key Statistics

- **Performance Improvement:** 2.8-4.4x speed increase with parallel execution
- **Memory Efficiency:** 60% compression with maintained recall
- **Processing Speed:** 172,000+ ops/sec with WASM optimization
- **Neural Accuracy:** Up to 94.8% pattern recognition (alienation synthesis model)
- **MCP Tools Required:** 20-25 new tools for full integration
- **Database Files:** 3 primary SQLite databases (hive.db, memory.db, .swarm/memory.db)

---

## 2. Architecture Overview

### 2.1 Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Claude Flow Ecosystem                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────────┐ │
│  │   Hive Mind │◄───┤    Memory    │◄───┤  Neural/SAFLA  │ │
│  │ Coordination│    │    System    │    │     Models     │ │
│  └─────────────┘    └──────────────┘    └────────────────┘ │
│         ▲                   ▲                     ▲          │
│         │                   │                     │          │
│         ▼                   ▼                     ▼          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            SQLite Database Layer                     │   │
│  │  ┌─────────┐  ┌───────────┐  ┌──────────────────┐  │   │
│  │  │ hive.db │  │ memory.db │  │ .swarm/memory.db │  │   │
│  │  └─────────┘  └───────────┘  └──────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ▲                                  │
│                           │                                  │
│                   ┌───────┴────────┐                        │
│                   │   MCP Server   │                        │
│                   │   Integration  │                        │
│                   └────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Directory Structure

```
.hive-mind/
├── hive.db              # Main coordination database (SQLite)
├── memory.db            # Hive memory storage (SQLite)
├── config.json          # System configuration
├── config/
│   ├── queens.json      # Queen coordinator types
│   └── workers.json     # Worker agent specializations
├── sessions/            # Session snapshots and auto-saves
│   ├── session-*.json   # Compressed session data
│   └── hive-mind-prompt-*.txt
└── README.md

.swarm/
├── memory.db            # Swarm coordination memory (SQLite)
├── memory.db-shm        # Shared memory file (WAL mode)
└── memory.db-wal        # Write-ahead log

.claude-flow/
└── metrics/
    ├── performance.json      # Overall performance stats
    ├── task-metrics.json     # Task execution metrics
    ├── agent-metrics.json    # Agent activity logs
    └── system-metrics.json   # System resource usage
```

### 2.3 Data Flow

```
┌─────────────┐
│  User/LLM   │
└──────┬──────┘
       │ (1) Task Request
       ▼
┌─────────────────┐
│  MCP Server     │
│  (Revolution)   │
└──────┬──────────┘
       │ (2) Query Memory/DB
       ▼
┌─────────────────────────────────────┐
│  Flow Nexus Adapter                 │
│  - Memory key retrieval             │
│  - SQLite query execution           │
│  - Session state management         │
└──────┬──────────────────────────────┘
       │ (3) Data Access
       ▼
┌─────────────────────────────────────┐
│  Storage Layer                      │
│  ┌───────────┐  ┌──────────────┐   │
│  │ SQLite DB │  │ JSON Metrics │   │
│  └───────────┘  └──────────────┘   │
└─────────────────────────────────────┘
       │ (4) Return Results
       ▼
┌─────────────┐
│  User/LLM   │
└─────────────┘
```

---

## 3. Database Schemas

### 3.1 SQLite Database Structure

**Note:** Direct SQLite schema inspection was not possible due to missing sqlite3 binary. The databases use SQLite 3 format with WAL (Write-Ahead Logging) mode enabled for concurrent access.

#### 3.1.1 Expected Schema for hive.db

Based on Hive Mind architecture analysis:

```sql
-- Swarm coordination table
CREATE TABLE IF NOT EXISTS swarms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    objective TEXT,
    status TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    queen_type TEXT,
    worker_count INTEGER,
    topology TEXT,
    max_workers INTEGER,
    consensus_algorithm TEXT
);

-- Agent registry
CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    swarm_id TEXT,
    type TEXT,
    name TEXT,
    status TEXT,
    capabilities TEXT, -- JSON array
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP,
    FOREIGN KEY (swarm_id) REFERENCES swarms(id)
);

-- Task tracking
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    swarm_id TEXT,
    description TEXT,
    assigned_agent_id TEXT,
    status TEXT,
    priority INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    result TEXT,
    FOREIGN KEY (swarm_id) REFERENCES swarms(id),
    FOREIGN KEY (assigned_agent_id) REFERENCES agents(id)
);

-- Consensus decisions
CREATE TABLE IF NOT EXISTS consensus (
    id TEXT PRIMARY KEY,
    swarm_id TEXT,
    proposal TEXT,
    votes TEXT, -- JSON object
    decision TEXT,
    consensus_reached BOOLEAN,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (swarm_id) REFERENCES swarms(id)
);

-- Session state
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    swarm_id TEXT,
    checkpoint_id TEXT,
    data TEXT, -- Compressed JSON
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    change_count INTEGER,
    FOREIGN KEY (swarm_id) REFERENCES swarms(id)
);
```

#### 3.1.2 Expected Schema for memory.db

```sql
-- Memory keys with namespacing
CREATE TABLE IF NOT EXISTS memory_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    namespace TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT, -- JSON content
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ttl INTEGER, -- Time to live in seconds
    expires_at TIMESTAMP,
    metadata TEXT, -- JSON metadata
    UNIQUE(namespace, key)
);

-- Memory access log
CREATE TABLE IF NOT EXISTS memory_access_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    namespace TEXT,
    key TEXT,
    operation TEXT, -- 'read', 'write', 'delete'
    agent_id TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cross-session persistence
CREATE TABLE IF NOT EXISTS session_memory (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    data TEXT, -- Compressed session state
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    restored_at TIMESTAMP
);
```

#### 3.1.3 Expected Schema for .swarm/memory.db

```sql
-- Swarm coordination memory
CREATE TABLE IF NOT EXISTS coordination_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    swarm_id TEXT,
    key TEXT NOT NULL,
    value TEXT, -- JSON or text content
    scope TEXT, -- 'global', 'swarm', 'agent'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT -- agent ID
);

-- Task coordination state
CREATE TABLE IF NOT EXISTS task_state (
    task_id TEXT PRIMARY KEY,
    swarm_id TEXT,
    description TEXT,
    status TEXT,
    assigned_agents TEXT, -- JSON array
    dependencies TEXT, -- JSON array
    results TEXT, -- JSON object
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agent communication log
CREATE TABLE IF NOT EXISTS agent_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_agent_id TEXT,
    to_agent_id TEXT,
    message_type TEXT,
    content TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_status BOOLEAN DEFAULT 0
);

-- Performance metrics
CREATE TABLE IF NOT EXISTS metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT, -- 'swarm', 'agent', 'task'
    entity_id TEXT,
    metric_name TEXT,
    metric_value REAL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 JSON-Based Metrics Files

#### 3.2.1 Performance Metrics (.claude-flow/metrics/performance.json)

```json
{
  "startTime": 1759364526581,
  "totalTasks": 1,
  "successfulTasks": 1,
  "failedTasks": 0,
  "totalAgents": 0,
  "activeAgents": 0,
  "neuralEvents": 0
}
```

#### 3.2.2 Task Metrics (.claude-flow/metrics/task-metrics.json)

```json
[
  {
    "id": "cmd-hooks-1759364404283",
    "type": "hooks",
    "success": true,
    "duration": 3009.679502,
    "timestamp": 1759364407293,
    "metadata": {}
  }
]
```

#### 3.2.3 System Metrics (.claude-flow/metrics/system-metrics.json)

```json
[
  {
    "timestamp": 1759364528744,
    "memoryTotal": 67306074112,
    "memoryUsed": 14780076032,
    "memoryFree": 52525998080,
    "memoryUsagePercent": 21.959498049767934,
    "memoryEfficiency": 78.04050195023207,
    "cpuCount": 16,
    "cpuLoad": 0.230625,
    "platform": "linux",
    "uptime": 268300.21
  }
]
```

---

## 4. Memory System Architecture

### 4.1 Flow Nexus Memory Adapter

The Flow Nexus adapter provides structured access to memory keys stored in the `revolution` namespace:

**Location:** `/server/src/memory/flowNexusAdapter.ts`

**Key Interfaces:**

```typescript
interface FlowNexusConfig {
  namespace: string;              // Memory namespace (e.g., "revolution")
  knowledgeBasePath: string;      // Base path to knowledge base
  memoryGuideRelativePath?: string; // Path to MEMORY-STRUCTURE-GUIDE.md
  baseUrl?: string;               // Optional Flow Nexus API URL
  apiKey?: string;                // Optional API key
}

interface MemoryKeySummary {
  name: string;
  createdAt?: string;
  summary?: string;
}

interface MemoryKeyDetail extends MemoryKeySummary {
  highlights: string[];           // Key points from memory content
}
```

### 4.2 Memory Key Structure

Memory keys are documented in `MEMORY-STRUCTURE-GUIDE.md` with this format:

```markdown
### 1. `memory-key-name`
**Created**: 2025-09-07T08:42:41.000Z
**Content**: Brief summary of content
- Highlight point 1
- Highlight point 2
- Highlight point 3
```

The adapter parses this markdown to extract:
- Memory key name
- Creation timestamp
- Summary description
- Bullet-point highlights

### 4.3 Memory Namespaces

Current namespaces identified:
- **revolution**: Revolutionary theory and transformation frameworks
- **default**: General-purpose memory storage
- **hive-collective**: Shared Hive Mind memory (from config)

### 4.4 Memory Operations

**Supported Operations:**
1. **List** - Retrieve all memory keys in namespace
2. **Get** - Retrieve specific memory key details
3. **Store** - Save new memory key (CLI only)
4. **Query** - Search memory by pattern (CLI only)
5. **Export** - Export namespace to file (CLI only)
6. **Import** - Import from file (CLI only)

---

## 5. Hive Mind Coordination

### 5.1 Configuration Structure

**Main Config:** `.hive-mind/config.json`

```json
{
  "version": "2.0.0",
  "system": {
    "enabled": true,
    "autoStart": false,
    "maxRetries": 3,
    "healthCheckInterval": 30000
  },
  "queen": {
    "type": "strategic",
    "name": "Queen-Genesis",
    "capabilities": [
      "task-decomposition",
      "consensus-building",
      "resource-allocation",
      "quality-assessment",
      "conflict-resolution"
    ],
    "decisionThreshold": 0.75,
    "adaptiveLearning": true
  },
  "workers": {
    "maxWorkers": 8,
    "autoScale": true,
    "scaleThreshold": 0.8,
    "specializedRoles": [
      "architect",
      "researcher",
      "implementer",
      "tester",
      "reviewer"
    ]
  },
  "consensus": {
    "algorithm": "weighted-majority",
    "minimumParticipants": 3,
    "timeoutMs": 30000,
    "requiredConsensus": 0.67
  },
  "memory": {
    "enabled": true,
    "size": 100,
    "persistenceMode": "database",
    "sharedMemoryNamespace": "hive-collective",
    "retentionDays": 30,
    "compressionEnabled": true
  }
}
```

### 5.2 Queen Types

**Available Queen Coordinators:**

1. **Strategic Queen**
   - Long-term planning and coordination
   - Analytical decision style
   - Specialties: architecture, planning, coordination
   - Adaptability: 0.7

2. **Tactical Queen**
   - Execution efficiency and problem-solving
   - Pragmatic decision style
   - Specialties: execution, optimization, troubleshooting
   - Adaptability: 0.9

3. **Adaptive Queen**
   - Dynamic context-based adjustments
   - Flexible decision style
   - Specialties: learning, adaptation, context-awareness
   - Adaptability: 1.0

### 5.3 Worker Specializations

**Worker Agent Types:**

| Type | Capabilities | Autonomy | Collaboration |
|------|--------------|----------|---------------|
| **Architect** | System design, patterns, scalability | 0.8 | 0.7 |
| **Researcher** | Information gathering, analysis | 0.9 | 0.6 |
| **Implementer** | Coding, debugging, integration | 0.7 | 0.8 |
| **Tester** | Testing, validation, QA | 0.8 | 0.7 |
| **Reviewer** | Code review, quality assessment | 0.8 | 0.9 |

### 5.4 Session Management

**Session State Structure:**

```json
{
  "sessionId": "session-1757540466532-139kzabqq",
  "checkpointId": "checkpoint-1757540496535-j5thb2fll",
  "checkpointName": "auto-save-1757540496535",
  "timestamp": "2025-09-10T21:41:36.537Z",
  "data": {
    "timestamp": "2025-09-10T21:41:36.535Z",
    "changeCount": 5,
    "changesByType": {
      "swarm_created": [...],
      "agent_activity": [...]
    },
    "statistics": {
      "tasksProcessed": 0,
      "tasksCompleted": 0,
      "memoryUpdates": 0,
      "agentActivities": 4,
      "consensusDecisions": 0
    }
  },
  "__session_meta__": {
    "version": "2.0.0",
    "compressionEnabled": true
  }
}
```

**Session data is base64-encoded and prefixed with `__compressed__`**

---

## 6. Neural Network Integration

### 6.1 SAFLA (Self-Aware Feedback Loop Algorithm)

**Features:**
- 4-tier memory system: Vector, Episodic, Semantic, Working
- 172,000+ ops/sec processing with WASM optimization
- 60% memory compression while maintaining recall
- Cross-session learning and persistence
- Distributed neural training with MCP integration

### 6.2 Neural Models Trained

From `MEMORY-STRUCTURE-GUIDE.md`:

1. **Coordination Model** (74.4% accuracy)
   - Focus: Revolutionary convergence patterns
   - Training data: Cross-tradition revolutionary texts

2. **Optimization Model** (78.9% accuracy)
   - Focus: Strategic pathway optimization
   - Training data: Historical revolutionary successes/failures

3. **Prediction Model** (82.0% accuracy)
   - Focus: Movement victory probability
   - Training data: Contemporary movement analysis

4. **Alienation Synthesis Model** (94.8% accuracy)
   - Focus: Alienation theory integration and pattern recognition
   - Model ID: `model_1757543718570_sxxg1v3bc`

### 6.3 Neural Pattern Recognition Results

**Key Patterns Identified:**
- Commons reclamation across all traditions
- Horizontal democracy as universal principle
- Reproductive justice as foundation
- Ecological interdependence necessity
- Alienation as systemic programming
- Consciousness evolution through collective action
- Species-being realization as liberation pathway

### 6.4 Neural Network Storage

**Expected Storage Locations:**
- Model weights: `.claude-flow/neural/models/`
- Training data: `.claude-flow/neural/training/`
- Pattern cache: `.claude-flow/neural/patterns/`
- Performance metrics: `.claude-flow/metrics/neural-metrics.json`

---

## 7. Performance Metrics System

### 7.1 Metrics Collection

**Metrics are collected at multiple levels:**

1. **Task-level metrics**
   - Execution duration
   - Success/failure status
   - Task type classification
   - Timestamp tracking

2. **System-level metrics**
   - Memory usage (total, used, free, percentage)
   - CPU load average
   - Platform information
   - System uptime

3. **Agent-level metrics**
   - Agent activity logs
   - Performance benchmarks
   - Resource utilization

4. **Neural metrics**
   - Training events
   - Pattern recognition accuracy
   - Model performance

### 7.2 Hooks Integration

**Lifecycle Hooks:**

```bash
# Pre-task hook
npx claude-flow@alpha hooks pre-task \
  --description "task description" \
  --task-id "task-123" \
  --agent-id "agent-456" \
  --auto-spawn-agents

# Post-task hook
npx claude-flow@alpha hooks post-task \
  --task-id "task-123" \
  --analyze-performance \
  --generate-insights

# Post-edit hook
npx claude-flow@alpha hooks post-edit \
  --file "path/to/file" \
  --memory-key "swarm/agent/step"

# Session-end hook
npx claude-flow@alpha hooks session-end \
  --export-metrics \
  --generate-summary \
  --swarm-id "swarm-123"
```

### 7.3 Performance Tracking

**Key Performance Indicators:**

- **Speed Improvement:** 2.8-4.4x with parallel execution
- **Token Optimization:** 32.3% reduction
- **SWE-Bench Solve Rate:** 84.8%
- **Memory Efficiency:** 78%+ (from system metrics)
- **Neural Processing:** 172,000+ ops/sec

---

## 8. MCP Tool Specifications

### 8.1 Memory Access Tools

#### 8.1.1 `revolution__list_memory_keys`

**Purpose:** List all memory keys in the revolution namespace

**Input Schema:**
```json
{
  "namespace": "string (optional, default: 'revolution')",
  "filter": "string (optional, pattern match)"
}
```

**Output Schema:**
```json
{
  "keys": [
    {
      "name": "string",
      "createdAt": "string (ISO 8601)",
      "summary": "string",
      "citations": [
        {
          "source": "string",
          "confidence": "number (0-1)"
        }
      ]
    }
  ]
}
```

#### 8.1.2 `revolution__get_memory_key`

**Purpose:** Retrieve detailed information about a specific memory key

**Input Schema:**
```json
{
  "name": "string (required)",
  "namespace": "string (optional, default: 'revolution')"
}
```

**Output Schema:**
```json
{
  "key": {
    "name": "string",
    "createdAt": "string",
    "summary": "string",
    "highlights": ["string"],
    "citations": [
      {
        "source": "string",
        "confidence": "number"
      }
    ]
  }
}
```

### 8.2 Database Query Tools

#### 8.2.1 `claudeflow__query_swarms`

**Purpose:** Query swarm information from hive.db

**Input Schema:**
```json
{
  "status": "string (optional: 'active', 'paused', 'completed', 'all')",
  "limit": "number (optional, default: 10)",
  "offset": "number (optional, default: 0)"
}
```

**Output Schema:**
```json
{
  "swarms": [
    {
      "id": "string",
      "name": "string",
      "objective": "string",
      "status": "string",
      "createdAt": "string",
      "queenType": "string",
      "workerCount": "number"
    }
  ],
  "total": "number"
}
```

#### 8.2.2 `claudeflow__query_agents`

**Purpose:** Query agent information

**Input Schema:**
```json
{
  "swarmId": "string (optional)",
  "type": "string (optional)",
  "status": "string (optional: 'active', 'idle', 'busy')",
  "limit": "number (optional)"
}
```

**Output Schema:**
```json
{
  "agents": [
    {
      "id": "string",
      "swarmId": "string",
      "type": "string",
      "name": "string",
      "status": "string",
      "capabilities": ["string"],
      "lastActive": "string"
    }
  ]
}
```

#### 8.2.3 `claudeflow__query_tasks`

**Purpose:** Query task information and status

**Input Schema:**
```json
{
  "swarmId": "string (optional)",
  "status": "string (optional)",
  "agentId": "string (optional)",
  "limit": "number (optional)"
}
```

**Output Schema:**
```json
{
  "tasks": [
    {
      "id": "string",
      "swarmId": "string",
      "description": "string",
      "assignedAgentId": "string",
      "status": "string",
      "priority": "number",
      "createdAt": "string",
      "completedAt": "string",
      "result": "string"
    }
  ]
}
```

### 8.3 Hive Mind Coordination Tools

#### 8.3.1 `claudeflow__get_consensus_decisions`

**Purpose:** Retrieve consensus decisions for a swarm

**Input Schema:**
```json
{
  "swarmId": "string (required)",
  "limit": "number (optional)"
}
```

**Output Schema:**
```json
{
  "decisions": [
    {
      "id": "string",
      "proposal": "string",
      "votes": "object",
      "decision": "string",
      "consensusReached": "boolean",
      "timestamp": "string"
    }
  ]
}
```

#### 8.3.2 `claudeflow__get_session_state`

**Purpose:** Retrieve session state and checkpoints

**Input Schema:**
```json
{
  "sessionId": "string (optional)",
  "swarmId": "string (optional)",
  "latest": "boolean (optional, get most recent)"
}
```

**Output Schema:**
```json
{
  "session": {
    "id": "string",
    "swarmId": "string",
    "checkpointId": "string",
    "data": "object (decompressed)",
    "timestamp": "string",
    "changeCount": "number"
  }
}
```

#### 8.3.3 `claudeflow__get_agent_communication`

**Purpose:** Retrieve agent-to-agent messages

**Input Schema:**
```json
{
  "fromAgentId": "string (optional)",
  "toAgentId": "string (optional)",
  "messageType": "string (optional)",
  "unreadOnly": "boolean (optional)",
  "limit": "number (optional)"
}
```

**Output Schema:**
```json
{
  "messages": [
    {
      "id": "string",
      "fromAgentId": "string",
      "toAgentId": "string",
      "messageType": "string",
      "content": "string",
      "timestamp": "string",
      "readStatus": "boolean"
    }
  ]
}
```

### 8.4 Neural Network Tools

#### 8.4.1 `claudeflow__list_neural_models`

**Purpose:** List available neural network models

**Input Schema:**
```json
{
  "filter": "string (optional: 'coordination', 'optimization', 'prediction')"
}
```

**Output Schema:**
```json
{
  "models": [
    {
      "id": "string",
      "name": "string",
      "type": "string",
      "accuracy": "number",
      "trainedAt": "string",
      "description": "string"
    }
  ]
}
```

#### 8.4.2 `claudeflow__get_neural_patterns`

**Purpose:** Retrieve neural pattern recognition results

**Input Schema:**
```json
{
  "modelId": "string (optional)",
  "category": "string (optional)"
}
```

**Output Schema:**
```json
{
  "patterns": [
    {
      "pattern": "string",
      "confidence": "number",
      "category": "string",
      "modelId": "string"
    }
  ]
}
```

#### 8.4.3 `claudeflow__query_training_history`

**Purpose:** Query neural network training history

**Input Schema:**
```json
{
  "modelId": "string (optional)",
  "limit": "number (optional)"
}
```

**Output Schema:**
```json
{
  "trainingRuns": [
    {
      "modelId": "string",
      "epochs": "number",
      "accuracy": "number",
      "loss": "number",
      "timestamp": "string",
      "datasetSize": "number"
    }
  ]
}
```

### 8.5 Session Management Tools

#### 8.5.1 `claudeflow__list_sessions`

**Purpose:** List all sessions with optional filtering

**Input Schema:**
```json
{
  "swarmId": "string (optional)",
  "status": "string (optional: 'active', 'paused', 'completed')",
  "limit": "number (optional)"
}
```

**Output Schema:**
```json
{
  "sessions": [
    {
      "id": "string",
      "swarmId": "string",
      "status": "string",
      "createdAt": "string",
      "updatedAt": "string",
      "checkpointCount": "number"
    }
  ]
}
```

#### 8.5.2 `claudeflow__restore_session`

**Purpose:** Restore a session from checkpoint

**Input Schema:**
```json
{
  "sessionId": "string (required)",
  "checkpointId": "string (optional, latest if not specified)"
}
```

**Output Schema:**
```json
{
  "session": {
    "id": "string",
    "swarmId": "string",
    "restoredFrom": "string",
    "data": "object",
    "restoredAt": "string"
  }
}
```

#### 8.5.3 `claudeflow__export_session`

**Purpose:** Export session data to JSON

**Input Schema:**
```json
{
  "sessionId": "string (required)",
  "format": "string (optional: 'json', 'yaml')",
  "includeMetrics": "boolean (optional)"
}
```

**Output Schema:**
```json
{
  "export": {
    "sessionId": "string",
    "data": "object",
    "metrics": "object (optional)",
    "exportedAt": "string"
  }
}
```

### 8.6 Metrics and Analytics Tools

#### 8.6.1 `claudeflow__get_performance_metrics`

**Purpose:** Retrieve performance metrics

**Input Schema:**
```json
{
  "metricType": "string (optional: 'task', 'system', 'agent', 'neural')",
  "startTime": "string (optional, ISO 8601)",
  "endTime": "string (optional, ISO 8601)",
  "entityId": "string (optional, specific entity)"
}
```

**Output Schema:**
```json
{
  "metrics": [
    {
      "id": "string",
      "type": "string",
      "entityType": "string",
      "entityId": "string",
      "metricName": "string",
      "value": "number",
      "timestamp": "string"
    }
  ],
  "summary": {
    "average": "number",
    "min": "number",
    "max": "number",
    "count": "number"
  }
}
```

#### 8.6.2 `claudeflow__get_system_health`

**Purpose:** Get current system health metrics

**Input Schema:**
```json
{
  "detailed": "boolean (optional)"
}
```

**Output Schema:**
```json
{
  "health": {
    "status": "string (healthy, degraded, unhealthy)",
    "memoryUsagePercent": "number",
    "cpuLoad": "number",
    "activeSwarms": "number",
    "activeAgents": "number",
    "queuedTasks": "number",
    "uptime": "number",
    "timestamp": "string"
  }
}
```

#### 8.6.3 `claudeflow__query_metrics_history`

**Purpose:** Query historical metrics with aggregation

**Input Schema:**
```json
{
  "entityType": "string (required: 'swarm', 'agent', 'task')",
  "entityId": "string (optional)",
  "metricName": "string (optional)",
  "aggregation": "string (optional: 'avg', 'sum', 'min', 'max')",
  "interval": "string (optional: '1m', '5m', '1h', '1d')",
  "startTime": "string (optional)",
  "endTime": "string (optional)"
}
```

**Output Schema:**
```json
{
  "metrics": [
    {
      "timestamp": "string",
      "value": "number",
      "aggregation": "string"
    }
  ],
  "entityType": "string",
  "entityId": "string",
  "metricName": "string"
}
```

### 8.7 Configuration and Control Tools

#### 8.7.1 `claudeflow__get_hive_config`

**Purpose:** Retrieve Hive Mind configuration

**Input Schema:**
```json
{
  "section": "string (optional: 'queen', 'workers', 'consensus', 'memory')"
}
```

**Output Schema:**
```json
{
  "config": {
    "version": "string",
    "system": "object",
    "queen": "object (if requested)",
    "workers": "object (if requested)",
    "consensus": "object (if requested)",
    "memory": "object (if requested)"
  }
}
```

#### 8.7.2 `claudeflow__get_coordination_state`

**Purpose:** Get current coordination memory state

**Input Schema:**
```json
{
  "swarmId": "string (optional)",
  "scope": "string (optional: 'global', 'swarm', 'agent')",
  "key": "string (optional, specific key)"
}
```

**Output Schema:**
```json
{
  "coordinationMemory": [
    {
      "id": "string",
      "swarmId": "string",
      "key": "string",
      "value": "any",
      "scope": "string",
      "createdBy": "string",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ]
}
```

#### 8.7.3 `claudeflow__update_coordination_memory`

**Purpose:** Update coordination memory (write operation)

**Input Schema:**
```json
{
  "swarmId": "string (required)",
  "key": "string (required)",
  "value": "any (required)",
  "scope": "string (optional, default: 'swarm')",
  "agentId": "string (required, creator)"
}
```

**Output Schema:**
```json
{
  "success": "boolean",
  "memory": {
    "id": "string",
    "swarmId": "string",
    "key": "string",
    "value": "any",
    "scope": "string",
    "createdBy": "string",
    "timestamp": "string"
  }
}
```

### 8.8 Summary of Required MCP Tools

**Total: 23 new MCP tools**

| Category | Tool Count | Tools |
|----------|------------|-------|
| Memory Access | 2 | list_memory_keys, get_memory_key |
| Database Queries | 3 | query_swarms, query_agents, query_tasks |
| Hive Mind Coordination | 3 | get_consensus_decisions, get_session_state, get_agent_communication |
| Neural Networks | 3 | list_neural_models, get_neural_patterns, query_training_history |
| Session Management | 3 | list_sessions, restore_session, export_session |
| Metrics & Analytics | 3 | get_performance_metrics, get_system_health, query_metrics_history |
| Configuration & Control | 3 | get_hive_config, get_coordination_state, update_coordination_memory |
| Hooks Integration | 3 | execute_pre_task_hook, execute_post_task_hook, execute_session_end_hook |

---

## 9. Security Considerations

### 9.1 Database Access Control

**Read-Only vs Write Access:**

1. **Read-Only Tools (Safe for External LLMs):**
   - All query operations
   - Memory key retrieval
   - Metrics access
   - Session state viewing
   - Configuration viewing

2. **Write-Access Tools (Require Authorization):**
   - `update_coordination_memory`
   - Session restoration
   - Configuration updates
   - Agent spawning/termination

**Recommendation:** Implement permission levels for MCP tools:
- **Level 1 (Public):** Read-only queries
- **Level 2 (Trusted):** Session management
- **Level 3 (Admin):** Write operations and configuration changes

### 9.2 Data Privacy

**Sensitive Data Protection:**

1. **Memory Key Content:**
   - Some memory keys may contain sensitive revolutionary theory
   - Consider content filtering for public access
   - Implement namespace-based access control

2. **Session Data:**
   - Compressed session data may include user prompts
   - Agent communication logs may contain private information
   - Implement data masking for sensitive fields

3. **Metrics Data:**
   - System metrics are generally safe
   - Task descriptions may contain sensitive information
   - Filter task details in public tools

### 9.3 SQL Injection Prevention

**Database Query Safety:**

1. **Parameterized Queries Only:**
   ```typescript
   // SAFE
   db.prepare('SELECT * FROM swarms WHERE id = ?').get(swarmId);

   // UNSAFE - Never do this
   db.exec(`SELECT * FROM swarms WHERE id = '${swarmId}'`);
   ```

2. **Input Validation:**
   - Validate all user inputs against expected formats
   - Use TypeScript/Zod schemas for type safety
   - Sanitize string inputs before database queries

3. **Query Limitations:**
   - Implement row limits (default: 100, max: 1000)
   - Add timeout constraints (max: 5 seconds)
   - Restrict complex JOIN operations

### 9.4 Resource Protection

**Rate Limiting and Quotas:**

1. **Per-Tool Rate Limits:**
   - Query tools: 100 requests/minute
   - Write tools: 10 requests/minute
   - Heavy operations (export): 5 requests/minute

2. **Resource Quotas:**
   - Max result set size: 10MB
   - Max session export size: 50MB
   - Concurrent connection limit: 10

3. **Monitoring:**
   - Log all tool invocations
   - Track usage per client
   - Alert on suspicious patterns

### 9.5 Access Control Matrix

| Tool Category | Public Access | Trusted Access | Admin Access |
|---------------|---------------|----------------|--------------|
| Memory Retrieval | ✅ Read | ✅ Read | ✅ Read/Write |
| Database Queries | ✅ Read | ✅ Read | ✅ Read/Write |
| Session Management | ❌ | ✅ View/Restore | ✅ Full Control |
| Metrics Access | ✅ Summary | ✅ Detailed | ✅ Full Access |
| Configuration | ✅ View Public | ✅ View All | ✅ Modify |
| Coordination Memory | ❌ | ✅ Read | ✅ Read/Write |
| Hooks Execution | ❌ | ✅ Limited | ✅ Full Access |

---

## 10. Integration Examples

### 10.1 Basic Memory Access

**Scenario:** External LLM wants to access revolutionary theory memory keys

```typescript
// List all available memory keys
const memoryKeys = await mcpClient.callTool('revolution__list_memory_keys', {
  namespace: 'revolution'
});

console.log(memoryKeys.keys);
// [
//   { name: 'meta-framework', createdAt: '2025-09-07T08:42:41.000Z', ... },
//   { name: 'validated-roadmap', createdAt: '2025-09-07T08:54:48.000Z', ... },
//   ...
// ]

// Get specific memory key details
const frameworkDetails = await mcpClient.callTool('revolution__get_memory_key', {
  name: 'meta-framework',
  namespace: 'revolution'
});

console.log(frameworkDetails.key.highlights);
// [
//   'Historical-material foundation (Marxist)',
//   'Horizontal organization (Anarchist)',
//   'Sacred wisdom principles (Spiritual-Ethical)',
//   ...
// ]
```

### 10.2 Swarm Coordination Query

**Scenario:** External LLM wants to monitor active swarms

```typescript
// Query active swarms
const activeSwarms = await mcpClient.callTool('claudeflow__query_swarms', {
  status: 'active',
  limit: 10
});

console.log(activeSwarms.swarms);
// [
//   {
//     id: 'swarm-1757540466531-ey94xk2r1',
//     name: 'hive-1757540466526',
//     objective: 'Build REST API with authentication',
//     status: 'active',
//     queenType: 'strategic',
//     workerCount: 4
//   }
// ]

// Get agents for a specific swarm
const swarmAgents = await mcpClient.callTool('claudeflow__query_agents', {
  swarmId: 'swarm-1757540466531-ey94xk2r1'
});

console.log(swarmAgents.agents);
// [
//   { id: 'worker-swarm-...-0', type: 'researcher', name: 'Researcher Worker 1', ... },
//   { id: 'worker-swarm-...-1', type: 'coder', name: 'Coder Worker 2', ... },
//   ...
// ]
```

### 10.3 Performance Metrics Analysis

**Scenario:** External LLM analyzes system performance

```typescript
// Get current system health
const health = await mcpClient.callTool('claudeflow__get_system_health', {
  detailed: true
});

console.log(health.health);
// {
//   status: 'healthy',
//   memoryUsagePercent: 21.96,
//   cpuLoad: 0.23,
//   activeSwarms: 1,
//   activeAgents: 4,
//   queuedTasks: 2,
//   uptime: 268300.21
// }

// Query task performance metrics
const taskMetrics = await mcpClient.callTool('claudeflow__get_performance_metrics', {
  metricType: 'task',
  startTime: '2025-10-01T00:00:00Z',
  endTime: '2025-10-02T00:00:00Z'
});

console.log(taskMetrics.summary);
// {
//   average: 3009.68,  // Average task duration in ms
//   min: 0.75,
//   max: 3009.68,
//   count: 2
// }
```

### 10.4 Neural Pattern Exploration

**Scenario:** External LLM explores neural pattern recognition results

```typescript
// List available neural models
const models = await mcpClient.callTool('claudeflow__list_neural_models', {
  filter: 'all'
});

console.log(models.models);
// [
//   {
//     id: 'model_coordination_1',
//     name: 'Coordination Model',
//     type: 'coordination',
//     accuracy: 0.744,
//     trainedAt: '2025-09-07T09:00:00Z'
//   },
//   {
//     id: 'model_1757543718570_sxxg1v3bc',
//     name: 'Alienation Synthesis Model',
//     type: 'optimization',
//     accuracy: 0.948,
//     trainedAt: '2025-09-10T22:00:00Z'
//   }
// ]

// Get patterns from best model
const patterns = await mcpClient.callTool('claudeflow__get_neural_patterns', {
  modelId: 'model_1757543718570_sxxg1v3bc'
});

console.log(patterns.patterns);
// [
//   { pattern: 'Alienation as systemic programming', confidence: 0.95, ... },
//   { pattern: 'Commons reclamation', confidence: 0.89, ... },
//   ...
// ]
```

### 10.5 Session State Management

**Scenario:** External LLM restores and analyzes previous sessions

```typescript
// List available sessions
const sessions = await mcpClient.callTool('claudeflow__list_sessions', {
  status: 'completed',
  limit: 5
});

console.log(sessions.sessions);
// [
//   {
//     id: 'session-1757540466532-139kzabqq',
//     swarmId: 'swarm-1757540466531-ey94xk2r1',
//     status: 'completed',
//     createdAt: '2025-09-10T21:41:06.532Z',
//     checkpointCount: 3
//   }
// ]

// Restore specific session
const restoredSession = await mcpClient.callTool('claudeflow__restore_session', {
  sessionId: 'session-1757540466532-139kzabqq'
});

console.log(restoredSession.session.data);
// {
//   timestamp: '2025-09-10T21:41:36.535Z',
//   changeCount: 5,
//   changesByType: { swarm_created: [...], agent_activity: [...] },
//   statistics: { tasksProcessed: 0, agentActivities: 4, ... }
// }
```

### 10.6 Coordination Memory Access

**Scenario:** External LLM coordinates with swarm agents

```typescript
// Get current coordination state
const coordState = await mcpClient.callTool('claudeflow__get_coordination_state', {
  swarmId: 'swarm-1757540466531-ey94xk2r1',
  scope: 'swarm'
});

console.log(coordState.coordinationMemory);
// [
//   {
//     id: '123',
//     swarmId: 'swarm-1757540466531-ey94xk2r1',
//     key: 'current_task',
//     value: 'Building authentication layer',
//     scope: 'swarm',
//     createdBy: 'worker-swarm-...-1',
//     createdAt: '2025-10-02T00:15:00Z'
//   }
// ]

// Update coordination memory (requires authorization)
const updateResult = await mcpClient.callTool('claudeflow__update_coordination_memory', {
  swarmId: 'swarm-1757540466531-ey94xk2r1',
  key: 'integration_status',
  value: {
    phase: 'testing',
    progress: 0.75,
    blockers: []
  },
  scope: 'swarm',
  agentId: 'external-llm-agent-1'
});

console.log(updateResult.success); // true
```

### 10.7 Complete Integration Workflow

**Scenario:** External LLM fully integrates with Claude Flow ecosystem

```typescript
async function integrateWithClaudeFlow() {
  // 1. Check system health
  const health = await mcpClient.callTool('claudeflow__get_system_health', {
    detailed: true
  });

  if (health.health.status !== 'healthy') {
    console.warn('System not healthy, proceeding with caution');
  }

  // 2. Load revolutionary theory context
  const memoryKeys = await mcpClient.callTool('revolution__list_memory_keys', {
    namespace: 'revolution'
  });

  const coreFramework = await mcpClient.callTool('revolution__get_memory_key', {
    name: 'ultimate-revolutionary-synthesis',
    namespace: 'revolution'
  });

  // 3. Query active swarms
  const swarms = await mcpClient.callTool('claudeflow__query_swarms', {
    status: 'active'
  });

  // 4. For each swarm, get agents and tasks
  for (const swarm of swarms.swarms) {
    const agents = await mcpClient.callTool('claudeflow__query_agents', {
      swarmId: swarm.id
    });

    const tasks = await mcpClient.callTool('claudeflow__query_tasks', {
      swarmId: swarm.id,
      status: 'pending'
    });

    // 5. Analyze with neural patterns
    const patterns = await mcpClient.callTool('claudeflow__get_neural_patterns', {
      category: 'optimization'
    });

    // 6. Update coordination memory with insights
    await mcpClient.callTool('claudeflow__update_coordination_memory', {
      swarmId: swarm.id,
      key: 'llm_analysis',
      value: {
        analyzedAt: new Date().toISOString(),
        coreContext: coreFramework.key.summary,
        relevantPatterns: patterns.patterns.slice(0, 5),
        taskRecommendations: generateRecommendations(tasks, patterns)
      },
      scope: 'swarm',
      agentId: 'external-llm-integration'
    });
  }

  // 7. Export session for analysis
  const sessionExport = await mcpClient.callTool('claudeflow__export_session', {
    sessionId: swarms.swarms[0]?.sessionId,
    format: 'json',
    includeMetrics: true
  });

  return {
    health,
    memoryContext: coreFramework,
    activeSwarms: swarms.swarms.length,
    sessionData: sessionExport
  };
}
```

---

## 11. Implementation Guide

### 11.1 Prerequisites

**Required Dependencies:**

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "better-sqlite3": "^9.0.0",
    "zod": "^3.22.0"
  }
}
```

**Environment Variables:**

```bash
# Required
REVOLUTION_KB_PATH=/path/to/knowledge-base
REVOLUTION_MEMORY_NAMESPACE=revolution

# Optional
FLOW_NEXUS_BASE_URL=https://api.flow-nexus.ai
FLOW_NEXUS_API_KEY=your_api_key_here
REVOLUTION_HTTP_ENABLE=true
REVOLUTION_HTTP_PORT=3000
REVOLUTION_HTTP_HOST=0.0.0.0
```

### 11.2 Database Connection Setup

```typescript
import Database from 'better-sqlite3';
import path from 'path';

// Connection configuration
interface DatabaseConfig {
  hiveDbPath: string;
  memoryDbPath: string;
  swarmMemoryDbPath: string;
  readonly: boolean;
}

class ClaudeFlowDatabase {
  private hiveDb: Database.Database;
  private memoryDb: Database.Database;
  private swarmMemoryDb: Database.Database;

  constructor(config: DatabaseConfig) {
    // Connect to Hive Mind database
    this.hiveDb = new Database(config.hiveDbPath, {
      readonly: config.readonly,
      fileMustExist: true
    });

    // Connect to Memory database
    this.memoryDb = new Database(config.memoryDbPath, {
      readonly: config.readonly,
      fileMustExist: true
    });

    // Connect to Swarm Memory database
    this.swarmMemoryDb = new Database(config.swarmMemoryDbPath, {
      readonly: config.readonly,
      fileMustExist: true
    });

    // Enable WAL mode for better concurrency
    if (!config.readonly) {
      this.hiveDb.pragma('journal_mode = WAL');
      this.memoryDb.pragma('journal_mode = WAL');
      this.swarmMemoryDb.pragma('journal_mode = WAL');
    }

    // Set busy timeout (5 seconds)
    this.hiveDb.pragma('busy_timeout = 5000');
    this.memoryDb.pragma('busy_timeout = 5000');
    this.swarmMemoryDb.pragma('busy_timeout = 5000');
  }

  // Query methods
  querySwarms(filter: { status?: string; limit?: number; offset?: number }) {
    const stmt = this.hiveDb.prepare(`
      SELECT * FROM swarms
      WHERE status = COALESCE(?, status)
      LIMIT ? OFFSET ?
    `);

    return stmt.all(
      filter.status ?? null,
      filter.limit ?? 10,
      filter.offset ?? 0
    );
  }

  // More query methods...

  close() {
    this.hiveDb.close();
    this.memoryDb.close();
    this.swarmMemoryDb.close();
  }
}
```

### 11.3 MCP Server Implementation

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// Initialize MCP server
const server = new McpServer({
  name: 'claude-flow-integration',
  version: '1.0.0'
});

// Register tool: Query Swarms
server.registerTool(
  'claudeflow__query_swarms',
  {
    title: 'Query Claude Flow Swarms',
    description: 'Retrieve swarm information from Hive Mind database',
    inputSchema: {
      status: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional()
    },
    outputSchema: {
      swarms: z.array(z.object({
        id: z.string(),
        name: z.string(),
        objective: z.string(),
        status: z.string(),
        createdAt: z.string(),
        queenType: z.string(),
        workerCount: z.number()
      })),
      total: z.number()
    }
  },
  async ({ status, limit, offset }) => {
    const swarms = db.querySwarms({ status, limit, offset });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ swarms, total: swarms.length }, null, 2)
        }
      ],
      structuredContent: {
        swarms,
        total: swarms.length
      }
    };
  }
);

// Register more tools...

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

### 11.4 Session Decompression

**Handling Compressed Session Data:**

```typescript
import zlib from 'zlib';
import { promisify } from 'util';

const inflate = promisify(zlib.inflate);

async function decompressSessionData(compressedData: string): Promise<object> {
  // Remove compression prefix
  if (!compressedData.startsWith('__compressed__')) {
    throw new Error('Invalid compressed data format');
  }

  const base64Data = compressedData.substring('__compressed__'.length);

  // Decode base64
  const buffer = Buffer.from(base64Data, 'base64');

  // Decompress
  const decompressed = await inflate(buffer);

  // Parse JSON
  return JSON.parse(decompressed.toString('utf8'));
}

// Usage
const sessionRow = db.getSession('session-1757540466532-139kzabqq');
const sessionData = await decompressSessionData(sessionRow.data);
console.log(sessionData);
```

### 11.5 Security Implementation

**Input Validation:**

```typescript
import { z } from 'zod';

// Define validation schemas
const SwarmQuerySchema = z.object({
  status: z.enum(['active', 'paused', 'completed', 'all']).optional(),
  limit: z.number().min(1).max(1000).optional(),
  offset: z.number().min(0).optional()
});

const MemoryKeySchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  namespace: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/).optional()
});

// Validate inputs
function validateInput<T>(schema: z.ZodSchema<T>, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (error) {
    throw new Error(`Invalid input: ${error.message}`);
  }
}

// Usage in tool
server.registerTool(
  'claudeflow__query_swarms',
  // ... schema definition
  async (input) => {
    const validated = validateInput(SwarmQuerySchema, input);
    // Proceed with validated input
  }
);
```

**Rate Limiting:**

```typescript
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  check(clientId: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get client request timestamps
    const timestamps = this.requests.get(clientId) ?? [];

    // Remove old timestamps
    const recentTimestamps = timestamps.filter(t => t > windowStart);

    // Check limit
    if (recentTimestamps.length >= limit) {
      return false;
    }

    // Add new timestamp
    recentTimestamps.push(now);
    this.requests.set(clientId, recentTimestamps);

    return true;
  }
}

const rateLimiter = new RateLimiter();

// Usage in tool
server.registerTool(
  'claudeflow__query_swarms',
  // ... schema
  async (input, context) => {
    const clientId = context.clientId ?? 'unknown';

    if (!rateLimiter.check(clientId, 100, 60000)) {
      throw new Error('Rate limit exceeded: 100 requests per minute');
    }

    // Proceed with query
  }
);
```

### 11.6 Testing Strategy

**Unit Tests:**

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Claude Flow Database Integration', () => {
  let db: ClaudeFlowDatabase;

  beforeAll(() => {
    db = new ClaudeFlowDatabase({
      hiveDbPath: './test-fixtures/hive.db',
      memoryDbPath: './test-fixtures/memory.db',
      swarmMemoryDbPath: './test-fixtures/.swarm/memory.db',
      readonly: true
    });
  });

  afterAll(() => {
    db.close();
  });

  it('should query active swarms', () => {
    const swarms = db.querySwarms({ status: 'active', limit: 10 });
    expect(swarms).toBeInstanceOf(Array);
    expect(swarms.length).toBeLessThanOrEqual(10);
  });

  it('should retrieve memory keys', async () => {
    const keys = await db.listMemoryKeys('revolution');
    expect(keys).toContain('meta-framework');
    expect(keys).toContain('validated-roadmap');
  });

  it('should decompress session data', async () => {
    const session = db.getSession('session-test-123');
    const data = await decompressSessionData(session.data);
    expect(data).toHaveProperty('sessionId');
    expect(data).toHaveProperty('changeCount');
  });
});
```

**Integration Tests:**

```typescript
describe('MCP Server Integration', () => {
  it('should register all required tools', () => {
    const tools = server.listTools();
    expect(tools).toContain('revolution__list_memory_keys');
    expect(tools).toContain('claudeflow__query_swarms');
    expect(tools).toContain('claudeflow__get_performance_metrics');
    // ... check all 23 tools
  });

  it('should enforce rate limits', async () => {
    const clientId = 'test-client';

    // Make 100 requests (should succeed)
    for (let i = 0; i < 100; i++) {
      await mcpClient.callTool('claudeflow__query_swarms', {}, { clientId });
    }

    // 101st request should fail
    await expect(
      mcpClient.callTool('claudeflow__query_swarms', {}, { clientId })
    ).rejects.toThrow('Rate limit exceeded');
  });
});
```

### 11.7 Deployment Checklist

- [ ] Database file permissions (read-only for query tools)
- [ ] Environment variables configured
- [ ] Rate limiting enabled
- [ ] Input validation on all tools
- [ ] SQL injection prevention verified
- [ ] Access control matrix implemented
- [ ] Logging and monitoring configured
- [ ] Error handling tested
- [ ] Documentation complete
- [ ] Integration tests passing
- [ ] Security audit completed

### 11.8 Monitoring and Observability

```typescript
import { logger } from './logger';

// Tool execution logging
server.registerTool(
  'claudeflow__query_swarms',
  // ... schema
  async (input, context) => {
    const startTime = Date.now();

    try {
      const result = await executeQuery(input);

      logger.info('Tool execution', {
        tool: 'claudeflow__query_swarms',
        clientId: context.clientId,
        duration: Date.now() - startTime,
        resultCount: result.swarms.length,
        status: 'success'
      });

      return result;
    } catch (error) {
      logger.error('Tool execution failed', {
        tool: 'claudeflow__query_swarms',
        clientId: context.clientId,
        duration: Date.now() - startTime,
        error: error.message,
        status: 'error'
      });

      throw error;
    }
  }
);
```

---

## Conclusion

This specification provides a complete blueprint for integrating external LLMs with the Claude Flow / Hive Mind ecosystem via MCP servers. The architecture enables:

1. **Safe, read-only access** to revolutionary theory memory keys
2. **Real-time swarm coordination** querying and monitoring
3. **Neural network pattern exploration** with high-accuracy models
4. **Performance metrics analysis** for system optimization
5. **Session state management** for cross-session learning
6. **Secure database access** with comprehensive input validation

The 23 proposed MCP tools provide comprehensive coverage of all Claude Flow features while maintaining security and performance. Implementation should follow the security considerations and testing strategy outlined in this document.

### Next Steps

1. Implement database schema creation/migration scripts
2. Build MCP server with all 23 tools
3. Create comprehensive test suite
4. Deploy with monitoring and observability
5. Document API for external LLM developers
6. Establish feedback loop for improvements

---

**Document Version:** 1.0.0
**Last Updated:** 2025-10-02
**Maintenance:** This document should be updated as Claude Flow evolves
