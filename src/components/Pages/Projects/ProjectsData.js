export const ProjectsData = [
    {
        id: "dev-1",
        title: "Journey: High-Performance 2D ECS Engine in Rust",
        content: [
            "A handcrafted, cross-platform game engine built from scratch to master systems design. Architected using Rust and wGPU with a custom Entity Component System (ECS) for maximum data locality. Features a fully decoupled rendering pipeline that targets desktop natively and the web via WebAssembly (WASM), delivering consistent 60 FPS performance without a heavy runtime.",
        ],
        tags: [
            "Rust",
            "wGPU",
            "WASM",
            "ECS",
            "System Architecture",
            "Game Dev",
            "Cross-Platform",
        ],
        visibleTags: 3,
        contentLinks: {
            blogPost: "/blog/proj_0004_rust_game_engine.md",
            githubRepo: "https://github.com/ujjwalvivek/journey",
        },
    },
    {
        id: "dev-2",
        title: "TinyTS: A Tiny HTML5 Game Engine",
        content: [
            "A tiny, fast, singleton-free TypeScript-first 2D web game engine with zero runtime dependencies. ~88 KB minified, ~27 KB gzip.",
        ],
        tags: ["TS", "WebGL + Canvas", "Game Engine"],
        visibleTags: 3,
        contentLinks: {
            websiteLink: "https://tinyts.ujjwalvivek.com",
            githubRepo: "https://github.com/ujjwalvivek/tinyts",
        },
    },
    {
        id: "dev-3",
        title: "Baremetal: A Terminal Renderer",
        content: [
            "A DDA raycaster and terminal game engine. Pure x86-64 assembly with syscalls. No libc and runtime. Inspired by Wolfenstein 3D.",
        ],
        tags: ["Assembly", "x86-64", "Terminal", "Game Engine"],
        visibleTags: 3,
        contentLinks: {
            websiteLink: "https://baremetal.ujjwalvivek.com",
            githubRepo: "https://github.com/ujjwalvivek/baremetal",
        },
    },
    {
        id: "dev-4",
        title: "Substrate: A Tiny JS Renderer",
        content: [
            "A tiny (~1000 LOC) vanilla JS procedural wallpaper engine with theme support. The repo is the frontend where you can visually tweak the engine primitives in real-time. The source codes are hosted at CDN.",
        ],
        tags: ["JS", "Procedural", "Wallpaper Engine"],
        visibleTags: 3,
        contentLinks: {
            websiteLink: "https://substrate.ujjwalvivek.com",
            githubRepo: "https://github.com/ujjwalvivek/substrate",
        },
    },
    {
        id: "dev-5",
        title: "PySiteGen: A Static Site Generator",
        content: [
            "PySiteGen is a tiny static site generator for people who would rather compose HTML with Python without any runtime server, client framework, or hidden build graph. PySiteGen gives you primitives. The default visual taste is just a theme layer with terminal-dark aesthetics. It is practical. You write Python functions that return HTML nodes. PySiteGen renders them to static HTML and copies the assets you explicitly ask for.",
        ],
        tags: ["Python", "SSG", "Terminal-Style", "Substrate"],
        visibleTags: 3,
        contentLinks: {
            websiteLink: "https://pysitegen.ujjwalvivek.com",
            githubRepo: "https://github.com/ujjwalvivek/pysitegen",
        },
    },
    {
        id: "dev-6",
        title: "Echopoint: An Edge SVG Generator",
        content: [
            "Echopoint is a telemetry aggregation service and dynamic SVG generation engine. It runs on the edge using Cloudflare Workers and provides a docs/dashboard for managing and previewing the generated assets. This is perfect for embedding real-time statistics and custom badges into GitHub READMEs, personal websites, or Notion pages.",
        ],
        tags: ["JS", "Cloudflare Workers", "SVG Generation"],
        visibleTags: 3,
        contentLinks: {
            websiteLink: "https://echopoint.ujjwalvivek.com",
            githubRepo: "https://github.com/ujjwalvivek/echopoint",
        },
    },
    {
        id: "dev-7",
        title: "An Ephemeral Sharing Utility: Synclippy",
        content: [
            "A tiny ephemeral sharing tool for moving text or small files between devices. Synclippy started as a clipboard sync system but eventually collapsed into something simpler, temporary three-word rooms that live in memory and expire after a few minutes.",
        ],
        tags: [
            "Go",
            "Typescript",
            "Cloudflare Workers",
            "Durable Objects",
            "Cross-Platform",
            "Local-First",
        ],
        visibleTags: 3,
        contentLinks: {
            blogPost: "/blog/log_0006_simpleclippy.md",
            githubRepo: "https://github.com/ujjwalvivek/synclippy",
        },
    },
    {
        id: "dev-8",
        title: "DevHub: A Native Project Launcher",
        content: [
            "Native egui/eframe desktop app that scans filesystems and SSH hosts for software projects (Cargo.toml, package.json, go.mod, etc.), indexes them, and presents a three-pane browser with file tree, content search, git state, and telemetry.",
        ],
        tags: ["Rust", "Native", "Project Launcher", "Telemetry"],
        visibleTags: 3,
        contentLinks: {
            websiteLink: "https://devhub.ujjwalvivek.com",
            githubRepo: "https://github.com/ujjwalvivek/devhub",
        },
    },
    {
        id: "dev-9",
        title: "Procedural Graphics Engine & React Architecture",
        content: [
            "Engineered a custom procedural rendering engine using HTML5 Canvas to visualize mathematical concepts without heavy 3D libraries. Architected a React-based performance-first portfolio site around this engine that prioritizes performant canvas rendering over standard DOM manipulation. The result is a unique blend of terminal aesthetics and interactive visuals, all while maintaining accessibility and cross-device performance.",
        ],
        tags: [
            "Algorithms",
            "Canvas API",
            "System Design",
            "Performance Optimization",
            "React",
            "Accessibility",
        ],
        contentLinks: {
            blogPost: "/blog/log_0000_boot_sequence.md",
            githubRepo: "https://github.com/ujjwalvivek/portfolio",
        },
    },
    {
        id: "dev-10",
        title: "EasyApply: A Job Application Companion",
        content: [
            "Zero-friction job application companion with a browser extension + Cloudflare Workers AI ",
        ],
        tags: ["TS", "Cloudflare Workers", "Durable Objects"],
        visibleTags: 3,
        contentLinks: {
            githubRepo: "https://github.com/ujjwalvivek/easyapply",
        },
    },
    {
        id: "dev-11",
        title: "Root: All My Links",
        content: [
            "A root hub for ujjwalvivek.com, driven by a custom rust canvas, js bg generation, and sounds using a procedural audio engine.",
        ],
        tags: ["Rust", "Journey", "Cadence", "Audio"],
        visibleTags: 3,
        contentLinks: {
            websiteLink: "https://root.ujjwalvivek.com",
            githubRepo: "https://github.com/ujjwalvivek/root",
        },
    },

    {
        id: "dev-12",
        title: "Requiem: A Journey Engine Game",
        content: [
            "A stark, minimalist bullet heaven built on the Journey Engine. Fewer, faster, deadlier enemies. Monochrome geometry. Heavy impact. Zero assets.",
        ],
        tags: ["Rust", "WASM", "Journey", "Cross-Platform"],
        visibleTags: 3,
        contentLinks: {
            websiteLink: "https://ujjwalvivek.itch.io/requiem-the-game",
            githubRepo: "https://github.com/ujjwalvivek/requiem",
        },
    },
    {
        id: "dev-13",
        title: "A 2D Game in Journey Engine: Engine Capabilities",
        content: [
            "A WASM Artifact. Port of the Dino Blink game (Easter Egg) to the Journey Engine, showcasing the engine’s capabilities in a real-world project. This project involved implementing core gameplay mechanics, optimizing performance for web deployment, and iterating on design.",
        ],
        tags: ["Journey", "Engine", "WASM", "2D", "Game Dev", "Cross-Platform"],
        visibleTags: 3,
        contentLinks: {
            blogPost: "/blog/log_0005_finally_it_happened.md",
            githubRepo: "https://github.com/ujjwalvivek/dino-blink",
        },
    },
    {
        id: "dev-14",
        title: "Multiplayer FPS Architecture: A Development Resource",
        content: [
            "Engineered the core networking and gameplay stack for a squad-based FPS. Architected a scalable RoomManager and Lobby system for seamless matchmaking, and implemented a custom Raycast Combat model with client-side prediction. developed a 3D spatial audio framework to drive immersive horror mechanics.",
        ],
        tags: [
            "Unity",
            "System Architecture",
            "Multiplayer",
            "Game Systems",
            "Networking",
        ],
        contentLinks: {
            githubRepo: "https://github.com/ujjwalvivek/TheReckoning",
        },
    },
    {
        id: "dev-15",
        title: "Real-Time Multiplayer Architecture: Mirror & Optimizations",
        content: [
            "Developed a server-authoritative multiplayer game using Unity & Mirror. Implemented client-side prediction for latency masking and architected a modular codebase to separate core logic from networking, learning critical lessons in bandwidth management and O(n) performance scaling.",
        ],
        tags: [
            "C#",
            "Mirror",
            "Unity",
            "Network Architecture",
            "3D",
            "Client-Side Prediction",
            "Optimization",
        ],
        visibleTags: 3,
        contentLinks: {
            blogPost: "/blog/proj_0002_greedysnek.md",
            githubRepo: "https://github.com/ujjwalvivek/GreedySnek",
        },
    },
    {
        id: "dev-16",
        title: "Deterministic Architecture & Weapon Tooling",
        content: [
            "Engineered a deterministic input-lockstep simulation framework to achieve minimal-bandwidth state synchronization (2 floats/frame). Integrated a ScriptableObject-driven weapon pipeline, decoupling game design data from engineering logic to accelerate content iteration.",
        ],
        tags: [
            "C#",
            "System Architecture",
            "Simulation",
            "Developer Tools",
            "Data-Driven Design",
            "unity",
        ],
        contentLinks: {
            blogPost: "/blog/proj_0003_kill_bad_guys.md",
            githubRepo:
                "https://github.com/ujjwalvivek/UnityCoordinationFramework",
        },
    },
    {
        id: "dev-17",
        title: "Nine Years… and Still Kicking: An IEEE website",
        content: [
            "Architected the IEEE Manipal digital platform with a focus on zero-maintenance durability. The static site architecture has served 10,000+ students with 99.9% uptime for 9 years, validating the 'Simple by Design' engineering philosophy over complex frameworks.",
        ],
        tags: [
            "Legacy",
            "System Reliability",
            "Maintainability",
            "Architecture",
        ],
        contentLinks: {
            githubRepo:
                "https://github.com/IEEE-Manipal/IEEE-Manipal.github.io",
            websiteLink: "https://ieeemanipal.com/",
        },
    },
    {
        id: "pm-1",
        title: "Cross-Platform Architecture & Security Analysis",
        content: [
            "Conducted a comparative architectural analysis of Web vs. Native clipboard APIs. Pivoted from a Web-only approach to a hybrid Tauri (Rust) architecture to bypass browser security sandboxing, enabling secure, local-first background synchronization. Read on to find more about this project.",
        ],
        tags: [
            "Tauri",
            "Go",
            "Cross-Platform",
            "System Security",
            "Architecture Pivot",
            "Local-First",
        ],
        visibleTags: 3,
        contentLinks: {
            blogPost: "/blog/proj_0005_the_synclippy.md",
        },
    },
    {
        id: "pm-2",
        title: "Enterprise VR Ecosystem: Large-Scale Deployment & Adoption",
        content: [
            "Orchestrated the infrastructure and adoption strategy for UltraTech’s VR training initiative. Managed the end to end project and deployment across 55+ manufacturing plants, successfully standardizing safety protocols for 65,000 enterprise users.",
        ],
        tags: [
            "VR",
            "Strategy",
            "Operations Scale",
            "Enterprise SaaS",
            "Deployment",
        ],
        contentLinks: {
            websiteLink: "https://www.autovrse.com/case-study-ultratech",
        },
    },
    {
        id: "pm-3",
        title: "Roblox Virtual Economy: Social Mechanics & Safety Architecture",
        content: [
            "Developed a comprehensive Product Spec for 'Pet Palooza,' a Roblox educational MMO inspired by 'Adopt Me' mechanics. modeled the virtual economy (currency sinks/faucets) to drive financial literacy KPIs while implementing a strict 'Safety-by-Design' framework for COPPA/GDPR-K compliance.",
        ],
        tags: [
            "Strategy",
            "Gaming",
            "Economy Design",
            "Platform Compliance",
            "Trust & Safety",
        ],
        contentLinks: {
            notionEmbed:
                "https://ujjwalvivek.notion.site/ebd//4bb4920a63f7452eb2f05eef1bb3868c",
        },
    },
    {
        id: "pm-4",
        title: "EdTech Engagement Strategy: Behavioral Analytics & UX Optimization",
        content: [
            "Engineered a data-driven retention framework for NxtWave’s learning platform. Leveraged behavioral analytics to identify user churn points and implemented a gamified UX overhaul, resulting in a 2x increase in student engagement metrics.",
        ],
        tags: [
            "Product Strategy",
            "Analytics",
            "User Retention",
            "A/B Testing",
        ],
        contentLinks: {
            notionEmbed:
                "https://ujjwalvivek.notion.site/ebd//b54e0f4355ea49b6841d9e4b9d2954ff",
        },
    },
    {
        id: "pm-5",
        title: "Enterprise 360° Platform: UX Design & Strategy",
        content: [
            "Designed the UX architecture for a scalable 360° web experience for Godrej. Translated complex industrial constraints into an intuitive interface, balancing technical performance limitations with strict corporate brand compliance.",
        ],
        tags: [
            "Enterprise",
            "UX",
            "Product Strategy",
            "Stakeholder Management",
        ],
        contentLinks: {
            figmaDesign:
                "https://www.figma.com/proto/to1kH8909LmtMxPvnmtgJ2?node-id=866-8947&mode=design&t=llhEzrevnwVqVdxM-6",
        },
    },
];
