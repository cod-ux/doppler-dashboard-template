# Doppler Dashboard Template

A customizable Next.js dashboard template for integrating with the Doppler API to optimize your prompts. This template allows you to view eval results, trigger prompt optimization tasks, and deploy optimized prompts to production.

## 🚀 Features

- **📊 Eval Results Management**: View and select evaluation results from your data source
- **⚙️ Optimization Tasks**: Submit prompts to Doppler for AI-powered optimization
- **🔍 Results Viewer**: Compare original vs optimized prompts with detailed diff view
- **🚀 Deployment Integration**: Deploy optimized prompts to your production systems
- **📈 Dashboard Metrics**: Track optimization progress with real-time metrics
- **🔧 Fully Customizable**: Modular architecture for easy customization

## 🏗️ Architecture

This template uses a modular architecture with clearly separated concerns:

- **Data Source Layer**: Configurable adapters for your eval data (`lib/data-source.ts`)
- **Field Mapping**: Maps your schema to Doppler's API format (`lib/mapping.ts`)
- **API Integration**: Handles Doppler API communication (`lib/api.ts`)
- **Deployment**: Customizable deployment logic (`lib/deploy.ts`)
- **UI Components**: Reusable React components with Tailwind CSS

## 🛠️ Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd doppler-dashboard-template
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and configure your settings:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Required: Your Doppler API key (server-side only - no NEXT_PUBLIC prefix)
DOPPLER_API_KEY=your_doppler_api_key_here

# Optional: Custom API base URL (server-side only)
DOPPLER_API_BASE=https://api.doppler.com
```

### 3. Configure Your Data Source

Edit `lib/data-source.ts` to connect to your eval data:

```typescript
// Option 1: Use the mock data source (for testing)
export const dataSource = new MockEvalDataSource();

// Option 2: Connect to your database
export const dataSource = new DatabaseEvalDataSource("your-connection-string");

// Option 3: Connect to your API
export const dataSource = new ApiEvalDataSource("https://your-api.com", "your-api-key");
```

### 4. Configure Field Mappings

Edit `lib/mapping.ts` to map your eval data fields to Doppler's expected format:

```typescript
export const DEFAULT_EVAL_FIELD_MAPPING: FieldMapping = {
  // Doppler field -> Your field name
  task: 'your_task_field',
  prompt: 'your_prompt_field',
  target_model: 'your_model_field',
  agent_type: 'your_agent_type_field',
  // ... other mappings
};
```

### 5. Configure Deployment (Optional)

Edit `lib/deploy.ts` to customize how optimized prompts are deployed:

```typescript
// Use the mock deployer for testing
export const deployer = new MockPromptDeployer();

// Or implement your own deployment logic
export const deployer = new ApiPromptDeployer("https://your-deployment-api.com", "your-api-key");
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## 📝 Doppler API Reference

This template integrates with the Doppler API using the following endpoints:

### Create Optimization Task

**POST** `/create_task`

Creates a new optimization task for your prompt.

**Headers:**
- `api-key`: Your Doppler API key
- `Content-Type`: application/json

**Request Body:**
```json
{
  "task": "Description of what you want to optimize",
  "target_model": "gpt-4.1",
  "prompt": "Your prompt to optimize",
  "agent_type": "outbound" | "inbound",
  "user_persona": "Description of user type",
  "test_criteria": "Success criteria for optimization",
  "transcript": "Sample conversation",
  "provided_variables": {
    "variable_name": "value"
  },
  "tool_schema": [
    {
      "name": "tool_name",
      "description": "Tool description",
      "parameters": { /* OpenAI tool schema */ }
    }
  ]
}
```

**Response:**
```json
{
  "task_id": "unique-task-identifier"
}
```

### Get Optimization Results

**GET** `/get_results/{task_id}`

Retrieves the results of an optimization task.

**Headers:**
- `api-key`: Your Doppler API key

**Response:**
```json
{
  "status": "completed" | "running" | "pending" | "failed",
  "result": {
    "task": { /* Original task data */ },
    "passed": true,
    "final_prompt": "Optimized prompt content",
    "task_summary": "Summary of optimization",
    "iterations": [
      {
        "iteration_number": 1,
        "prompt_content": "Prompt for this iteration",
        "test_result": {
          "passed": true,
          "reason": "Why it passed/failed",
          "conversation": [ /* Test conversation */ ]
        }
      }
    ]
  },
  "error": null
}
```

## 🏗️ Architecture

### CORS Handling

This template solves CORS issues by using Next.js API routes (`app/api/doppler/`) as a proxy to the Doppler API. This means:

- ✅ API calls are made server-side, avoiding CORS restrictions
- ✅ Your API key is kept secure on the server
- ✅ No need to configure CORS on the Doppler API
- ✅ Works in all deployment environments

The flow is: **Browser → Next.js API Route → Doppler API → Next.js API Route → Browser**

## 🎨 Customization Guide

### Adding Custom Data Sources

Implement the `EvalDataSource` interface:

```typescript
export class YourCustomDataSource implements EvalDataSource {
  async getAllEvals(): Promise<EvalRow[]> {
    // Your implementation
  }

  async getEvalById(id: string): Promise<EvalRow | null> {
    // Your implementation
  }
}
```

### Custom Field Mappings

The template automatically detects variables (fields starting with `var_` or `variable_`) and tools (stored in `tools`, `tool_schema`, or `available_tools` fields). You can customize this logic in `lib/mapping.ts`.

### Custom Deployment Logic

Extend the `PromptDeployer` class:

```typescript
export class YourCustomDeployer extends PromptDeployer {
  async deploy(promptId: string, optimizedPrompt: string, target: DeploymentTarget): Promise<DeploymentResult> {
    // Your deployment logic
  }

  async getAvailableTargets(): Promise<DeploymentTarget[]> {
    // Return your deployment targets
  }
}
```

### Styling and UI

The template uses Tailwind CSS and shadcn/ui components. Customize the look by:

1. Modifying Tailwind classes in components
2. Updating the color scheme in `tailwind.config.js`
3. Adding custom CSS in `app/globals.css`

## 📊 Sample Data Format

Your eval data should follow this general structure:

```json
{
  "id": "unique-eval-id",
  "task_description": "What this eval is testing",
  "prompt_content": "The prompt to optimize",
  "model_name": "gpt-4.1",
  "agent_type": "inbound",
  "user_persona": "Type of user being simulated",
  "success_criteria": "What constitutes success",
  "conversation_log": "Sample conversation",
  "var_customer_name": "John Doe",
  "var_account_id": "ACC123",
  "tools": "[{\"name\":\"tool_name\",\"description\":\"...\"}]"
}
```

## 🔧 Development

### Project Structure

```
doppler-dashboard-template/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main dashboard page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── MetricHeader.tsx  # Dashboard metrics
│   ├── EvalTable.tsx     # Eval results table
│   ├── TaskList.tsx      # Task tracker
│   └── PromptDiffViewer.tsx # Results viewer
├── lib/                  # Core logic
│   ├── api.ts           # Doppler API integration
│   ├── data-source.ts   # Data source adapters
│   ├── mapping.ts       # Field mapping logic
│   ├── deploy.ts        # Deployment logic
│   ├── types.ts         # TypeScript types
│   └── utils.ts         # Utility functions
├── .env.example         # Environment variables template
└── README.md           # This file
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 🚨 Important Notes

### Data Persistence

The template uses **file-based storage** for task persistence, storing tasks in a JSON file (`data/tasks.json`) within the repository. The data includes:

- Task IDs and status (pending, running, completed, failed)
- Full optimization results when completed
- Error messages and timestamps
- Original eval IDs that were optimized

**File Storage Features:**
- Tasks are automatically saved to `data/tasks.json` when created or updated
- The `data/` directory is added to `.gitignore` to avoid committing task data
- File operations happen server-side via API routes (`/api/tasks`)
- Automatic backup and recovery of task data

**For production use, you should:**
1. Consider implementing proper database storage for better scalability
2. Add user authentication and authorization
3. Implement proper error handling and logging
4. Set up regular backups of the task data file

### Security Considerations

- Never expose your Doppler API key in client-side code
- Implement proper authentication for your dashboard
- Validate and sanitize all user inputs
- Use HTTPS in production

### Performance

- The template polls for task results every 5 seconds
- Consider implementing WebSocket connections for real-time updates
- Add pagination for large datasets
- Implement caching for frequently accessed data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This template is provided under the MIT License. See LICENSE file for details.

## 🆘 Support

For issues with this template:
1. Check the troubleshooting section below
2. Search existing GitHub issues
3. Create a new issue with detailed information

For Doppler API support:
- Visit the [Doppler API Documentation](https://docs.doppler.com)
- Contact Doppler support

## 🔍 Troubleshooting

### Common Issues

**"Cannot find module" errors**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**API key not working**
- Verify your API key is correct
- Check that it's set in the right environment file (`.env.local` for development)
- Ensure the API key has the necessary permissions

**Data not loading**
- Check your data source configuration
- Verify your field mappings match your data structure
- Check the browser console for error messages

**Tasks not updating**
- Verify your Doppler API key is valid
- Check network connectivity
- Look for error messages in the browser console

**CORS errors**
- This template uses Next.js API routes to avoid CORS issues
- Make sure your API key is set in `.env.local` (not `.env`)
- Ensure you're using `DOPPLER_API_KEY` (not `NEXT_PUBLIC_DOPPLER_API_KEY`)
- Restart your development server after changing environment variables

### Getting Help

If you encounter issues:

1. **Check the console**: Open browser developer tools and look for error messages
2. **Verify configuration**: Double-check your environment variables and field mappings
3. **Test with mock data**: Use the `MockEvalDataSource` to verify the template works
4. **Check API responses**: Use browser network tab to inspect API calls

## 🎯 Next Steps

After setting up the template:

1. **Test with mock data**: Verify everything works with the included sample data
2. **Connect your data source**: Implement your custom data source adapter
3. **Configure field mappings**: Map your data fields to Doppler's format
4. **Set up deployment**: Configure how optimized prompts get deployed
5. **Customize the UI**: Modify the design to match your brand
6. **Add authentication**: Implement user authentication for production use
7. **Deploy to production**: Host your dashboard on your preferred platform

---

Happy prompt optimizing! 🚀 