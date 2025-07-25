import { Worker, Viewer, SpecialZoomLevel } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import styles from './PdfViewer.module.css';
import React from 'react';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { FaWindowClose } from "react-icons/fa";

/**
 * PdfViewer component for displaying PDF files in a modal or inline.
 * @param {string} fileUrl - The URL or path to the PDF file.
 * @param {boolean} [showToolbar=true] - Whether to show the default toolbar.
 * @param {function} [onClose] - Optional close handler for modal usage.
 */
const PdfViewer = ({ fileUrl, showToolbar = true, onClose }) => {
    const renderToolbar = (Toolbar) => (
        <Toolbar>
            {(slots) => {
                const {
                    CurrentScale,
                    ZoomIn,
                    ZoomOut,
                } = slots;
                return (
                    <div
                        style={{
                            alignItems: 'center',
                            display: 'flex',
                            gap: '0.3rem',
                            padding: '0rem 0.5rem',
                        }}
                    >
                        <div style={{ padding: '0px 2px' }}>
                            <ZoomOut>
                                {(props) => (
                                    <button
                                        style={{
                                            fontFamily: 'var(--font-mono)',
                                            color: '#dbdbdb',
                                            background: 'transparent',
                                            width: 'auto',
                                            height: '0.9rem',
                                            fontSize: '0.8rem',
                                            fontWeight: 400,
                                            cursor: 'pointer',
                                            zIndex: 10,
                                            transition: 'background 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'right',
                                            border: '2px solid #dbdbdb',
                                            borderRadius: '4px',
                                            padding: '0.8rem 0.8rem',
                                        }}
                                        onClick={props.onClick}
                                    >
                                        ZoomOut
                                    </button>
                                )}
                            </ZoomOut>
                        </div>
                        <div
                            style={{
                                fontFamily: 'var(--font-mono)',
                                color: '#dbdbdb',
                                width: 'auto',
                                height: '0.9rem',
                                fontSize: '0.8rem',
                                fontWeight: 400,
                                cursor: 'pointer',
                                zIndex: 10,
                                transition: 'background 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'right',
                                background: '#dbdbdb3d',
                                border: '2px solid #dbdbdb',
                                borderRadius: '4px',
                                padding: '0.8rem 0.8rem',
                            }}>
                            <CurrentScale>{(props) => <span>{`${Math.round(props.scale * 100)}%`}</span>}</CurrentScale>
                        </div>
                        <div style={{ padding: '0px 2px' }}>
                            <ZoomIn>
                                {(props) => (
                                    <button
                                        style={{
                                            fontFamily: 'var(--font-mono)',
                                            color: '#dbdbdb',
                                            background: 'transparent',
                                            width: 'auto',
                                            height: '0.9rem',
                                            fontSize: '0.8rem',
                                            fontWeight: 400,
                                            cursor: 'pointer',
                                            zIndex: 10,
                                            transition: 'background 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'right',
                                            border: '2px solid #dbdbdb',
                                            borderRadius: '4px',
                                            padding: '0.8rem 0.8rem',
                                        }}
                                        onClick={props.onClick}
                                    >
                                        ZoomIn
                                    </button>
                                )}
                            </ZoomIn>
                        </div>
                        <div style={{ padding: '0px 2px' }}>
                            {onClose && (
                                <button
                                    className={styles.pdfViewerCloseBtn}
                                    onClick={onClose}
                                    aria-label="Close PDF viewer"
                                    style={{
                                        fontFamily: 'var(--font-mono)',
                                        color: '#dbdbdb',
                                        background: 'transparent',
                                        width: 'auto',
                                        height: '0.9rem',
                                        fontSize: '0.8rem',
                                        fontWeight: 400,
                                        cursor: 'pointer',
                                        zIndex: 10,
                                        transition: 'background 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'right',
                                        border: '2px solid #dbdbdb',
                                        borderRadius: '4px',
                                        padding: '0.8rem 0.8rem',
                                    }}
                                >
                                    <FaWindowClose style={{ marginRight: '0.5rem' }} size={'1.2rem'} /> Close
                                </button>
                            )}
                        </div>
                    </div>
                );
            }}
        </Toolbar>
    );

    const defaultLayoutPluginInstance = defaultLayoutPlugin({
        renderToolbar,
        sidebarTabs: (defaultTabs) => [],
        theme: 'dark',
    });

    return (
        <div className={styles.pdfViewerRoot}>
            <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
                <Viewer
                    fileUrl={fileUrl}
                    theme={'dark'}
                    plugins={[defaultLayoutPluginInstance]}
                    defaultScale={SpecialZoomLevel.PageWidth}
                />
            </Worker>
        </div>
    );
};

export default PdfViewer;