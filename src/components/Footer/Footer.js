import React from 'react';
import styles from './Footer.module.css';
import { useContext } from "react";
import { ThemeContext } from '../ThemeSwitcher/ThemeContext';

const Footer = () => {
    const { darkMode } = useContext(ThemeContext);
    const getDarkClass = (baseClass) => `${baseClass} ${darkMode ? styles.dark : ''}`;

    return (
        <footer className={getDarkClass(styles.Footer)}>
            <p>© 2024 Ujjwal Vivek. Fuelled by sleepless nights, almost ready to shine!</p>
        </footer>
    );
};

export default Footer;