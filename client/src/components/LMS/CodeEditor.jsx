import React, { useState } from 'react';

const PYTHON_KEYWORDS = ['def', 'class', 'import', 'from', 'return', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally', 'with', 'as', 'yield', 'lambda', 'pass', 'break', 'continue', 'and', 'or', 'not', 'in', 'is', 'True', 'False', 'None', 'print', 'range', 'len', 'self', 'async', 'await'];

const JAVA_KEYWORDS = ['public', 'private', 'protected', 'static', 'final', 'void', 'int', 'String', 'boolean', 'double', 'float', 'long', 'char', 'class', 'interface', 'extends', 'implements', 'new', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'throws', 'import', 'package', 'this', 'super', 'null', 'true', 'false', 'System', 'out', 'println', 'main', 'args'];

const ALL_KEYWORDS = [...new Set([...PYTHON_KEYWORDS, ...JAVA_KEYWORDS])];

const highlightCode = (code) => {
  if (!code) return '';
  
  const lines = code.split('\n');
  return lines.map((line, lineIndex) => {
    // Process the line for syntax highlighting
    let result = [];
    let i = 0;
    const chars = line;
    
    while (i < chars.length) {
      // Check for strings
      if (chars[i] === '"' || chars[i] === "'") {
        const quote = chars[i];
        let str = quote;
        i++;
        while (i < chars.length && chars[i] !== quote) {
          if (chars[i] === '\\') {
            str += chars[i];
            i++;
          }
          if (i < chars.length) {
            str += chars[i];
            i++;
          }
        }
        if (i < chars.length) {
          str += chars[i];
          i++;
        }
        result.push(<span key={`${lineIndex}-s-${i}`} style={{ color: '#a5d6a7' }}>{str}</span>);
        continue;
      }
      
      // Check for comments
      if (chars[i] === '/' && chars[i + 1] === '/') {
        const comment = chars.substring(i);
        result.push(<span key={`${lineIndex}-c-${i}`} style={{ color: '#78909c', fontStyle: 'italic' }}>{comment}</span>);
        i = chars.length;
        continue;
      }
      if (chars[i] === '#') {
        const comment = chars.substring(i);
        result.push(<span key={`${lineIndex}-c-${i}`} style={{ color: '#78909c', fontStyle: 'italic' }}>{comment}</span>);
        i = chars.length;
        continue;
      }
      
      // Check for numbers
      if (/\d/.test(chars[i])) {
        let num = '';
        while (i < chars.length && /[\d.]/.test(chars[i])) {
          num += chars[i];
          i++;
        }
        result.push(<span key={`${lineIndex}-n-${i}`} style={{ color: '#f48fb1' }}>{num}</span>);
        continue;
      }
      
      // Check for keywords
      if (/[a-zA-Z_]/.test(chars[i])) {
        let word = '';
        const start = i;
        while (i < chars.length && /[a-zA-Z_0-9]/.test(chars[i])) {
          word += chars[i];
          i++;
        }
        if (ALL_KEYWORDS.includes(word)) {
          result.push(<span key={`${lineIndex}-k-${start}`} style={{ color: '#82b1ff', fontWeight: 600 }}>{word}</span>);
        } else if (word[0] === word[0].toUpperCase() && /^[A-Z]/.test(word)) {
          result.push(<span key={`${lineIndex}-t-${start}`} style={{ color: '#ffcc80' }}>{word}</span>);
        } else {
          result.push(<span key={`${lineIndex}-w-${start}`}>{word}</span>);
        }
        continue;
      }
      
      // Operators and brackets
      if (/[+\-*/%=<>!&|^~?:]/.test(chars[i])) {
        result.push(<span key={`${lineIndex}-o-${i}`} style={{ color: '#80cbc4' }}>{chars[i]}</span>);
        i++;
        continue;
      }
      
      if (/[(){}[\],;.]/.test(chars[i])) {
        result.push(<span key={`${lineIndex}-p-${i}`} style={{ color: '#b0bec5' }}>{chars[i]}</span>);
        i++;
        continue;
      }
      
      result.push(<span key={`${lineIndex}-x-${i}`}>{chars[i]}</span>);
      i++;
    }
    
    return (
      <div key={lineIndex} style={{ display: 'flex', minHeight: '1.5em' }}>
        <span style={{ 
          color: '#546e7a', 
          userSelect: 'none', 
          textAlign: 'right', 
          width: '3em', 
          paddingRight: '1em',
          borderRight: '1px solid #37474f',
          marginRight: '1em',
          flexShrink: 0
        }}>
          {lineIndex + 1}
        </span>
        <span style={{ flex: 1, whiteSpace: 'pre' }}>{result.length ? result : ' '}</span>
      </div>
    );
  });
};

const CodeEditor = ({ value = '', onChange, language = 'python', readOnly = false, placeholder = '' }) => {
  const [showScratch, setShowScratch] = useState(false);
  const [scratchPad, setScratchPad] = useState('');

  return (
    <div style={{
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.08)',
      background: '#1a1a2e',
      marginTop: '12px',
      position: 'relative'
    }}>
      {/* Editor Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 14px',
        background: 'rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }}></span>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }}></span>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }}></span>
          </div>
          <span style={{
            fontSize: '0.72rem',
            color: '#82b1ff',
            padding: '2px 8px',
            background: 'rgba(130,177,255,0.1)',
            borderRadius: '4px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {language}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowScratch(!showScratch)}
            className="text-[10px] uppercase font-bold text-teal-400 bg-teal-400/10 px-2 py-1 rounded"
          >
            {showScratch ? '✕ Close Scratch' : '✎ Scratch Pad'}
          </button>
        </div>
      </div>

      {/* Code Input & Display Area */}
      <div style={{ position: 'relative', minHeight: '300px', background: '#0d1117' }}>
        {/* Layered Textarea and Highlighting */}
        <textarea
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          readOnly={readOnly}
          placeholder={placeholder || `Write your ${language} code here...`}
          data-coding="true"
          style={{
            width: '100%',
            height: '300px',
            background: 'transparent',
            color: 'transparent',
            caretColor: '#fff',
            border: 'none',
            padding: '12px 12px 12px 4em',
            fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
            fontSize: '0.85rem',
            lineHeight: 1.6,
            resize: 'none',
            outline: 'none',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 10,
            whiteSpace: 'pre',
            overflowX: 'auto',
            overflowY: 'auto'
          }}
          spellCheck="false"
        />
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '300px',
          padding: '12px 0',
          fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
          fontSize: '0.85rem',
          lineHeight: 1.6,
          color: '#e0e0e0',
          pointerEvents: 'none',
          overflow: 'hidden'
        }}>
          {highlightCode(value)}
        </div>
      </div>

      {/* Scratch Pad Section */}
      {showScratch && (
        <div className="p-3 bg-black/40 border-t border-white/5">
          <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Quick Scratchpad (Rough Work)</label>
          <textarea
            value={scratchPad}
            onChange={(e) => setScratchPad(e.target.value)}
            className="w-full h-24 bg-slate-900 text-slate-300 p-2 rounded-lg text-xs font-mono outline-none border border-white/5"
            placeholder="Pseudo-code or notes..."
          />
        </div>
      )}
    </div>
  );
};

// Helper to extract code from a question text
export const extractCodeFromQuestion = (questionText) => {
  if (!questionText) return { text: questionText, code: '', language: '' };

  // 1. Try markdown code block extraction
  const codeBlockMatch = questionText.match(/```(java|python)?\n([\s\S]+?)\n```/i);
  if (codeBlockMatch) {
    const beforeCode = questionText.replace(codeBlockMatch[0], '').trim();
    const language = (codeBlockMatch[1] || '').toLowerCase();
    const code = codeBlockMatch[2].trim();
    return { text: beforeCode, code, language };
  }

  // 2. Try explicit "Starter Code" header extraction
  const starterCodePrefixes = [
    'Starter Code (Java):',
    'Starter Code (Python):',
    'Starter Code:',
    'Starter code (Java):',
    'Starter code (Python):',
    'Starter code:'
  ];

  let starterIndex = -1;
  let detectedPrefix = '';

  for (const prefix of starterCodePrefixes) {
    const idx = questionText.indexOf(prefix);
    if (idx !== -1) {
      starterIndex = idx;
      detectedPrefix = prefix;
      break;
    }
  }

  if (starterIndex !== -1) {
    const beforeCode = questionText.substring(0, starterIndex).trim();
    const afterCode = questionText.substring(starterIndex + detectedPrefix.length).trim();

    let language = '';
    const prefixLower = detectedPrefix.toLowerCase();
    if (prefixLower.includes('python')) {
      language = 'python';
    } else if (prefixLower.includes('java')) {
      language = 'java';
    } else {
      if (/def |print\(|import |from |lambda |elif /.test(afterCode)) {
        language = 'python';
      } else if (/public |private |System\.|void |String |int\s|\.println/.test(afterCode)) {
        language = 'java';
      }
    }

    return { text: beforeCode, code: afterCode, language };
  }

  // 3. If neither is found, DO NOT extract anything. The whole text is description.
  return { text: questionText, code: '', language: '' };
};

export default CodeEditor;
