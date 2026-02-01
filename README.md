# AI-First Authoring Suite

An AI-first story creation web application that empowers you to build narratives from scratch with AI assistance. Create stories, characters, and locations interactively with multiple uncensored AI models, live entity management, and advanced story continuation tools.

## 🌟 Features

### Core AI-First Workflow
- **Start from Scratch**: No imports needed - create stories directly with AI guidance
- **Multiple AI Models**: Switch between uncensored models (WizardLM, Llama 3, Dolphin) for creative flexibility
- **Live Entity Creation**: Build characters and locations on-the-fly as your story develops
- **Interactive Story Continuation**: AI-powered narrative generation with full context awareness
- **In-Context Instructions**: Use `[ --- note ]` markers to guide AI behavior inline
- **Iterative Revision**: Provide feedback and refine generated content without editing raw text

### Advanced Features
- **Character Manager**: Create, edit, and manage character profiles with traits and personalities
- **Location Manager**: Build your story world with detailed location descriptions
- **Model Selector**: Choose from multiple AI models optimized for creative fiction
- **Story Branching**: Explore alternative scenarios without losing progress
- **Draft Management**: Save, version, and restore story continuations
- **Tags & Notes**: Organize scenes with tags and private author notes
- **Dark/Light Mode**: Toggle between dark and light themes

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), Material UI, React, TypeScript
- **Backend**: Next.js API Routes (Node.js)
- **Database**: Supabase (PostgreSQL)
- **AI**: Local LLM via Ollama (multiple uncensored models supported)
- **File Processing**: mammoth (DOCX parsing - legacy feature)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0 or higher ([Download](https://nodejs.org/))
- **Ollama** ([Installation Guide](https://ollama.ai/))
- **Supabase Account** ([Sign up](https://supabase.com/))
- **Git** (for cloning the repository)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Tanveerfb/ai-story-manager.git
cd ai-story-manager
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Ollama

Ollama is a local LLM runtime that runs AI models on your machine.

#### Install Ollama

- **macOS/Linux**: 
  ```bash
  curl -fsSL https://ollama.ai/install.sh | sh
  ```

- **Windows**: 
  1. Download the Windows installer from [ollama.ai](https://ollama.ai/)
  2. Run the installer (OllamaSetup.exe)
  3. Ollama will be installed and automatically start as a Windows service
  4. The service runs on `http://localhost:11434` by default
  5. **For mobile/network access**: Configure Windows Firewall:
     - Open Windows Defender Firewall
     - Click "Advanced settings"
     - Add a new Inbound Rule for TCP port 11434
     - Allow connections from your local network (192.168.x.x)

#### Pull Recommended Models

For the best AI-first authoring experience, install one or more uncensored models:

```bash
# Recommended: Large, high-quality model
ollama pull llama3.1:70b

# Fast and efficient
ollama pull llama3.1:8b

# Uncensored creative models
ollama pull wizardlm-uncensored
ollama pull dolphin-llama3
ollama pull llama3-uncensored
```

**Note**: The application supports model switching, so you can install multiple models and choose the best one for each scene.

#### Start Ollama Server

```bash
ollama serve
```

The server will start on `http://localhost:11434` by default.

### 4. Set Up Supabase

#### Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and create an account
2. Create a new project
3. Wait for the project to be set up

#### Run Database Migration

1. Go to the SQL Editor in your Supabase dashboard
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and execute the SQL to create all tables

#### Get Your API Keys

1. Go to Project Settings > API
2. Copy your Project URL and anon/public key

### 5. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:70b

# Optional: Enable unrestricted content generation for mature/adult fiction
# OLLAMA_UNRESTRICTED_MODE=true

# Quality-focused AI settings
AI_TEMPERATURE=0.82
AI_TOP_P=0.92
AI_TOP_K=50
AI_MAX_TOKENS=1500
AI_REPEAT_PENALTY=1.1
AI_NUM_CTX=8192
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**For mobile/network access**, run with the `--hostname` flag to bind to all network interfaces:

```bash
npm run dev -- --hostname 0.0.0.0
```

Then access from mobile using your PC's IP: `http://192.168.x.x:3000`

## 📖 Usage Guide

### Getting Started with AI-First Story Creation

When you launch the application, you'll land directly on the **Continue Story** page - your central creative workspace.

### Creating Your First Story

1. **Select Your AI Model**
   - Click the "AI Model" dropdown at the top
   - Choose from available models (Llama 3.1, WizardLM-uncensored, Dolphin, etc.)
   - Larger models (70B) provide better quality but are slower
   - Smaller models (8B) are faster for quick iterations

2. **Create Characters**
   - Click the **Add** button in the Characters panel
   - Fill in character details: name, role, personality, traits, description
   - Characters are automatically available for story context

3. **Create Locations**
   - Click the **Add** button in the Locations panel
   - Define location name, type, description, and atmosphere
   - Locations enrich your story's setting and context

4. **Write Your First Prompt**
   - Enter what you want to happen in the story
   - Use `[ --- note ]` markers for inline AI instructions
   - Example: `[ --- Make this scene tense ] The detective enters the dark warehouse...`
   - Optionally select a character to focus the narrative

5. **Generate Story Content**
   - Click **Generate** to create your story continuation
   - AI uses context from characters, locations, and previous parts
   - Wait for generation (30-90 seconds depending on model)

6. **Refine and Iterate**
   - Review the generated content
   - Use the feedback panel to revise: "Make the dialogue more natural"
   - Edit the text directly in the editor
   - Save as draft or insert into your story

### Advanced Features

#### In-Context Markers
Use `[ --- note ]` anywhere in your prompt to guide the AI:
- `[ --- Write this from Emma's perspective ]`
- `[ --- Make this scene intense and emotional ]`
- `[ --- Include detailed description of the setting ]`

#### Model Switching
Switch models mid-story to find the perfect voice:
- Use larger models for important scenes
- Use faster models for quick drafts
- Each model has unique creative characteristics

#### Story Branching
- Save your current draft
- Click **Create Branch** to explore alternative scenarios
- Return to main story or continue the branch
- Never lose progress when experimenting

#### Tags and Notes
- Tag scenes: Draft, Climax, Character Development, etc.
- Add private notes about creative decisions
- Classify scene type: Action, Dialogue, Description

### Managing Your Story

#### View Story Parts
1. Navigate to **Story Viewer** from the sidebar
2. Browse all story parts in order
3. Search and filter content
4. Each generated continuation can be inserted as a new part

#### Character Management
1. Navigate to **Characters** from the sidebar
2. View all characters with details
3. Edit or delete characters as needed
4. Characters created live are immediately available

#### Location Management
1. Navigate to **Locations** from the sidebar
2. Browse and manage all locations
3. Edit descriptions and atmosphere
4. Locations enrich AI-generated context

## ⚙️ AI Configuration

### Supported Models

The AI-First Authoring Suite supports multiple uncensored models optimized for creative fiction:

| Model | Size | Best For | Speed |
|-------|------|----------|-------|
| Llama 3.1 (70B) | 70B | High-quality detailed narratives | Slow |
| Llama 3.1 (8B) | 8B | Quick iterations and drafts | Fast |
| WizardLM Uncensored | 13B | Creative fiction without filters | Medium |
| Dolphin Llama 3 | 8B | Balanced versatility | Fast |
| Llama 3 Uncensored | 8B | Community uncensored model | Fast |

### AI Quality Settings

The application is configured for maximum quality output:

- **Temperature (0.82)**: Balanced creativity and coherence
- **Top P (0.92)**: Nucleus sampling for diverse outputs
- **Top K (50)**: Token selection pool
- **Max Tokens (1500)**: Detailed, comprehensive responses
- **Context Window (8192)**: Large context for better coherence
- **Repeat Penalty (1.1)**: Reduces repetitive output

These settings prioritize quality over speed. Generation may take 30-90 seconds depending on your hardware.

## 🏗️ Architecture

### Core Workflow
The AI-First Authoring Suite focuses on interactive story creation:
1. **Continue Story Page** - Central workspace (default landing page)
2. **Entity Managers** - Live character and location creation
3. **AI Generation** - Model-aware story continuation with context
4. **Draft System** - Save, branch, and version your work

### Database Schema

- **story_parts**: Stores story content with metadata
- **characters**: Character profiles and attributes (created live or via API)
- **locations**: Story locations (created live or via API)
- **continuation_drafts**: Saved drafts with tags and notes
- **continuation_history**: Version history for iterative revision
- **continuation_branches**: Alternative story scenarios
- **relationships**: Character relationships
- **events**: Story events linked to characters and locations

### API Routes

#### Core AI-First Routes
- `GET /api/models`: List available Ollama models
- `POST /api/continue`: Generate/revise story continuations (supports model selection)
- `GET/POST/PUT/DELETE /api/characters`: Manage characters (live CRUD)
- `GET/POST/PUT/DELETE /api/locations`: Manage locations (live CRUD)
- `GET/POST/DELETE /api/story-parts`: Manage story parts

#### Legacy Routes (for existing content)
- `POST /api/import-story`: Import and process DOCX files (hidden from UI)
- `POST /api/extract-entities`: Extract entities from text

## 🔒 Privacy & Security

- **Local AI**: All AI processing happens locally via Ollama - no data sent to third parties
- **Self-Hosted Database**: Use Supabase cloud or self-host your database
- **Multiple Models**: Switch between uncensored models for unrestricted creative freedom
- **Complete Control**: All your data stays under your control

### Unrestricted Content Mode

The application supports uncensored AI models by default. To enable unrestricted mode for all models:

1. Add the following to your `.env.local` file:
   ```env
   OLLAMA_UNRESTRICTED_MODE=true
   ```

2. Restart your development server

**⚠️ WARNING**: Enabling unrestricted mode removes content restrictions for story generation. This is intended for mature/adult fiction writing. You take full responsibility for all generated content. Use responsibly and in accordance with applicable laws.

**Note**: Some model refusals may still occur due to:
- Hard-coded filters in specific model variants
- Ollama server-level filtering (rare)
- Model fine-tuning that includes content restrictions

If you continue to experience unwanted content refusals with unrestricted mode enabled, consider:
- Using a different Llama model variant (e.g., community models without restrictions)
- Checking Ollama server configuration
- Using alternative models designed for creative fiction writing

## 📱 Mobile Access Guide

You can access the web application from your mobile device on the same local network.

### Setup for Mobile Access

#### 1. Find Your PC's Local IP Address

**Windows:**
```bash
ipconfig
# Look for "IPv4 Address" under your active network adapter
# Usually starts with 192.168.x.x or 10.0.x.x
```

**macOS/Linux:**
```bash
ifconfig
# Look for "inet" under your active network adapter (en0, wlan0, etc.)
# Or use: hostname -I
```

#### 2. Configure Ollama for Network Access

Update your `.env.local` file:

```env
# Change from localhost to your PC's local IP
OLLAMA_API_URL=http://192.168.x.x:11434  # Replace x.x with your actual IP (e.g., 192.168.1.100)
```

**Security Note**: This uses HTTP (unencrypted) which is acceptable for local network usage. However, avoid transmitting highly sensitive data over this connection. The traffic is only on your local network and not exposed to the internet.

**Windows Users**: Ensure Windows Firewall allows connections to port 11434 (see Ollama installation section above).

**macOS/Linux Users**: Ollama listens on localhost by default. To allow network access:
```bash
# Set environment variable before starting Ollama
export OLLAMA_HOST=0.0.0.0:11434
ollama serve
```

#### 3. Run Next.js with Network Binding

```bash
npm run dev -- --hostname 0.0.0.0
```

This allows the web app to be accessed from other devices on your network.

#### 4. Access from Mobile

On your mobile device:
1. Connect to the **same WiFi network** as your PC
2. Open browser and navigate to: `http://192.168.x.x:3000` (replace x.x with your PC's actual IP, e.g., `http://192.168.1.100:3000`)
3. The app should load and work normally
4. AI generation will use Ollama running on your PC

### Mobile Access Troubleshooting

- **Cannot connect to web app**: 
  - Verify mobile device is on same WiFi network
  - Check if PC firewall allows incoming connections on port 3000
  - **Windows**: Add inbound rule for TCP port 3000 in Windows Firewall (similar to Ollama setup)
  - **macOS**: System Settings > Network > Firewall > Options > Allow port 3000
  - **Linux**: Configure iptables/ufw to allow port 3000: `sudo ufw allow 3000/tcp`
  
- **Web app loads but AI generation fails**:
  - Verify OLLAMA_API_URL in .env.local uses PC's local IP, not localhost
  - Check Ollama is running: `ollama list`
  - Verify firewall allows port 11434 (add inbound rule if needed)
  
- **Slow mobile performance**:
  - Normal - AI generation happens on PC, which may take 30-90 seconds
  - Ensure PC remains active and not in sleep mode
  - Consider using a smaller model (llama3.1:8b) for faster responses

## 🐛 Troubleshooting

### Ollama Connection Issues

- Ensure Ollama is running: `ollama serve`
- Check if the model is downloaded: `ollama list`
- Verify the API URL in `.env.local`

### Supabase Connection Issues

- Verify your API keys in `.env.local`
- Check that the database migration ran successfully
- Ensure your Supabase project is active

### Import Failing

- Ensure the file is a valid `.docx` file
- Check that Ollama is running and the model is available
- Check browser console and server logs for errors

### Slow Generation

- This is expected with llama3.1:70b on consumer hardware
- Consider using a smaller model like llama3.1:8b for faster inference
- Ensure your system meets the requirements for running large LLMs

## 🤝 Contributing

This is a personal project, but contributions are welcome! Feel free to open issues or submit pull requests.

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Material-UI](https://mui.com/)
- Database by [Supabase](https://supabase.com/)
- Local AI powered by [Ollama](https://ollama.ai/)
