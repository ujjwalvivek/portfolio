import React, { useEffect } from 'react';
import styles from './RecentProjects.module.css';
import { Link } from 'react-router-dom';
import { ProjectsData } from '../../Pages/Projects/ProjectsData';
import { VscGithubInverted } from "react-icons/vsc";
import { BsJournalText } from 'react-icons/bs';
import { SiNotion } from "react-icons/si";

const RecentProjects = () => {
    const [recentProjects, setRecentProjects] = React.useState([]);

    useEffect(() => {
        const devProjects = ProjectsData.filter(project => project.id.startsWith('dev-'));
        const pmProjects = ProjectsData.filter(project => project.id.startsWith('pm-'));

        const pick = (arr, ...idxs) => idxs.map(i => arr[i]).filter(Boolean);

        // pick 1st and 3rd (indexes 0 and 2)
        const topDevProjects = pick(devProjects, 0, 2);
        const topPmProjects = pick(pmProjects, 0, 1);

        setRecentProjects([...topDevProjects, ...topPmProjects]);
    }, []);

    const ButtonGroup = ({ project }) => {

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
                action: () => window.open(contentLinks.notionEmbed, '_blank'),
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

        const buttons = [primary, secondary[0]].filter(Boolean);

        if (buttons.length === 0) return null;

        return (
            <div className={styles.buttonContainer}>
                {buttons.map((button, index) => (
                    <button
                        key={index}
                        className={styles[button.className] || styles.openAppBtn}
                        onClick={button.action}
                    >
                        {button.icon}
                        {button.label}
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className={styles.recentProjects}>
            <ul>
                {recentProjects.map((project) => {
                    const maxLen = 50;
                    const shortTitle = project.title.length > maxLen ? project.title.slice(0, maxLen) + '...' : project.title;

                    return (
                        <li key={project.id}>
                            <div className={styles.projectCard}>
                                <Link>
                                    <span className={styles.projectTitle}>{shortTitle}</span>
                                    <div className={styles.projectActions}>
                                        {/* reused css class */}
                                        <span className={styles.projectType}>
                                            {project.id.startsWith('dev-') ? 'DEV' : 'PM'}
                                        </span>
                                        <ButtonGroup project={project} />
                                    </div>
                                </Link>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default RecentProjects;
