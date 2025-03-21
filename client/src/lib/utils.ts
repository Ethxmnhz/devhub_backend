import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { FileType, Code, FileText } from "lucide-react";
import React from 'react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Debounce function to limit the frequency of function calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>): void {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

// Get language for monaco editor based on file extension
export function getFileLanguage(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  const languageMap: Record<string, string> = {
    'py': 'python',
    'js': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'jsx': 'javascript',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'md': 'markdown',
    'txt': 'plaintext',
    'csv': 'plaintext',
    'xml': 'xml',
    'sql': 'sql',
    'sh': 'shell',
    'yaml': 'yaml',
    'yml': 'yaml',
  };
  
  return languageMap[ext] || 'plaintext';
}

// Get file icon based on file extension and type
export function getFileIcon(fileName: string, type: 'file' | 'folder' = 'file') {
  if (type === 'folder') {
    return React.createElement("svg", {
      xmlns: "http://www.w3.org/2000/svg",
      className: "h-4 w-4 mr-1.5 text-amber-400",
      fill: "none",
      viewBox: "0 0 24 24",
      stroke: "currentColor"
    }, React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      strokeWidth: 2,
      d: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
    }));
  }
  
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  // Code files
  if (['py', 'js', 'ts', 'jsx', 'tsx', 'java', 'c', 'cpp', 'cs', 'php', 'rb', 'go', 'rs', 'swift'].includes(ext)) {
    return React.createElement(Code, { className: "h-4 w-4 mr-1.5 text-blue-400" });
  }
  
  // Document files
  if (['md', 'txt', 'doc', 'docx', 'pdf', 'rtf'].includes(ext)) {
    return React.createElement(FileText, { className: "h-4 w-4 mr-1.5 text-yellow-400" });
  }
  
  // Data files
  if (['json', 'csv', 'xml', 'yaml', 'yml'].includes(ext)) {
    return React.createElement(FileType, { className: "h-4 w-4 mr-1.5 text-green-400" });
  }
  
  // Default file icon
  return React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    className: "h-4 w-4 mr-1.5 text-blue-400",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor"
  }, React.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: 2,
    d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
  }));
}
