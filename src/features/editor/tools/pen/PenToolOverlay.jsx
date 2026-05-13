import React from 'react';
import { usePathRenderer } from './usePathRenderer';

export const PenToolOverlay = ({ activePath, previewPoint, canvasSize, zoom, selectedPoints = [], hoveredPoint = null }) => {
    const { buildSVGPath, buildPreviewPath } = usePathRenderer();
    
    if (!activePath && !previewPoint) return null;
    
    const d = activePath ? buildSVGPath(activePath) : '';
    const previewD = previewPoint && activePath ? buildPreviewPath(activePath, previewPoint) : '';
    
    return (
        <svg
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 1000,
            }}
            viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
        >
            {/* Completed path segments */}
            {activePath && (
                <path
                    d={d}
                    fill={activePath.fill || 'none'}
                    stroke={activePath.stroke}
                    strokeWidth={activePath.strokeWidth}
                    strokeLinecap={activePath.strokeCap}
                    strokeLinejoin={activePath.strokeJoin}
                    opacity={activePath.opacity}
                />
            )}
            
            {/* Live preview segment */}
            {previewD && (
                <path
                    d={previewD}
                    fill="none"
                    stroke="#1f2937"
                    strokeWidth={2}
                    strokeDasharray="4,4"
                />
            )}
            
            {/* Anchor points */}
            {activePath && activePath.points.map((p, index) => {
                const isSelected = selectedPoints.includes(p.id);
                const isHovered = hoveredPoint === `anchor_${p.id}`;
                const isEnd = index === 0;

                return (
                    <g key={p.id}>
                        {/* Handles for the point */}
                        {p.handleIn && (
                            <g>
                                <line 
                                    x1={p.x} y1={p.y} 
                                    x2={p.x + p.handleIn.x} y2={p.y + p.handleIn.y} 
                                    stroke="#3b82f6" strokeWidth={1} 
                                />
                                <circle 
                                    cx={p.x + p.handleIn.x} cy={p.y + p.handleIn.y} 
                                    r={4}
                                    fill={hoveredPoint === `handleIn_${p.id}` ? '#3b82f6' : '#ffffff'}
                                    stroke="#3b82f6" strokeWidth={1} 
                                />
                            </g>
                        )}
                        {p.handleOut && (
                            <g>
                                <line 
                                    x1={p.x} y1={p.y} 
                                    x2={p.x + p.handleOut.x} y2={p.y + p.handleOut.y} 
                                    stroke="#3b82f6" strokeWidth={1} 
                                />
                                <circle 
                                    cx={p.x + p.handleOut.x} cy={p.y + p.handleOut.y} 
                                    r={4}
                                    fill={hoveredPoint === `handleOut_${p.id}` ? '#3b82f6' : '#ffffff'}
                                    stroke="#3b82f6" strokeWidth={1} 
                                />
                            </g>
                        )}
                        
                        <rect
                            x={p.x - 4}
                            y={p.y - 4}
                            width={8}
                            height={8}
                            fill={isEnd ? '#10b981' : isSelected ? '#3b82f6' : '#ffffff'}
                            stroke="#3b82f6"
                            strokeWidth={isHovered ? 2 : 1}
                        />
                    </g>
                );
            })}

            {/* Segment hover indicator */}
            {hoveredPoint?.startsWith('segment') && previewPoint && (
                <g>
                    <circle 
                        cx={previewPoint.x} cy={previewPoint.y} 
                        r={5} fill="#3b82f6" fillOpacity={0.5}
                        stroke="#3b82f6" strokeWidth={1}
                    />
                    <text 
                        x={previewPoint.x + 8} y={previewPoint.y + 4} 
                        fill="#3b82f6" fontSize={14} fontWeight="bold"
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                        +
                    </text>
                </g>
            )}

            {/* Hover indicator for first point in DRAW mode */}
            {activePath && activePath.points.length > 0 && previewPoint && (
                (() => {
                    const first = activePath.points[0];
                    const dist = Math.sqrt(Math.pow(first.x - previewPoint.x, 2) + Math.pow(first.y - previewPoint.y, 2));
                    if (dist < 10) {
                        return (
                            <circle
                                cx={first.x}
                                cy={first.y}
                                r={12}
                                fill="none"
                                stroke="#10b981"
                                strokeWidth={2}
                            />
                        );
                    }
                    return null;
                })()
            )}
        </svg>
    );
};
