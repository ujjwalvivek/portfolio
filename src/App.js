import React from "react";
import logo from './logo.svg';
import styles from './App.module.css';

function App() {
  return (
    <div className={styles.App}>
      <header className={styles.AppHeader}>
        <p>powered by <span style={{color: '#61DAFB', fontWeight: 'bold'}}>React</span></p><br></br>
        <img src={logo} className={styles.AppLogo} alt="logo" />
      </header>
      <main className={styles.AppMain}>
        <h1>Work In Progress</h1>
        <p style={{textTransform:'none'}}>Something cool coming before the New Year!</p>
        <p>Be on the lookout</p>
      </main>
      <footer>
        <p>© 2024 Ujjwal Vivek. Fuelled by sleepless nights, almost ready to shine!</p>
      </footer>
    </div>
  );
}

export default App;