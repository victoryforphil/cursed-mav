import useDroneStore from '#/state/drone';
import { useEffect, useState } from 'react';

export type MapValue = string | number | boolean;

/**
 * This is hook that will subscribe to a specific value in the Drone Station Store.
 * @param key Key to subscribe to, like `status/health/healthy`
 * @returns 
 */
function useArdupilotValue(key: string): any | undefined {
    const [value, setValue] = useState(useDroneStore.getState().getMapValue(key));

    useEffect(() => {
        const unsubscribe = useDroneStore.subscribe(
            (state) => state.data.get(key),
            (newValue) => {
                setValue(newValue); 
            }
        );
        return () => unsubscribe();
    }, [key]);

    return value;
}

export default useArdupilotValue;