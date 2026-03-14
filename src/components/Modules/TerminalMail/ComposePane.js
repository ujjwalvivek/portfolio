import { useEffect } from 'react';
import styles from './TerminalMail.module.css';

const TYPE_CLASS = {
    user: styles.lineUser,
    system: styles.lineSystem,
    prompt: styles.linePrompt,
    success: styles.lineSuccess,
    error: styles.lineError,
    warn: styles.lineWarn,
    info: styles.lineInfo,
};

export default function ComposePane({
    history,
    terminalRef,
}) {

    //? Auto-scroll on new history
    useEffect(() => {
        if (terminalRef?.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [history, terminalRef]);

    return (
        <div className={styles.composePane}>
            <div className={styles.composeOutput} ref={terminalRef}>
                {history.map((entry, i) => (
                    <div
                        key={i}
                        className={`${styles.composeLine} ${!entry.message.trim() ? styles.lineBlank : (TYPE_CLASS[entry.type] || styles.lineSystem)}`}
                    >
                        {entry.message}
                    </div>
                ))}
            </div>
        </div>
    );
}