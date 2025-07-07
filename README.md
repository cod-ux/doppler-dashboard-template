# Doppler Dashboard

Next.js dashboard for prompt optimization using the Doppler API. View eval results, run optimization tasks, and track results.

## Setup

### 1. Install
```bash
npm install
```

### 2. Environment Variables
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
DOPPLER_API_KEY=your_api_key_here
```

### 3. Run
```bash
npm run dev
```

## Customization

### Data Source (`lib/data-source.ts`)

Connect to your eval data:

```typescript
// Mock data (default)
export const defaultDataSource = new MockEvalDataSource();

// Database
export const defaultDataSource = new DatabaseEvalDataSource("connection-string");

// API
export const defaultDataSource = new ApiEvalDataSource("https://api.example.com", "api-key");
```

### Field Mapping (`lib/mapping.ts`)

Map your data fields to Doppler format:

```typescript
export const DEFAULT_EVAL_FIELD_MAPPING: FieldMapping = {
  task: 'your_task_field',
  prompt: 'your_prompt_field', 
  target_model: 'your_model_field',
  agent_type: 'your_agent_type_field',
  user_persona: 'your_persona_field',
  test_criteria: 'your_criteria_field',
  transcript: 'your_transcript_field'
};
```

### Deployment (`lib/deploy.ts`)

Configure how optimized prompts get deployed:

```typescript
// Mock deployment (default)
export const deployer = new MockPromptDeployer();

// Custom deployment
export const deployer = new ApiPromptDeployer("https://deploy-api.com", "api-key");
```

### API Integration (`lib/api.ts`)

Handles Doppler API calls. Customize base URL if needed:

```typescript
const DOPPLER_API_BASE = process.env.DOPPLER_API_BASE || 'https://api.doppler.com';
```

## Data Format

Your eval data should include:

```json
{
  "id": "eval-1",
  "task_description": "What to optimize",
  "prompt_content": "Current prompt",
  "model_name": "gpt-4.1",
  "agent_type": "inbound|outbound",
  "user_persona": "User description",
  "success_criteria": "Success definition",
  "conversation_log": "Sample conversation",
  "var_*": "Variables (auto-detected)",
  "tools": "Tool schema JSON string"
}
```

## Doppler API

The dashboard uses these endpoints:

- **POST** `/create_task` - Start optimization
- **GET** `/get_results/{task_id}` - Get results

Full API reference: [docs.dopplr.dev](https://docs.dopplr.dev)

## File Structure

```
├── app/                 # Next.js pages
├── components/          # React components  
├── lib/
│   ├── data-source.ts  # Data connection
│   ├── mapping.ts      # Field mapping
│   ├── api.ts          # Doppler API
│   ├── deploy.ts       # Deployment
│   └── types.ts        # TypeScript types
└── data/               # Task storage (auto-created)
```

## Key Features

- **Multi-select**: Select and run multiple tasks
- **Real-time tracking**: Monitor optimization progress  
- **Diff viewer**: Compare original vs optimized prompts
- **Task persistence**: File-based storage in `data/tasks.json`
- **CORS handling**: Server-side API proxy

## Production Notes

- Implement proper database storage
- Add authentication
- Use HTTPS
- Set up monitoring

For detailed API documentation: [docs.dopplr.dev](https://docs.dopplr.dev) 