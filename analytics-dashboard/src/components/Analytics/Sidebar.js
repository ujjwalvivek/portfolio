import React from 'react';
import styles from './Sidebar.module.css';
import { BiSolidNetworkChart } from "react-icons/bi";
import { MdOutlineMore } from "react-icons/md";
import { IoSettingsSharp, IoAnalyticsSharp  } from "react-icons/io5";
import { IoMdHelpCircleOutline } from "react-icons/io";
import { PiSidebarSimpleFill } from "react-icons/pi";
import { RiLogoutBoxRLine } from "react-icons/ri";

const Sidebar = ({ collapsed, onToggle, onLogout }) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: <BiSolidNetworkChart />, active: true },
    { id: 'analytics', label: 'More options coming soon', icon: <MdOutlineMore />, disabled: true },
  ];

  const settingsItems = [
    { id: 'settings', label: 'Settings', icon: <IoSettingsSharp />, disabled: true },
    { id: 'help', label: 'Help', icon: <IoMdHelpCircleOutline />, disabled: true },
  ];

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.sidebarContent}>
        {/* Logo Section */}
        <div className={`${styles.logoSection} ${collapsed ? styles.collapsed : ''}`}>
          <div className={styles.logo}>
            <span className={styles.logoIcon} onClick={onToggle}><IoAnalyticsSharp /></span>
            {!collapsed && <span className={styles.logoText}>Lightweight Analytics</span>}
          </div>
          {!collapsed && (
            <div className={styles.versionBadge} onClick={onToggle}>
              <PiSidebarSimpleFill />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className={styles.navigation}>
          <div className={styles.navSection}>
            {!collapsed && <div className={styles.navTitle}>Dashboard</div>}
            <ul className={styles.navList}>
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    className={`${styles.navItem} ${item.active ? styles.active : ''}`}
                    title={collapsed ? item.label : ''}
                    disabled={item.disabled}
                    tabIndex={item.disabled ? -1 : 0}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
                    {!collapsed && item.active && <span className={styles.activeIndicator}></span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.navSection}>
            <ul className={styles.navList}>
              {settingsItems.map((item) => (
                <li key={item.id}>
                  <button
                    className={styles.navItem}
                    title={collapsed ? item.label : ''}
                    disabled={item.disabled}
                    tabIndex={item.disabled ? -1 : 0}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* User Section */}
        <div className={styles.userSection}>
          {!collapsed && (
            <div className={styles.userActions}>
                <div className={styles.authorSignature}>
                  <div className={styles.authorImage}>
                      <img className={styles.authorImageInner} src="https://cdn.ujjwalvivek.com/images/profile.webp" alt="Author" />
                  </div>
                  <div style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
                    <div className={styles.userName}>Vivek</div>
                  <div className={styles.userStatus} onClick={() => window.open('https://ujjwalvivek.com', '_blank', 'noopener,noreferrer')}>
                    <span className={styles.statusDot}></span>
                    ujjwalvivek.com
                  </div>
                  </div>
                  <div className={styles.userAuth} onClick={onLogout} title="Logout">
                    <span className={styles.userAuthIcon}><RiLogoutBoxRLine /></span>
                  </div>
                </div>
              </div>
          )}
          
          {collapsed && (
            <div className={styles.userActions} onClick={onLogout} title="Logout" >
                <div className={styles.authorSignature}>
                  <div className={`${styles.authorImage} ${styles.collapsed}`}>
                      <img className={`${styles.authorImageInner} ${styles.collapsed}`} src="https://cdn.ujjwalvivek.com/images/profile.webp" alt="Author" />
                  </div>
                </div>
              </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
