import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Header.module.css';
import { BiMenuAltRight, BiMenuAltLeft } from 'react-icons/bi';
import ThemeSwitcher from '../ThemeSwitcher/ThemeSwitcher';
import { ThemeContext } from '../ThemeSwitcher/ThemeContext';

const Header = () => {

    const [isOpen, setIsOpen] = useState(false);
    const toggleMenu = () => { setIsOpen(!isOpen); };
    const { darkMode } = useContext(ThemeContext);
    const getDarkClass = (baseClass) => `${baseClass} ${darkMode ? styles.dark : ''}`;

    return (
        <header className={getDarkClass(styles.Header)}>
            <div className={getDarkClass(styles.Container)}>
                <Link to="/" className={getDarkClass(styles.NavLogo)}>{"<ujjwalvivek />"}</Link>
                <nav className={`${styles.Nav} ${isOpen ? styles.Open : ''} ${styles.Nav} ${darkMode ? styles.dark : ''}`}>
                    <Link to="/about" className={getDarkClass(styles.NavLink)}>{"<about>"}</Link>
                    <Link to="/work" className={getDarkClass(styles.NavLink)}>{"<work>"}</Link>
                    <Link to="/projects" className={getDarkClass(styles.NavLink)}>{"<projects>"}</Link>
                    <Link to="/contact" className={getDarkClass(styles.NavLink)}>{"<contact>"}</Link>
                </nav>
                <div className={styles.RightContainer}>
                    <ThemeSwitcher />
                    <div className={styles.MenuIcon} onClick={toggleMenu}>
                        <div className={`${styles.Icon} ${isOpen ? styles.SlideLeft : ''}`}>
                        {isOpen ? <BiMenuAltLeft /> : <BiMenuAltRight />}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;