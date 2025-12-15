import React, { useState, useEffect, useRef } from 'react';

const KeepAliveView = ({ active, children }) => {
    const [hasRendered, setHasRendered] = useState(active);
    const containerRef = useRef(null);

    useEffect(() => {
        if (active && !hasRendered) {
            setHasRendered(true);
        }
    }, [active, hasRendered]);

    // If it hasn't been rendered yet and isn't active, render nothing
    if (!hasRendered) return null;

    return (
        <div
            ref={containerRef}
            className={`col-start-1 row-start-1 w-full h-full transition-all duration-500 ease-in-out ${active ? 'opacity-100 z-10 visible' : 'opacity-0 z-0 invisible pointer-events-none'}`}
        // When hidden, we don't want to unmount, just hide.
        // The children will retain their state.
        >
            {children}
        </div>
    );
};

// Custom comparison function for React.memo
// Returns true if the component should NOT re-render
const arePropsEqual = (prevProps, nextProps) => {
    // If both are inactive, we don't need to re-render even if children (props) changed.
    // This prevents background updates for hidden tabs.
    if (!prevProps.active && !nextProps.active) {
        return true;
    }

    // If active state changed, or if it is currently active, we must re-render
    // to reflect changes in children (e.g. updated hassStates)
    return false;
};

export default React.memo(KeepAliveView, arePropsEqual);
