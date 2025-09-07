# **App Name**: AdaptiveFlow

## Core Features:

- Traffic Simulation: Simulate realistic urban traffic flow, vehicle behavior, and IoT-based sensing on a 4-way intersection.
- Adaptive Green Light Control: Dynamically adjust green light times each cycle based on emergency status, queue length, vehicle arrival rate, and vehicle type weights.
- Delta Calculation Tool: AI powered tool that calculates the adjustment (Δ) for green light times each phase using the formula: Δ = Emergency_Bonus + α*(mean - avg_mean) + β*(weight - avg_weight). It clamps the value between -15s and +15s. LLM uses all parameters available from the IoT sensors.
- Live Dashboard UI: Real-time display of intersection state (GREEN/RED), countdown timer, progress bar, queue status, and reasoning for decisions, updated every 200ms by polling a decision.json file.
- Sensor Data Mocking: Simulate data streams for queue length, vehicle count, mean demand, weight index, and emergency vehicle flags from IoT sensors via random generator.
- Phase Cycle Management: Control phase cycles including group (NS/EW) selection and enforces a minimum green time depending on the presence of any ongoing emergencies.

## Style Guidelines:

- Primary color: Deep sky blue (#00BFFF) to represent the technological nature of traffic management and signal trustworthiness.
- Background color: Very light cyan (#E0FFFF) to provide a clean, non-distracting backdrop for data visualization.
- Accent color: Spring green (#00FF7F) to highlight active elements such as countdown timers, progress bars, and emergency states.
- Body and headline font: 'Inter', a sans-serif font, known for its legibility in user interfaces; well suited for presenting real-time sensor and decision data clearly.
- Use icons for representing various parameters, for example, vehicle icon for car count, siren for emergency.
- Layout is clean, dividing NS/EW information into separate, well-defined sections.
- Use subtle transitions when updating UI elements such as the countdown timer or status indicators.