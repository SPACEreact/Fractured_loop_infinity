import React from "react";
import { ThemeProvider, useTheme } from "./theme/ThemeContext";
import "./global.css";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button className="theme-toggle" onClick={toggleTheme}>
      {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
    </button>
  );
}

function MainContent() {
  // Example: Replace with your actual app functions/components!
  return (
    <div className="scrollable">
      <section className="hero">Fractured Loop Infinity</section>
      <section className="section">
        <h2>All Functions</h2>
        <p>
          Every app feature should be clearly visible and easy to access.
          Structure your functions in scrollable sections or cards for clarity.
        </p>
        {/* Example function cards/components */}
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
          <div className="section" style={{ flex: 1 }}>
            <h3>Function 1</h3>
            <p>Describe what this function does...</p>
          </div>
          <div className="section" style={{ flex: 1 }}>
            <h3>Function 2</h3>
            <p>Describe what this function does...</p>
          </div>
        </div>
      </section>
      <section className="section">
        <h2>Scroll & Parallax</h2>
        <p>
          Apple-inspired smooth scrolling, transitions, and parallax backgrounds.
        </p>
      </section>
      {/* Add more sections for other features/functions */}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <header className="header">ai director &mdash; Apple-Style Redesign</header>
      <ThemeToggle />
      <MainContent />
    </ThemeProvider>
  );
}