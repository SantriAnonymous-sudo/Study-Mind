/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  ChevronUp, 
  ChevronDown, 
  Download, 
  RefreshCw,
  Move,
  Info
} from 'lucide-react';
import { MindMapNode } from './types';

interface MindMapCanvasProps {
  rootNode: MindMapNode;
}

interface RenderNode extends MindMapNode {
  x: number;
  y: number;
  depth: number;
  parentId?: string;
}

export default function MindMapCanvas({ rootNode }: MindMapCanvasProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 150, y: 150 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [activeNodeInfo, setActiveNodeInfo] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Tree coordinates layout configuration
  const nodeWidth = 200;
  const nodeHeight = 60;
  const levelSeparation = 240;
  const siblingSeparation = 90;

  // Track collapsed nodes
  const toggleCollapse = (id: string) => {
    const updated = new Set(collapsedNodes);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setCollapsedNodes(updated);
  };

  // Traverses tree to calculate logical coordinates
  const calculateCoordinates = (): { nodes: RenderNode[]; connections: { from: {x: number, y: number}, to: {x: number, y: number}, parentId: string, nodeId: string }[] } => {
    const renderNodes: RenderNode[] = [];
    const connections: { from: {x: number, y: number}, to: {x: number, y: number}, parentId: string, nodeId: string }[] = [];

    let leafIndex = 0;

    const traverse = (node: MindMapNode, depth: number, parentX?: number, parentY?: number, parentId?: string) => {
      // Base placement configuration
      const x = depth * levelSeparation;
      
      // Compute Y spacing recursively based on leaves layout
      let y = leafIndex * siblingSeparation;
      
      const nodeInfo: RenderNode = {
        id: node.id,
        label: node.label,
        description: node.description,
        children: node.children,
        x,
        y,
        depth,
        parentId
      };

      const isNodeCollapsed = collapsedNodes.has(node.id);

      if (node.children && node.children.length > 0 && !isNodeCollapsed) {
        // Recurse down leaves first
        const numChildren = node.children.length;
        const initialLeafIndex = leafIndex;

        const childrenCoordinates: {x: number, y: number}[] = [];
        
        node.children.forEach(child => {
          traverse(child, depth + 1, x, y, node.id);
          // Fetch leaf Y coordinate that was just created for centering calculations
          const recent = renderNodes[renderNodes.length - 1];
          childrenCoordinates.push({ x: recent.x, y: recent.y });
        });

        // Center parent node vertically between its displayed children
        const sumY = childrenCoordinates.reduce((sum, coords) => sum + coords.y, 0);
        y = sumY / numChildren;
        nodeInfo.y = y;
      } else {
        // Node is clean leaf level or collapsed, advance leafIndex for next Y slots
        leafIndex++;
      }

      renderNodes.push(nodeInfo);

      if (parentX !== undefined && parentY !== undefined && parentId) {
        // Note: connections point to updated target computed coordinates
        connections.push({
          from: { x: parentX + nodeWidth, y: parentY + nodeHeight / 2 },
          to: { x: x, y: y + nodeHeight / 2 },
          parentId,
          nodeId: node.id
        });
      }
    };

    traverse(rootNode, 0);

    // Let's adjust connections since parent nodes were relocated to the center of their children.
    // Map of nodeId -> node
    const nodeMap = new Map<string, RenderNode>();
    renderNodes.forEach(n => nodeMap.set(n.id, n));

    const finalConnections = connections.map(conn => {
      const pNode = nodeMap.get(conn.parentId);
      const cNode = nodeMap.get(conn.nodeId);
      return {
        from: { x: (pNode?.x || 0) + nodeWidth, y: (pNode?.y || 0) + nodeHeight / 2 },
        to: { x: cNode?.x || 0, y: (cNode?.y || 0) + nodeHeight / 2 },
        parentId: conn.parentId,
        nodeId: conn.nodeId
      };
    });

    return { nodes: renderNodes, connections: finalConnections };
  };

  const { nodes, connections } = calculateCoordinates();

  // Mouse pan handlers drag controls
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only drag with left-button
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 100, y: 150 });
  };

  // Export as static human-readable schematic data files
  const triggerDownloadTxt = () => {
    const lines: string[] = [];
    const traverse = (node: MindMapNode, depth: number) => {
      const spacing = '  '.repeat(depth);
      lines.push(`${spacing}- ${node.label} ${node.description ? `(${node.description})` : ''}`);
      if (node.children) {
        node.children.forEach(c => traverse(c, depth + 1));
      }
    };
    traverse(rootNode, 0);

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studymind_mindmap_${rootNode.label.toLowerCase().replace(/\s+/g, '_')}.txt`;
    a.click();
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-900 bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Tool panel buttons bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/40 border-b border-slate-900">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Move className="w-3.5 h-3.5" />
          <span>Left-click and drag canvas to PAN. Use controls to ZOOM.</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setZoom(z => Math.min(z + 0.1, 2))}
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))}
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button 
            onClick={handleReset}
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Recenter Coordinates"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <span className="text-[10px] uppercase font-bold text-slate-500 select-none px-1">|</span>
          <button 
            onClick={triggerDownloadTxt}
            className="p-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1 text-xs font-bold"
            title="Export Schematic"
          >
            <Download className="w-3.5 h-3.5" /> Download Scheme
          </button>
        </div>
      </div>

      <div className="relative grow overflow-hidden select-none">
        {/* Socratic contextual dialog banner */}
        {activeNodeInfo && (
          <div className="absolute top-4 left-4 z-10 max-w-xs p-3.5 rounded-xl border border-slate-800 bg-slate-950/90 backdrop-blur-md shadow-2xl animate-fade-in text-xs text-slate-300">
            <h4 className="font-bold text-white mb-1">Concept Insights</h4>
            <p className="leading-relaxed mb-3">{activeNodeInfo}</p>
            <button 
              onClick={() => setActiveNodeInfo(null)}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[10px] text-blue-400 font-bold"
            >
              Close
            </button>
          </div>
        )}

        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`w-full h-full cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
        >
          <svg className="w-full h-full origin-top-left">
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              
              {/* Draw Nodes connections with premium smooth curves splitting paths */}
              {connections.map((c, i) => {
                const isTargCollapsed = collapsedNodes.has(c.nodeId);
                const isParCollapsed = collapsedNodes.has(c.parentId);
                if (isParCollapsed) return null; // Don't show connections nested under closed concepts

                // Render beautiful Bézier control paths
                const midX = (c.from.x + c.to.x) / 2;
                const pathStr = `M ${c.from.x} ${c.from.y} C ${midX} ${c.from.y}, ${midX} ${c.to.y}, ${c.to.x} ${c.to.y}`;

                return (
                  <path
                    key={i}
                    d={pathStr}
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth={2}
                    className="transition-all duration-300"
                  />
                );
              })}

              {/* Draw Mind Nodes */}
              {nodes.map((node) => {
                // Determine recursively whether parent is collapsed to hide nested sub-nodes
                const isAncestorCollapsed = () => {
                  let parId = node.parentId;
                  while (parId) {
                    if (collapsedNodes.has(parId)) return true;
                    // Find parent
                    const parentN = nodes.find(n => n.id === parId);
                    parId = parentN ? parentN.parentId : undefined;
                  }
                  return false;
                };

                if (isAncestorCollapsed()) return null;

                const hasChildren = node.children && node.children.length > 0;
                const isNodeCollapsed = collapsedNodes.has(node.id);

                return (
                  <g 
                    key={node.id} 
                    transform={`translate(${node.x}, ${node.y})`}
                    className="group"
                  >
                    {/* Node Glass Card container */}
                    <rect
                      width={nodeWidth}
                      height={nodeHeight}
                      rx={12}
                      className={`fill-slate-900/50 stroke-1 transition-all duration-300 ${node.depth === 0 ? 'stroke-blue-500 fill-slate-900/80 shadow-lg shadow-blue-500/10' : 'stroke-slate-800 hover:stroke-slate-700'}`}
                    />

                    {/* Left node color accent block */}
                    <rect
                      width={6}
                      height={nodeHeight}
                      rx={3}
                      x={1}
                      className={node.depth === 0 ? 'fill-blue-500' : 'fill-slate-700 group-hover:fill-blue-400 transition-colors'}
                    />

                    {/* text element label */}
                    <text
                      x={18}
                      y={26}
                      className="fill-slate-100 font-bold text-xs select-none"
                    >
                      {node.label.length > 24 ? `${node.label.substring(0, 22)}...` : node.label}
                    </text>

                    {/* text element sub description */}
                    {node.description && (
                      <text
                        x={18}
                        y={44}
                        className="fill-slate-500 text-[10px] select-none"
                      >
                        {node.description.length > 28 ? `${node.description.substring(0, 26)}...` : node.description}
                      </text>
                    )}

                    {/* Details Info dialog icon trigger */}
                    {node.description && (
                      <g 
                        transform={`translate(${nodeWidth - 52}, 23)`}
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveNodeInfo(node.description || null);
                        }}
                      >
                        <circle cx={6} cy={6} r={8} className="fill-slate-950 stroke-slate-800" />
                        <path d="M6,3 v3 M6,8 v1" stroke="#3b82f6" strokeWidth={1.5} strokeLinecap="round" />
                      </g>
                    )}

                    {/* Collapse / Expand interactive nodes indicators */}
                    {hasChildren && (
                      <g 
                        transform={`translate(${nodeWidth - 28}, 23)`}
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCollapse(node.id);
                        }}
                      >
                        <circle cx={6} cy={6} r={8} className="fill-slate-950 stroke-slate-800 hover:stroke-slate-600" />
                        {isNodeCollapsed ? (
                          <path d="M3,6 h6 M6,3 v6" stroke="#10b981" strokeWidth={1.5} strokeLinecap="round" />
                        ) : (
                          <path d="M3,6 h6" stroke="#ef4444" strokeWidth={1.5} strokeLinecap="round" />
                        )}
                      </g>
                    )}
                  </g>
                );
              })}

            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
