import styles from './TerminalMail.module.css';

const STEP_HINTS = {
    subject: [],
    body: [
        { key: '"done"', label: 'finish body' },
    ],
    contact_preference: [
        { key: 'y', label: 'yes' },
        { key: 'n', label: 'no' },
    ],
    contact_method: [
        { key: '"email"', label: 'email' },
        { key: '"social"', label: 'social' },
    ],
    contact_info: [],
    ready_to_send: [
        { key: '"send"', label: 'transmit' },
    ],
    sending: [
        { key: '...', label: 'transmitting' },
    ],
    complete: [
        { key: '"reset"', label: 'new message' },
    ],
};

export default function HelpBar({ currentStep, subject, bodyLines, contactMethod, contactInfo, needsContact }) {
    const hints = STEP_HINTS[currentStep] || '';

    return (
        <div className={styles.helpBar}>
            <div className={styles.previewHints}>
                <div className={styles.previewGrid}>
                    <div className={styles.previewField}>
                        <span className={styles.previewLabel}>Subject</span>
                        <span className={styles.previewValue}>
                            {subject || <span className={styles.previewWaiting}>waiting...</span>}
                        </span>
                    </div>
                    <div className={styles.previewField}>
                        <span className={styles.previewLabel}>Body</span>
                        <span className={styles.previewValue}>
                            {bodyLines.length > 0
                                ? <span>{bodyLines.length} line{bodyLines.length !== 1 ? 's' : ''}</span>
                                : <span className={styles.previewWaiting}>waiting...</span>
                            }
                        </span>
                    </div>
                    <div className={styles.previewField}>
                        <span className={styles.previewLabel}>Contact</span>
                        <span className={styles.previewValue}>
                            {contactInfo
                                ? <span>{contactMethod}: {contactInfo}</span>
                                : needsContact === false && subject
                                    ? <span className={styles.previewDim}>none requested</span>
                                    : <span className={styles.previewWaiting}>waiting...</span>
                            }
                        </span>
                    </div>
                </div>
            </div>
            <div className={styles.helpHints}>
                {hints.map((hint, i) => (
                    <span key={i} className={styles.helpHint}>
                        <kbd className={styles.helpKey}>{hint.key}</kbd>
                        <span className={styles.helpLabel}>{hint.label}</span>
                    </span>
                ))}
            </div>
        </div>
    );
}

