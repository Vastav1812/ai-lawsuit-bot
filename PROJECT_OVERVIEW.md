# Project Overview: AI Lawsuit Bot

This document provides a comprehensive overview of the AI Lawsuit Bot project, covering both its backend and frontend components, their architecture, dependencies, and current status.

---

## Backend Description: `ai-lawsuit-bot/backend`

The backend for the AI Lawsuit Bot is a Node.js application built with Express.js, designed to interact with Ethereum smart contracts, integrate with an AI judgment model (AWS Bedrock), and manage cryptocurrency payments. It uses Hardhat for smart contract development and the Coinbase SDK for wallet management.

### 1. Project Structure:

```
backend/
├── artifacts/                  # Compiled smart contract artifacts (ABI, bytecode)
│   └── contracts/
│       └── AICourtSettlement.sol/
│           └── AICourtSettlement.json
├── cache/                      # Hardhat cache directory
├── contracts/                  # Smart contract source code
│   └── AICourtSettlement.sol
├── data/                       # Local data storage (e.g., case details)
│   └── cases/                  # Stores individual case JSON files
├── ignition/                   # Hardhat Ignition deployment scripts
├── node_modules/               # Node.js dependencies
├── scripts/                    # Utility and demo scripts
│   └── demo-settlement-flow.js # Demo script to simulate the case settlement flow
├── src/                        # Core backend application source code
│   ├── app.js                  # Main Express.js application entry point
│   ├── config/
│   │   ├── bedrock.js          # AWS Bedrock (AI) client configuration
│   │   └── index.js            # General configurations (if any)
│   ├── middleware/
│   │   └── x402pay.js          # X402 payment gateway middleware
│   ├── routes/
│   │   ├── cases.js            # API routes for case management
│   │   └── wallets.js          # API routes for wallet information
│   └── services/
│       └── walletManager.js    # Logic for creating and managing wallets
├── .env                        # Environment variables (AWS keys, RPC URLs, contract addresses)
├── .gitignore                  # Git ignore file
├── coinbase_cloud_api_key.json # Coinbase Cloud API key file
├── deployment-info.json        # Deployed smart contract addresses and network info
├── hardhat.config.cjs          # Hardhat configuration for contract compilation/deployment
├── package.json                # Project metadata and dependencies
├── package-lock.json           # Exact dependency versions
├── README.md                   # Project README
├── tsconfig.json               # TypeScript configuration
└── wallet-backup.json          # (Potentially old) wallet backup file
```

### 2. Key Dependencies and Their Roles:

*   **`express`**: A fast, unopinionated, minimalist web framework for Node.js. It's used to build the RESTful API endpoints.
*   **`ethers`**: A complete and compact library for interacting with the Ethereum blockchain and its ecosystem. Used for:
    *   Connecting to the Base Sepolia RPC.
    *   Initializing the smart contract interface (`ethers.Contract`).
    *   Interacting with contract methods (e.g., filing cases, judging).
*   **`@aws-sdk/client-bedrock-runtime`**: AWS SDK client for interacting with Amazon Bedrock, which hosts the generative AI model (Nova Micro). Used for:
    *   Invoking the AI model with prompts to get case judgments.
    *   Handling authentication with AWS credentials.
*   **`@coinbase/coinbase-sdk`**: The official Coinbase SDK for managing blockchain wallets. Used for:
    *   Creating and loading different system wallets (treasury, escrow, jury pool, precedent fund).
    *   Generating case-specific wallets.
    *   Performing fund transfers and balance checks.
*   **`x402`**: A custom payment gateway middleware used for monetizing API endpoints. It verifies and tracks payments made for accessing certain API routes (e.g., filing a case, getting an AI judgment).
*   **`dotenv`**: A zero-dependency module that loads environment variables from a `.env` file into `process.env`.
*   **`nodemon`**: A tool that helps develop Node.js based applications by automatically restarting the node application when file changes in the directory are detected.
*   **`hardhat`**: An Ethereum development environment for professionals. Used for:
    *   Compiling smart contracts (`AICourtSettlement.sol`).
    *   Deployment and testing of contracts.
*   **`axios`**: A popular promise-based HTTP client for the browser and Node.js. Used in utility scripts (like `demo-settlement-flow.js`) to make requests to the backend API.
*   **`fs`, `path`, `url`**: Node.js built-in modules used for file system operations (reading config files, storing case data) and resolving file paths.

### 3. Backend Approach and Core Logic:

The backend serves as the central hub, orchestrating interactions between the frontend, smart contracts, AI model, and payment system.

*   **API Endpoints:**
    *   `/api/cases/file` (POST): Accepts case details (defendant, claim type, evidence, damages). It uses `x402pay` middleware for payment verification. Case data is stored locally as a JSON file, and a temporary ID is assigned.
    *   `/api/cases/:caseId/judge` (POST): Accepts a `caseId`. It loads the stored case data, constructs a prompt for the AI judge, invokes the configured Bedrock model (Nova Micro), parses the AI's judgment, and updates the case status/stores the judgment. This also requires payment.
    *   `/api/cases/:caseId` (GET): Retrieves the full details of a specific case.
    *   `/api/wallets/system` (GET): Provides information on the system's core wallets (treasury, escrow, jury pool, precedent fund).
    *   Additional planned endpoints (e.g., `/api/precedents/search`, `/api/cases/:caseId/settle`, `/api/cases/:caseId/appeal`) are outlined but not yet fully implemented, relying on mock data or placeholders.
*   **Smart Contract Interaction:** The `AICourtSettlement.sol` contract defines the core logic for the decentralized court system (e.g., filing cases, judging, handling settlements). The backend connects to a deployed instance of this contract on the Base Sepolia testnet using `ethers.js` and the `deployment-info.json` file.
*   **AI Integration:** The `bedrock.js` configuration handles communication with AWS Bedrock. The `invokeNovaMicro` function sends a text prompt (derived from case details) to the Nova Micro model and processes its JSON response to obtain a judgment. It correctly uses `process.env.BEDROCK_MODEL_ID` for the inference profile.
*   **Wallet Management:** The `walletManager.js` service is crucial for handling all cryptocurrency wallets. It creates and manages both "system wallets" (treasury, escrow, jury pool, precedent fund) and dynamic "case wallets." Wallet data (ID, name) is stored in JSON files, while sensitive seed phrases are stored separately in `.seed` files, encrypted via the Coinbase SDK's `saveSeedToFile` method. This separation and encryption enhance security.
*   **Payment Gateway (`x402pay`):** This custom middleware intercepts API requests, verifies payments using custom `X-PAYMENT` headers, and tracks transactions. This mechanism enforces micro-payments for access to AI-powered features.
*   **Local Data Persistence:** Case data is stored directly on the file system within `backend/data/cases/` as JSON files, using simple helper functions for saving and loading.

---

## Frontend Description: `ai-lawsuit-bot/frontend`

The frontend for the AI Lawsuit Bot is a modern web application built with **Next.js 15.3.3**, a React framework, designed to provide a user interface for interacting with the backend API and the Ethereum blockchain. It leverages Tailwind CSS for styling and RainbowKit/Wagmi for robust wallet connectivity.

### 1. Project Structure:

```
frontend/
├── public/                     # Static assets (images, favicon, etc.)
│   └── favicon.ico
├── src/                        # Main application source code
│   ├── app/                    # Next.js App Router root
│   │   ├── favicon.ico
│   │   ├── globals.css         # Global CSS styles (Tailwind base, components, utilities, custom CSS variables)
│   │   ├── layout.tsx          # Root layout for the application (e.g., HTML, body, Web3Provider)
│   │   └── page.tsx            # Main dashboard/landing page
│   ├── components/             # Reusable React components
│   │   └── ui/                 # UI-specific components (e.g., Navbar, Shadcn/UI primitives)
│   │       └── navbar.tsx      # Application navigation bar
│   ├── config/                 # Configuration files
│   │   └── logger.ts           # (Previously created, but not used in current setup)
│   ├── providers/              # Context providers for global state/services
│   │   └── web3-provider.tsx   # Wagmi and RainbowKit configuration for Web3 connectivity
│   └── lib/                    # Utility functions or helper libraries
│       └── utils.ts            # General utility functions (e.g., `cn` for Tailwind class merging)
├── .env.local                  # Local environment variables (e.g., WalletConnect Project ID)
├── .gitignore                  # Git ignore file
├── next.config.js              # Next.js configuration (e.g., Webpack fallbacks)
├── package.json                # Project metadata and dependencies
├── package-lock.json           # Exact dependency versions
├── postcss.config.js           # PostCSS configuration for Tailwind CSS
├── README.md                   # Project README
├── tailwind.config.ts          # Tailwind CSS configuration (theme, plugins, content paths)
└── tsconfig.json               # TypeScript configuration
```

### 2. Key Dependencies and Their Roles:

These are the core libraries and packages required for the application to run in production.

*   **`@headlessui/react`**: `^2.2.4`
    *   **Role:** Unstyled, accessible UI components for React, such as modals, dropdowns, and toggles. Used for building interactive elements without imposing a specific design.
*   **`@heroicons/react`**: `^2.2.0`
    *   **Role:** A set of beautiful SVG icons from Heroicons, provided as React components, for use in the UI.
*   **`@hookform/resolvers`**: `^5.1.0`
    *   **Role:** Integrates schema validation libraries (like Zod, which is also used) with `react-hook-form`. This makes form validation straightforward and robust.
*   **`@radix-ui/react-dialog`**: `^1.1.14`
    *   **Role:** Provides highly customizable and accessible dialog (modal) components. Part of the Radix UI primitives, which are foundational for many UI libraries like Shadcn/UI.
*   **`@radix-ui/react-label`**: `^2.1.7`
    *   **Role:** An accessible label component for forms, ensuring proper association between labels and input fields.
*   **`@radix-ui/react-select`**: `^2.2.5`
    *   **Role:** Accessible and customizable select dropdown components.
*   **`@radix-ui/react-slot`**: `^1.2.3`
    *   **Role:** A utility component that allows you to pass a React element as a child and merge its props with its own. Often used for building flexible UI components.
*   **`@radix-ui/react-tabs`**: `^1.1.12`
    *   **Role:** Accessible and customizable tab components for organizing content.
*   **`@rainbow-me/rainbowkit`**: `^2.2.6`
    *   **Role:** A React library for connecting wallets to dApps, providing a beautiful and easy-to-use modal for wallet selection and connection. It simplifies the setup for `wagmi`.
*   **`@tanstack/react-query`**: `^5.80.6`
    *   **Role:** Powerful asynchronous state management library for React. Used for fetching, caching, synchronizing, and updating server state in your web applications (e.g., blockchain data, API responses).
*   **`axios`**: `^1.9.0`
    *   **Role:** A popular promise-based HTTP client for making API requests from the frontend to the backend.
*   **`class-variance-authority`**: `^0.7.1`
    *   **Role:** A utility for creating reusable, type-safe, and composable UI components with variant-based styling. Often used with Tailwind CSS to manage complex component styles.
*   **`clsx`**: `^2.1.1`
    *   **Role:** A tiny utility for constructing `className` strings conditionally, making it easier to manage dynamic Tailwind classes.
*   **`date-fns`**: `^4.1.0`
    *   **Role:** A comprehensive and modular JavaScript date utility library for parsing, formatting, validating, and manipulating dates.
*   **`framer-motion`**: `^12.16.0`
    *   **Role:** A production-ready motion library for React that makes it easy to add animations to your UI components.
*   **`lucide-react`**: `^0.513.0`
    *   **Role:** A collection of beautiful, community-maintained SVG icons, provided as React components. Similar to Heroicons, offering a different style.
*   **`next`**: `15.3.3`
    *   **Role:** The React framework for building full-stack web applications. It provides features like routing, API routes, server-side rendering (SSR), static site generation (SSG), and more.
*   **`next-themes`**: `^0.4.6`
    *   **Role:** A lightweight library for managing themes (e.g., light/dark mode) in Next.js applications, supporting system preferences and easy switching.
*   **`pino-pretty`**: `^13.0.0`
    *   **Role:** A development dependency for pretty-printing `pino` logs (a fast Node.js logger). While it was causing issues in the browser, it's typically used in development for readable console output. It's listed here as a direct dependency.
*   **`react`**: `^19.0.0`
    *   **Role:** The core JavaScript library for building user interfaces.
*   **`react-dom`**: `^19.0.0`
    *   **Role:** Provides DOM-specific methods that can be used at the top-level of a web app to enable efficient updates of the DOM.
*   **`react-hook-form`**: `^7.57.0`
    *   **Role:** A performant, flexible, and extensible forms library for React, designed to minimize re-renders and simplify form management.
*   **`react-hot-toast`**: `^2.5.2`
    *   **Role:** A simple and customizable toast notification library for React applications.
*   **`recharts`**: `^2.15.3`
    *   **Role:** A composable charting library built with React and D3, used for creating various types of charts and graphs to visualize data.
*   **`tailwind-merge`**: `^3.3.0`
    *   **Role:** A utility to intelligently merge Tailwind CSS classes, resolving conflicts by applying the latest class.
*   **`viem`**: `^2.30.6`
    *   **Role:** A lightweight, type-safe, and performant low-level library for interacting with Ethereum. It's often used by `wagmi` internally for core blockchain operations.
*   **`wagmi`**: `^2.15.6`
    *   **Role:** A collection of React Hooks for Ethereum, making it easy to connect wallets, interact with contracts, send transactions, and more. RainbowKit builds on top of Wagmi.
*   **`zod`**: `^3.25.56`
    *   **Role:** A TypeScript-first schema declaration and validation library. Used for defining expected data shapes (e.g., for form validation) and ensuring data integrity.

### Frontend Development Dependencies (`devDependencies`)

These packages are only needed during the development process and are not included in the final production build.

*   **`@eslint/eslintrc`**: `^3`
    *   **Role:** Provides utilities for creating and extending ESLint configurations. ESLint is a tool for identifying and reporting on patterns found in ECMAScript/JavaScript code.
*   **`@tailwindcss/postcss`**: `^4`
    *   **Role:** A PostCSS plugin for Tailwind CSS. PostCSS is a tool for transforming CSS with JavaScript, and this plugin enables Tailwind's functionalities.
*   **`@types/node`**: `^20`
    *   **Role:** TypeScript type definitions for Node.js, providing type-checking for Node.js APIs used in the project.
*   **`@types/react`**: `^19`
    *   **Role:** TypeScript type definitions for React, enabling type-checking for React components and hooks.
*   **`@types/react-dom`**: `^19`
    *   **Role:** TypeScript type definitions for `react-dom`, for type-checking DOM-specific React APIs.
*   **`eslint`**: `^9`
    *   **Role:** The main ESLint library for linting JavaScript/TypeScript code, ensuring code quality and consistency.
*   **`eslint-config-next`**: `15.3.3`
    *   **Role:** An ESLint configuration specifically tailored for Next.js projects, including rules for React, TypeScript, and Next.js best practices.
*   **`tailwindcss`**: `^4`
    *   **Role:** The core Tailwind CSS framework. This is the main package that provides all the utility classes for styling.
*   **`tw-animate-css`**: `^1.3.4`
    *   **Role:** Likely a utility or plugin for integrating animation classes from animate.css (or similar) into Tailwind CSS.
*   **`typescript`**: `^5.8.3`
    *   **Role:** The TypeScript compiler, which transpiles TypeScript code into JavaScript.

### Frontend Current Status and Remaining Work

The frontend currently provides the **foundation** (Next.js setup, wallet connection, basic navigation, styling framework), but the **core functional UI** that interacts with the specific backend logic (filing, judging, viewing cases, handling payments) is yet to be developed.

**What is Made:**

*   **Project Initialization:** The Next.js project is set up and configured.
*   **Wallet Connection:** Users can connect their wallets using RainbowKit and Wagmi. This includes support for various wallet types.
*   **Basic Layout:** A navbar with navigation links is present.
*   **Theming:** Dark theme is applied from RainbowKit, and Tailwind CSS is configured for custom theme variables.
*   **Core Configuration:** `next.config.js`, `tailwind.config.ts`, `globals.css` are correctly set up to handle common frontend issues like module resolution and CSS utility classes.

**What is NOT Yet Made (Required for full functionality):**

*   **Dashboard (`/`):** Display a summary of active cases, user wallet balance, etc.
*   **File Case Page (`/file-case`):** A form to input case details, logic to send POST requests to `/api/cases/file` with payment headers, and display of results.
*   **My Cases Page (`/my-cases`):** Fetch and display a list of cases associated with the connected user, and links to detailed case information.
*   **Case Detail Page (`/cases/:caseId`):** Fetch and display all details of a specific case, UI for triggering AI judgment, settlement details, and appeal processes.
*   **Precedent Search/View Pages:** UI for searching and viewing full precedent details.
*   **Payment Integration:** UI elements to clearly indicate API call costs, and mechanisms to generate and include `X-PAYMENT` headers (likely requiring wallet signatures).
*   **Error Handling and User Feedback:** Robust display of backend errors, and loading states for asynchronous operations. 