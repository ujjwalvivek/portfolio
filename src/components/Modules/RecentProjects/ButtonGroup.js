import { BsHourglassSplit } from 'react-icons/bs';
import { PiFilePdfFill } from 'react-icons/pi';
import { FaNewspaper, FaDesktop } from "react-icons/fa6";
import { TfiGithub } from "react-icons/tfi";
import { PiNotionLogoFill } from "react-icons/pi";
import { IoLogoFigma } from "react-icons/io5";

export function ButtonGroup({ project, onEmbed, classNames = {} }) {
    const { contentLinks } = project;

    const primary = contentLinks?.blogPost ? {
        type: 'primary',
        label: 'Blog',
        icon: <FaNewspaper />,
        action: () => window.open(contentLinks.blogPost, '_blank'),
        className: classNames.primary || ''
    } : null;

    const secondary = [];
    if (contentLinks?.notionEmbed) secondary.push({
        type: 'secondary',
        label: 'Case Study',
        icon: <PiNotionLogoFill />,
        action: () => {
            if (onEmbed) onEmbed(project.id, 'notion');
            else window.open(contentLinks.notionEmbed, '_blank');
        },
        className: classNames.secondary || ''
    });
    if (contentLinks?.pdfDocument) secondary.push({
        type: 'secondary',
        label: 'Docs',
        icon: <PiFilePdfFill />,
        action: () => {
            if (onEmbed) onEmbed(project.id, 'pdf');
            else window.open(contentLinks.pdfDocument, '_blank');
        },
        className: classNames.secondary || ''
    });
    if (contentLinks?.figmaDesign) secondary.push({
        type: 'secondary',
        label: 'Design',
        icon: <IoLogoFigma />,
        action: () => window.open(contentLinks.figmaDesign, '_blank'),
        className: classNames.secondary || ''
    });
    if (contentLinks?.githubRepo) secondary.push({
        type: 'secondary',
        label: 'Code',
        icon: <TfiGithub />,
        action: () => window.open(contentLinks.githubRepo, '_blank'),
        className: classNames.secondary || ''
    });
    if (contentLinks?.websiteLink) secondary.push({
        type: 'secondary',
        label: 'Web',
        icon: <FaDesktop />,
        action: () => window.open(contentLinks.websiteLink, '_blank'),
        className: classNames.secondary || ''
    });

    const layout = (primary && secondary.length > 0) ? [primary, secondary[0]]
        : (primary && secondary.length === 0) ? [primary]
            : (!primary && secondary.length >= 1) ? secondary.slice(0, 2)
                : [{ type: 'wip', label: 'WIP. Devlog Soon.', icon: <BsHourglassSplit />, action: () => { }, className: classNames.wip || '' }];

    return (
        <div className={classNames.container || ''}>
            {layout.map((btn, i) => (
                <button key={i} className={btn.className || ''} onClick={btn.action}>
                    {btn.icon} {btn.label}
                </button>
            ))}
        </div>
    );
}

export default ButtonGroup;