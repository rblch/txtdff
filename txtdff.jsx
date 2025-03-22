import React, { useState, useEffect } from 'react';
import _ from 'lodash';

// Main component
export default function TextDiffApp() {
  const [originalText, setOriginalText] = useState('');
  const [aiText, setAiText] = useState('');
  const [diffResult, setDiffResult] = useState([]);
  const [viewMode, setViewMode] = useState('side-by-side'); // 'side-by-side' or 'unified'
  const [diffLevel, setDiffLevel] = useState('word'); // 'word' or 'character'
  
  // Example text for demonstration
  const exampleOriginal = "This is the original text. It contains some information that might be rewritten or improved by an AI system. Some sentences might remain the same, while others could be significantly altered.";
  const exampleAI = "This is the AI-enhanced text. It contains information that has been rewritten and improved by an AI system. Some sentences remain the same, while others have been significantly enhanced for clarity and impact.";
  
  // Compute diff when texts change
  useEffect(() => {
    if (originalText && aiText) {
      computeDiff();
    }
  }, [originalText, aiText, diffLevel]);
  
  // Function to compute difference between texts using the longest common subsequence approach
  const computeDiff = () => {
    // Helper function to find longest common subsequence
    const findLCS = (str1, str2) => {
      const m = str1.length;
      const n = str2.length;
      
      // Create a table to store the LCS lengths
      const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
      
      // Fill the dp table
      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          if (str1[i - 1] === str2[j - 1]) {
            dp[i][j] = dp[i - 1][j - 1] + 1;
          } else {
            dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
          }
        }
      }
      
      // Backtrack to find the actual LCS and the diff
      const diff = [];
      let i = m;
      let j = n;
      
      while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && str1[i - 1] === str2[j - 1]) {
          // Characters match, part of LCS
          diff.unshift({ type: 'unchanged', text: str1[i - 1] });
          i--;
          j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
          // Addition in str2
          diff.unshift({ type: 'insertion', text: str2[j - 1] });
          j--;
        } else {
          // Deletion from str1
          diff.unshift({ type: 'deletion', text: str1[i - 1] });
          i--;
        }
      }
      
      return diff;
    };
    
    // Process the text based on diffLevel
    let originalParts, aiParts;
    
    if (diffLevel === 'word') {
      // More robust word tokenization
      // This regex splits on whitespace but keeps punctuation attached to words
      const wordRegex = /(\s+)|([^\s]+)/g;
      originalParts = [...originalText.matchAll(wordRegex)].map(match => match[0]);
      aiParts = [...aiText.matchAll(wordRegex)].map(match => match[0]);
    } else {
      // Character level diff
      originalParts = originalText.split('');
      aiParts = aiText.split('');
    }
    
    // Find the diff using LCS
    const diff = findLCS(originalParts, aiParts);
    
    // Process the diff to merge consecutive items of the same type
    const mergedDiff = [];
    
    for (const item of diff) {
      const lastItem = mergedDiff[mergedDiff.length - 1];
      
      if (lastItem && lastItem.type === item.type) {
        // Merge with previous item of the same type
        lastItem.text += item.text;
      } else {
        // Add as a new item
        mergedDiff.push({ ...item });
      }
    }
    
    setDiffResult(mergedDiff);
  };
  
  // Function to load example texts
  const loadExamples = () => {
    setOriginalText(exampleOriginal);
    setAiText(exampleAI);
  };
  
  // Function to clear texts
  const clearTexts = () => {
    setOriginalText('');
    setAiText('');
    setDiffResult([]);
  };
  
  // Create a unified view from the diff result
  const renderUnifiedView = () => {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mt-4 font-mono text-sm">
        {diffResult.map((part, index) => {
          let className = "leading-relaxed";
          
          if (part.type === 'insertion') {
            className += " bg-green-100 text-green-800";
          } else if (part.type === 'deletion') {
            className += " bg-red-100 text-red-800";
          }
          
          return (
            <span key={index} className={className}>
              {part.text}
            </span>
          );
        })}
      </div>
    );
  };
  
  // Create separate views for original and AI texts with changes highlighted
  const renderSideBySideView = () => {
    // Group diff parts for original and AI texts
    const originalParts = [];
    const aiParts = [];
    
    diffResult.forEach(part => {
      if (part.type === 'unchanged' || part.type === 'deletion') {
        originalParts.push(part);
      }
      
      if (part.type === 'unchanged' || part.type === 'insertion') {
        aiParts.push(part);
      }
    });
    
    return (
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-white rounded-lg shadow-sm p-6 font-mono text-sm">
          {originalParts.map((part, index) => {
            let className = "leading-relaxed";
            
            if (part.type === 'deletion') {
              className += " bg-red-100 text-red-800";
            }
            
            return (
              <span key={index} className={className}>
                {part.text}
              </span>
            );
          })}
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 font-mono text-sm">
          {aiParts.map((part, index) => {
            let className = "leading-relaxed";
            
            if (part.type === 'insertion') {
              className += " bg-green-100 text-green-800";
            }
            
            return (
              <span key={index} className={className}>
                {part.text}
              </span>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Calculate diff statistics
  const calculateStats = () => {
    if (!diffResult.length) return null;
    
    const unchanged = diffResult.filter(part => part.type === 'unchanged').length;
    const insertions = diffResult.filter(part => part.type === 'insertion').length;
    const deletions = diffResult.filter(part => part.type === 'deletion').length;
    const total = diffResult.length;
    
    const unchangedPercent = Math.round((unchanged / total) * 100);
    const changedPercent = 100 - unchangedPercent;
    
    return (
      <div className="flex gap-4 justify-center mt-6 text-sm text-gray-500">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-400 mr-2"></div>
          <span>{unchangedPercent}% Unchanged</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
          <span>{insertions} Additions</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-400 mr-2"></div>
          <span>{deletions} Deletions</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-purple-400 mr-2"></div>
          <span>{changedPercent}% Changed</span>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Text Diff Visualizer</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Compare original text with AI-enhanced versions. See what's been added, removed, or kept the same.
          </p>
        </div>
        
        {/* Controls */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <select 
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="bg-white border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="side-by-side">Side by Side</option>
              <option value="unified">Unified View</option>
            </select>
            
            <select 
              value={diffLevel}
              onChange={(e) => setDiffLevel(e.target.value)}
              className="bg-white border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="word">Word Level</option>
              <option value="character">Character Level</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={loadExamples}
              className="bg-blue-50 text-blue-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-100 transition"
            >
              Load Examples
            </button>
            
            <button 
              onClick={clearTexts}
              className="bg-gray-50 text-gray-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition"
            >
              Clear All
            </button>
          </div>
        </div>
        
        {/* Input Area */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-medium text-gray-700">Original Text</h2>
              <div className="text-xs text-gray-500">{originalText.length} characters</div>
            </div>
            <textarea
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
              placeholder="Paste your original text here..."
              className="w-full h-64 p-4 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-medium text-gray-700">AI-Enhanced Text</h2>
              <div className="text-xs text-gray-500">{aiText.length} characters</div>
            </div>
            <textarea
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              placeholder="Paste your AI-enhanced text here..."
              className="w-full h-64 p-4 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
            />
          </div>
        </div>
        
        {/* Legend */}
        {diffResult.length > 0 && (
          <div className="flex justify-center gap-6 mb-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-red-100 mr-2"></div>
              <span>Deleted</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-green-100 mr-2"></div>
              <span>Added</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-white border border-gray-200 mr-2"></div>
              <span>Unchanged</span>
            </div>
          </div>
        )}
        
        {/* Diff Visualization */}
        {diffResult.length > 0 ? (
          <>
            {viewMode === 'side-by-side' ? renderSideBySideView() : renderUnifiedView()}
            {calculateStats()}
          </>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
            Enter text in both fields to see the difference
          </div>
        )}
        
        {/* Footer */}
        <div className="text-center text-gray-500 text-xs mt-8">
          Text Diff Visualizer • Compare texts with confidence
        </div>
      </div>
    </div>
  );
}