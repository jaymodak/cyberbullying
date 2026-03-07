import React from "react";

// FIXED: This component now accepts `data` as a flat array of model results,
// matching what Home.jsx passes after calling setResults(modelsArray).
// Previously it expected data.models (an object) which was always undefined.

export default function Results({ data }) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  return (
    <div className="grid md:grid-cols-2 gap-6 mt-6 animate-fade-in">
      {data.map((result) => {
        const isDanger = result.severity === "High";
        const isSafe = result.category === "Safe";

        return (
          <div
            key={result.modelName}
            className={`bg-dark-card border border-dark-border p-6 rounded-2xl shadow-soft 
            ${isDanger ? "shadow-glow-danger" : ""}
            ${isSafe ? "shadow-glow-safe" : ""}
            transition-all`}
          >
            {/* Model Name */}
            <h2 className="text-xl font-semibold mb-3 text-primary-400">
              {result.modelName}
            </h2>

            {/* Probability */}
            <p className="text-dark-muted">
              Probability:
              <span className="ml-2 text-white font-medium">
                {(result.probability * 100).toFixed(2)}%
              </span>
            </p>

            {/* Category */}
            <p className="mt-2">
              Category:
              <span
                className={`ml-2 font-semibold
                ${isSafe ? "text-safe-500" : ""}
                ${isDanger ? "text-danger-500" : ""}
                `}
              >
                {result.category}
              </span>
            </p>

            {/* Severity */}
            <p className="mt-1 text-dark-muted">
              Severity:
              <span className="ml-2 text-white">
                {result.severity}
              </span>
            </p>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-dark-border rounded-full mt-4">
              <div
                className={`h-2 rounded-full transition-all
                  ${isDanger ? "bg-danger-500" : "bg-primary-500"}
                `}
                style={{ width: `${result.probability * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
