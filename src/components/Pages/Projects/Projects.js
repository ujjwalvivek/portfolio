import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styles from './Projects.module.css';
import { DescriptionCell } from "./ToolTip/DescriptionCell";
import { TagCell } from "./ToolTip/TagCell";
import { VscGithubInverted } from "react-icons/vsc";
import { FaWindowClose } from "react-icons/fa";
import PdfViewer from "./PDFViewer/PdfViewer";
import { ProjectsData } from './ProjectsData';
import { useBackground } from '../../Background/BackgroundContext';
import { BsJournalText } from 'react-icons/bs';
import { SiFigma, SiNotion } from "react-icons/si";
import { PiFilePdfFill } from "react-icons/pi";
import { TbWorldWww } from "react-icons/tb";
import { BsHourglassSplit } from 'react-icons/bs';

const Projects = () => {

  const sortProjectsById = (projects) => {
    return projects.sort((a, b) => {
      // Extract prefix and number from IDs like 'pm-1', 'dev-2'
      const aMatch = a.id.match(/([a-z]+)-(\d+)/);
      const bMatch = b.id.match(/([a-z]+)-(\d+)/);

      if (aMatch && bMatch) {
        const [, aPrefix, aNum] = aMatch;
        const [, bPrefix, bNum] = bMatch;

        // First sort by prefix (pm vs dev)
        if (aPrefix !== bPrefix) {
          return aPrefix.localeCompare(bPrefix);
        }

        // Then sort by number (1, 2, 3... not string sort)
        return parseInt(aNum) - parseInt(bNum);
      }

      // Fallback for any non-matching IDs
      return a.id.localeCompare(b.id);
    });
  };

  const [activeWindow, setActiveWindow] = useState(null);
  const [projectFilter, setProjectFilter] = useState('all');

  // Responsive: show table on desktop, cards on mobile
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth <= 800
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 800);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Background-dependent styling (like your original)
  const { backgroundConfig } = useBackground();
  const glitchyClasses = backgroundConfig.type !== 'none' ? styles.titleCell : '';
  const noBlinkCursor = backgroundConfig.type !== 'none' ? '' : styles.noBlinkCursor;

  // Memoize expensive calculations (this is good optimization)
  const { pmProjects, devProjects } = useMemo(() => ({
    pmProjects: sortProjectsById(
      ProjectsData.filter(project => project.id.startsWith('pm-'))
    ),
    devProjects: sortProjectsById(
      ProjectsData.filter(project => project.id.startsWith('dev-'))
    )
  }), []);

  const filteredSections = useMemo(() => {
    if (projectFilter === 'pm') {
      return [{ title: 'uv@chroot ~ ⪢ eza --PM "pm-projects"', projects: pmProjects, section: 'pm' }];
    } else if (projectFilter === 'dev') {
      return [{ title: 'uv@chroot ~ ⪢ eza --DEV "dev-projects"', projects: devProjects, section: 'dev' }];
    } else {
      return [
        { title: 'uv@chroot ~ ⪢ eza --DEV "dev-projects"', projects: devProjects, section: 'dev' },
        { title: 'uv@chroot ~ ⪢ eza --PM "pm-projects"', projects: pmProjects, section: 'pm' },
      ];
    }
  }, [projectFilter, pmProjects, devProjects]);

  const projectCount = useMemo(() => {
    const counts = { all: ProjectsData.length, pm: pmProjects.length, dev: devProjects.length };
    return counts[projectFilter];
  }, [projectFilter, pmProjects.length, devProjects.length]);

  // Memoize button layout function
  const getButtonLayout = useCallback((project) => {
    const { contentLinks } = project;

    const primary = contentLinks?.blogPost ? {
      type: 'primary',
      label: 'Blog',
      icon: <BsJournalText className={styles.journeyIcon} />,
      action: () => window.open(contentLinks.blogPost, '_blank'),
      className: 'openAppBtn'
    } : null;

    const secondary = [];

    if (contentLinks?.notionEmbed) {
      secondary.push({
        type: 'secondary',
        label: 'Details',
        icon: <SiNotion className={styles.journeyIcon} />,
        action: () => setActiveWindow(project.id + '-embed'),
        className: 'openAppBtn'
      });
    }
    if (contentLinks?.pdfDocument) {
      secondary.push({
        type: 'secondary',
        label: 'Docs',
        icon: <PiFilePdfFill className={styles.journeyIcon} />,
        action: () => setActiveWindow(project.id + '-embed'),
        className: 'openAppBtn'
      });
    }
    if (contentLinks?.figmaDesign) {
      secondary.push({
        type: 'secondary',
        label: 'Design',
        icon: <SiFigma className={styles.journeyIcon} />,
        action: () => window.open(contentLinks.figmaDesign, '_blank'),
        className: 'openAppBtn'
      });
    }
    if (contentLinks?.githubRepo) {
      secondary.push({
        type: 'secondary',
        label: 'Code',
        icon: <VscGithubInverted className={styles.journeyIcon} />,
        action: () => window.open(contentLinks.githubRepo, '_blank'),
        className: 'openAppBtn'
      });
    }
    if (contentLinks?.websiteLink) {
      secondary.push({
        type: 'secondary',
        label: 'Web',
        icon: <TbWorldWww className={styles.journeyIcon} />,
        action: () => window.open(contentLinks.websiteLink, '_blank'),
        className: 'openAppBtn'
      });
    }

    // Layout logic
    if (primary && secondary.length > 0) {
      return { layout: 'split', buttons: [primary, secondary[0]] };
    } else if (primary && secondary.length === 0) {
      return { layout: 'fullPrimary', buttons: [primary] };
    } else if (!primary && secondary.length === 1) {
      return { layout: 'fullSecondary', buttons: [secondary[0]] };
    } else if (!primary && secondary.length >= 2) {
      return { layout: 'splitSecondary', buttons: [secondary[0], secondary[1]] };
    }

    return {
      layout: 'wip',
      buttons: [{
        type: 'wip',
        label: 'WIP. Devlog Soon.',
        icon: <BsHourglassSplit />,
        action: () => { }, // No action, it's disabled
        className: 'wipBtn'
      }]
    };
  }, []); // setActiveWindow is stable

  // NO React.memo - just regular component functions
  const ButtonGroup = ({ project }) => {
    const { layout, buttons } = getButtonLayout(project);
    if (buttons.length === 0) return null;

    return (
      <div className={`${styles.buttonContainer} ${styles[layout]}`}>
        {buttons.map((button, index) => (
          <button
            key={index}
            className={styles[button.className]}
            onClick={button.action}
          >
            {button.icon} {" "} {button.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.projectsRoot}>
      <div className={styles.heroSection}>
        <h1 className={styles.heroTitle}>Projects Directory</h1>
        <p className={styles.heroSubtitle}>Projects. Failures. Successes. Learnings. Insights.</p>
      </div>

      <div className={styles.tableWrapper}>
        <div className={styles.filterWrapper}>
          <span style={{ fontWeight: 500 }}>{'filter@uv ~ ⪢ eza'}</span>
          <div className={styles.filterButtons}>
            {['all', 'pm', 'dev'].map((filter) => (
              <button
                key={filter}
                className={`${styles.terminalBtn} ${projectFilter === filter ? styles.active : ''}`}
                onClick={() => setProjectFilter(filter)}
                style={{
                  fontWeight: projectFilter === filter ? '800' : '400',
                  background: projectFilter === filter ? 'var(--text-color)' : 'transparent',
                  color: projectFilter === filter ? 'var(--background-color)' : 'var(--text-color)',
                }}
              >
                --{filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
          <div className={styles.statusBar}>
            <span>
              Active filter: <span className={styles.activeFilter}>{projectFilter}</span>
            </span>
            <span className={styles.projectCount}>
              {projectCount} entries found
            </span>
          </div>
        </div>

        {!isMobile ? (
          <table className={styles.projectsTable}>
            <tbody>
              {filteredSections.map(section => (
                <React.Fragment key={section.title}>
                  {section.projects.length > 0 && (
                    <tr>
                      <td colSpan={4}>
                        <div className={`${styles.sectionSubtitle} ${styles.terminalCommand} ${noBlinkCursor}`}>
                          {section.title}
                        </div>
                      </td>
                    </tr>
                  )}
                  {section.projects.map((project, idx) => (
                    <tr key={project.id} className={styles.glassRow} id={`project-card-${section.section}-${idx}`}>
                      <td className={styles.cell}>{idx + 1}</td>
                      <td className={styles.cell + ' ' + glitchyClasses}>
                        <DescriptionCell description={project.content}>
                          {project.title}
                        </DescriptionCell>
                      </td>
                      <td className={styles.cell}>
                        <TagCell tags={project.tags} />
                      </td>
                      <td className={styles.cell}>
                        <ButtonGroup project={project} />
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
                  <div className={`${styles.sectionSubtitle} ${noBlinkCursor}`}>
                    {section.title}
                  </div>
                )}
                {section.projects.map((project, idx) => (
                  <div key={project.id} className={styles.projectCard} id={`project-card-${section.section}-${idx}`}>
                    <div className={styles.cell} style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.2rem' }}>
                      Entry #{idx + 1}
                    </div>
                    <div className={styles.cell + ' ' + glitchyClasses} style={{ marginBottom: '0.3rem' }}>
                      <DescriptionCell description={project.content}>
                        {project.title}
                      </DescriptionCell>
                    </div>
                    <div className={styles.cell}>
                      <TagCell tags={project.tags} />
                    </div>
                    <ButtonGroup project={project} />
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      <div className={styles.stats} style={{ width: '100%', padding: '1rem' }}>
        <div className={styles.tableEnd} data-count={projectCount}></div>
        <div className={styles.systemStats}>
          <span className={styles.stat}>
            TOTAL_PROJECTS<span className={styles.value}>{ProjectsData.length}</span>
          </span>
          <span className={styles.stat}>
            PM_PROJECTS<span className={styles.value}>{pmProjects.length}</span>
          </span>
          <span className={styles.stat}>
            DEV_PROJECTS<span className={styles.value}>{devProjects.length}</span>
          </span>
          <span className={styles.stat}>
            STATUS<span className={styles.value}>ONLINE</span>
          </span>
        </div>
      </div>

      {/* Overlay rendering */}
      {ProjectsData.filter(project =>
        project.contentLinks?.notionEmbed || project.contentLinks?.pdfDocument
      ).map(project => (
        activeWindow === project.id + '-embed' && (
          <div className={styles.notionOverlay} key={project.id + '-embed'}>
            <div className={styles.notionEmbedContainer}>
              {project.contentLinks?.pdfDocument ? (
                <PdfViewer
                  fileUrl={project.contentLinks.pdfDocument}
                  onClose={() => setActiveWindow(null)}
                />
              ) : project.contentLinks?.notionEmbed ? (
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
                    title={project.title}
                    src={project.contentLinks.notionEmbed}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allowFullScreen
                    className={styles.notionIframe}
                  />
                </>
              ) : null}
            </div>
          </div>
        )
      ))}
    </div>
  );
};

export default Projects;
