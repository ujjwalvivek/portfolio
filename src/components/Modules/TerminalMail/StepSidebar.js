import styles from './TerminalMail.module.css';
import TerminalCat from './TerminalCat';

const SIDEBAR_STEPS = [
    { key: 'subject', label: 'subject' },
    { key: 'body', label: 'body' },
    { key: 'contact', label: 'contact' },
    { key: 'review', label: 'review' },
    { key: 'send', label: 'send' },
];

function mapStepToSidebar(currentStep) {
    switch (currentStep) {
        case 'subject': return 'subject';
        case 'body': return 'body';
        case 'contact_preference':
        case 'contact_method':
        case 'contact_info': return 'contact';
        case 'ready_to_send': return 'review';
        case 'sending':
        case 'complete': return 'send';
        default: return 'subject';
    }
}

function getCompletedSteps(currentStep) {
    const sidebarStep = mapStepToSidebar(currentStep);
    const order = SIDEBAR_STEPS.map(s => s.key);
    const activeIdx = order.indexOf(sidebarStep);
    return new Set(order.slice(0, activeIdx));
}

export default function StepSidebar({ currentStep, onJumpToStep }) {
    const activeSidebarKey = mapStepToSidebar(currentStep);
    const completed = getCompletedSteps(currentStep);


    return (
        <div className={styles.stepSidebar}>
            <div className={styles.stepList}>
                {SIDEBAR_STEPS.map((step) => {
                    const isActive = step.key === activeSidebarKey;
                    const isDone = completed.has(step.key);
                    const isClickable = isDone && onJumpToStep;

                    return (
                        <button
                            key={step.key}
                            className={`${styles.stepItem} ${isActive ? styles.stepActive : ''} ${isDone ? styles.stepDone : ''}`}
                            onClick={isClickable ? () => onJumpToStep(step.key) : undefined}
                            disabled={!isClickable}
                            type="button"
                        >
                            <span className={styles.stepMarker}>
                                {isDone ? '●' : isActive ? '●' : '○'}
                            </span>
                            <span className={styles.stepLabel}>{step.label}</span>
                        </button>
                    );
                })}
            </div>
            <div className={styles.companion}>
                <TerminalCat />
            </div>

        </div>
    );
}

export { mapStepToSidebar, SIDEBAR_STEPS };
