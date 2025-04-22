document.addEventListener('DOMContentLoaded', () => {
    const graph = document.querySelector('.graph');
    const subContainers = document.querySelectorAll('.sub-satellite-container');
    const hoverState = {}; // Tracks hover over parent/sub-container pairs
    const animationState = {}; // Stores animation frame IDs
    const HIDE_DELAY = 150; // ms delay before hiding on mouseleave
    const SUB_ORBIT_RADIUS = 95; // Increased Pixels for sub-satellite orbit radius
    const SUB_ORBIT_SPEED = 0.005; // Radians per frame - Reduced speed

    subContainers.forEach(container => {
        const parentSelector = container.dataset.parentSelector;
        const parentNode = document.querySelector(parentSelector);
        const subSatellites = container.querySelectorAll('.sub-satellite');

        if (!parentNode) {
            console.warn(`Parent node not found for selector: ${parentSelector}`);
            return;
        }

        const stateKey = parentSelector; // Unique key for this pair
        hoverState[stateKey] = { count: 0, timeoutId: null };
        // Add a flag to track if sub-animation should be paused
        animationState[stateKey] = { angle: 0, frameId: null, subPaused: false }; 

        const show = () => {
            clearTimeout(hoverState[stateKey].timeoutId);
            hoverState[stateKey].count++;
            parentNode.classList.add('paused'); // Pause parent animation
            if (!container.classList.contains('visible')) {
                container.classList.add('visible');
                // Reset angle on show for consistent start position?
                // animationState[stateKey].angle = 0; 
                startAnimation();
            }
        };

        const hide = () => {
            hoverState[stateKey].count--;
            clearTimeout(hoverState[stateKey].timeoutId);
            hoverState[stateKey].timeoutId = setTimeout(() => {
                if (hoverState[stateKey].count <= 0) {
                    container.classList.remove('visible');
                    stopAnimation();
                    parentNode.classList.remove('paused'); // Resume parent animation
                    hoverState[stateKey].count = 0; // Reset count
                }
            }, HIDE_DELAY);
        };
        
        // Functions to pause/resume JUST the sub-animation
        const pauseSubAnimation = () => {
            animationState[stateKey].subPaused = true;
        };
        const resumeSubAnimation = () => {
            animationState[stateKey].subPaused = false;
        };

        const startAnimation = () => {
            if (animationState[stateKey].frameId) return; // Already running
            
            const animate = () => {
                // Only update angle if not paused
                if (!animationState[stateKey].subPaused) {
                    animationState[stateKey].angle += SUB_ORBIT_SPEED;
                }

                const parentRect = parentNode.getBoundingClientRect();
                const graphRect = graph.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect(); 

                const parentCenterXGraph = parentRect.left + parentRect.width / 2 - graphRect.left;
                const parentCenterYGraph = parentRect.top + parentRect.height / 2 - graphRect.top;

                const containerOffsetX = containerRect.left - graphRect.left;
                const containerOffsetY = containerRect.top - graphRect.top;
                
                subSatellites.forEach((sub, index) => {
                    const totalSubs = subSatellites.length;
                    const currentAngle = animationState[stateKey].angle; 
                    const angle = currentAngle + (index * (2 * Math.PI / totalSubs));
                    
                    const targetXGraph = parentCenterXGraph + SUB_ORBIT_RADIUS * Math.cos(angle);
                    const targetYGraph = parentCenterYGraph + SUB_ORBIT_RADIUS * Math.sin(angle);

                    const targetXContainer = targetXGraph - containerOffsetX;
                    const targetYContainer = targetYGraph - containerOffsetY;

                    sub.style.left = `${targetXContainer}px`;
                    sub.style.top = `${targetYContainer}px`;
                });

                animationState[stateKey].frameId = requestAnimationFrame(animate);
            };
            // Add a small delay before starting the animation loop
            // to give CSS animations a chance to apply initial position.
            setTimeout(() => {
                 // Ensure the animation hasn't been cancelled while waiting
                if (container.classList.contains('visible')) { 
                    animate(); // Start the loop after the delay
                }
            }, 50); // 50ms delay
        };

        const stopAnimation = () => {
            if (animationState[stateKey].frameId) {
                cancelAnimationFrame(animationState[stateKey].frameId);
                animationState[stateKey].frameId = null;
            }
        };

        // Attach listeners to parent and container
        parentNode.addEventListener('mouseenter', show);
        parentNode.addEventListener('mouseleave', hide);
        container.addEventListener('mouseenter', show);
        container.addEventListener('mouseleave', hide);

        // Attach listeners to individual sub-satellites for pausing sub-animation
        subSatellites.forEach(sub => {
            sub.addEventListener('mouseenter', () => {
                show(); // Ensure parent/container logic runs (increments count)
                pauseSubAnimation(); // Pause the sub-orbit
            });
            sub.addEventListener('mouseleave', () => {
                hide(); // Ensure parent/container logic runs (decrements count)
                resumeSubAnimation(); // Resume the sub-orbit
            });
        });
    });
}); 