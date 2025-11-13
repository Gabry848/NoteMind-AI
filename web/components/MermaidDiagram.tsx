"use client";

import { useEffect, useRef, useState } from "react";

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

export default function MermaidDiagram({ chart, className = "" }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Dynamic import of mermaid to avoid SSR issues
    const renderDiagram = async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        
        // Initialize mermaid with dark theme and better settings for vertical display
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          securityLevel: "loose",
          fontFamily: "Inter, system-ui, sans-serif",
          themeVariables: {
            darkMode: true,
            background: "#1f2937",
            primaryColor: "#3b82f6",
            primaryTextColor: "#f3f4f6",
            primaryBorderColor: "#60a5fa",
            lineColor: "#9ca3af",
            secondaryColor: "#6366f1",
            tertiaryColor: "#8b5cf6",
            textColor: "#e5e7eb",
            fontSize: "16px",
          },
          flowchart: {
            useMaxWidth: false,
            htmlLabels: true,
            curve: "basis",
            padding: 20,
            nodeSpacing: 80,
            rankSpacing: 80,
          },
          mindmap: {
            useMaxWidth: false,
            padding: 20,
          },
          sequence: {
            useMaxWidth: false,
          },
          gantt: {
            useMaxWidth: false,
          },
        });

        setError(null);
        
        // Clear previous content
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }

        // Generate unique ID for this diagram
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

        // Render the diagram
        const { svg } = await mermaid.render(id, chart);

        // Insert the rendered SVG
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err) {
        console.error("Error rendering Mermaid diagram:", err);
        setError("Errore nella visualizzazione del diagramma. Il codice Mermaid potrebbe non essere valido.");
      }
    };

    if (chart) {
      renderDiagram();
    }
  }, [chart]);

  if (error) {
    return (
      <div className={`p-4 bg-gray-900 border border-red-500 rounded-lg ${className}`}>
        <p className="text-red-400 text-sm">{error}</p>
        <details className="mt-2">
          <summary className="text-xs text-red-300 cursor-pointer">Mostra codice</summary>
          <pre className="mt-2 p-2 bg-gray-800 rounded text-xs overflow-x-auto text-gray-300">
            {chart}
          </pre>
        </details>
      </div>
    );
  }

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const handleZoomReset = () => setZoom(1);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setScrollStart({
      x: scrollContainerRef.current.scrollLeft,
      y: scrollContainerRef.current.scrollTop,
    });
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    scrollContainerRef.current.scrollLeft = scrollStart.x - deltaX;
    scrollContainerRef.current.scrollTop = scrollStart.y - deltaY;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className={`relative bg-gray-900 rounded-lg border border-gray-700 ${className}`}>
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2 bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-2">
        <button
          onClick={handleZoomOut}
          className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors"
          title="Zoom Out"
        >
          −
        </button>
        <button
          onClick={handleZoomReset}
          className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors font-mono"
          title="Reset Zoom"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={handleZoomIn}
          className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors"
          title="Zoom In"
        >
          +
        </button>
      </div>

      {/* Scrollable Container */}
      <div 
        ref={scrollContainerRef}
        className="overflow-auto max-h-[600px] p-6"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ 
          cursor: isDragging ? "grabbing" : "grab",
          userSelect: "none",
        }}
      >
        <div 
          ref={containerRef} 
          className="mermaid-container flex justify-center items-start min-h-[200px]"
          style={{ 
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
            transition: isDragging ? "none" : "transform 0.2s ease",
            pointerEvents: isDragging ? "none" : "auto",
          }}
        />
      </div>
    </div>
  );
}
