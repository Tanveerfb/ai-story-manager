# AI Story Manager

A comprehensive story management web application that allows importing existing story content from DOCX files, automatically extracts characters/locations/events using local AI, stores everything in a structured database, and enables AI-powered story continuation with full context awareness.

## 🌟 Features

- **DOCX Import**: Upload story files and automatically parse content
- **AI Entity Extraction**: Automatically extract characters, locations, events, and relationships using Ollama
- **Story Viewer**: Browse all story parts with search and filtering
- **AI Story Continuation**: Continue your story with full context awareness
- **Character Management**: View and manage character profiles, traits, and relationships
- **Location Management**: Track all locations mentioned in your stories
- **Timeline View**: Visualize story events chronologically
- **Dark/Light Mode**: Toggle between dark and light themes
- **Quality-Focused AI**: Optimized for best AI output quality using llama3.1:70b

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), Material UI, React, TypeScript
- **Backend**: Next.js API Routes (Node.js)
- **Database**: Supabase (PostgreSQL)
- **AI**: Local LLM via Ollama (llama3.1:70b)
- **File Processing**: mammoth (DOCX parsing)

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

- **Windows**: Download from [ollama.ai](https://ollama.ai/)

#### Pull the Model

```bash
# Pull the llama3.1:70b model (recommended for quality)
ollama pull llama3.1:70b

# Or use a smaller model for faster inference
ollama pull llama3.1:8b
```

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

## 📖 Usage Guide

### Importing Stories

1. Navigate to **Import Story** from the sidebar
2. Upload a `.docx` file containing your story
3. Set the part number and optional title
4. Click **Import Story**
5. Wait for the AI to extract entities (this may take 30-90 seconds)
6. Review extracted characters, locations, events, and relationships

### Viewing Stories

1. Navigate to **Story Viewer** from the sidebar
2. Browse all imported story parts
3. Use the search bar to find specific content
4. Expand any part to view full content and summary

### Continuing Stories

1. Navigate to **Continue Story** from the sidebar
2. Enter a prompt describing what should happen next
3. Optionally select a character to focus on
4. Click **Generate Continuation**
5. Wait for the AI to generate content (30-90 seconds)
6. Review and optionally save as a new story part

### Managing Characters

1. Navigate to **Characters** from the sidebar
2. Browse all extracted characters
3. Filter by role (main, side, minor)
4. Click on a character to view full details
5. View personality traits, physical traits, and relationships

### Viewing Locations

1. Navigate to **Locations** from the sidebar
2. Browse all locations from your stories
3. Filter by type (indoor, outdoor, etc.)

### Timeline

1. Navigate to **Timeline** from the sidebar
2. View all story events chronologically
3. Filter by event type (dialogue, action, revelation)

## ⚙️ AI Quality Settings

The application is configured for maximum quality output:

- **Temperature (0.82)**: Balanced creativity and coherence
- **Top P (0.92)**: Nucleus sampling for diverse outputs
- **Top K (50)**: Token selection pool
- **Max Tokens (1500)**: Detailed, comprehensive responses
- **Context Window (8192)**: Large context for better coherence
- **Repeat Penalty (1.1)**: Reduces repetitive output

These settings prioritize quality over speed. Generation may take 30-90 seconds depending on your hardware.

## 🏗️ Architecture

### Database Schema

- **story_parts**: Stores story content with metadata
- **characters**: Character profiles and attributes
- **character_traits**: Detailed character traits
- **locations**: Story locations
- **events**: Story events linked to characters and locations
- **relationships**: Character relationships
- **story_context**: Additional context information

### API Routes

- `POST /api/import-story`: Import and process DOCX files
- `POST /api/continue-story`: Generate story continuations
- `POST /api/extract-entities`: Extract entities from text
- `GET/POST/PUT /api/characters`: Manage characters
- `GET/POST/PUT /api/locations`: Manage locations
- `GET /api/events`: Fetch story events
- `GET/POST/DELETE /api/story-parts`: Manage story parts

## 🔒 Privacy & Security

- **Local AI**: All AI processing happens locally via Ollama - no data sent to third parties
- **Self-Hosted Database**: Use Supabase cloud or self-host your database
- **No Content Filtering**: Local LLM allows for any content without restrictions
- **Complete Control**: All your data stays under your control

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
