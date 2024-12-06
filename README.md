
# Portfolio Website

This project is a personal portfolio website built with React. It showcases the work and projects of **Ujjwal Vivek**. The website is still a work in progress and will be launched soon.

---

## Table of Contents

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Project Features](#project-features)
- [Development Workflow](#development-workflow)
  - [Available Scripts](#available-scripts)
- [PostCSS Integration](#postcss-integration)
- [CSS Modules Usage](#css-modules-usage)
- [Project Structure](#project-structure)
- [License](#license)

---

## Getting Started

Follow these steps to get a local copy of the project up and running for development and testing.

### Prerequisites

Make sure you have the following installed:
- **Node.js** (>=14.x)
- **npm** (>=6.x)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/portfolio.git
   cd portfolio
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

---

## Project Features

- Built with **React** for a responsive and dynamic UI.
- Styled using **CSS Modules** for component-specific styles.
- Integrated with **PostCSS** plugins for advanced CSS processing.
- Fully customizable and optimized for deployment.

---

## Development Workflow

The project uses `react-app-rewired` and `customize-cra` to modify the default Create React App configurations.

### Available Scripts

In the project directory, you can run:

- **Start the Development Server:**
  ```bash
  npm start
  ```

- **Run Tests:**
  ```bash
  npm test
  ```

- **Build the Project for Production:**
  ```bash
  npm run build
  ```

---

## PostCSS Integration

This project uses PostCSS with the following plugins:
- `postcss-import` for handling `@import` rules.
- `postcss-preset-env` for modern CSS features.
- `postcss-nested` for nesting CSS rules.
- `autoprefixer` for adding vendor prefixes.
- `cssnano` for CSS minification.

---

## CSS Modules Usage

The project employs **CSS Modules** to scope styles to individual components. For example:
- **App.module.css** contains styles specific to the `App` component.
- Import the styles in the component:
  ```javascript
  import styles from './App.module.css';
  ```
- Use the styles:
  ```javascript
  <div className={styles.AppHeader}>...</div>
  ```

---

## Project Structure

The project follows a structured file organization:

```
portfolio/
├── .github/
├── public/
├── src/
│   ├── App.js
│   ├── App.module.css
│   ├── App.test.js
│   ├── index.css
│   ├── index.js
│   ├── logo.svg
│   ├── reportWebVitals.js
│   └── setupTests.js
├── config-overrides.js
├── postcss.config.js
├── package.json
├── README.md
```

---

## License

This project is licensed under the MIT License. You are free to use, modify, and distribute this project as long as proper credit is given.

---

**© 2024 Ujjwal Vivek**  
Fuelled by sleepless nights, almost ready to shine!
