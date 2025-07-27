import React, { useState, useEffect, useRef } from 'react';
import styles from './AsciiGenerator.module.css';

const AsciiGenerator = ({ isOpen, onClose }) => {
  const [text, setText] = useState('HELLO');
  const [font, setFont] = useState('block');
  const [effect, setEffect] = useState('none');
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef(null);
  const frameRef = useRef(0);
  const previewRef = useRef(null);

  // Complete alphabet patterns for all fonts
  const FONT_PATTERNS = {
    block: {
      'A': ['  ██  ', ' ████ ', '██  ██', '██████', '██  ██'],
      'B': ['██████', '██  ██', '██████', '██  ██', '██████'],
      'C': [' █████', '██    ', '██    ', '██    ', ' █████'],
      'D': ['██████', '██  ██', '██  ██', '██  ██', '██████'],
      'E': ['██████', '██    ', '█████ ', '██    ', '██████'],
      'F': ['██████', '██    ', '█████ ', '██    ', '██    '],
      'G': [' █████', '██    ', '██ ███', '██  ██', ' █████'],
      'H': ['██  ██', '██  ██', '██████', '██  ██', '██  ██'],
      'I': ['██████', '  ██  ', '  ██  ', '  ██  ', '██████'],
      'J': ['██████', '    ██', '    ██', '██  ██', ' █████'],
      'K': ['██  ██', '██ ██ ', '████  ', '██ ██ ', '██  ██'],
      'L': ['██    ', '██    ', '██    ', '██    ', '██████'],
      'M': ['██  ██', '██████', '██████', '██  ██', '██  ██'],
      'N': ['██  ██', '███ ██', '██████', '██ ███', '██  ██'],
      'O': [' █████', '██  ██', '██  ██', '██  ██', ' █████'],
      'P': ['██████', '██  ██', '██████', '██    ', '██    '],
      'Q': [' █████', '██  ██', '██  ██', '██ ███', ' ██████'],
      'R': ['██████', '██  ██', '██████', '██ ██ ', '██  ██'],
      'S': [' █████', '██    ', ' █████', '    ██', '█████ '],
      'T': ['██████', '  ██  ', '  ██  ', '  ██  ', '  ██  '],
      'U': ['██  ██', '██  ██', '██  ██', '██  ██', ' █████'],
      'V': ['██  ██', '██  ██', '██  ██', ' ████ ', '  ██  '],
      'W': ['██  ██', '██  ██', '██████', '██████', '██  ██'],
      'X': ['██  ██', ' ████ ', '  ██  ', ' ████ ', '██  ██'],
      'Y': ['██  ██', ' ████ ', '  ██  ', '  ██  ', '  ██  '],
      'Z': ['██████', '   ██ ', '  ██  ', ' ██   ', '██████'],
      '0': [' █████', '██  ██', '██ ███', '███ ██', ' █████'],
      '1': ['  ██  ', ' ███  ', '  ██  ', '  ██  ', '██████'],
      '2': [' █████', '    ██', ' █████', '██    ', '██████'],
      '3': [' █████', '    ██', ' █████', '    ██', ' █████'],
      '4': ['██  ██', '██  ██', '██████', '    ██', '    ██'],
      '5': ['██████', '██    ', '██████', '    ██', '██████'],
      '6': [' █████', '██    ', '██████', '██  ██', ' █████'],
      '7': ['██████', '    ██', '   ██ ', '  ██  ', ' ██   '],
      '8': [' █████', '██  ██', ' █████', '██  ██', ' █████'],
      '9': [' █████', '██  ██', ' █████', '    ██', ' █████'],
      ' ': ['      ', '      ', '      ', '      ', '      '],
      '!': ['  ██  ', '  ██  ', '  ██  ', '      ', '  ██  '],
      '?': [' █████', '    ██', '  ████', '      ', '  ██  '],
      '.': ['      ', '      ', '      ', '      ', '  ██  '],
      ',': ['      ', '      ', '      ', '  ██  ', ' ██   '],
      ':': ['      ', '  ██  ', '      ', '  ██  ', '      '],
      ';': ['      ', '  ██  ', '      ', '  ██  ', ' ██   '],
      '-': ['      ', '      ', '██████', '      ', '      '],
      '+': ['      ', '  ██  ', '██████', '  ██  ', '      '],
      '=': ['      ', '██████', '      ', '██████', '      '],
      '/': ['    ██', '   ██ ', '  ██  ', ' ██   ', '██    '],
      '\\': ['██    ', ' ██   ', '  ██  ', '   ██ ', '    ██'],
      '(': ['   ██ ', '  ██  ', '  ██  ', '  ██  ', '   ██ '],
      ')': [' ██   ', '  ██  ', '  ██  ', '  ██  ', ' ██   '],
      '[': ['  ████', '  ██  ', '  ██  ', '  ██  ', '  ████'],
      ']': ['████  ', '  ██  ', '  ██  ', '  ██  ', '████  '],
      '@': [' █████', '██ █ █', '██ ███', '██    ', ' █████'],
      '#': [' ██ ██', '██████', ' ██ ██', '██████', ' ██ ██'],
      '$': ['  ██  ', ' █████', '██    ', ' █████', '  ██  '],
      '%': ['██  ██', '   ██ ', '  ██  ', ' ██   ', '██  ██'],
      '^': ['  ██  ', ' ████ ', '██  ██', '      ', '      '],
      '&': [' ████ ', '██  ██', '██████', '██ ███', ' ██████'],
      '*': ['██  ██', ' ████ ', '██████', ' ████ ', '██  ██'],
      '_': ['      ', '      ', '      ', '      ', '██████']
    },

    shadow: {
      'A': ['  ▓▓▓▓  ', ' ▓▓▓▓▓▓ ', '▓▓▓  ▓▓▓', '▓▓▓▓▓▓▓▓', '▓▓▓  ▓▓▓', '░░░  ░░░'],
      'B': ['▓▓▓▓▓▓▓▓', '▓▓▓  ▓▓▓', '▓▓▓▓▓▓▓▓', '▓▓▓  ▓▓▓', '▓▓▓▓▓▓▓▓', '░░░░░░░░'],
      'C': [' ▓▓▓▓▓▓▓', '▓▓▓     ', '▓▓▓     ', '▓▓▓     ', ' ▓▓▓▓▓▓▓', ' ░░░░░░░'],
      'D': ['▓▓▓▓▓▓▓▓', '▓▓▓  ▓▓▓', '▓▓▓  ▓▓▓', '▓▓▓  ▓▓▓', '▓▓▓▓▓▓▓▓', '░░░░░░░░'],
      'E': ['▓▓▓▓▓▓▓▓', '▓▓▓     ', '▓▓▓▓▓▓▓ ', '▓▓▓     ', '▓▓▓▓▓▓▓▓', '░░░░░░░░'],
      'F': ['▓▓▓▓▓▓▓▓', '▓▓▓     ', '▓▓▓▓▓▓▓ ', '▓▓▓     ', '▓▓▓     ', '░░░     '],
      'G': [' ▓▓▓▓▓▓▓', '▓▓▓     ', '▓▓▓ ▓▓▓▓', '▓▓▓  ▓▓▓', ' ▓▓▓▓▓▓▓', ' ░░░░░░░'],
      'H': ['▓▓▓  ▓▓▓', '▓▓▓  ▓▓▓', '▓▓▓▓▓▓▓▓', '▓▓▓  ▓▓▓', '▓▓▓  ▓▓▓', '░░░  ░░░'],
      'I': ['▓▓▓▓▓▓▓▓', '  ▓▓▓   ', '  ▓▓▓   ', '  ▓▓▓   ', '▓▓▓▓▓▓▓▓', '░░░░░░░░'],
      'J': ['▓▓▓▓▓▓▓▓', '    ▓▓▓ ', '    ▓▓▓ ', '▓▓▓ ▓▓▓ ', ' ▓▓▓▓▓▓▓', ' ░░░░░░░'],
      'K': ['▓▓▓  ▓▓▓', '▓▓▓ ▓▓▓ ', '▓▓▓▓▓   ', '▓▓▓ ▓▓▓ ', '▓▓▓  ▓▓▓', '░░░  ░░░'],
      'L': ['▓▓▓     ', '▓▓▓     ', '▓▓▓     ', '▓▓▓     ', '▓▓▓▓▓▓▓▓', '░░░░░░░░'],
      'M': ['▓▓▓  ▓▓▓', '▓▓▓▓▓▓▓▓', '▓▓▓▓▓▓▓▓', '▓▓▓  ▓▓▓', '▓▓▓  ▓▓▓', '░░░  ░░░'],
      'N': ['▓▓▓  ▓▓▓', '▓▓▓▓ ▓▓▓', '▓▓▓▓▓▓▓▓', '▓▓▓ ▓▓▓▓', '▓▓▓  ▓▓▓', '░░░  ░░░'],
      'O': [' ▓▓▓▓▓▓▓', '▓▓▓  ▓▓▓', '▓▓▓  ▓▓▓', '▓▓▓  ▓▓▓', ' ▓▓▓▓▓▓▓', ' ░░░░░░░'],
      'P': ['▓▓▓▓▓▓▓▓', '▓▓▓  ▓▓▓', '▓▓▓▓▓▓▓▓', '▓▓▓     ', '▓▓▓     ', '░░░     '],
      'Q': [' ▓▓▓▓▓▓▓', '▓▓▓  ▓▓▓', '▓▓▓  ▓▓▓', '▓▓▓ ▓▓▓▓', ' ▓▓▓▓▓▓▓▓', ' ░░░░░░░░'],
      'R': ['▓▓▓▓▓▓▓▓', '▓▓▓  ▓▓▓', '▓▓▓▓▓▓▓▓', '▓▓▓ ▓▓▓ ', '▓▓▓  ▓▓▓', '░░░  ░░░'],
      'S': [' ▓▓▓▓▓▓▓', '▓▓▓     ', ' ▓▓▓▓▓▓▓', '     ▓▓▓', '▓▓▓▓▓▓▓ ', '░░░░░░░ '],
      'T': ['▓▓▓▓▓▓▓▓', '  ▓▓▓   ', '  ▓▓▓   ', '  ▓▓▓   ', '  ▓▓▓   ', '  ░░░   '],
      'U': ['▓▓▓  ▓▓▓', '▓▓▓  ▓▓▓', '▓▓▓  ▓▓▓', '▓▓▓  ▓▓▓', ' ▓▓▓▓▓▓▓', ' ░░░░░░░'],
      'V': ['▓▓▓  ▓▓▓', '▓▓▓  ▓▓▓', '▓▓▓  ▓▓▓', ' ▓▓▓▓▓  ', '  ▓▓▓   ', '  ░░░   '],
      'W': ['▓▓▓  ▓▓▓', '▓▓▓  ▓▓▓', '▓▓▓▓▓▓▓▓', '▓▓▓▓▓▓▓▓', '▓▓▓  ▓▓▓', '░░░  ░░░'],
      'X': ['▓▓▓  ▓▓▓', ' ▓▓▓▓▓  ', '  ▓▓▓   ', ' ▓▓▓▓▓  ', '▓▓▓  ▓▓▓', '░░░  ░░░'],
      'Y': ['▓▓▓  ▓▓▓', ' ▓▓▓▓▓  ', '  ▓▓▓   ', '  ▓▓▓   ', '  ▓▓▓   ', '  ░░░   '],
      'Z': ['▓▓▓▓▓▓▓▓', '   ▓▓▓  ', '  ▓▓▓   ', ' ▓▓▓    ', '▓▓▓▓▓▓▓▓', '░░░░░░░░'],
      ' ': ['        ', '        ', '        ', '        ', '        ', '        ']
    },

    outline: {
      'A': ['  ████  ', ' ██  ██ ', '██    ██', '████████', '██    ██'],
      'B': ['███████ ', '██    ██', '███████ ', '██    ██', '███████ '],
      'C': [' ███████', '██      ', '██      ', '██      ', ' ███████'],
      'D': ['██████  ', '██   ██ ', '██    ██', '██   ██ ', '██████  '],
      'E': ['████████', '██      ', '██████  ', '██      ', '████████'],
      'F': ['████████', '██      ', '██████  ', '██      ', '██      '],
      'G': [' ███████', '██      ', '██   ███', '██    ██', ' ███████'],
      'H': ['██    ██', '██    ██', '████████', '██    ██', '██    ██'],
      'I': ['████████', '   ██   ', '   ██   ', '   ██   ', '████████'],
      'J': ['████████', '     ██ ', '     ██ ', '██   ██ ', ' ███████'],
      'K': ['██    ██', '██  ██  ', '█████   ', '██  ██  ', '██    ██'],
      'L': ['██      ', '██      ', '██      ', '██      ', '████████'],
      'M': ['██    ██', '████████', '████████', '██    ██', '██    ██'],
      'N': ['██    ██', '███   ██', '████████', '██   ███', '██    ██'],
      'O': [' ██████ ', '██    ██', '██    ██', '██    ██', ' ██████ '],
      'P': ['███████ ', '██    ██', '███████ ', '██      ', '██      '],
      'Q': [' ██████ ', '██    ██', '██    ██', '██   ███', ' ████████'],
      'R': ['███████ ', '██    ██', '███████ ', '██  ██  ', '██    ██'],
      'S': [' ███████', '██      ', ' ██████ ', '      ██', '███████ '],
      'T': ['████████', '   ██   ', '   ██   ', '   ██   ', '   ██   '],
      'U': ['██    ██', '██    ██', '██    ██', '██    ██', ' ██████ '],
      'V': ['██    ██', '██    ██', '██    ██', ' ██████ ', '   ██   '],
      'W': ['██    ██', '██    ██', '████████', '████████', '██    ██'],
      'X': ['██    ██', ' ██████ ', '   ██   ', ' ██████ ', '██    ██'],
      'Y': ['██    ██', ' ██████ ', '   ██   ', '   ██   ', '   ██   '],
      'Z': ['████████', '     ██ ', '   ██   ', ' ██     ', '████████'],
      ' ': ['        ', '        ', '        ', '        ', '        ']
    },

    thick: {
      'A': ['   ████   ', '  ██████  ', ' ████████ ', '████████████', '████    ████'],
      'B': ['████████████', '████    ████', '████████████', '████    ████', '████████████'],
      'C': [' ███████████', '████        ', '████        ', '████        ', ' ███████████'],
      'D': ['████████████', '████    ████', '████    ████', '████    ████', '████████████'],
      'E': ['████████████', '████        ', '████████    ', '████        ', '████████████'],
      'F': ['████████████', '████        ', '████████    ', '████        ', '████        '],
      'G': [' ███████████', '████        ', '████    ████', '████    ████', ' ███████████'],
      'H': ['████    ████', '████    ████', '████████████', '████    ████', '████    ████'],
      'I': ['████████████', '    ████    ', '    ████    ', '    ████    ', '████████████'],
      'J': ['████████████', '        ████', '        ████', '████    ████', ' ███████████'],
      'K': ['████    ████', '████  ████  ', '████████    ', '████  ████  ', '████    ████'],
      'L': ['████        ', '████        ', '████        ', '████        ', '████████████'],
      'M': ['████    ████', '████████████', '████████████', '████    ████', '████    ████'],
      'N': ['████    ████', '██████  ████', '████████████', '████  ██████', '████    ████'],
      'O': [' ██████████ ', '████    ████', '████    ████', '████    ████', ' ██████████ '],
      'P': ['████████████', '████    ████', '████████████', '████        ', '████        '],
      'Q': [' ██████████ ', '████    ████', '████    ████', '████  ██████', ' ████████████'],
      'R': ['████████████', '████    ████', '████████████', '████  ████  ', '████    ████'],
      'S': [' ███████████', '████        ', ' ██████████ ', '        ████', '███████████ '],
      'T': ['████████████', '    ████    ', '    ████    ', '    ████    ', '    ████    '],
      'U': ['████    ████', '████    ████', '████    ████', '████    ████', ' ██████████ '],
      'V': ['████    ████', '████    ████', '████    ████', ' ████████   ', '   ████     '],
      'W': ['████    ████', '████    ████', '████████████', '████████████', '████    ████'],
      'X': ['████    ████', ' ████████   ', '   ████     ', ' ████████   ', '████    ████'],
      'Y': ['████    ████', ' ████████   ', '   ████     ', '   ████     ', '   ████     '],
      'Z': ['████████████', '      ████  ', '   ████     ', ' ████       ', '████████████'],
      ' ': ['            ', '            ', '            ', '            ', '            ']
    },

    slim: {
      'A': [' /\\ ', '/  \\', '----', '|  |'],
      'B': ['|--\\', '|--/', '|--\\', '|--/'],
      'C': [' ---', '|   ', '|   ', ' ---'],
      'D': ['|-- ', '|  \\', '|  /', '|-- '],
      'E': ['----', '|-- ', '----', '----'],
      'F': ['----', '|-- ', '----', '|   '],
      'G': [' ---', '| --', '|  |', ' ---'],
      'H': ['|  |', '|--|', '|  |', '|  |'],
      'I': ['----', ' || ', ' || ', '----'],
      'J': ['----', '  | ', '| | ', ' -- '],
      'K': ['| |', '|/ ', '^  ', '| |'],
      'L': ['|   ', '|   ', '|   ', '----'],
      'M': ['|\\|/', '| | ', '| | ', '| | '],
      'N': ['|\\ |', '| \\|', '|  |', '|  |'],
      'O': [' -- ', '|  |', '|  |', ' -- '],
      'P': ['|--\\', '|--/', '|   ', '|   '],
      'Q': [' -- ', '| |', '|\\|', ' -\\'],
      'R': ['|--\\', '|--/', '|\\  ', '| \\ '],
      'S': [' ---', ' -- ', '--- ', ' -- '],
      'T': ['----', ' || ', ' || ', ' || '],
      'U': ['|  |', '|  |', '|  |', ' -- '],
      'V': ['|  |', '|  |', ' \\/ ', '  | '],
      'W': ['| | ', '| | ', '| | ', '\\|/'],
      'X': ['|  |', ' \\/ ', ' /\\ ', '|  |'],
      'Y': ['|  |', ' \\/ ', '  | ', '  | '],
      'Z': ['----', '  / ', ' /  ', '----'],
      ' ': ['    ', '    ', '    ', '    ']
    },

    double: {
      'A': ['  ╔╗  ', ' ╔╝╚╗ ', '╔╩══╩╗', '╝    ╚'],
      'B': ['╔═══╗ ', '╠═══╣ ', '╠═══╣ ', '╚═══╝ '],
      'C': [' ╔═══╗', ' ║    ', ' ║    ', ' ╚═══╝'],
      'D': ['╔═══╗ ', '║   ║ ', '║   ║ ', '╚═══╝ '],
      'E': ['╔════╗', '╠══   ', '╠════╣', '╚════╝'],
      'F': ['╔════╗', '╠══   ', '╠════ ', '║     '],
      'G': [' ╔═══╗', ' ║ ══╣', ' ║   ║', ' ╚═══╝'],
      'H': ['╔╗  ╔╗', '╠╬══╬╣', '║║  ║║', '╚╝  ╚╝'],
      'I': ['╔════╗', '  ║║  ', '  ║║  ', '╚════╝'],
      'J': ['╔════╗', '    ║║', '╔╗  ║║', '╚╚══╝╝'],
      'K': ['║║  ║║', '║╚╗╔╝ ', '║ ╚╗  ', '║║  ║║'],
      'L': ['║     ', '║     ', '║     ', '╚═════'],
      'M': ['║║  ║║', '║╠══╣║', '║║  ║║', '║║  ║║'],
      'N': ['║╗  ║║', '║╚╗ ║║', '║ ╚╗║║', '║  ╚╝║'],
      'O': [' ╔═══╗', ' ║   ║', ' ║   ║', ' ╚═══╝'],
      'P': ['╔═══╗ ', '║   ║ ', '╠═══╣ ', '║     '],
      'Q': [' ╔═══╗', ' ║   ║', ' ║ ╔═║', ' ╚═╚══'],
      'R': ['╔═══╗ ', '║   ║ ', '╠═══╣ ', '║   ║ '],
      'S': [' ╔═══╗', ' ╚═══╗', ' ╔═══╝', ' ╚═══╝'],
      'T': ['╔════╗', '  ║║  ', '  ║║  ', '  ╚╝  '],
      'U': ['║║  ║║', '║║  ║║', '║║  ║║', '╚╚══╝╝'],
      'V': ['║║  ║║', '║║  ║║', ' ╚╗╔╝ ', '  ╚╝  '],
      'W': ['║║  ║║', '║║  ║║', '║╠══╣║', '║║  ║║'],
      'X': ['║║  ║║', ' ╚╗╔╝ ', ' ╔╝╚╗ ', '║║  ║║'],
      'Y': ['║║  ║║', ' ╚╗╔╝ ', '  ║║  ', '  ╚╝  '],
      'Z': ['╔════╗', '   ╔╝ ', '  ╔╝  ', '╔════╝'],
      ' ': ['      ', '      ', '      ', '      ']
    }
  };

  // Effects
  const effects = {
    wave: (text, frame) => {
      return text.split('\n').map((line, i) => {
        const offset = Math.sin((frame * 0.1) + (i * 0.5)) * 4;
        return ' '.repeat(Math.max(0, Math.floor(offset))) + line;
      }).join('\n');
    },
    
    rainbow: (text, frame) => {
      const colors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3'];
      return text.split('').map((char, i) => {
        if (char === '\n') return char;
        const colorIndex = (Math.floor(frame * 0.1) + i) % colors.length;
        return `<span style="color: ${colors[colorIndex]}">${char}</span>`;
      }).join('');
    },
    
    matrix: (text, frame) => {
      const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      return text.split('').map((char, i) => {
        if (char === ' ' || char === '\n') return char;
        if (Math.random() < 0.08) {
          return chars[Math.floor(Math.random() * chars.length)];
        }
        return char;
      }).join('');
    },
    
    glow: (text, frame) => {
      const intensity = Math.sin(frame * 0.1) * 0.5 + 0.5;
      const glowColor = `rgba(88, 166, 255, ${intensity})`;
      return `<span style="text-shadow: 0 0 10px ${glowColor}, 0 0 20px ${glowColor}, 0 0 30px ${glowColor};">${text}</span>`;
    },
    
    neon: (text, frame) => {
      const colors = ['#ff0080', '#00ff80', '#8000ff', '#ff8000'];
      const colorIndex = Math.floor((frame * 0.05) % colors.length);
      const color = colors[colorIndex];
      return `<span style="color: ${color}; text-shadow: 0 0 5px ${color}, 0 0 10px ${color}, 0 0 15px ${color};">${text}</span>`;
    }
  };

  // Generate ASCII art with proper word wrapping
  const generateAsciiArt = (inputText, fontStyle) => {
    if (!inputText.trim()) {
      return '🎨 Enter some text to generate ASCII art!\n\n✨ Try different fonts and effects for amazing results!';
    }

    const words = inputText.toUpperCase().split(' ');
    const pattern = FONT_PATTERNS[fontStyle] || FONT_PATTERNS.block;
    const height = fontStyle === 'shadow' ? 6 : (fontStyle === 'slim' ? 4 : 5);
    
    // Calculate max characters per line (approximate)
    const maxCharsPerLine = Math.floor(80 / 8); // Assuming each char is ~8 units wide
    
    let result = [];
    let currentLine = [];
    let currentLength = 0;

    words.forEach(word => {
      // Check if adding this word would exceed the line length
      if (currentLength + word.length + 1 > maxCharsPerLine && currentLine.length > 0) {
        // Process current line
        const lineArt = generateLineArt(currentLine.join(' '), pattern, height);
        result.push(lineArt);
        result.push(''); // Add spacing between lines
        
        // Start new line
        currentLine = [word];
        currentLength = word.length;
      } else {
        currentLine.push(word);
        currentLength += word.length + (currentLine.length > 1 ? 1 : 0);
      }
    });

    // Process the last line
    if (currentLine.length > 0) {
      const lineArt = generateLineArt(currentLine.join(' '), pattern, height);
      result.push(lineArt);
    }

    return result.join('\n');
  };

  const generateLineArt = (text, pattern, height) => {
    const lines = Array(height).fill('');
    
    for (let char of text) {
      const charPattern = pattern[char] || pattern[' '];
      for (let i = 0; i < height; i++) {
        lines[i] += (charPattern[i] || ' '.repeat(charPattern[0]?.length || 6)) + '  ';
      }
    }
    
    return lines.join('\n');
  };

  // Animation loop
  const animate = () => {
    if (!isAnimating) return;
    
    let ascii = generateAsciiArt(text, font);
    
    if (effect !== 'none' && effects[effect]) {
      ascii = effects[effect](ascii, frameRef.current);
    }
    
    if (previewRef.current) {
      previewRef.current.innerHTML = ascii;
    }
    
    frameRef.current++;
    animationRef.current = requestAnimationFrame(animate);
  };

  // Start/stop animation
  const toggleAnimation = () => {
    if (isAnimating) {
      setIsAnimating(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    } else {
      setIsAnimating(true);
      frameRef.current = 0;
    }
  };

  // Generate static art
  const generateStatic = () => {
    if (isAnimating) {
      setIsAnimating(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
    
    const ascii = generateAsciiArt(text, font);
    if (previewRef.current) {
      previewRef.current.innerHTML = ascii;
    }
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    if (previewRef.current) {
      navigator.clipboard.writeText(previewRef.current.textContent);
    }
  };

  // Effects
  useEffect(() => {
      generateStatic();
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, font]);

  useEffect(() => {
    if (isAnimating) {
      animate();
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnimating, font, effect]);

  if (!isOpen) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.icon}>🎨</span>
          <span className={styles.title}>3D ASCII Art Generator</span>
          <span className={styles.version}>v3.0</span>
        </div>
        <button className={styles.closeButton} onClick={onClose}>
          ✕ CLOSE
        </button>
      </div>

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.label}>TEXT INPUT</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter your text..."
            className={styles.textInput}
          />
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.label}>FONT STYLE</label>
          <select
            value={font}
            onChange={(e) => setFont(e.target.value)}
            className={styles.select}
          >
            <option value="block">■ Block</option>
            <option value="shadow">▓ Shadow</option>
            <option value="outline">◯ Outline</option>
            <option value="thick">█ Thick</option>
            <option value="slim">│ Slim</option>
            <option value="double">═ Double</option>
          </select>
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.label}>EFFECT</label>
          <select
            value={effect}
            onChange={(e) => setEffect(e.target.value)}
            className={styles.select}
          >
            <option value="none">None</option>
            <option value="wave">🌊 Wave</option>
            <option value="rainbow">🌈 Rainbow</option>
            <option value="matrix">📱 Matrix</option>
            <option value="glow">✨ Glow</option>
            <option value="neon">💫 Neon</option>
          </select>
        </div>

        <div className={styles.buttonGroup}>
          <button className={styles.generateButton} onClick={generateStatic}>
            🚀 Generate
          </button>
          <button 
            className={`${styles.animateButton} ${isAnimating ? styles.animating : ''}`}
            onClick={toggleAnimation}
          >
            {isAnimating ? '⏸ Stop' : '▶ Animate'}
          </button>
          <button className={styles.copyButton} onClick={copyToClipboard}>
            📋 Copy
          </button>
        </div>
      </div>

      <div className={styles.preview} ref={previewRef}>
        {generateAsciiArt(text, font)}
      </div>
    </div>
  );
};

export default AsciiGenerator;
