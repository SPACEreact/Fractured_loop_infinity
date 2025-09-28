n          </div>

        </div>
      </main>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="glass-card rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gradient">How the Node System Works</h2>
              <button
                onClick={() => setShowHelp(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="text-gray-300 space-y-4 leading-relaxed">
              <p>
                The Quantum Box uses a powerful node-based system for visual concept mapping and AI prompt generation. Here's how it works:
              </p>
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">1. Creating Nodes</h3>
                  <p>Nodes represent different concepts, parameters, or ideas. You can create input nodes (like character traits, settings, or styles) and connect them to build complex relationships.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">2. Node Types</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Text Nodes:</strong> Free-form input for concepts, descriptions, or ideas</li>
                    <li><strong>Option Nodes:</strong> Predefined choices for specific parameters like shot types or lighting styles</li>
                    <li><strong>Output Nodes:</strong> The final destination where you generate AI prompts</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">3. Weighting System</h3>
                  <p>Each node can be weighted to influence how strongly it affects the final output. Higher weights make concepts more prominent in generated prompts.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">4. Connections</h3>
                  <p>Connect nodes by dragging from one to another. The connections determine how concepts flow and combine in your creative process.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">5. Generating Output</h3>
                  <p>Connect your nodes to an AI Prompt Output node and select the type of content you want to generate: images, videos, stories, or batch prompts.</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-6">
                Experiment with different connections and weights to discover unique creative combinations!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
