/**
 * ████████╗███████╗██████╗ ███╗   ███╗██╗███╗   ██╗ █████╗ ██╗     
 * ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██║████╗  ██║██╔══██╗██║     
 *    ██║   █████╗  ██████╔╝██╔████╔██║██║██╔██╗ ██║███████║██║     
 *    ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██║██║╚██╗██║██╔══██║██║     
 *    ██║   ███████╗██║  ██║██║ ╚═╝ ██║██║██║ ╚████║██║  ██║███████╗
 *    ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝
 *                                                                  
 * ███╗   ███╗ █████╗ ██╗██╗                                        
 * ████╗ ████║██╔══██╗██║██║                                        
 * ██╔████╔██║███████║██║██║                                        
 * ██║╚██╔╝██║██╔══██║██║██║                                        
 * ██║ ╚═╝ ██║██║  ██║██║███████╗                                   
 * ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝╚══════╝                                   
 *                                                                  
 *  ██████╗██╗     ██╗███████╗███╗   ██╗████████╗                   
 * ██╔════╝██║     ██║██╔════╝████╗  ██║╚══██╔══╝                   
 * ██║     ██║     ██║█████╗  ██╔██╗ ██║   ██║                      
 * ██║     ██║     ██║██╔══╝  ██║╚██╗██║   ██║                      
 * ╚██████╗███████╗██║███████╗██║ ╚████║   ██║                      
 *  ╚═════╝╚══════╝╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝                      
 *                                                                  
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import emailjs from '@emailjs/browser';
import styles from './TerminalMail.module.css';
import { RiTerminalBoxFill } from "react-icons/ri";

import TUIPanel from './TUIPanel';
import StepSidebar from './StepSidebar';
import InputPane from './InputPane';
import ComposePane from './ComposePane';
import HelpBar from './HelpBar';
//? EmailJS Configuration
const SERVICE_ID = 'service_1uxgvw6';
const TEMPLATE_ID = 'terminal_mail';
const PUBLIC_KEY = '7NdaPgOh1ikiQfrW9';

//? Turnstile Configuration (Invisible mode)
const TURNSTILE_SITE_KEY = '0x4AAAAAABmjbZtkf8GEbgrw';

//? Conversation steps
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
    //? Conversation state
    const [currentStep, setCurrentStep] = useState(STEPS.SUBJECT);
    const [history, setHistory] = useState([
        { message: 'encrypted connection established', type: 'system' },
        { message: ' ', type: 'system' }
    ]);
    const [input, setInput] = useState('');

    //? Message data
    const [subject, setSubject] = useState('');
    const [bodyLines, setBodyLines] = useState([]);
    const [needsContact, setNeedsContact] = useState(false);
    const [contactMethod, setContactMethod] = useState(''); //* 'email' or 'social'
    const [contactInfo, setContactInfo] = useState('');

    //? UI state
    const [sending, setSending] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState('');
    const [commandHistory, setCommandHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [sendResult, setSendResult] = useState(null); //* 'success' | 'error' | null

    const terminalRef = useRef(null);
    const invisibleRef = useRef(null);
    const turnstileWidgetId = useRef(null);

    //? Initialize Turnstile properly after DOM is ready
    useEffect(() => {
        if (!invisibleRef.current || !window.turnstile) return;
        if (turnstileWidgetId.current) return;

        try {
            turnstileWidgetId.current = window.turnstile.render(invisibleRef.current, {
                sitekey: TURNSTILE_SITE_KEY,
                size: 'invisible',
                callback: (token) => {
                    setTurnstileToken(token);
                },
                'error-callback': () => {
                    appendHistory('failed. try again...', 'error');
                    setSending(false);
                    setTurnstileToken('');
                },
                'expired-callback': () => {
                    setTurnstileToken('');
                    appendHistory('reissuing token...', 'warn');
                }
            });
        } catch (error) {
            console.warn('Turnstile initialization failed:', error);
        }
    }, []);

    const appendHistory = (line, type = 'system') => {
        setHistory(prev => [...prev, { message: line, type }]);
    };

    //? Jump back to a completed step for editing
    const handleJumpToStep = useCallback((sidebarKey) => {
        const jumpMap = {
            subject: () => {
                appendHistory(' ', 'prompt');
                appendHistory('editing subject...', 'system');
                setCurrentStep(STEPS.SUBJECT);
            },
            body: () => {
                setBodyLines([]);
                appendHistory(' ', 'prompt');
                appendHistory('editing body...', 'system');
                setCurrentStep(STEPS.BODY);
            },
            contact: () => {
                setContactMethod('');
                setContactInfo('');
                setNeedsContact(false);
                appendHistory(' ', 'prompt');
                appendHistory('editing contact (y/n)...', 'system');
                setCurrentStep(STEPS.CONTACT_PREFERENCE);
            },
        };
        if (jumpMap[sidebarKey]) {
            jumpMap[sidebarKey]();
            setInput('');
        }
    }, []);

    //? Clear send result flash after animation
    useEffect(() => {
        if (!sendResult) return;
        const timer = setTimeout(() => setSendResult(null), 700);
        return () => clearTimeout(timer);
    }, [sendResult]);

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

        setCommandHistory(prev => [...prev, userInput]);
        setHistoryIndex(-1);

        if (currentStep !== STEPS.BODY || userInput.toLowerCase() === 'done') {
            appendHistory(`${userInput}`, 'user');
        }
        setInput('');

        if (userInput.toLowerCase() === 'reset') {
            resetConversation();
            return;
        }

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
                appendHistory('invalid input', 'error');
        }
    };

    const handleSubjectInput = (input) => {
        if (input.length < 3) {
            appendHistory('minimum 3 characters', 'error');
            return;
        }

        setSubject(input);
        appendHistory(' ', 'prompt');
        appendHistory('type your message (you can add multiple lines)', 'prompt');
        setCurrentStep(STEPS.BODY);
    };

    const handleBodyInput = (input) => {
        if (input.toLowerCase() === 'done') {
            if (bodyLines.length === 0) {
                appendHistory('minimum one line"', 'error');
                return;
            }

            appendHistory(' ', 'prompt');
            appendHistory('should i be able to contact you back? (y/n)', 'prompt');
            setCurrentStep(STEPS.CONTACT_PREFERENCE);
            return;
        }

        if (input.length === 0) {
            appendHistory('minimum one line"', 'error');
            return;
        }

        setBodyLines(prev => [...prev, input]);
        appendHistory(`+ ${input}`, 'info');
    };

    const handleContactPreferenceInput = (input) => {
        const answer = input.toLowerCase();

        if (answer === 'n' || answer === 'no') {
            setNeedsContact(false);
            appendHistory(' ', 'prompt');
            appendHistory('ready! type "send" to transmit your message', 'prompt');
            setCurrentStep(STEPS.READY_TO_SEND);
        } else if (answer === 'y' || answer === 'yes') {
            setNeedsContact(true);
            appendHistory(' ', 'prompt');
            appendHistory('perfect! choose one. type "email" or "social"', 'prompt');
            setCurrentStep(STEPS.CONTACT_METHOD);
        } else {
            appendHistory('invalid. choose one y/n', 'error');
        }
    };

    const handleContactMethodInput = (input) => {
        const method = input.toLowerCase();

        if (method === 'email') {
            setContactMethod('email');
            appendHistory(' ', 'prompt');
            appendHistory('what\'s your email?', 'prompt');
            setCurrentStep(STEPS.CONTACT_INFO);
        } else if (method === 'social') {
            setContactMethod('social');
            appendHistory(' ', 'prompt');
            appendHistory('enter your socials as platform@username, like twitter@ujjwalvivekx', 'prompt');
            appendHistory('Supported: twitter, instagram, telegram, discord, linkedin', 'info');
            setCurrentStep(STEPS.CONTACT_INFO);
        } else {
            appendHistory('invalid. choose "email" or "social"', 'error');
        }
    };

    const handleContactInfoInput = (input) => {
        if (contactMethod === 'email') {
            if (!isValidEmail(input)) {
                appendHistory(' ', 'prompt');
                appendHistory('enter a valid email address', 'error');
                return;
            }

            setContactInfo(input);
        } else if (contactMethod === 'social') {
            if (!isValidSocial(input)) {
                appendHistory(' ', 'prompt');
                appendHistory('use format platform@username', 'error');
                return;
            }

            setContactInfo(input);
            appendHistory(` `, 'success');
        }

        appendHistory(' ', 'prompt');
        appendHistory('ready! type "send" to transmit your message', 'prompt');
        setCurrentStep(STEPS.READY_TO_SEND);
    };

    const handleSendInput = (input) => {
        if (input.toLowerCase() === 'send') {
            initiateSend();
        } else {
            appendHistory(' ', 'prompt');
            appendHistory('invalid. type "send"', 'error');
        }
    };

    const initiateSend = () => {
        setSending(true);
        setCurrentStep(STEPS.SENDING);

        //? Check if we already have a valid token
        if (turnstileToken) {
            setTimeout(() => {
                appendHistory(' ', 'prompt');
                appendHistory('security verification completed', 'success');
                proceedWithSend(turnstileToken);
            }, 1000);
        } else {
            if (window.turnstile && turnstileWidgetId.current) {
                try {
                    window.turnstile.execute(turnstileWidgetId.current);

                    const checkForToken = setInterval(() => {
                        if (turnstileToken) {
                            clearInterval(checkForToken);
                            appendHistory(' ', 'prompt');
                            appendHistory('security verification completed', 'success');
                            proceedWithSend(turnstileToken);
                        }
                    }, 100);

                    //? Timeout after 10 seconds
                    setTimeout(() => {
                        clearInterval(checkForToken);
                        if (!turnstileToken) {
                            appendHistory('timeout. try again...', 'error');
                            setSending(false);
                            setCurrentStep(STEPS.READY_TO_SEND);
                        }
                    }, 10000);

                } catch (error) {
                    console.warn('Turnstile execute failed:', error);
                    //? Fallback: send without turnstile
                    setTimeout(() => {
                        appendHistory('proceeding without verification', 'warn');
                        proceedWithSend('');
                    }, 1000);
                }
            } else {
                //? Fallback: send without turnstile
                setTimeout(() => {
                    appendHistory('proceeding without verification', 'warn');
                    proceedWithSend('');
                }, 1000);
            }
        }
    };

    const proceedWithSend = (token) => {
        appendHistory('transmitting encrypted message...', 'system');

        //? Prepare template params
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
                appendHistory(' ', 'prompt');
                appendHistory('thank you for reaching out!', 'success');
                if (needsContact) {
                    appendHistory(`i'll get back to you on ${contactInfo}`, 'info');
                }
                appendHistory(' ', 'system');
                appendHistory('type "reset" to send another message', 'prompt');
                setCurrentStep(STEPS.COMPLETE);
                setSendResult('success');
            })
            .catch((error) => {
                console.error('EmailJS Error:', error);
                appendHistory('failed. type "send" to retry', 'error');
                setCurrentStep(STEPS.READY_TO_SEND);
                setSendResult('error');
            })
            .finally(() => {
                setSending(false);
            });
    };

    const resetConversation = () => {
        if (turnstileWidgetId.current && window.turnstile) {
            try {
                window.turnstile.reset(turnstileWidgetId.current);
            } catch (error) {
                console.warn('Turnstile reset failed:', error);
            }
        }
        setSubject('');
        setBodyLines([]);
        setNeedsContact(false);
        setContactMethod('');
        setContactInfo('');
        setTurnstileToken('');
        setSending(false);
        setCommandHistory([]);
        setHistoryIndex(-1);
        setSendResult(null);

        setHistory([
            { message: 'encrypted connection established', type: 'system' },
            { message: ' ', type: 'system' }
        ]);
        setCurrentStep(STEPS.SUBJECT);
    };

    const flashClass = sendResult === 'success'
        ? styles.sendSuccess
        : sendResult === 'error'
            ? styles.sendError
            : '';

    return (
        <div className={`${styles.terminalContainer} ${flashClass}`}>
            <div ref={invisibleRef} style={{ display: 'none' }} />

            <div className={styles.terminalHeader}>
                <div className={styles.terminalButtons}>
                    <div className={styles.closeButton} />
                    <div className={styles.minimizeButton} />
                    <div className={styles.maximizeButton} />
                </div>
                <div className={styles.terminalTitle}>
                    <span className={styles.titleIcon}><RiTerminalBoxFill /></span>
                    terminalmail@ujjwalvivek
                </div>
                <span className={`${styles.statusDot} ${sending ? styles.sending : styles.ready}`} />
            </div>

            <div className={styles.terminalBody}>

                <TUIPanel
                    title="jump back"
                    focused={false}
                    className={styles.sidebarPanel}
                >
                    <StepSidebar
                        currentStep={currentStep}
                        onJumpToStep={handleJumpToStep}
                    />
                </TUIPanel>

                <TUIPanel
                    title="compose"
                    focused={true}
                    className={styles.composePanel}
                >
                    <ComposePane
                        history={history}
                        terminalRef={terminalRef}
                    />
                </TUIPanel>
                <InputPane
                    input={input}
                    setInput={setInput}
                    onKeyDown={handleKeyDown}
                    sending={sending}
                    currentStep={currentStep}
                />
            </div>
            <HelpBar
                currentStep={currentStep}
                subject={subject}
                bodyLines={bodyLines}
                contactMethod={contactMethod}
                contactInfo={contactInfo}
                needsContact={needsContact}
            />
        </div>
    );
}
