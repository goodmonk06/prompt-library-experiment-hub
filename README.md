# Prompt Library & Experiment Hub

A comprehensive platform for managing prompts, versions, and experiments across multiple LLM projects. Run evaluations, compare results, and iterate on your prompts with confidence.

## Features

- **Prompt Management**: Version-controlled prompt templates with support for variable substitution
- **Dataset Management**: Upload and manage evaluation datasets in JSONL format
- **Experiment Runner**: Automated testing of prompts against datasets using OpenAI models
- **Scoring System**: Automatic similarity metrics and optional LLM-as-judge evaluation
- **Dashboard UI**: Clean Next.js interface for managing all aspects of your experiments
- **Queue System**: BullMQ-powered background job processing for scalable experiment runs

## Tech Stack

- **Backend**: Fastify + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Queue**: BullMQ + Redis
- **LLM**: OpenAI API
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS

## Project Structure

```
prompt-library-experiment-hub/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── routes/                # API routes
│   │   │   ├── projects.ts
│   │   │   ├── prompts.ts
│   │   │   ├── datasets.ts
│   │   │   └── experiments.ts
│   │   ├── services/              # Business logic
│   │   │   ├── openai-service.ts
│   │   │   └── scoring-service.ts
│   │   ├── workers/               # Background workers
│   │   │   └── experiment-worker.ts
│   │   ├── lib/                   # Utilities
│   │   │   ├── prisma.ts
│   │   │   └── queue.ts
│   │   └── index.ts               # Server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/                   # Next.js app directory
│   │   │   ├── projects/          # Project pages
│   │   │   │   └── [id]/
│   │   │   │       ├── prompts/
│   │   │   │       ├── datasets/
│   │   │   │       └── experiments/
│   │   │   └── layout.tsx
│   │   ├── components/            # React components
│   │   └── lib/
│   │       └── api.ts             # API client
│   └── package.json
├── docker-compose.yml             # PostgreSQL + Redis
└── package.json                   # Workspace root
```

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd prompt-library-experiment-hub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start PostgreSQL and Redis**
   ```bash
   npm run docker:up
   ```

4. **Set up environment variables**

   Backend (`backend/.env`):
   ```env
   DATABASE_URL="postgresql://promptuser:promptpass@localhost:5432/prompthub?schema=public"
   REDIS_HOST="localhost"
   REDIS_PORT=6379
   OPENAI_API_KEY="your-openai-api-key-here"
   PORT=3001
   ```

   Frontend (`frontend/.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

5. **Run database migrations**
   ```bash
   npm run db:migrate
   npm run db:generate
   ```

6. **Start the services**

   In separate terminals:
   ```bash
   # Terminal 1: Backend API
   npm run dev:backend

   # Terminal 2: Worker
   npm run dev:worker

   # Terminal 3: Frontend
   npm run dev:frontend
   ```

7. **Open the dashboard**

   Navigate to http://localhost:3000

## Usage

### 1. Create a Project

Projects organize your prompts, datasets, and experiments.

```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer Support Bot",
    "description": "Automated customer support responses"
  }'
```

### 2. Create a Prompt

Prompts are templates with variable substitution using `{{variable}}` syntax.

```bash
curl -X POST http://localhost:3001/api/prompts \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "project-id",
    "name": "Support Response Template",
    "description": "Template for customer support responses"
  }'
```

### 3. Add a Prompt Version

```bash
curl -X POST http://localhost:3001/api/prompts/{promptId}/versions \
  -H "Content-Type: application/json" \
  -d '{
    "versionTag": "v1.0",
    "templateText": "You are a helpful customer support agent. Answer the following question:\n\n{{question}}\n\nProvide a clear and concise response."
  }'
```

### 4. Create a Dataset

```bash
curl -X POST http://localhost:3001/api/datasets \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "project-id",
    "name": "Support Questions",
    "description": "Common customer support questions"
  }'
```

### 5. Upload Evaluation Items

```bash
curl -X POST http://localhost:3001/api/datasets/{datasetId}/items \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "inputJson": "{\"question\": \"How do I reset my password?\"}",
        "expectedOutputJson": "\"To reset your password, click on Forgot Password on the login page.\""
      },
      {
        "inputJson": "{\"question\": \"What are your business hours?\"}",
        "expectedOutputJson": "\"We are open Monday-Friday, 9 AM - 5 PM EST.\""
      }
    ]
  }'
```

### 6. Create an Experiment

```bash
curl -X POST http://localhost:3001/api/experiments \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "project-id",
    "name": "GPT-3.5 Baseline",
    "description": "Baseline experiment with GPT-3.5",
    "model": "gpt-3.5-turbo"
  }'
```

### 7. Run an Experiment

```bash
curl -X POST http://localhost:3001/api/experiments/{experimentId}/runs \
  -H "Content-Type: application/json" \
  -d '{
    "promptVersionId": "version-id",
    "datasetId": "dataset-id"
  }'
```

The worker will process the experiment in the background, running each evaluation item through the LLM and calculating scores.

### 8. View Results

```bash
curl http://localhost:3001/api/experiments/{experimentId}/runs/{runId}
```

## Integration Examples

### Integration with `agent-benchmark-lab`

The agent-benchmark-lab can use this hub as its prompt backbone for managing agent prompts and running benchmarks.

```typescript
// agent-benchmark-lab/src/prompts/client.ts
import { promptsAPI } from 'prompt-hub-client';

export async function getAgentPrompt(agentName: string, version: string) {
  const prompts = await promptsAPI.list(process.env.PROJECT_ID);
  const prompt = prompts.find(p => p.name === agentName);

  if (!prompt) {
    throw new Error(`Prompt ${agentName} not found`);
  }

  const versions = await promptsAPI.getVersions(prompt.id);
  const targetVersion = versions.find(v => v.versionTag === version);

  return targetVersion.templateText;
}

export async function runBenchmark(agentName: string, version: string) {
  // Create experiment run
  const run = await experimentsAPI.createRun(EXPERIMENT_ID, {
    promptVersionId: versionId,
    datasetId: BENCHMARK_DATASET_ID
  });

  // Poll for results
  // ...
}
```

### Integration with `sns-content-autopilot`

The SNS content autopilot can manage its content generation prompts and test different variations.

```typescript
// sns-content-autopilot/src/generator.ts
import { promptsAPI, experimentsAPI } from 'prompt-hub-client';

export class ContentGenerator {
  async generatePost(topic: string, platform: string) {
    // Fetch latest prompt version from hub
    const prompt = await this.getLatestPrompt('social-post-generator');

    // Use prompt template
    const content = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{
        role: 'user',
        content: this.renderTemplate(prompt.templateText, { topic, platform })
      }]
    });

    return content.choices[0].message.content;
  }

  async testNewPromptVersion(versionId: string) {
    // Run A/B test using experiment hub
    return await experimentsAPI.createRun(CONTENT_EXPERIMENT_ID, {
      promptVersionId: versionId,
      datasetId: SAMPLE_TOPICS_DATASET_ID
    });
  }
}
```

### Integration with `cocoon-mental-platform`

The mental health platform can use the hub to manage therapeutic conversation prompts and ensure quality.

```typescript
// cocoon-mental-platform/src/therapy/prompts.ts
import { promptsAPI, datasetsAPI, experimentsAPI } from 'prompt-hub-client';

export class TherapyPromptManager {
  async getTherapistPrompt(scenario: string): Promise<string> {
    const prompts = await promptsAPI.list(THERAPY_PROJECT_ID);
    const scenarioPrompt = prompts.find(p => p.name === scenario);

    // Always use the latest approved version
    const versions = await promptsAPI.getVersions(scenarioPrompt.id);
    return versions[0].templateText;
  }

  async validateNewPrompt(promptText: string): Promise<ValidationResult> {
    // Create temporary version
    const version = await promptsAPI.createVersion(PROMPT_ID, {
      versionTag: `test-${Date.now()}`,
      templateText: promptText
    });

    // Run against safety dataset
    const run = await experimentsAPI.createRun(SAFETY_EXPERIMENT_ID, {
      promptVersionId: version.id,
      datasetId: SAFETY_DATASET_ID
    });

    // Wait for results and validate safety scores
    const results = await this.waitForRunCompletion(run.id);
    return this.analyzeSafety(results);
  }
}
```

## API Reference

### Projects

- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Prompts

- `GET /api/prompts?projectId=:id` - List prompts
- `POST /api/prompts` - Create prompt
- `GET /api/prompts/:id` - Get prompt details
- `PATCH /api/prompts/:id` - Update prompt
- `DELETE /api/prompts/:id` - Delete prompt
- `POST /api/prompts/:id/versions` - Create version
- `GET /api/prompts/:id/versions` - List versions

### Datasets

- `GET /api/datasets?projectId=:id` - List datasets
- `POST /api/datasets` - Create dataset
- `GET /api/datasets/:id` - Get dataset details
- `PATCH /api/datasets/:id` - Update dataset
- `DELETE /api/datasets/:id` - Delete dataset
- `POST /api/datasets/:id/items` - Upload items
- `GET /api/datasets/:id/items` - Get items

### Experiments

- `GET /api/experiments?projectId=:id` - List experiments
- `POST /api/experiments` - Create experiment
- `GET /api/experiments/:id` - Get experiment details
- `PATCH /api/experiments/:id` - Update experiment
- `DELETE /api/experiments/:id` - Delete experiment
- `POST /api/experiments/:id/runs` - Create run
- `GET /api/experiments/:id/runs` - List runs
- `GET /api/experiments/:id/runs/:runId` - Get run details
- `GET /api/experiments/:id/runs/:runId/results` - Get run results

## Database Schema

```prisma
model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  prompts            Prompt[]
  evaluationDatasets EvaluationDataset[]
  experiments        Experiment[]
}

model Prompt {
  id          String   @id @default(cuid())
  projectId   String
  name        String
  description String?
  versions    PromptVersion[]
}

model PromptVersion {
  id           String   @id @default(cuid())
  promptId     String
  versionTag   String
  templateText String   @db.Text
  createdAt    DateTime @default(now())
}

model EvaluationDataset {
  id          String   @id @default(cuid())
  projectId   String
  name        String
  description String?
  itemCount   Int      @default(0)
  items       EvaluationItem[]
}

model EvaluationItem {
  id                 String  @id @default(cuid())
  datasetId          String
  inputJson          String  @db.Text
  expectedOutputJson String? @db.Text
  tagsJson           String? @db.Text
}

model Experiment {
  id          String   @id @default(cuid())
  projectId   String
  name        String
  description String?
  model       String
  runs        ExperimentRun[]
}

model ExperimentRun {
  id               String    @id @default(cuid())
  experimentId     String
  promptVersionId  String
  datasetId        String
  status           String    @default("pending")
  startedAt        DateTime?
  finishedAt       DateTime?
  metricsJson      String?   @db.Text
  resultItems      ExperimentResultItem[]
}

model ExperimentResultItem {
  id               String  @id @default(cuid())
  runId            String
  evaluationItemId String
  outputJson       String  @db.Text
  scoreJson        String? @db.Text
}
```

## Scoring Metrics

### Automatic Metrics

- **Exact Match**: Binary score for exact string match (case-insensitive)
- **Similarity Score**: String similarity using Dice coefficient (0-1)

### LLM-as-Judge (Optional)

Enable LLM-based scoring for more nuanced evaluation:

```typescript
// backend/src/services/scoring-service.ts
await scoreResult({
  input,
  output,
  expectedOutput,
  useLLMJudge: true  // Enable GPT-4 judge
});
```

The LLM judge provides:
- Numerical score (0-100)
- Reasoning for the score

## Development

### Database Management

```bash
# Create migration
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Open Prisma Studio
cd backend && npm run db:studio
```

### Testing

```bash
# Run backend tests
cd backend && npm test

# Run frontend tests
cd frontend && npm test
```

## Deployment

### Docker Deployment

Build and deploy the entire stack:

```bash
# Build images
docker build -t prompt-hub-backend ./backend
docker build -t prompt-hub-frontend ./frontend

# Run with docker-compose
docker-compose up -d
```

### Environment Variables (Production)

```env
# Backend
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_HOST=redis-host
REDIS_PORT=6379
OPENAI_API_KEY=sk-...
PORT=3001
CORS_ORIGIN=https://your-frontend.com

# Frontend
NEXT_PUBLIC_API_URL=https://your-api.com
```

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PRs.

## License

MIT

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/your-org/prompt-library-experiment-hub/issues)
- Documentation: [View docs](https://docs.your-org.com)
