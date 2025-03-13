# Labyrinth: AI-Powered Search Engine with Generative UI


## Overview

Labyrinth is a cutting-edge AI-powered search engine that reimagines information retrieval with a generative user interface. It's designed to be flexible, performant, and easy to deploy, offering both open-source and cloud-hosted options. Labyrinth leverages the power of AI to provide more relevant and insightful search results.

## Key Features

*   **AI-Powered Search:** Integrates with leading AI models (OpenAI, Google Gemini, etc.) for intelligent and context-aware search.
*   **Generative UI:** A dynamic and customizable user interface built with modern web technologies for a seamless user experience.
*   **Multiple Search Providers:** Supports various search providers (Tavily, SearXNG, Exa) for diverse search capabilities.
*   **High Performance:** Optimized for speed, with support for Groq and Gemini for accelerated response times.
*   **Flexible Deployment:** Offers both open-source and cloud-hosted options to suit different needs and skill levels.
*   **Model Selection:** Allows users to choose between different AI models directly from the UI.
*   **Redis Support:** Utilizes Redis (local or Upstash) for efficient data caching and session management.

## Technologies Used

*   **Core Framework:** Next.js (App Router, React Server Components)
*   **Language:** TypeScript
*   **AI & Search:**
    *   Google Gemini (Default)
    *   Groq (Multiple models)
    *   Linkup (Default Search)
    *   SearXNG (Self-Hosted)
*   **Data Storage:** Redis / Upstash
*   **UI & Styling:** Tailwind CSS, shadcn/ui, Radix UI, Lucide Icons

## Getting Started

Follow these steps to get Labyrinth up and running:

### Prerequisites

*   Node.js (version >= 18)
*   Bun package manager (recommended) or npm/yarn
*   Docker (optional, for containerized deployment)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/[YOUR_GITHUB_USERNAME]/[YOUR_REPOSITORY_NAME].git
    cd [YOUR_REPOSITORY_NAME]
    ```

2.  **Install dependencies:**

    ```bash
    bun install
    # or
    npm install
    # or
    yarn install
    ```

3.  **Configure environment variables:**

    *   Copy the `.env.local.example` file to `.env.local`:

        ```bash
        cp .env.local.example .env.local
        ```

    *   Fill in the required environment variables in `.env.local`.  At a minimum, you'll need:

        ```
        OPENAI_API_KEY=[YOUR_OPENAI_API_KEY]
        TAVILY_API_KEY=[YOUR_TAVILY_API_KEY]
        ```

   

4.  **Run the application:**

    *   **Using Bun:**

        ```bash
        bun dev
        ```

    *   **Using Docker:**

        ```bash
        docker compose up -d
        ```

5.  **Access Labyrinth:**

    *   Open your browser and navigate to `http://localhost:3000`.

## Deployment

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Vinitj088/Labyrinth)

### Docker

1.  **Pull the prebuilt Docker image:**

    ```bash
    docker pull ghcr.io/[YOUR_GITHUB_USERNAME]/[YOUR_REPOSITORY_NAME]:latest
    ```

2.  **Run using Docker Compose:**

    ```yaml
    version: "3.8"
    services:
      labyrinth:
        image: ghcr.io/[YOUR_GITHUB_USERNAME]/[YOUR_REPOSITORY_NAME]:latest
        env_file: .env.local
        ports:
          - "3000:3000"
        # Optional: Override default model configuration
        volumes:
          - ./models.json:/app/public/config/models.json
    ```

    *   Create a `docker-compose.yml` file with the above content.
    *   Run `docker compose up -d`.

## Contributing

We welcome contributions to Labyrinth!

## License

Labyrinth is licensed under the Apache 2.0 License. See the [LICENSE](LICENSE) file for more information.

## Support

For questions, bug reports, or feature requests, please open an issue on GitHub.

## Credits

*   [Morphic](https://github.com/miurla/morphic)
