# DecipathAI
<p align="center">
  <img src="https://github.com/user-attachments/assets/1c1249cc-7512-4f08-99ea-63cafaeb99e5" width="48%">
  <img src="https://github.com/user-attachments/assets/746446a1-2153-4d9d-8a98-844020ad160e" width="48%">
</p>
<br/>

**Create AI-Powered Roadmaps for Anything You Can Think Of**

DecipathAI is an intelligent roadmap generation platform that transforms your goals into comprehensive, interactive visual pathways. Whether you're planning a career transition, learning a new skill, or mapping out any complex journey, DecipathAI leverages advanced AI to create detailed, personalized roadmaps that guide you from where you are to where you want to be.

---

## What is DecipathAI?

I built DecipathAI to solve a simple problem: **how do you get from point A to point B when the path isn't clear?** 

Traditional roadmaps are static and generic. DecipathAI is different. It generates dynamic, intelligent pathways tailored to your specific situation and goals. Each roadmap is a living document—an interactive mind map that breaks down complex journeys into actionable nodes, complete with tasks, time estimates, and detailed guidance.

---

## Key Features

- **AI-Powered Generation**: Leverages Google's Gemini 1.5 Flash to create comprehensive roadmaps based on your current situation and desired outcome
- **Interactive Visualizations**: Beautiful, interactive node-based roadmaps built with ReactFlow
- **Detailed Path Planning**: Each node includes descriptions, time estimates, actionable tasks, and next steps
- **Theme Support**: Seamless dark/light mode with theme-aware styling
- **Secure Authentication**: User management powered by Clerk
- **Persistent Storage**: Save and retrieve your roadmaps using Prisma and PostgreSQL
- **Responsive Design**: Fully responsive interface that works across all devices

---

## How the AI Works

At the core of DecipathAI is a sophisticated AI pipeline that transforms abstract goals into concrete action plans.

### The Generation Process

**Input Analysis**: The system takes two primary inputs—your current situation and your desired outcome. Optionally, you can provide custom prompts for fine-tuned control.

**Structured Schema Generation**: Using Google's Generative AI SDK, I've implemented a strict JSON schema that ensures every roadmap contains nodes with labels, icons, descriptions, detailed explanations, time estimates, and actionable tasks, along with edges that create meaningful progression paths between nodes.

**Intelligent Prompt Engineering**: The AI receives carefully crafted prompts that instruct it to generate 10-15+ interconnected roadmap paths, create branching options with at least three divergence points, include convergent paths where different routes lead to common advanced stages, and provide realistic, achievable progressions tailored to the user's context.

**Layout Optimization**: Generated nodes and edges are processed through Dagre's hierarchical layout algorithm, creating clean, readable visualizations that automatically organize complexity.

---

## Architecture Overview

DecipathAI is built on a modern, scalable stack designed for performance and reliability.

### Frontend
- **Next.js 15**: React framework with App Router for optimal performance
- **TypeScript**: Type-safe development across the entire codebase
- **ReactFlow**: Powers the interactive node-based visualizations
- **Tailwind CSS + shadcn/ui**: Beautiful, accessible UI components
- **Framer Motion**: Smooth animations and transitions

### Backend & AI
- **Google Generative AI (Gemini 1.5 Flash)**: AI model for roadmap generation
- **Prisma ORM**: Type-safe database operations
- **PostgreSQL**: Reliable data persistence
- **Clerk**: Authentication and user management

### Data Flow
User inputs are transformed through AI prompt construction, sent to the Gemini API, validated against a strict schema, processed through a layout algorithm, and finally rendered as an interactive visualization. The application uses client-side React hooks for state management and server actions for database operations.

---

## Getting Started

### Prerequisites
- Node.js 18 or higher
- A Google AI API key
- Clerk authentication credentials

### Installation

```bash
# Clone the repository
git clone https://github.com/AbhinavMishra32/DecipathAI.git
cd DecipathAI

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your NEXT_PUBLIC_GEMINI_API_KEY and Clerk keys

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application in action.

---

## Usage

1. **Define Your Starting Point**: Describe where you currently are
2. **Set Your Goal**: Specify what you want to achieve
3. **Customize (Optional)**: Add specific requirements or constraints
4. **Generate**: Let the AI create your personalized roadmap
5. **Explore**: Navigate the interactive mind map, click nodes for detailed tasks
6. **Save**: Store your roadmap for future reference

---

## Built With

- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Google Generative AI](https://ai.google.dev/) - AI capabilities
- [ReactFlow](https://reactflow.dev/) - Interactive diagrams
- [Clerk](https://clerk.com/) - Authentication
- [Prisma](https://www.prisma.io/) - Database ORM
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - UI components

---

## License

This project is private and proprietary. All rights reserved.

---

## Author

**Abhinav Mishra**

I created DecipathAI to make complex goal planning accessible to everyone. Whether you're charting a career path, planning a learning journey, or mapping out any complex endeavor, DecipathAI is here to illuminate your way forward.

---

## Acknowledgments

Built with modern web technologies and powered by Google's Generative AI. Special thanks to the open-source community for the amazing tools that made this possible.
