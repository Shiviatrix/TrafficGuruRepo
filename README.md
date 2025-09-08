# Traffic Guru: Smart Traffic Management Simulation
Where it's hosted:
https://studio--adaptiveflow-oxefi.us-central1.hosted.app

Traffic guru is a web-based simulation that demonstrates a modern, AI-powered traffic control system. It provides a real-time comparison between a traditional fixed-time traffic light controller and an adaptive system that dynamically adjusts signal timings based on live IoT sensor data.

This project showcases how AI and IoT can be leveraged to improve urban traffic flow, reduce congestion, and prioritize emergency vehicles.

## Core Features

- **Traffic Simulation**: Simulates a busy 4-way intersection with realistic vehicle behavior and traffic flow.
- **Adaptive Green Light Control**: Dynamically adjusts green light times based on real-time sensor data, including queue length, vehicle count, vehicle type, and emergency vehicle detection.
- **AI-Powered Decision Making**: Utilizes a Genkit AI flow to provide natural language explanations for the adaptive system's decisions.
- **Live Dashboard UI**: A real-time interface built with Next.js and React displays the state of the intersection, countdown timers, and key performance metrics.
- **Performance Comparison**: Directly compares the vehicle throughput of the adaptive system against a traditional fixed-time system, highlighting efficiency gains.
- **Mock Sensor Data**: Simulates a network of IoT sensors, including:
    - **In-Pavement Magnetometers**: To detect vehicle presence and count.
    - **Acoustic Sensors**: To detect emergency vehicle sirens.
    - **AI-Powered Cameras**: To classify vehicle types for weighted priority.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (with App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI**: [React](https://react.dev/), [ShadCN UI](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
- **AI/Generative**: [Google AI & Genkit](https://firebase.google.com/docs/genkit)
- **Icons**: [Lucide React](https://lucide.dev/guide/packages/lucide-react)

## How It Works

The simulation runs in cycles, alternating between the North-South (NS) and East-West (EW) traffic groups.

1.  **Sensor Data Simulation**: In each cycle, the `simulation-runner.ts` script generates new data for both traffic groups, mimicking real-world fluctuations in traffic volume, vehicle types, and potential emergencies.
2.  **Control Systems**:
    *   **Fixed-Time**: The fixed-time controller operates on a constant, pre-defined green light duration for each phase.
    - **Adaptive**: The adaptive controller calculates an optimal green light duration for the upcoming phase. It uses a formula that considers queue length, vehicle weight (e.g., prioritizing buses and trucks), and a significant time bonus for detected emergencies.
3.  **AI Explanation**: For the adaptive system, an AI flow (`explain-decision-reasoning.ts`) is called to generate a concise, human-readable explanation of why a particular green light duration was chosen, making the AI's decision process transparent.
4.  **Real-Time Updates**: The frontend polls the simulation state and updates the dashboard components every 200ms to provide a smooth, real-time visualization of the traffic flow and signal changes.

## Getting Started

To run the project locally, follow these steps:

1.  **Install Dependencies**:
    Open your terminal and run the following command to install the necessary packages.
    ```bash
    npm install
    ```

2.  **Run the Development Server**:
    Once the installation is complete, start the Next.js development server.
    ```bash
    npm run dev
    ```

3.  **View the Application**:
    Open your web browser and navigate to [http://localhost:9002](http://localhost:9002) to see the application in action.

## File Structure

- `src/app/page.tsx`: The main entry point and homepage of the application.
- `src/components/`: Contains all the React components used in the application.
    - `comparison-dashboard.tsx`: The primary component that orchestrates the two simulation instances (adaptive and fixed).
    - `dashboard.tsx`: Manages a single simulation instance and its display.
    - `traffic-card.tsx`: Displays the status and sensor data for a single traffic direction (NS or EW).
- `src/lib/`: Contains core application logic and utilities.
    - `simulation-runner.ts`: The heart of the simulation, containing the logic for advancing the simulation state each cycle.
    - `constants.ts`: Holds all the core simulation parameters and initial state values.
    - `types.ts`: Defines the TypeScript types used throughout the application.
- `src/ai/`: Contains the Genkit AI flows.
    - `flows/calculate-delta.ts`: Originally an AI flow, now a pure TypeScript function for calculating green light adjustments.
    - `flows/explain-decision-reasoning.ts`: The Genkit flow that calls the AI model to generate explanations.
- `public/`: Static assets (if any).
- `tailwind.config.ts`: Configuration for Tailwind CSS.
- `next.config.ts`: Configuration for Next.js.
