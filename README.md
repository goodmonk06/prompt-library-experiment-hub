# Prompt Library & Experiment Hub

A production-ready platform for managing prompts, versions, and experiments across multiple LLM projects. Version control your prompts, run systematic evaluations, and iterate with confidence.

## Overview

This platform solves the problem of prompt management and evaluation at scale. Instead of scattering prompts across codebases and manually testing changes, you get:

- **Centralized prompt management** with version control
- **Systematic evaluation** using datasets and metrics
- **Automated experiment runs** via background workers
- **Clean dashboard** for tracking results and comparing versions

Built for teams working on multiple LLM-powered products who need a single source of truth for their prompts.

## Tech Stack

- **Backend**: Fastify + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Queue**: BullMQ + Redis (for background experiment execution)
- **LLM**: OpenAI API
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Testing**: Vitest
- **Infrastructure**: Docker + Docker Compose

## Domain Model

```
Project (e.g., "Customer Support Bot")
├── Prompts (e.g., "Support Response Generator")
│   └── PromptVersions (e.g., "v1.0", "v2.0")
├── EvaluationDatasets (e.g., "Common Questions")
│   └── EvaluationItems (input/expected pairs)
└── Experiments (e.g., "GPT-3.5 Baseline")
    └── ExperimentRuns (tracks execution and results)
        └── ExperimentResultItems (individual outputs + scores)
```

**Key relationships:**
- Projects organize all resources
- Prompts have multiple versions for A/B testing
- Datasets contain test cases for evaluation
- Experiments link prompt versions to datasets and track results

## Getting Started

### Requirements

- Node.js 18+
- Docker & Docker Compose
- OpenAI API key

### Quick Start (Recommended)

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd prompt-library-experiment-hub
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your OPENAI_API_KEY

   cp backend/.env.example backend/.env
   cp frontend/.env.local.example frontend/.env.local
   ```

3. **Start infrastructure** (PostgreSQL + Redis)
   ```bash
   npm run docker:up
   ```

4. **Set up database**
   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Start development servers**

   In separate terminals:
   ```bash
   # Terminal 1: Backend API
   npm run dev:backend

   # Terminal 2: Worker (for running experiments)
   npm run dev:worker

   # Terminal 3: Frontend
   npm run dev:frontend
   ```

6. **Open the dashboard**

   Navigate to http://localhost:3000/projects

   You'll see the demo project "Customer Support Automation" with:
   - 2 prompts with multiple versions
   - 1 evaluation dataset with 6 test cases
   - 2 experiments ready to run

### Alternative: Full Docker Setup

If you prefer to run everything in Docker:

```bash
# Copy environment file
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Build and start all services
npm run docker:build
npm run docker:up

# Run migrations (one-time)
docker exec prompt-hub-backend npx prisma db push

# Seed demo data (optional)
docker exec prompt-hub-backend npm run db:seed

# View logs
npm run docker:logs
```

Services will be available at:
- Backend API: http://localhost:3001
- Health check: http://localhost:3001/health
- Frontend: Run separately with `npm run dev:frontend`

## Example Flow (Vertical Slice)

This demonstrates the complete workflow from prompt creation to evaluation:

### 1. Create a Project

```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Email Assistant",
    "description": "AI-powered email response generation"
  }'
```

### 2. Create a Prompt

```bash
curl -X POST http://localhost:3001/api/prompts \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "<project-id>",
    "name": "Professional Email Response",
    "description": "Generates professional email responses"
  }'
```

### 3. Add Prompt Versions

Version 1 (baseline):
```bash
curl -X POST http://localhost:3001/api/prompts/<prompt-id>/versions \
  -H "Content-Type: application/json" \
  -d '{
    "versionTag": "v1.0",
    "templateText": "Write a professional email response to: {{email}}"
  }'
```

Version 2 (improved):
```bash
curl -X POST http://localhost:3001/api/prompts/<prompt-id>/versions \
  -H "Content-Type: application/json" \
  -d '{
    "versionTag": "v2.0",
    "templateText": "You are a professional email assistant. Write a clear, concise, and friendly response to:\n\n{{email}}\n\nResponse:"
  }'
```

### 4. Create Evaluation Dataset

```bash
curl -X POST http://localhost:3001/api/datasets \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "<project-id>",
    "name": "Sample Emails",
    "description": "Test cases for email responses"
  }'
```

### 5. Upload Test Cases

```bash
curl -X POST http://localhost:3001/api/datasets/<dataset-id>/items \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "inputJson": "{\"email\": \"Can we reschedule our meeting to next week?\"}",
        "expectedOutputJson": "\"Of course! I am happy to reschedule. What day next week works best for you?\""
      }
    ]
  }'
```

### 6. Create Experiment

```bash
curl -X POST http://localhost:3001/api/experiments \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "<project-id>",
    "name": "GPT-4 Evaluation",
    "model": "gpt-4"
  }'
```

### 7. Run Experiment

```bash
curl -X POST http://localhost:3001/api/experiments/<experiment-id>/runs \
  -H "Content-Type: application/json" \
  -d '{
    "promptVersionId": "<version-id>",
    "datasetId": "<dataset-id>"
  }'
```

The worker will process this in the background, running each test case through OpenAI and calculating:
- Exact match rate
- String similarity scores
- Optional LLM-as-judge scores

### 8. View Results

```bash
curl http://localhost:3001/api/experiments/<experiment-id>/runs/<run-id>
```

Or view in the dashboard at http://localhost:3000/projects/<project-id>/experiments

## Available Scripts

### Root Level

```bash
npm run dev              # Start both backend and frontend
npm run dev:backend      # Start backend only
npm run dev:frontend     # Start frontend only
npm run dev:worker       # Start background worker
npm run build            # Build all workspaces
npm run test             # Run tests
npm run lint             # Lint all workspaces

# Database
npm run db:migrate       # Run migrations (dev)
npm run db:push          # Push schema to DB
npm run db:seed          # Seed demo data
npm run db:generate      # Generate Prisma client

# Docker
npm run docker:up        # Start infrastructure
npm run docker:down      # Stop infrastructure
npm run docker:build     # Build Docker images
npm run docker:logs      # View logs
```

### Backend (workspace)

```bash
cd backend
npm run dev              # Dev server with hot reload
npm run dev:worker       # Worker with hot reload
npm run build            # Build TypeScript
npm run start            # Start production server
npm run test             # Run tests with Vitest
npm run test:watch       # Run tests in watch mode
npm run lint             # Type check
```

### Frontend (workspace)

```bash
cd frontend
npm run dev              # Dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Next.js linting
```

## Integration with Other Projects

This hub serves as the prompt backbone for multiple LLM-powered applications:

### agent-benchmark-lab

```typescript
// Fetch agent prompts from central hub
import { promptsAPI } from 'prompt-hub-client';

const agentPrompt = await promptsAPI.get(AGENT_PROMPT_ID);
const latestVersion = agentPrompt.versions[0];

// Run benchmarks using experiment runs
const benchmarkRun = await experimentsAPI.createRun(EXPERIMENT_ID, {
  promptVersionId: latestVersion.id,
  datasetId: BENCHMARK_DATASET_ID
});
```

### sns-content-autopilot

```typescript
// Test new content generation prompts before deployment
const newVersion = await promptsAPI.createVersion(CONTENT_PROMPT_ID, {
  versionTag: 'v2.5',
  templateText: improvedPrompt
});

// A/B test against current version
const results = await experimentsAPI.createRun(CONTENT_EXPERIMENT_ID, {
  promptVersionId: newVersion.id,
  datasetId: SAMPLE_TOPICS_DATASET_ID
});

// Deploy if metrics improve
if (results.metricsJson.avgSimilarity > 0.85) {
  deployToProduction(newVersion.id);
}
```

### cocoon-mental-platform

```typescript
// Ensure therapeutic prompts meet quality standards
const safetyRun = await experimentsAPI.createRun(SAFETY_EXPERIMENT_ID, {
  promptVersionId: therapeuticPromptVersion.id,
  datasetId: SAFETY_SCENARIOS_DATASET_ID
});

// Require LLM judge approval before use
const safetyScore = safetyRun.metricsJson.avgLLMScore;
if (safetyScore < 90) {
  throw new Error('Prompt does not meet safety standards');
}
```

## API Reference

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project with related entities
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project (cascades)

### Prompts
- `GET /api/prompts?projectId=:id` - List prompts for project
- `POST /api/prompts` - Create prompt
- `GET /api/prompts/:id` - Get prompt with versions
- `PATCH /api/prompts/:id` - Update prompt
- `DELETE /api/prompts/:id` - Delete prompt
- `POST /api/prompts/:id/versions` - Create new version
- `GET /api/prompts/:id/versions` - List all versions

### Datasets
- `GET /api/datasets?projectId=:id` - List datasets
- `POST /api/datasets` - Create dataset
- `GET /api/datasets/:id` - Get dataset with items (limit 100)
- `POST /api/datasets/:id/items` - Bulk upload items
- `GET /api/datasets/:id/items?limit=100&offset=0` - Paginate items

### Experiments
- `GET /api/experiments?projectId=:id` - List experiments
- `POST /api/experiments` - Create experiment
- `GET /api/experiments/:id` - Get experiment with runs
- `POST /api/experiments/:id/runs` - Create and enqueue run
- `GET /api/experiments/:id/runs/:runId` - Get run details with metrics
- `GET /api/experiments/:id/runs/:runId/results` - Get individual results

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
cd backend && npm run test:watch

# Run tests with coverage
cd backend && npm run test -- --coverage
```

Test coverage includes:
- Template variable substitution
- Similarity scoring algorithms
- Exact match calculation
- Metrics aggregation
- Error handling (Zod validation, Prisma errors)

## Future Extensions

Short-term enhancements:
- [ ] Authentication & multi-tenancy
- [ ] Cost tracking per experiment run
- [ ] Export results to CSV/JSON
- [ ] Prompt template library (reusable components)
- [ ] Webhook notifications for completed runs

Medium-term features:
- [ ] Support for additional LLM providers (Anthropic, Cohere)
- [ ] Custom scoring functions (Python/JS snippets)
- [ ] Scheduled experiment runs (cron-based)
- [ ] Result visualization (charts, comparisons)
- [ ] Collaborative features (comments, approval workflows)

Long-term vision:
- [ ] Prompt marketplace (share templates)
- [ ] ML-powered prompt optimization
- [ ] Integration with observability tools (LangSmith, Helicone)
- [ ] Advanced versioning (git-like branching)

## Deployment

### Production Checklist

1. Set environment variables:
   ```bash
   DATABASE_URL=postgresql://...
   REDIS_HOST=your-redis-host
   OPENAI_API_KEY=sk-...
   NODE_ENV=production
   ```

2. Build Docker images:
   ```bash
   docker build -t prompt-hub-backend ./backend
   docker build -t prompt-hub-frontend ./frontend
   ```

3. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

4. Start services:
   ```bash
   docker-compose up -d
   ```

### Environment Variables

**Required:**
- `OPENAI_API_KEY` - OpenAI API key for running experiments

**Backend:**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST` - Redis host (default: localhost)
- `REDIS_PORT` - Redis port (default: 6379)
- `PORT` - Backend port (default: 3001)
- `CORS_ORIGIN` - Allowed CORS origin (default: http://localhost:3000)
- `NODE_ENV` - Environment (development/production)

**Frontend:**
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:3001)

## Troubleshooting

**Database connection fails:**
```bash
# Ensure PostgreSQL is running
docker ps | grep postgres

# Check connection string
cat backend/.env | grep DATABASE_URL
```

**Experiments not running:**
```bash
# Check worker is running
ps aux | grep experiment-worker

# Check Redis connection
redis-cli ping

# View worker logs
npm run docker:logs
```

**Frontend can't connect to API:**
```bash
# Verify NEXT_PUBLIC_API_URL
cat frontend/.env.local

# Check CORS settings in backend
curl -I http://localhost:3001/health
```

**Tests failing:**
```bash
# Ensure dependencies are installed
npm install

# Run tests in verbose mode
cd backend && npm run test -- --reporter=verbose
```

## License

MIT

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass (`npm test`)
5. Submit a pull request

For major changes, please open an issue first to discuss the proposed changes.
