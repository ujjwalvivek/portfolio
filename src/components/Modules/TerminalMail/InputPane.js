import { useEffect, useRef, useState } from 'react';
import styles from './TerminalMail.module.css';

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

const STEP_PROMPTS = {
    subject: { prompt: 'subject', hint: "What's the subject of your message?" },
    body: { prompt: 'body', hint: 'Type your message. Type "done" when finished.' },
    contact_preference: { prompt: 'contact', hint: 'Should I be able to contact you back? (y/n)' },
    contact_method: { prompt: 'method', hint: 'Type "email" or "social"' },
    contact_info: { prompt: 'info', hint: 'Enter your contact details' },
    ready_to_send: { prompt: 'send', hint: 'Type "send" to transmit your message' },
    sending: { prompt: '...', hint: 'Processing...' },
    complete: { prompt: 'done', hint: "Type 'reset' for new message" },
};

export default function InputPane({ input, setInput, onKeyDown, sending, currentStep }) {
    const inputRef = useRef(null);
    const [spinnerIdx, setSpinnerIdx] = useState(0);

    useEffect(() => {
        if (!sending) return;
        const timer = setInterval(() => {
            setSpinnerIdx(prev => (prev + 1) % SPINNER_FRAMES.length);
        }, 80);
        return () => clearInterval(timer);
    }, [sending]);

    const stepConfig = STEP_PROMPTS[currentStep] || STEP_PROMPTS.subject;

    return (
        <div className={styles.composeInputRow}>
            <span className={styles.composePrompt}>
                {sending ? (
                    <span className={styles.spinner}>{SPINNER_FRAMES[spinnerIdx]}</span>
                ) : (
                    <>
                        <span className={styles.promptTilde}>~</span>
                        <span className={styles.promptSlash}>/</span>
                        <span className={styles.promptStep}>{stepConfig.prompt}</span>
                        <span className={styles.promptCaret}> &gt;</span>
                    </>
                )}
            </span>
            <input
                ref={inputRef}
                name='terminalInput'
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                className={styles.composeInput}
                placeholder={stepConfig.hint}
                disabled={sending}
                autoComplete="off"
                spellCheck="false"
            />
        </div>
    );
}
