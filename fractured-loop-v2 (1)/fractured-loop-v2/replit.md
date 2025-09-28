# Fractured Loop - AI Assistant Director

## Overview
An AI-powered assistant for film and video production tasks including scriptwriting, storyboarding, and character creation. The application provides three main modes:
- **Sandbox Mode**: Free-form brainstorming with AI assistance
- **Guided Workflows**: Step-by-step processes for specific outcomes
- **Quantum Box**: Visual concept mapping with weighted relationships

## Recent Changes
- **2025-09-28**: Successfully imported and set up project in Replit environment
- Migrated from CDN-based imports to npm dependencies with Vite
- Set up TypeScript compilation and React development environment
- Configured deployment for autoscale hosting
- Created placeholder Gemini AI service (requires API key setup)

## User Preferences
None specified yet.

## Project Architecture
- **Frontend**: React 19 with TypeScript
- **Build System**: Vite for development and building
- **Styling**: TailwindCSS via CDN
- **AI Integration**: Google Generative AI (Gemini) - requires VITE_API_KEY
- **Deployment**: Autoscale deployment with static build

### Key Files
- `index.html`: Main HTML entry point with TailwindCSS
- `App.tsx`: Main React application component
- `services/geminiService.ts`: AI integration service (currently placeholder)
- `types.ts`: TypeScript type definitions
- `constants.tsx`: Application constants and configuration
- `components/`: React components for different app modes

### Setup Requirements
1. Add Google AI API key as `VITE_API_KEY` environment variable
2. Run `npm install` to install dependencies
3. Run `npm run dev` for development server
4. Run `npm run build` for production build

## Current State
- ✅ Application successfully running in development mode
- ✅ All TypeScript compilation issues resolved  
- ✅ Vite development server configured on port 5000
- ✅ Deployment configuration set up for autoscale
- ⏳ Google AI integration requires API key configuration
- ⏳ Production deployment ready when API key is added