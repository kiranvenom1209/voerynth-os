import { useState, useEffect } from 'react';

/**
 * --- CUSTOM HOOK: USE LONG PRESS ---
 */
const useLongPress = (callback = () => { }, ms = 500, options = {}) => {
    const [startLongPress, setStartLongPress] = useState(false);
    const { shouldStart } = options;

    useEffect(() => {
        let timerId;
        if (startLongPress) {
            timerId = setTimeout(callback, ms);
        } else {
            clearTimeout(timerId);
        }

        return () => {
            clearTimeout(timerId);
        };
    }, [callback, ms, startLongPress]);

    const startPress = (event) => {
        if (shouldStart && !shouldStart(event)) return;
        setStartLongPress(true);
    };

    return {
        onMouseDown: startPress,
        onMouseUp: () => setStartLongPress(false),
        onMouseLeave: () => setStartLongPress(false),
        onTouchStart: startPress,
        onTouchEnd: () => setStartLongPress(false),
    };
};

export default useLongPress;
