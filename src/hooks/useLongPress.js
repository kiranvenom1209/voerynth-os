import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * --- CUSTOM HOOK: USE LONG PRESS ---
 */
const DEFAULT_MOVE_CANCEL_PX = 10;

const getEventPoint = (event) => {
    const touch = event.touches?.[0] || event.changedTouches?.[0];

    return {
        x: touch?.clientX ?? event.clientX ?? 0,
        y: touch?.clientY ?? event.clientY ?? 0,
    };
};

const useLongPress = (callback = () => { }, ms = 500, options = {}) => {
    const [startLongPress, setStartLongPress] = useState(false);
    const startPointRef = useRef(null);
    const { shouldStart, moveCancelThreshold = DEFAULT_MOVE_CANCEL_PX } = options;

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

    const cancelPress = useCallback(() => {
        startPointRef.current = null;
        setStartLongPress(false);
    }, []);

    const startPress = useCallback((event) => {
        if (shouldStart && !shouldStart(event)) return;
        startPointRef.current = getEventPoint(event);
        setStartLongPress(true);
    }, [shouldStart]);

    const movePress = useCallback((event) => {
        if (!startLongPress || !startPointRef.current) return;

        const point = getEventPoint(event);
        const deltaX = point.x - startPointRef.current.x;
        const deltaY = point.y - startPointRef.current.y;

        if (Math.hypot(deltaX, deltaY) >= moveCancelThreshold) {
            cancelPress();
        }
    }, [cancelPress, moveCancelThreshold, startLongPress]);

    return {
        onMouseDown: startPress,
        onMouseMove: movePress,
        onMouseUp: cancelPress,
        onMouseLeave: cancelPress,
        onTouchStart: startPress,
        onTouchMove: movePress,
        onTouchEnd: cancelPress,
        onTouchCancel: cancelPress,
    };
};

export default useLongPress;
