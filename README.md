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

**For mobile/network access**, run with the `--hostname` flag to bind to all network interfaces:

```bash
npm run dev -- --hostname 0.0.0.0
```

Then access from mobile using your PC's IP: `http://192.168.x.x:3000`

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
