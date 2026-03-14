import styles from './TerminalMail.module.css';

export default function TUIPanel({ title, focused, children, className }) {
    return (
        <div className={`${styles.tuiPanel} ${focused ? styles.tuiPanelFocused : styles.tuiPanelUnfocused} ${className || ''}`}>
            {title && (
                <div className={styles.tuiPanelHeader}>
                    <span className={styles.tuiPanelTitle}>{title}</span>
                </div>
            )}
            <div className={styles.tuiPanelBody}>
                {children}
            </div>
        </div>
    );
}
