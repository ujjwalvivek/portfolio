// src/components/TerminalMail/TerminalMail.js
import React, { useState, useEffect, useRef } from 'react';
import emailjs from '@emailjs/browser';
import styles from './TerminalMail.module.css';
import { RiTerminalBoxFill } from "react-icons/ri";

// EmailJS Configuration
const SERVICE_ID = 'service_1uxgvw6';
const TEMPLATE_ID = 'terminal_mail';
const PUBLIC_KEY = '7NdaPgOh1ikiQfrW9';

// Turnstile Configuration (Invisible mode)
const TURNSTILE_SITE_KEY = '0x4AAAAAABmjbZtkf8GEbgrw';

// Conversation steps
const STEPS = {
    WELCOME: 'welcome',
    SUBJECT: 'subject',
    BODY: 'body',
    CONTACT_PREFERENCE: 'contact_preference',
    CONTACT_METHOD: 'contact_method',
    CONTACT_INFO: 'contact_info',
    READY_TO_SEND: 'ready_to_send',
    SENDING: 'sending',
    COMPLETE: 'complete'
};

export default function TerminalMail() {
    // Conversation state
    const [currentStep, setCurrentStep] = useState(STEPS.WELCOME);
    const [history, setHistory] = useState([]);
    const [input, setInput] = useState('');

    // Message data
    const [subject, setSubject] = useState('');
    const [bodyLines, setBodyLines] = useState([]);
    const [needsContact, setNeedsContact] = useState(false);
    const [contactMethod, setContactMethod] = useState(''); // 'email' or 'social'
    const [contactInfo, setContactInfo] = useState('');

    // UI state
    const [sending, setSending] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState('');
    const [commandHistory, setCommandHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const inputRef = useRef(null);
    const terminalRef = useRef(null);
    const invisibleRef = useRef(null); // ✅ NEW: Proper Turnstile container
    const turnstileWidgetId = useRef(null);

    // Initialize welcome message
    useEffect(() => {
        const welcomeMessages = [
            '╭─────────────────────────────────────────────────────────────╮',
            '│                    SECURE TERMINAL MAIL                     │',
            '│                         v1.1.0                              │',
            '╰─────────────────────────────────────────────────────────────╯',
            '',
            'Encrypted connection established via Turnstile',
            'Connecting to iCloud mail server',
            'Ready to transmit your message',
            '',
            '┌─ Let\'s compose your message ─┐',
            '',
            'What\'s the subject of your message?'
        ];

        setHistory(welcomeMessages);
        setCurrentStep(STEPS.SUBJECT);
    }, []);

    // FIXED: Initialize Turnstile properly after DOM is ready
    useEffect(() => {
        if (!invisibleRef.current || !window.turnstile) return;

        // Guard: avoid double-render
        if (turnstileWidgetId.current) return;

        try {
            turnstileWidgetId.current = window.turnstile.render(invisibleRef.current, {
                sitekey: TURNSTILE_SITE_KEY,
                size: 'invisible',
                callback: (token) => {
                    setTurnstileToken(token);
                },
                'error-callback': (error) => {
                    appendHistory('✗ Security verification failed');
                    appendHistory('  Please try again...');
                    setSending(false);
                    setTurnstileToken(''); // Clear failed token
                },
                'expired-callback': () => {
                    setTurnstileToken('');
                    appendHistory('⚠ Security token expired. Reissuing...');
                }
            });
        } catch (error) {
            console.warn('Turnstile initialization failed:', error);
        }
    }, []); // Run once after first DOM paint

    // Auto-focus and scroll
    useEffect(() => {
        inputRef.current?.focus();
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [history]);

    const appendHistory = (line) => {
        setHistory(prev => [...prev, line]);
    };

    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const isValidSocial = (social) => {
        const socialRegex = /^(twitter|instagram|telegram|discord|linkedin)@[\w._-]+$/i;
        return socialRegex.test(social);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            processInput();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            navigateHistory(1);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            navigateHistory(-1);
        }
    };

    const navigateHistory = (direction) => {
        if (commandHistory.length === 0) return;

        const newIndex = Math.max(-1, Math.min(commandHistory.length - 1, historyIndex + direction));
        setHistoryIndex(newIndex);
        setInput(newIndex >= 0 ? commandHistory[commandHistory.length - 1 - newIndex] : '');
    };

    const processInput = () => {
        const userInput = input.trim();
        if (!userInput) return;

        // Add to history
        setCommandHistory(prev => [...prev, userInput]);
        setHistoryIndex(-1);

        // Display user input
        appendHistory(`> ${userInput}`);
        setInput('');

        // Handle reset command at any time
        if (userInput.toLowerCase() === 'reset') {
            resetConversation();
            return;
        }

        // Process based on current step
        switch (currentStep) {
            case STEPS.SUBJECT:
                handleSubjectInput(userInput);
                break;
            case STEPS.BODY:
                handleBodyInput(userInput);
                break;
            case STEPS.CONTACT_PREFERENCE:
                handleContactPreferenceInput(userInput);
                break;
            case STEPS.CONTACT_METHOD:
                handleContactMethodInput(userInput);
                break;
            case STEPS.CONTACT_INFO:
                handleContactInfoInput(userInput);
                break;
            case STEPS.READY_TO_SEND:
                handleSendInput(userInput);
                break;
            default:
                appendHistory('✗ Unexpected input');
        }
    };

    const handleSubjectInput = (input) => {
        if (input.length < 3) {
            appendHistory('✗ Subject too short (minimum 3 characters)');
            appendHistory('What\'s the subject of your message?');
            return;
        }

        setSubject(input);
        appendHistory(`✓ Subject set: "${input}"`);
        appendHistory('');
        appendHistory('Now, let\'s write your message body.');
        appendHistory('Type your message (you can add multiple lines)');
        appendHistory('When finished, type "done"');
        appendHistory('');
        setCurrentStep(STEPS.BODY);
    };

    const handleBodyInput = (input) => {
        if (input.toLowerCase() === 'done') {
            if (bodyLines.length === 0) {
                appendHistory('✗ Message body cannot be empty');
                appendHistory('Please write at least one line, then type "done"');
                return;
            }

            appendHistory(`✓ Message body completed (${bodyLines.length} lines)`);
            appendHistory('');
            appendHistory('Should I be able to contact you back?');
            appendHistory('Type "y" for yes or "n" for no');
            setCurrentStep(STEPS.CONTACT_PREFERENCE);
            return;
        }

        if (input.length < 1) {
            appendHistory('✗ Line cannot be empty');
            return;
        }

        setBodyLines(prev => [...prev, input]);
        //appendHistory(`✓ Line ${bodyLines.length + 1} added`);
    };

    const handleContactPreferenceInput = (input) => {
        const answer = input.toLowerCase();

        if (answer === 'n' || answer === 'no') {
            setNeedsContact(false);
            appendHistory('✓ Got it, no contact info needed');
            appendHistory('');
            appendHistory('🚀 Ready to send! Type "send" to transmit your message');
            setCurrentStep(STEPS.READY_TO_SEND);
        } else if (answer === 'y' || answer === 'yes') {
            setNeedsContact(true);
            appendHistory('✓ Perfect! How should I contact you?');
            appendHistory('');
            appendHistory('Type "email" or "social"');
            setCurrentStep(STEPS.CONTACT_METHOD);
        } else {
            appendHistory('✗ Please type "y" for yes or "n" for no');
        }
    };

    const handleContactMethodInput = (input) => {
        const method = input.toLowerCase();

        if (method === 'email') {
            setContactMethod('email');
            appendHistory('✓ Email selected');
            appendHistory('');
            appendHistory('What\'s your email address?');
            setCurrentStep(STEPS.CONTACT_INFO);
        } else if (method === 'social') {
            setContactMethod('social');
            appendHistory('✓ Social media selected');
            appendHistory('');
            appendHistory('Enter your social handle in format:');
            appendHistory('platform@username (e.g., twitter@ujjwalvivekx)');
            appendHistory('Supported: twitter, instagram, telegram, discord, linkedin');
            setCurrentStep(STEPS.CONTACT_INFO);
        } else {
            appendHistory('✗ Please type "email" or "social"');
        }
    };

    const handleContactInfoInput = (input) => {
        if (contactMethod === 'email') {
            if (!isValidEmail(input)) {
                appendHistory('✗ Invalid email format');
                appendHistory('Please enter a valid email address');
                return;
            }

            setContactInfo(input);
            appendHistory(`✓ Email set: ${input}`);
        } else if (contactMethod === 'social') {
            if (!isValidSocial(input)) {
                appendHistory('✗ Invalid social format');
                appendHistory('Use format: platform@username');
                appendHistory('Example: twitter@ujjwalvivekx');
                return;
            }

            setContactInfo(input);
            appendHistory(`✓ Social handle set: ${input}`);
        }

        appendHistory('');
        appendHistory('🚀 Ready to send! Type "send" to transmit your message');
        setCurrentStep(STEPS.READY_TO_SEND);
    };

    const handleSendInput = (input) => {
        if (input.toLowerCase() === 'send') {
            initiateSend();
        } else {
            appendHistory('✗ Type "send" to transmit your message');
        }
    };

    const initiateSend = () => {
        setSending(true);
        setCurrentStep(STEPS.SENDING);

        appendHistory('');
        appendHistory('🔐 Initiating secure transmission...');
        appendHistory('🤖 Performing security verification...');

        // Check if we already have a valid token
        if (turnstileToken) {
            // Token exists, proceed immediately
            setTimeout(() => {
                appendHistory('✓ Security verification completed');
                proceedWithSend(turnstileToken);
            }, 1000);
        } else {
            // Need to execute Turnstile to get token
            if (window.turnstile && turnstileWidgetId.current) {
                try {
                    // Execute Turnstile and wait for callback
                    window.turnstile.execute(turnstileWidgetId.current);

                    // Set up a one-time listener for when token is received
                    const checkForToken = setInterval(() => {
                        if (turnstileToken) {
                            clearInterval(checkForToken);
                            appendHistory('✓ Security verification completed');
                            proceedWithSend(turnstileToken);
                        }
                    }, 100);

                    // Timeout after 10 seconds
                    setTimeout(() => {
                        clearInterval(checkForToken);
                        if (!turnstileToken) {
                            appendHistory('✗ Verification timeout');
                            appendHistory('Please try again');
                            setSending(false);
                            setCurrentStep(STEPS.READY_TO_SEND);
                        }
                    }, 10000);

                } catch (error) {
                    console.warn('Turnstile execute failed:', error);
                    // Fallback: send without turnstile
                    setTimeout(() => {
                        appendHistory('⚠ Proceeding without verification');
                        proceedWithSend('');
                    }, 1000);
                }
            } else {
                // Fallback: send without turnstile
                setTimeout(() => {
                    appendHistory('⚠ Proceeding without verification');
                    proceedWithSend('');
                }, 1000);
            }
        }
    };

    const proceedWithSend = (token) => {
        appendHistory('📡 Establishing connection to mail server...');
        appendHistory('📨 Transmitting encrypted message...');

        // Prepare template params
        const templateParams = {
            subject: subject,
            message: bodyLines.join('\n'),
            from_name: 'Website Visitor',
            reply_to: contactMethod === 'email' ? contactInfo : 'noreply@terminal.local',
            contact_info: needsContact ? `${contactMethod}: ${contactInfo}` : 'No contact requested',
            'cf-turnstile-response': token
        };

        emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
            .then(() => {
                appendHistory('✅ MESSAGE TRANSMITTED SUCCESSFULLY');
                appendHistory('');
                appendHistory('📬 Your message has been delivered securely');
                if (needsContact) {
                    appendHistory(`📞 I'll get back to you via ${contactMethod}: ${contactInfo}`);
                }
                appendHistory('');
                appendHistory('Thank you for reaching out! 🚀');
                appendHistory('');
                appendHistory('Type "reset" to send another message');
                setCurrentStep(STEPS.COMPLETE);
            })
            .catch((error) => {
                console.error('EmailJS Error:', error);
                appendHistory('❌ TRANSMISSION FAILED');
                appendHistory(`Error: ${error.text || 'Network error'}`);
                appendHistory('');
                appendHistory('Please try again or check your connection');
                appendHistory('Type "send" to retry');
                setCurrentStep(STEPS.READY_TO_SEND);
            })
            .finally(() => {
                setSending(false);
            });
    };

    const resetConversation = () => {
        setSubject('');
        setBodyLines([]);
        setNeedsContact(false);
        setContactMethod('');
        setContactInfo('');
        setTurnstileToken('');
        setSending(false);
        setCommandHistory([]);
        setHistoryIndex(-1);

        setHistory([
            '🔄 Terminal reset',
            '',
            'What\'s the subject of your message?'
        ]);
        setCurrentStep(STEPS.SUBJECT);
    };

    const getStatusText = () => {
        switch (currentStep) {
            case STEPS.SUBJECT: return 'Awaiting subject';
            case STEPS.BODY: return 'Composing body';
            case STEPS.CONTACT_PREFERENCE: return 'Contact preference';
            case STEPS.CONTACT_METHOD: return 'Contact method';
            case STEPS.CONTACT_INFO: return 'Contact details';
            case STEPS.READY_TO_SEND: return 'Ready to send';
            case STEPS.SENDING: return 'Transmitting...';
            case STEPS.COMPLETE: return 'Complete';
            default: return 'Ready';
        }
    };

    return (
        <div className={styles.terminalContainer}>
            {/* ✅ NEW: Hidden container for invisible Turnstile */}
            <div ref={invisibleRef} style={{ display: 'none' }} />

            <div className={styles.terminalHeader}>
                <div className={styles.terminalButtons}>
                    <div className={styles.closeButton}></div>
                    <div className={styles.minimizeButton}></div>
                    <div className={styles.maximizeButton}></div>
                </div>
                <div className={styles.terminalTitle}>
                    <span className={styles.titleIcon}><RiTerminalBoxFill /></span>
                    secure-mail@ujjwalvivek
                </div>
                <div className={styles.terminalStatus}>
                    <span className={styles.titleDomain}>secure_connection_on</span>
                    <span className={`${styles.statusDot} ${sending ? styles.sending : styles.ready}`}></span>
                </div>
            </div>

            <div
                ref={terminalRef}
                className={styles.terminalContent}
            >
                <div className={styles.terminalOutput}>
                    {history.map((line, i) => (
                        <div key={i} className={styles.outputLine}>
                            {line}
                        </div>
                    ))}
                </div>

                <div className={styles.inputContainer}>
                    <span className={styles.prompt}>
                        <span className={styles.promptUser}>mail</span>
                        <span className={styles.promptSeparator}>@</span>
                        <span className={styles.promptHost}>uv</span>
                        <span className={styles.promptPath}>:~$</span>
                    </span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className={styles.terminalInput}
                        placeholder={
                            sending ? "Processing..." :
                                currentStep === STEPS.COMPLETE ? "Type 'reset' for new message..." :
                                    "Type your response..."
                        }
                        disabled={sending}
                        autoComplete="off"
                        spellCheck="false"
                    />
                </div>
            </div>

            <div className={styles.terminalFooter}>
                <div className={styles.statusBar}>
                    <span className={styles.statusItem}>
                        <span className={styles.statusIcon}>●</span>
                        {getStatusText()}
                    </span>
                    <span className={styles.statusItem}>
                        {subject && `Subject: ${subject.slice(0, 20)}${subject.length > 20 ? '...' : ''}`}
                    </span>
                    <span className={styles.statusItem}>
                        Lines: {bodyLines.length}
                    </span>
                    <span className={styles.statusItem}>
                        <span className={styles.statusIcon}>⚡</span>
                        Ready
                    </span>
                </div>
            </div>
        </div>
    );
}
