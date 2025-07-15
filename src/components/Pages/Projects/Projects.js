import React, { useState, useEffect } from 'react';
import styles from './Projects.module.css';
import { DescriptionCell } from "./ToolTip/DescriptionCell";
import { TagCell } from "./ToolTip/TagCell";
import { VscVscode, VscGithubInverted } from "react-icons/vsc";
import { FaWindowClose } from "react-icons/fa";
import PdfViewer from "./PDFViewer/PdfViewer";
import { ProjectsData } from './ProjectsData';

const Projects = () => {
  const [activeWindow, setActiveWindow] = useState(null);

  // Responsive: show table on desktop, cards on mobile (live on resize)
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 800);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 800);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  // Filter state: 'all', 'pm', 'dev'
  const [projectFilter, setProjectFilter] = useState('all');

  // Split projects into PM and Dev based on id prefix
  const pmProjects = ProjectsData.filter(win => win.id.startsWith('pm-'));
  const devProjects = ProjectsData.filter(win => win.id.startsWith('dev-'));

  // Filtered projects for rendering
  let filteredSections = [];
  if (projectFilter === 'pm') {
    filteredSections = [
      { title: 'ujjwalvivek@chroot ~ > sudo pacman -Syu "pm-projects"', projects: pmProjects, section: 'pm' }
    ];
  } else if (projectFilter === 'dev') {
    filteredSections = [
      { title: 'ujjwalvivek@chroot ~ > sudo pacman -Syu "dev-projects"', projects: devProjects, section: 'dev' }
    ];
  } else {
    filteredSections = [
      { title: 'ujjwalvivek@chroot ~ > sudo pacman -Syu "pm-projects"', projects: pmProjects, section: 'pm' },
      { title: 'ujjwalvivek@chroot ~ > sudo pacman -Syu "dev-projects"', projects: devProjects, section: 'dev' }
    ];
  }

  return (
    <div className={styles.projectsRoot}>
      <div className={styles.heroSection}>
        <h1 className={styles.heroTitle}>Projects Directory</h1>
        <p className={styles.heroSubtitle}>Projects. Failures. Successes. Learnings. Insights.</p>
      </div>
      <div className={styles.tableWrapper}>
        {/* Filter Controls (only render once above table/card list) */}
        <div style={{ margin: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontWeight: 500 }}>Filter:</span>
          <button
            onClick={() => setProjectFilter('all')}
            style={{
              fontWeight: projectFilter === 'all' ? 'bold' : 'normal',
              background: projectFilter === 'all' ? 'var(--text-color)' : 'transparent',
              color: projectFilter === 'all' ? 'var(--background-color)' : 'var(--text-color)',
              border: '1px solid var(--text-color)',
              borderRadius: '4px',
              padding: '0.3rem 0.8rem',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            All
          </button>
          <button
            onClick={() => setProjectFilter('pm')}
            style={{
              fontWeight: projectFilter === 'pm' ? 'bold' : 'normal',
              background: projectFilter === 'pm' ? 'var(--text-color)' : 'transparent',
              color: projectFilter === 'pm' ? 'var(--background-color)' : 'var(--text-color)',
              border: '1px solid var(--text-color)',
              borderRadius: '4px',
              padding: '0.3rem 0.8rem',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            PM
          </button>
          <button
            onClick={() => setProjectFilter('dev')}
            style={{
              fontWeight: projectFilter === 'dev' ? 'bold' : 'normal',
              background: projectFilter === 'dev' ? 'var(--text-color)' : 'transparent',
              color: projectFilter === 'dev' ? 'var(--background-color)' : 'var(--text-color)',
              border: '1px solid var(--text-color)',
              borderRadius: '4px',
              padding: '0.3rem 0.8rem',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            Dev
          </button>
        </div>
        {!isMobile ? (
          <table className={styles.projectsTable}>
            <thead>
              <tr className={styles.tableHeader}>
                <th>#</th>
                <th>title(project)</th>
                <th>(tags)</th>
                <th>(links)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredSections.map(section => (
                <React.Fragment key={section.title}>
                  {section.projects.length > 0 && (
                    <tr>
                      <td colSpan={5}>
                        <div className={styles.sectionSubtitle}>
                          {section.title}
                        </div>
                      </td>
                    </tr>
                  )}
                  {section.projects.map((win, idx) => (
                    <tr key={win.id} className={styles.glassRow} id={`project-card-${section.section}-${idx}`}>
                      <td className={styles.cell}>{idx + 1}</td>
                      <td className={styles.cell + ' ' + styles.titleCell}>
                        <DescriptionCell description={win.content}>
                          {win.title}
                        </DescriptionCell>
                      </td>
                      <td className={styles.cell}>
                        <TagCell tags={win.tags} />
                      </td>
                      <td className={styles.cell}>
                        <div className={styles.buttonContainer}>
                          {/* VSCode.dev and GitHub buttons for github projects */}
                          {win.notionEmbed && win.notionEmbed.startsWith('https://vscode.dev/github/') ? (
                            <div style={{ display: 'flex', width: '100%' }}>
                              <button
                                className={styles.openAppBtn + ' ' + styles.halfWidthBtn}
                                onClick={() => window.open(win.notionEmbed, '_blank', 'noopener,noreferrer')}
                                title="Open in VSCode.dev"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}
                              >
                                <VscVscode size={'1.2rem'} />
                              </button>
                              <button
                                className={styles.openAppBtn + ' ' + styles.halfWidthBtn}
                                onClick={() => window.open(win.notionEmbed.replace('https://vscode.dev/github/', 'https://github.com/'), '_blank', 'noopener,noreferrer')}
                                title="Open in GitHub"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}
                              >
                                <VscGithubInverted size={'1.2rem'} />
                              </button>
                            </div>
                          ) : win.notionEmbed ? (
                            win.notionEmbed.startsWith('https://www.figma.com/') ? (
                              <button
                                className={styles.openAppBtn}
                                onClick={e => {
                                  e.stopPropagation();
                                  window.open(win.notionEmbed, '_blank', 'noopener,noreferrer');
                                }}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                              >
                                Project Details ↗
                              </button>
                            ) : win.notionEmbed.endsWith('.pdf') || win.notionEmbed.includes('notion.site') ? (
                              <button
                                className={styles.openAppBtn}
                                onClick={e => {
                                  e.stopPropagation();
                                  setActiveWindow(win.id + '-embed');
                                }}
                              >
                                Project Details ↗
                              </button>
                            ) : (
                              // Generic external links
                              <button
                                className={styles.openAppBtn}
                                onClick={e => {
                                  e.stopPropagation();
                                  window.open(win.notionEmbed, '_blank', 'noopener,noreferrer');
                                }}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                              >
                                Project Details ↗
                              </button>
                            )
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        ) : (
          <div>
            {filteredSections.map(section => (
              <React.Fragment key={section.title}>
                {section.projects.length > 0 && (
                  <div className={styles.sectionSubtitle}>
                          {section.title}
                        </div>
                )}
                {section.projects.map((win, idx) => (
                  <div key={win.id} className={styles.projectCard} id={`project-card-${section.section}-${idx}`}>
                    <div className={styles.cell} style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.2rem' }}>#{idx + 1}</div>
                    <div className={styles.cell + ' ' + styles.titleCell} style={{ marginBottom: '0.3rem' }}>
                      <DescriptionCell description={win.content}>
                        {win.title}
                      </DescriptionCell>
                    </div>
                    <div className={styles.cell}>
                      <TagCell tags={win.tags} />
                    </div>
                    <div className={styles.buttonContainer} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {/* VSCode.dev and GitHub buttons for github projects */}
                      {win.notionEmbed && win.notionEmbed.startsWith('https://vscode.dev/github/') ? (
                        <>
                          <button
                            className={styles.openAppBtn + ' ' + styles.halfWidthBtn}
                            onClick={() => window.open(win.notionEmbed, '_blank', 'noopener,noreferrer')}
                            title="Open in VSCode.dev"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center', width: 'auto' }}
                          >
                            <VscVscode size={'1.2rem'} /> <span>Open in VSCode.dev ↗</span> 
                          </button>
                          <button
                            className={styles.openAppBtn + ' ' + styles.halfWidthBtn}
                            onClick={() => window.open(win.notionEmbed.replace('https://vscode.dev/github/', 'https://github.com/'), '_blank', 'noopener,noreferrer')}
                            title="Open in GitHub"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center', width: 'auto' }}
                          >
                            <VscGithubInverted size={'1.2rem'} /> <span>Open in GitHub ↗</span>
                          </button>
                        </>
                      ) : win.notionEmbed ? (
                        win.notionEmbed.startsWith('https://www.figma.com/') ? (
                          <button
                            className={styles.openAppBtn}
                            onClick={e => {
                              e.stopPropagation();
                              window.open(win.notionEmbed, '_blank', 'noopener,noreferrer');
                            }}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                          >
                            Project Details ↗
                          </button>
                        ) : win.notionEmbed.endsWith('.pdf') || win.notionEmbed.includes('notion.site') ? (
                          <button
                            className={styles.openAppBtn}
                            onClick={e => {
                              e.stopPropagation();
                              setActiveWindow(win.id + '-embed');
                            }}
                          >
                            Project Details ↗
                          </button>
                        ) : (
                          // Generic external links
                          <button
                            className={styles.openAppBtn}
                            onClick={e => {
                              e.stopPropagation();
                              window.open(win.notionEmbed, '_blank', 'noopener,noreferrer');
                            }}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                          >
                            Project Details ↗
                          </button>
                        )
                      ) : null}
                    </div>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
      {/* Notion Embeds overlays (excluding VSCode.dev/github projects) */}
      {ProjectsData.filter(win => win.notionEmbed && !win.notionEmbed.startsWith('https://vscode.dev/github/')).map(win => (
        activeWindow === win.id + '-embed' && (
          <div className={styles.notionOverlay} key={win.id + '-embed'}>
            <div className={styles.notionEmbedContainer}>
              {/* Use PdfViewer for PDFs, iframe for Notion links */}
              {win.notionEmbed.endsWith('.pdf') ? (
                <PdfViewer fileUrl={win.notionEmbed} onClose={() => setActiveWindow(null)} />
              ) : (
                <>
                  <div className={styles.closeBtnContainer}>
                    <button
                      className={styles.closeBtn}
                      onClick={() => setActiveWindow(null)}
                      aria-label="Close App"
                    >
                      <FaWindowClose style={{ marginRight: '0.5rem' }} size={'1.2rem'} />
                      Close
                    </button>
                  </div>
                  <iframe
                    title={win.title}
                    src={win.notionEmbed}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allowFullScreen
                    className={styles.notionIframe}
                  />
                </>
              )}
            </div>
          </div>
        )
      ))}
    </div>
  );
};

export default Projects;