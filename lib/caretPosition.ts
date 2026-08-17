let mirrorDiv: HTMLDivElement | null = null;

const PROPERTIES = [
  'font-family', 'font-size', 'font-weight', 'font-style', 
  'letter-spacing', 'word-spacing', 'text-transform', 'text-indent', 
  'line-height', 'padding', 'border', 'box-sizing', 
  'white-space', 'word-break', 'overflow-wrap', 'tab-size', 'direction', 
  'text-align', 'width'
];

export interface CaretCoordinates {
  top: number;
  left: number;
  lineHeight: number;
}

export function getCaretCoordinates(element: HTMLTextAreaElement, position: number): CaretCoordinates | null {
  try {
    if (!mirrorDiv) {
      mirrorDiv = document.createElement('div');
      document.body.appendChild(mirrorDiv);
    }

    const style = window.getComputedStyle(element);

    let cssText = 'position: absolute; top: -9999px; left: -9999px; visibility: hidden; ';
    for (const prop of PROPERTIES) {
      cssText += `${prop}: ${style.getPropertyValue(prop)}; `;
    }
    mirrorDiv.style.cssText = cssText;

    // Important for textarea mirroring
    mirrorDiv.style.whiteSpace = 'pre-wrap';
    mirrorDiv.style.wordWrap = 'break-word';

    const textBeforeCaret = element.value.substring(0, position);
    
    // Using textContent correctly handles pre-wrap without needing <br> replacements
    mirrorDiv.textContent = textBeforeCaret;

    const span = document.createElement('span');
    span.textContent = element.value.substring(position) || '.';
    mirrorDiv.appendChild(span);

    const borderTop = parseFloat(style.getPropertyValue('border-top-width')) || 0;
    const borderLeft = parseFloat(style.getPropertyValue('border-left-width')) || 0;

    const top = span.offsetTop - element.scrollTop + borderTop;
    const left = span.offsetLeft - element.scrollLeft + borderLeft;
    
    const lineHeightStr = style.getPropertyValue('line-height');
    let lineHeight = parseInt(lineHeightStr, 10);
    if (isNaN(lineHeight)) {
      lineHeight = parseInt(style.getPropertyValue('font-size'), 10) * 1.2;
    }

    return {
      top: top + lineHeight, // Position directly below the caret
      left: left,
      lineHeight: lineHeight
    };
  } catch (err) {
    return null;
  }
}
