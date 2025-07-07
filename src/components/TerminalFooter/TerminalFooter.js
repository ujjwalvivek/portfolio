import React from "react";
import CrashOverlay from "../SystemError/CrashOverlay";
import styles from "./TerminalFooter.module.css";
import { terminalCommands } from "./TerminalCommands";

const TerminalFooter = ({showTerminal}) => {
  
  const greetings = [
  "Welcome to the Terminal! Type 'help'.",
  "Terminal ready. What will you 'help' create today?",
  "Magic happens here. 'help' yourself out with a command.",
  "Seek and you shall find 'help'.",
  "Hint: Not all commands are listed. 'help' yourself. "
];


  const [input, setInput] = React.useState("");
  const [crashed, setCrashed] = React.useState(false);
const [history, setHistory] = React.useState([
  { type: 'output', text: greetings[Math.floor(Math.random() * greetings.length)] }
]);
  const [historyIndex, setHistoryIndex] = React.useState(-1);
  const inputRef = React.useRef(null);
  const scrollRef = React.useRef(null);

  const handleCommand = (cmd) => {
    if (cmd.trim().toLowerCase() === "run exit") {
      setCrashed(true);
      return;
    }
    let output = '';
    if (cmd.trim() === "help") {
      output = 'Available commands: whoami, clear, hint';
    } else if (cmd.trim() === "whoami") {
      output = 'You are a Creator! Keep Building and Exploring.';
    } else if (cmd.trim() === "clear") {
      setHistory([]);
      return;
    } else if (cmd.trim() === "") {
      output = '';
    } else {
      const surprise = terminalCommands.find(s => s.trigger === cmd.trim().toLowerCase());
      if (surprise) {
        output = surprise.output;
      } else {
        output = `command not found: ${cmd}`;
      }
    }
    setHistory((h) => [...h, { type: 'input', text: cmd }, { type: 'output', text: output }]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleCommand(input);
      setInput("");
      setHistoryIndex(-1);
    } else if (e.key === "ArrowUp") {
      const cmds = history.filter(h => h.type === 'input').map(h => h.text);
      if (cmds.length === 0) return;
      const idx = historyIndex === -1 ? cmds.length - 1 : Math.max(0, historyIndex - 1);
      setInput(cmds[idx] || "");
      setHistoryIndex(idx);
    } else if (e.key === "ArrowDown") {
      const cmds = history.filter(h => h.type === 'input').map(h => h.text);
      if (cmds.length === 0) return;
      const idx = historyIndex === -1 ? cmds.length - 1 : Math.min(cmds.length - 1, historyIndex + 1);
      setInput(cmds[idx] || "");
      setHistoryIndex(idx);
    }
  };


React.useEffect(() => {
  if (scrollRef.current) {
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }
}, [history]);

  if (crashed) {
    return <CrashOverlay onRestart={() => window.location.reload()} />;
  }

  return (
    <div className={styles.terminalFooterReal + ' ' + styles.flicker} onClick={() => inputRef.current && inputRef.current.focus()} >
      <div className={styles.terminalFooterWindowBar}>
        <span className={styles.terminalDot} style={{ background: '#ff5f56' }} />
        <span className={styles.terminalDot} style={{ background: '#ffbd2e' }} />
        <span className={styles.terminalDot} style={{ background: '#27c93f' }} />
      </div>
      <div className={styles.terminalFooterScroll} ref={scrollRef}>
        {history.map((item, i) => {
          // Detect keywords for effects
          let extraClass = "";
          if (
            item.text.includes("The terminal dims") ||
            item.text.includes("silence grows louder") ||
            item.text.includes("You turn away")
          ) {
            extraClass = styles.dimmed;
          }
          if (
            item.text.includes("INTRUDER DETECTED") ||
            item.text.includes("System override denied") ||
            item.text.includes("Override failed")
          ) {
            extraClass = styles.alert;
          }
          if (
            item.text.includes("glitches") ||
            item.text.includes("glitch") ||
            item.text.includes("system glitches")
          ) {
            extraClass = styles.glitch;
          }
          return (
            <div
              key={i}
              className={
                (item.type === "input"
                  ? styles.terminalInputLine
                  : styles.terminalOutputLine) +
                (extraClass ? " " + extraClass : "")
              }
            >
              {item.type === "input" ? (
                <>
                  <span className={styles.terminalPromptReal}>&gt; </span>
                  <span>{item.text}</span>
                </>
              ) : (
                <span>{item.text}</span>
              )}
            </div>
          );
        })}
        <div className={styles.terminalInputLine}>
          <span className={styles.terminalPromptReal + ' ' + styles.flicker}>&gt; </span>
          <input
            ref={inputRef}
            className={styles.terminalInputReal + ' ' + styles.flicker}
            type="text"
            value={input}
            placeholder="try out a command"
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
};

export default TerminalFooter;