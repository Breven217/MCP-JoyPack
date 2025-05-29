import React from 'react';
import ReactDOM from 'react-dom';

interface TooltipProps {
  text: string;
  visible: boolean;
  position: { x: number; y: number };
}

const Tooltip: React.FC<TooltipProps> = ({ text, visible, position }) => {
  if (!visible) return null;

  return ReactDOM.createPortal(
    <div 
      className="global-tooltip"
      style={{
        left: position.x,
        top: position.y
      }}
    >
      {text}
      <div className="global-tooltip-arrow"></div>
    </div>,
    document.body
  );
};

export default Tooltip;
