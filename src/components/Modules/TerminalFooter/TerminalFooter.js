/**
 * ███████╗ █████╗ ███████╗████████╗███████╗██████╗                 
 * ██╔════╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗                
 * █████╗  ███████║███████╗   ██║   █████╗  ██████╔╝                
 * ██╔══╝  ██╔══██║╚════██║   ██║   ██╔══╝  ██╔══██╗                
 * ███████╗██║  ██║███████║   ██║   ███████╗██║  ██║                
 * ╚══════╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝                
 *                                                                  
 * ███████╗ ██████╗  ██████╗                                        
 * ██╔════╝██╔════╝ ██╔════╝                                        
 * █████╗  ██║  ███╗██║  ███╗                                       
 * ██╔══╝  ██║   ██║██║   ██║                                       
 * ███████╗╚██████╔╝╚██████╔╝                                       
 * ╚══════╝ ╚═════╝  ╚═════╝                                        
 *                                                                  
 * ████████╗███████╗██████╗ ███╗   ███╗██╗███╗   ██╗ █████╗ ██╗     
 * ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██║████╗  ██║██╔══██╗██║     
 *    ██║   █████╗  ██████╔╝██╔████╔██║██║██╔██╗ ██║███████║██║     
 *    ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██║██║╚██╗██║██╔══██║██║     
 *    ██║   ███████╗██║  ██║██║ ╚═╝ ██║██║██║ ╚████║██║  ██║███████╗
 *    ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝
 *                                                                  
 */

import React from "react";
import CrashOverlay from "../SystemError/CrashOverlay";
import styles from "./TerminalFooter.module.css";
import { terminalCommands } from "./TerminalCommands";
import { useBackground } from '../../Background/BackgroundContext';

const TerminalFooter = ({ showTerminal }) => {

  const greetings = [
    "Great Find! Welcome to the Terminal! Type 'help'.",
    "Now we're talking! Terminal ready. What will you 'help' create today?",
    "Nice! Magic happens here. 'help' yourself out with a command.",
    "Rare item acquired! Seek and you shall find 'help'.",
    "Still obscure? Hint: Not all commands are listed. 'help' yourself. "
  ];


  const [input, setInput] = React.useState("");
  const [crashed, setCrashed] = React.useState(false);
  const [history, setHistory] = React.useState([
    { type: 'output', text: greetings[Math.floor(Math.random() * greetings.length)] }
  ]);
  const [historyIndex, setHistoryIndex] = React.useState(-1);
  const inputRef = React.useRef(null);
  const scrollRef = React.useRef(null);

  const { backgroundConfig } = useBackground();
  const { toggleBackground } = useBackground();
  // Only add glitch/pulse/flicker if background is not "none"
  const flicker = backgroundConfig.type !== 'none' ? styles.flicker : '';
  const dimmed = backgroundConfig.type !== 'none' ? styles.dimmed : '';
  const alert = backgroundConfig.type !== 'none' ? styles.alert : '';
  const glitch = backgroundConfig.type !== 'none' ? styles.glitch : '';

  const handleCommand = (cmd) => {
    if (cmd.trim().toLowerCase() === "run exit") {
      setCrashed(true);
      return;
    }
    let output = '';

    // Context-aware "hint"
    if (cmd.trim() === "hint") {
      let output = `Psst! Here's one especially for you :)\n\n>> Type 'start' to begin the journey.`;
      if (backgroundConfig.type === "none") {
        output += `\n\n(Psst! This journey is more fun when chaos is cracked up to the max. Type 'maximumfun' to turn up the heat!)`;
      }
      output += `\n\n[Accessibility]: Some effects may be visually intense. For a calmer vibe, keep it cool or use 'minimumfun'. Use these commands anytime to switch your vibe!`;
      setHistory((h) => [
        ...h,
        { type: "input", text: cmd },
        { type: "output", text: output }
      ]);
      return;
    }

    // Context-aware "maximumfun"
    if (cmd.trim() === "maximumfun") {
      if (backgroundConfig.type === "none") {
        toggleBackground();
        setHistory((h) => [
          ...h,
          { type: "input", text: cmd },
          { type: "output", text: "Madness 100.\n\n>> Type 'start' to begin the journey. Good Luck!" }
        ]);
      } else {
        setHistory((h) => [
          ...h,
          { type: "input", text: cmd },
          { type: "output", text: "Madness Detected Already.\n\n>> Type 'start' to begin the journey. Good Luck!" }
        ]);
      }
      return;
    }

    // Context-aware "minimumfun"
    if (cmd.trim() === "minimumfun") {
      if (backgroundConfig.type !== "none") {
        toggleBackground();
        setHistory((h) => [
          ...h,
          { type: "input", text: cmd },
          { type: "output", text: "Calm 100.\n\n>> Type 'start' to begin the journey. Good Luck!" }
        ]);
      } else {
        setHistory((h) => [
          ...h,
          { type: "input", text: cmd },
          { type: "output", text: "Calmness Detected Already.\n\n>> Type 'start' to begin the journey. Good Luck!" }
        ]);
      }
      return;
    }

    // Handle other commands
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

  React.useEffect(() => {
    if (crashed) {
      console.log(
        "👀 Welcome curious dev. You found the logs under the logs. Just refresh the page and it should restart."
      );
    }
  }, [crashed]);

  if (crashed) {
    return <CrashOverlay onRestart={() => window.location.reload()} />;
  }

  return (
    <div className={`${styles.terminalFooterReal} ${flicker}`} onClick={() => inputRef.current && inputRef.current.focus()} >
      <div className={styles.terminalFooterWindowBar}>
        <span className={styles.terminalDot} style={{ background: 'linear-gradient(135deg, var(--status-ram-color) 0%, var(--status-ram-color) 100%)' }} />
        <span className={styles.terminalDot} style={{ background: 'linear-gradient(135deg, var(--status-warn-color) 0%, var(--status-warn-color) 100%)' }} />
        <span className={styles.terminalDot} style={{ background: 'linear-gradient(135deg, var(--status-ok-color) 0%, var(--status-ok-color) 100%)' }} />
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
            extraClass = dimmed;
          }
          if (
            item.text.includes("INTRUDER DETECTED") ||
            item.text.includes("System override denied") ||
            item.text.includes("Override failed")
          ) {
            extraClass = alert;
          }
          if (
            item.text.includes("glitches") ||
            item.text.includes("glitch") ||
            item.text.includes("system glitches")
          ) {
            extraClass = glitch;
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
          <span className={styles.terminalPromptReal + ' ' + flicker}>&gt; </span>
          <input
            ref={inputRef}
            className={styles.terminalInputReal + ' ' + flicker}
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
      <div style={{ borderTop: '1px solid rgba(56, 139, 253, 0.2)', height: '0.5rem', flexShrink: 0 }}></div>
    </div>
  );
};

export default TerminalFooter;