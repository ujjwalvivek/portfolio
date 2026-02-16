export const ProjectsData = [
  {
    id: 'pm-2',
    title: 'Roblox Virtual Economy: Social Mechanics & Safety Architecture',
    content: ['Developed a comprehensive Product Spec for \'Pet Palooza,\' a Roblox educational MMO inspired by \'Adopt Me\' mechanics. modeled the virtual economy (currency sinks/faucets) to drive financial literacy KPIs while implementing a strict \'Safety-by-Design\' framework for COPPA/GDPR-K compliance.'],
    tags: ['Strategy', 'Gaming', 'Economy Design', 'Platform Compliance', 'Trust & Safety'],
    contentLinks: {
      notionEmbed: 'https://ujjwalvivek.notion.site/ebd//4bb4920a63f7452eb2f05eef1bb3868c',
    },
  },
  {
    id: 'pm-3',
    title: 'EdTech Engagement Strategy: Behavioral Analytics & UX Optimization',
    content: ['Engineered a data-driven retention framework for NxtWave’s learning platform. Leveraged behavioral analytics to identify user churn points and implemented a gamified UX overhaul, resulting in a 2x increase in student engagement metrics.'],
    tags: ['Product Strategy', 'Analytics', 'User Retention', 'A/B Testing'],
    contentLinks: {
      notionEmbed: 'https://ujjwalvivek.notion.site/ebd//b54e0f4355ea49b6841d9e4b9d2954ff',
    },
  },
  {
    id: 'pm-4',
    title: 'Enterprise 360° Platform: UX Design & Strategy',
    content: ['Designed the UX architecture for a scalable 360° web experience for Godrej. Translated complex industrial constraints into an intuitive interface, balancing technical performance limitations with strict corporate brand compliance.'],
    tags: ['Enterprise', 'UX', 'Product Strategy', 'Stakeholder Management'],
    contentLinks: {
      figmaDesign: 'https://www.figma.com/proto/to1kH8909LmtMxPvnmtgJ2?node-id=866-8947&mode=design&t=llhEzrevnwVqVdxM-6',
    },
  },

  {
    id: 'dev-2',
    title: 'Procedural Graphics Engine & React Architecture',
    content: ['Engineered a custom procedural rendering engine using HTML5 Canvas to visualize mathematical concepts without heavy 3D libraries. Architected a React-based performance-first portfolio site around this engine that prioritizes performant canvas rendering over standard DOM manipulation. The result is a unique blend of terminal aesthetics and interactive visuals, all while maintaining accessibility and cross-device performance.'],
    tags: ['Algorithms', 'Canvas API', 'System Design', 'Performance Optimization', 'React', 'Accessibility'],
    contentLinks: {
      blogPost: '/blog/log_0000_boot_sequence.md',
      githubRepo: 'https://github.com/ujjwalvivek/portfolio',
    },
  },
  {
    id: 'dev-1',
    title: 'Journey: High-Performance 2D ECS Engine in Rust',
    content: ['A handcrafted, cross-platform game engine built from scratch to master systems design. Architected using Rust and wGPU with a custom Entity Component System (ECS) for maximum data locality. Features a fully decoupled rendering pipeline that targets desktop natively and the web via WebAssembly (WASM), delivering consistent 60 FPS performance without a heavy runtime.'],
    tags: ['Rust', 'wGPU', 'WASM', 'ECS', 'System Architecture', 'Game Dev', 'Cross-Platform'],
    visibleTags: 3,
    contentLinks: {
      blogPost: '/blog/proj_0004_rust_game_engine.md',
      githubRepo: 'https://github.com/ujjwalvivek/journey', // waiting to open source
    },
  },
  {
    id: 'dev-3',
    title: 'Cross-Platform Architecture & Security Analysis',
    content: ['Conducted a comparative architectural analysis of Web vs. Native clipboard APIs. Pivoted from a Web-only approach to a hybrid Tauri (Rust) architecture to bypass browser security sandboxing, enabling secure, local-first background synchronization. Read on to find more about this project.'],
    tags: ['Tauri', 'Go', 'Cross-Platform', 'System Security', 'Architecture Pivot', 'Local-First'],
    visibleTags: 3,
    contentLinks: {
      blogPost: '/blog/proj_0005_the_synclippy.md',
      githubRepo: 'https://github.com/ujjwalvivek/Synclippy',
    },
  },
  {
    id: 'dev-4',
    title: 'Real-Time Multiplayer Architecture: Mirror & Optimizations',
    content: ['Developed a server-authoritative multiplayer game using Unity & Mirror. Implemented client-side prediction for latency masking and architected a modular codebase to separate core logic from networking, learning critical lessons in bandwidth management and O(n) performance scaling.'],
    tags: ['C#', 'Mirror', 'Unity', 'Network Architecture', '3D', 'Client-Side Prediction', 'Optimization'],
    visibleTags: 3,
    contentLinks: {
      blogPost: '/blog/proj_0002_greedysnek.md',
      githubRepo: 'https://github.com/ujjwalvivek/GreedySnek',
    },
  },
  {
    id: 'dev-6',
    title: 'Nine Years… and Still Kicking: An IEEE website',
    content: ['Architected the IEEE Manipal digital platform with a focus on zero-maintenance durability. The static site architecture has served 10,000+ students with 99.9% uptime for 9 years, validating the \'Simple by Design\' engineering philosophy over complex frameworks.'],
    tags: ['Legacy', 'System Reliability', 'Maintainability', 'Architecture'],
    contentLinks: {
      githubRepo: 'https://github.com/IEEE-Manipal/IEEE-Manipal.github.io',
      websiteLink: 'https://ieeemanipal.com/',
    },
  },
  {
    id: 'dev-5',
    title: 'Deterministic Architecture & Weapon Tooling',
    content: ['Engineered a deterministic input-lockstep simulation framework to achieve minimal-bandwidth state synchronization (2 floats/frame). Integrated a ScriptableObject-driven weapon pipeline, decoupling game design data from engineering logic to accelerate content iteration.'],
    tags: ['C#', 'System Architecture', 'Simulation', 'Developer Tools', 'Data-Driven Design', 'unity'],
    contentLinks: {
      blogPost: '/blog/proj_0003_kill_bad_guys.md',
      githubRepo: 'https://github.com/ujjwalvivek/UnityCoordinationFramework',
    },
  },
  {
    id: 'dev-7',
    title: 'Multiplayer FPS Architecture: A Development Resource',
    content: ['Engineered the core networking and gameplay stack for a squad-based FPS. Architected a scalable RoomManager and Lobby system for seamless matchmaking, and implemented a custom Raycast Combat model with client-side prediction. developed a 3D spatial audio framework to drive immersive horror mechanics.'],
    tags: ['Unity', 'System Architecture', 'Multiplayer', 'Game Systems', 'Networking'],
    contentLinks: {
      githubRepo: 'https://github.com/ujjwalvivek/TheReckoning',
    },
  },
  {
    id: 'pm-1',
    title: 'Enterprise VR Ecosystem: Large-Scale Deployment & Adoption',
    content: ['Orchestrated the infrastructure and adoption strategy for UltraTech’s VR training initiative. Managed the end to end project and deployment across 55+ manufacturing plants, successfully standardizing safety protocols for 65,000 enterprise users.'],
    tags: ['VR', 'Strategy', 'Operations Scale', 'Enterprise SaaS', 'Deployment'],
    contentLinks: {
      websiteLink: 'https://www.autovrse.com/case-study-ultratech',
    },
  },
];