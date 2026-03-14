import React, { useEffect } from 'react';
import styles from './RecentProjects.module.css';
import { Link } from 'react-router-dom';
import { ProjectsData } from '../../Pages/Projects/ProjectsData';
import ButtonGroup from './ButtonGroup';

const getRecentProjects = () => {
    // const devProjects = ProjectsData.filter(project => project.id.startsWith('dev-'));
    const pmProjects = ProjectsData.filter(project => project.id.startsWith('pm-'));
    const pick = (arr, ...idxs) => idxs.map(i => arr[i]).filter(Boolean);
    const topDevProjects = pick(pmProjects, 0, 1);
    const topPmProjects = pick(pmProjects, 2, 3);
    return [...topDevProjects, ...topPmProjects];
};

const RecentProjects = () => {
    const [recentProjects, setRecentProjects] = React.useState(getRecentProjects);

    useEffect(() => {
        if (recentProjects.length === 0) {
            setRecentProjects(getRecentProjects());
        }
    }, [recentProjects.length]);


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
                                    <span className={styles.projectType}>
                                        {project.id.startsWith('dev-') ? 'DEV' : 'PM'}
                                    </span>
                                    <span className={styles.projectTitle}>{shortTitle}</span>
                                    <div className={styles.projectActions}>
                                        <ButtonGroup
                                            project={project}
                                            classNames={{
                                                container: styles.buttonContainer,
                                                primary: styles.openAppBtn,
                                                secondary: styles.openAppBtn
                                            }} />
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
