# FlowForge

FlowForge is a full-stack visual workflow automation platform for building, publishing, scheduling, and executing automated workflows.

Users can create workflows visually, connect different node types, configure HTTP requests and conditional logic, publish workflow versions, trigger workflows manually or through webhooks, schedule automated executions, and inspect detailed execution results.

## Features

* JWT-based authentication
* Visual workflow builder using React Flow
* Manual workflow triggers
* Webhook-based workflow triggers
* Scheduled workflow execution
* HTTP request nodes
* Conditional branching with TRUE/FALSE paths
* Workflow drafts and publishing
* Workflow version history
* Restore previous workflow versions
* Execution history
* Detailed execution results
* HTTP request retries and timeouts
* Configurable request headers and bodies
* Dynamic values using workflow execution data
* Backend request validation
* Workflow graph validation
* MongoDB persistence
* Responsive dashboard UI

## Tech Stack

### Frontend

* React
* Vite
* React Router
* React Flow (`@xyflow/react`)
* Axios
* Zod

### Backend

* Node.js
* Express
* MongoDB
* Mongoose
* JWT
* bcrypt
* Zod
* Croner

## Architecture

```text
┌─────────────────────────┐
│       React + Vite      │
│                         │
│  Dashboard              │
│  Workflow Editor        │
│  Execution History      │
│  Settings               │
└────────────┬────────────┘
             │
             │ REST API
             ▼
┌─────────────────────────┐
│      Node + Express     │
│                         │
│  Authentication         │
│  Workflow Management    │
│  Workflow Engine        │
│  Scheduler              │
│  Webhooks               │
│  Executions             │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│         MongoDB         │
│                         │
│  Users                  │
│  Workflows              │
│  Workflow Versions      │
│  Executions             │
└─────────────────────────┘
```

## Workflow Nodes

### Trigger

Starts a workflow manually.

### Schedule

Runs a published workflow automatically according to a configured schedule.

Supported schedule types:

* Interval
* Hourly
* Daily
* Weekly
* Cron expressions

Timezone configuration is supported for scheduled workflows.

### HTTP Request

Makes requests to external APIs.

Supported methods:

* GET
* POST
* PUT
* PATCH
* DELETE
* HEAD
* OPTIONS

HTTP nodes support:

* Request headers
* Request bodies
* Request timeouts
* Automatic retries
* Dynamic values from previous node output

### Condition

Evaluates workflow data and selects one of two execution branches.

```text
                  ┌── TRUE ──► Node A
                  │
Trigger ──► HTTP ──► Condition
                  │
                  └── FALSE ─► Node B
```

Supported operators:

* Equals
* Not equals
* Contains
* Greater than
* Less than

## Workflow Lifecycle

Workflows use a draft and published lifecycle.

```text
        ┌─────────┐
        │  Draft  │
        └────┬────┘
             │
          Publish
             │
             ▼
      ┌─────────────┐
      │  Published  │
      └─────────────┘
```

Publishing a workflow validates its graph before creating a published version.

Published workflows can be:

* Executed manually
* Triggered through webhooks
* Executed by the scheduler

When a published workflow is edited, the changes remain in the draft until the workflow is published again.

## Workflow Versioning

FlowForge stores snapshots of published workflows as versions.

Users can:

1. View workflow versions
2. Inspect previous versions
3. Restore an older version
4. Review the restored workflow
5. Publish it again

Restoring a version returns the workflow to draft state rather than immediately replacing the live published workflow.

## Execution Engine

The workflow engine executes connected nodes according to their dependencies.

Each execution records:

* Execution status
* Trigger type
* Start time
* Total duration
* Node execution order
* Node status
* Node duration
* Node start time
* Node input
* Node output
* Node errors
* Condition results
* Skipped branches

Example execution flow:

```text
Trigger
   │
   ▼
HTTP Request
   │
   ▼
Condition
  │       │
 TRUE   FALSE
  │       │
  ▼       ▼
 HTTP    HTTP
```

The execution history allows users to inspect the overall result, while the execution detail view provides node-level information.

## HTTP Retry Handling

HTTP request nodes support configurable retries.

Retryable failures include:

* Network errors
* Request timeouts
* HTTP 408
* HTTP 429
* HTTP 5xx responses

Retry attempts use increasing delays and are capped to prevent excessive request loops.

HTTP timeout and retry values are also bounded by the execution engine.

## Workflow Validation

FlowForge validates workflow structure before publishing.

Validation includes:

* At least one workflow node
* Unique node IDs
* Unique edge IDs
* Valid edge source and target nodes
* No self-connections
* Exactly one trigger or schedule node
* All nodes reachable from the trigger
* No cyclic workflow graphs
* Valid HTTP configuration
* Valid condition configuration
* Valid TRUE/FALSE condition branches
* Valid schedule configuration

This prevents invalid workflow graphs from reaching the execution engine.

## Authentication

FlowForge uses JWT-based authentication.

Protected resources require an authenticated user, and workflow operations are scoped to the workflow owner.

Passwords are securely hashed using bcrypt before being stored.

## Webhooks

Published workflows can be triggered through webhook requests.

A webhook execution can pass request data into the workflow, allowing later nodes to use values from the incoming payload.

Example:

```text
Webhook Request
      │
      ▼
Trigger
      │
      ▼
HTTP Request
      │
      ▼
Condition
```

## Project Structure

```text
FlowForge/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   │
│   └── ...
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── validation/
│   ├── app.js
│   └── server.js
│
├── .gitignore
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

Make sure you have:

* Node.js
* MongoDB
* Git

### Clone the Repository

```bash
git clone https://github.com/hasu7/flowforge.git

cd FlowForge
```

## Backend Setup

Navigate to the backend:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Start the backend:

```bash
npm run dev
```

The API runs on:

```text
http://localhost:5000
```

## Frontend Setup

Open another terminal and navigate to the frontend:

```bash
cd client
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will normally run at:

```text
http://localhost:5173
```

## API Overview

### Authentication

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

### Workflows

```text
GET    /api/v1/workflows
POST   /api/v1/workflows
GET    /api/v1/workflows/:id
PATCH  /api/v1/workflows/:id
DELETE /api/v1/workflows/:id

POST /api/v1/workflows/:id/publish

GET  /api/v1/workflows/:id/versions
GET  /api/v1/workflows/:id/versions/:version
POST /api/v1/workflows/:id/versions/:version/restore

GET /api/v1/workflows/:id/schedule
```

### Webhooks

```text
POST /api/v1/webhooks/:workflowId
```

### Executions

Execution endpoints provide access to workflow execution history and individual execution details.

## Example Workflow

A simple API automation workflow can look like:

```text
Trigger
   │
   ▼
HTTP Request
   │
   ▼
Condition
  ├──── TRUE ────► HTTP Request
  │
  └──── FALSE ───► HTTP Request
```

The workflow can then be published and executed manually, through a webhook, or through a schedule.

## Environment Variables

| Variable     | Description                        |
| ------------ | ---------------------------------- |
| `PORT`       | Port used by the Express server    |
| `MONGO_URI`  | MongoDB connection string          |
| `JWT_SECRET` | Secret used for JWT authentication |

Never commit `.env` files or secrets to the repository.

## Security

FlowForge includes:

* JWT authentication
* bcrypt password hashing
* Protected API routes
* Owner-based workflow access
* Request validation with Zod
* Workflow graph validation
* HTTP timeout limits
* HTTP retry limits
* Protected execution operations

## Development

Run the frontend and backend separately during development.

Frontend:

```bash
npm run dev
```

Backend:

```bash
npm run dev
```

Make sure MongoDB is running and the required environment variables are configured before starting the backend.

## Future Improvements

Potential future improvements include:

* Additional workflow node types
* API credential management
* OAuth integrations
* More detailed execution logs
* Workflow templates
* Team collaboration
* Additional authentication options
* Production deployment improvements

## Author

Built as a full-stack portfolio project demonstrating:

* React frontend development
* Node.js and Express backend development
* MongoDB and Mongoose
* REST API design
* JWT authentication
* Workflow execution engines
* Scheduling systems
* Graph validation
* Asynchronous backend processing
* Full-stack application architecture
