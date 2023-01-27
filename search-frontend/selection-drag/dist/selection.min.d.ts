/**
 * Add the ability to select area via mouse elements from within
 * a given container.
 */
export default function Selection({ container, targetSelectors, options }: {
    /** The container you'll allow selecting from. */
    container: HTMLElement | null;
    /** Valid CSS Selector string for children within the selction area. */
    targetSelectors: string;
    /** Further `optional` options. */
    options?: {
        /** The id that will be placed on the selection area div. Defaults to `selectionRectangle` */
        selectionDivId?: string;
        /** Only left clicks will enable the selection area. */
        leftClickOnly?: boolean;
    };
}): {
    /** The selection rectangle that is mounted and unmounted from the DOM. */
    rect: HTMLDivElement;
    /**
     * Reset all elements/state, and unmount the selection div.
     */
    cleanUp: () => void;
    /**
    * Disable the container event listeners.
    */
    disable: () => void;
    /**
     * Re-add the container event listeners. Make sure to remove them first.
     */
    enable: () => void;
};
