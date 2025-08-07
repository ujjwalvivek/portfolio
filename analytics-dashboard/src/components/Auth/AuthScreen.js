import React, { useState } from 'react';
import styles from './AuthScreen.module.css';

const AuthScreen = ({ onLogin, isLoading }) => {
    const [apiKey, setApiKey] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!apiKey.trim()) return;

        setIsSubmitting(true);
        setError('');

        const result = await onLogin(apiKey.trim());

        if (!result.success) {
            setError(result.error);
        }

        setIsSubmitting(false);
    };

    return (
        <div className={styles.authScreen}>
            {/* Background Effects */}
            <div className={styles.particles}>
                {[...Array(20)].map((_, i) => (
                    <div key={i} className={styles.particle}></div>
                ))}
            </div>

            <div className={styles.terminalWindow}>
                {/* Terminal Title Bar */}
                <div className={styles.titleBar}>
                    <div className={styles.windowControls}>
                        <span className={styles.windowButton} data-type="close"></span>
                        <span className={styles.windowButton} data-type="minimize"></span>
                        <span className={styles.windowButton} data-type="maximize"></span>
                    </div>
                    <span className={styles.titleRight}>minimal_analytics_cli</span>
                </div>

                {/* Terminal Content */}
                <div className={styles.terminalContent}>
                    {/* ASCII Art */}
                    <div className={styles.asciiArt}>
                        <pre>{`
██╗     ██╗ ██████╗ ██╗  ██╗████████╗██╗    ██╗███████╗██╗ ██████╗ ██╗  ██╗████████╗
██║     ██║██╔════╝ ██║  ██║╚══██╔══╝██║    ██║██╔════╝██║██╔════╝ ██║  ██║╚══██╔══╝
██║     ██║██║  ███╗███████║   ██║   ██║ █╗ ██║█████╗  ██║██║  ███╗███████║   ██║   
██║     ██║██║   ██║██╔══██║   ██║   ██║███╗██║██╔══╝  ██║██║   ██║██╔══██║   ██║   
███████╗██║╚██████╔╝██║  ██║   ██║   ╚███╔███╔╝███████╗██║╚██████╔╝██║  ██║   ██║   
╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝    ╚══╝╚══╝ ╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝   

 █████╗ ███╗   ██╗ █████╗ ██╗  ██╗   ██╗████████╗██╗ ██████╗███████╗
██╔══██╗████╗  ██║██╔══██╗██║  ╚██╗ ██╔╝╚══██╔══╝██║██╔════╝██╔════╝
███████║██╔██╗ ██║███████║██║   ╚████╔╝    ██║   ██║██║     ███████╗
██╔══██║██║╚██╗██║██╔══██║██║    ╚██╔╝     ██║   ██║██║     ╚════██║
██║  ██║██║ ╚████║██║  ██║███████╗██║      ██║   ██║╚██████╗███████║
╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝╚═╝      ╚═╝   ╚═╝ ╚═════╝╚══════╝
            `}</pre>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className={styles.loginForm}>
                        <div className={styles.loginPrompt}>
                            {(isSubmitting || isLoading) ? (
                                <div className={styles.statusLine}>
                                    Authenticating... Please wait.
                                </div>
                            ) : (
                                <div className={styles.inputLine}>
                                    <span className={styles.promptText}> $secret_key_api</span>
                                    <div className={styles.inputContainer}>
                                        <span className={styles.inputPrompt}>&gt;</span>
                                        <input
                                            type="password"
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                            className={styles.secretInput}
                                            disabled={isSubmitting || isLoading}
                                            autoFocus
                                            autoComplete="off"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            </div>
            {error && (
                                <div className={styles.errorLine}>
                                    Authentication failed. Please try again.
                                </div>
                            )}
            {/* Success State */}
                    {!error && !isSubmitting && !isLoading && apiKey.length > 0 && (
                        <div className={styles.readyMessage}>
                            Ready to authenticate. Press <span className={styles.keyHint}>Enter</span> to continue
                        </div>
                    )}
        </div>
    );
};

export default AuthScreen;
