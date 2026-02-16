import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styles from './Projects.module.css';
import { DescriptionCell } from "../../Modules/ToolTip/DescriptionCell";
import { TagCell } from "../../Modules/ToolTip/TagCell";
import { VscGithubInverted } from "react-icons/vsc";
import PdfViewer from "../../Modules/PDFViewer/PdfViewer";
import { ProjectsData } from './ProjectsData';
import { useBackground } from '../../Background/BackgroundContext';
import { BsJournalText } from 'react-icons/bs';
import { SiFigma, SiNotion } from "react-icons/si";
import { PiFilePdfFill } from "react-icons/pi";
import { TbWorldWww } from "react-icons/tb";
import { BsHourglassSplit } from 'react-icons/bs';
import { RiArchiveFill } from "react-icons/ri";

const Projects = () => {

  const sortProjectsById = (projects) => {
    return projects.sort((a, b) => {
      const aMatch = a.id.match(/([a-z]+)-(\d+)/);
      const bMatch = b.id.match(/([a-z]+)-(\d+)/);
      if (aMatch && bMatch) {
        const [, aPrefix, aNum] = aMatch;
        const [, bPrefix, bNum] = bMatch;
        if (aPrefix !== bPrefix) {
          return aPrefix.localeCompare(bPrefix);
        }
        return parseInt(aNum) - parseInt(bNum);
      }
      return a.id.localeCompare(b.id);
    });
  };

  const [activeWindow, setActiveWindow] = useState(null);
  const [projectFilter, setProjectFilter] = useState('all');

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth <= 800
  );

  const [showDelay, setShowDelay] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShowDelay(false), 2000); // change 1200 -> 2000 for 2s
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 800);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { backgroundConfig } = useBackground();
  const glitchyClasses = backgroundConfig.type !== 'none' ? styles.titleCell : '';

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
      return [{ projects: pmProjects, section: 'pm' }];
    } else if (projectFilter === 'dev') {
      return [{ projects: devProjects, section: 'dev' }];
    } else {
      return [
        { projects: devProjects, section: 'dev' },
        { projects: pmProjects, section: 'pm' },
      ];
    }
  }, [projectFilter, pmProjects, devProjects]);

  const projectCount = useMemo(() => {
    const counts = { all: ProjectsData.length, pm: pmProjects.length, dev: devProjects.length };
    return counts[projectFilter];
  }, [projectFilter, pmProjects.length, devProjects.length]);

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
        label: 'Case Study',
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
        action: () => { },
        className: 'wipBtn'
      }]
    };
  }, []);

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
        <div className={styles.heroHeader}>
          <div className={styles.headerIcon}>
            <RiArchiveFill size={'2.5rem'} />
          </div>
          <div className={styles.headerText}>
            <h1 className={styles.heroTitle}>Projects Directory</h1>
            <p className={styles.heroSubtitle}>projects . failures . successes . learnings . insights</p>
          </div>
          <span className={styles.border}></span>
          <span className={styles.borderFull}></span>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <div className={styles.filterWrapper}>
          <div className={styles.filterSection}>
            <div className={styles.sectionHeader}>
              <span style={{ fontWeight: 500 }}>{'eza /projects -l'}</span>
            </div>
            <div className={styles.filterButtons}>
              {['all', 'pm', 'dev'].map((filter) => (
                <button
                  key={filter}
                  className={`${styles.terminalBtn} ${projectFilter === filter ? styles.active : ''}`}
                  onClick={() => setProjectFilter(filter)}
                >
                  --{filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
            <div className={`${styles.statusBar} ${showDelay ? '' : styles.loading}`}>
              {showDelay ? (
                <div className={styles.progress}>
                  <div className={styles.track}>
                    <div className={styles.bar}></div>
                    <div className={styles.bar}></div>
                    <div className={styles.bar}></div>
                    <div className={styles.bar}></div>
                    <div className={styles.bar}></div>
                    <div className={styles.bar}></div>
                    <div className={styles.bar}></div>
                    <div className={styles.bar}></div>
                    <div className={styles.bar}></div>
                    <div className={styles.bar}></div>
                    <div className={styles.bar}></div>
                  </div>
                </div>
              ) : (
                <>
                  <span>
                    Active filter: <span className={styles.activeFilter}>{projectFilter}</span>
                  </span>
                  <span className={styles.projectCount}>
                    {projectCount} entries found
                  </span>
                </>
              )}
            </div>
          </div>
          {showDelay ? (
            null
          ) : (
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
          )}
        </div>

        <div className={styles.tableStats}>

        </div>

        {!isMobile ? (
          <table className={styles.projectsTable}>
            <tbody>
              {filteredSections.map(section => (
                <React.Fragment key={section.title}>
                  {section.projects.map((project, idx) => (
                    <tr key={project.id} className={styles.glassRow} id={`project-card-${section.section}-${idx}`}>
                      <td className={styles.cell}><RiArchiveFill /></td>
                      <td className={styles.cell + ' ' + glitchyClasses}>
                        <DescriptionCell description={project.content}>
                          {project.title}
                        </DescriptionCell>
                      </td>
                      <td className={styles.cell}>
                        <TagCell tags={project.tags} visibleCount={project.visibleTags} />
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
                {section.projects.map((project, idx) => (
                  <div key={project.id} className={styles.projectCard} id={`project-card-${section.section}-${idx}`}>
                    <div className={styles.cardHeader}>
                      <RiArchiveFill />
                      <div className={styles.cell + ' ' + glitchyClasses}>
                        <DescriptionCell description={project.content}>
                          {project.title}
                        </DescriptionCell>
                      </div>
                    </div>
                    <div className={styles.cell}>
                      <TagCell tags={project.tags} visibleCount={project.visibleTags} />
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
      </div>

      {/* Overlay rendering */}
      {ProjectsData.filter(project =>
        project.contentLinks?.notionEmbed || project.contentLinks?.pdfDocument
      ).map(project => (
        activeWindow === project.id + '-embed' && (
          <div className={styles.notionOverlay} key={project.id + '-embed'} onClick={() => setActiveWindow(null)}>
            <div className={styles.notionEmbedContainer}>
              <div className={styles.postHeader}>
                <div className={styles.headerButtons}>
                  <div className={styles.closeButton} onClick={() => setActiveWindow(null)}></div>
                  <div className={styles.minimizeButton} onClick={() => setActiveWindow(null)}></div>
                  <div className={styles.maximizeButton}></div>
                </div>
                <div className={styles.postTitle}>
                  {project.title}
                </div>
              </div>
              {project.contentLinks?.pdfDocument ? (
                <PdfViewer fileUrl={project.contentLinks.pdfDocument} onClose={() => setActiveWindow(null)} />
              ) : project.contentLinks?.notionEmbed ? (
                <iframe title={project.title} src={project.contentLinks.notionEmbed} className={styles.notionIframe} allowFullScreen />
              ) : null}
            </div>
          </div>
        )
      ))}
    </div>
  );
};

export default Projects;
