import {Keyboard} from 'react-native';
import CONST from '@src/CONST';

type InputType = (typeof CONST.INPUT_TYPES_WITH_KEYBOARD)[number];
type TCallbackFn = () => void;

const isInputKeyboardType = (element: Element | null): boolean => {
    if (element && ((element.tagName === 'INPUT' && CONST.INPUT_TYPES_WITH_KEYBOARD.includes((element as HTMLInputElement).type as InputType)) || element.tagName === 'TEXTAREA')) {
        return true;
    }
    return false;
};

const isVisible = (): boolean => {
    const focused = document.activeElement;
    return isInputKeyboardType(focused);
};

const nullFn: () => null = () => null;

let isKeyboardListenerRunning = false;
let currentVisibleElement: Element | null = null;
const showListeners: TCallbackFn[] = [];
const hideListeners: TCallbackFn[] = [];
const visualViewport = window.visualViewport ?? {
    height: window.innerHeight,
    width: window.innerWidth,
    addEventListener: window.addEventListener.bind(window),
    removeEventListener: window.removeEventListener.bind(window),
};
let previousVPHeight = visualViewport.height;

const handleViewportResize = (): void => {
    if (visualViewport.height < previousVPHeight) {
        if (isInputKeyboardType(document.activeElement) && document.activeElement !== currentVisibleElement) {
            showListeners.forEach((fn) => fn());
        }
    }

    if (visualViewport.height > previousVPHeight) {
        if (!isVisible()) {
            hideListeners.forEach((fn) => fn());
        }
    }

    previousVPHeight = visualViewport.height;
    currentVisibleElement = document.activeElement;
};

const startKeboardListeningService = (): void => {
    isKeyboardListenerRunning = true;
    visualViewport.addEventListener('resize', handleViewportResize);
};

const addListener = (eventName: 'keyboardDidShow' | 'keyboardDidHide', callbackFn: TCallbackFn): (() => void) => {
    if ((eventName !== 'keyboardDidShow' && eventName !== 'keyboardDidHide') || !callbackFn) {
        throw new Error('Invalid eventName passed to addListener()');
    }

    if (eventName === 'keyboardDidShow') {
        showListeners.push(callbackFn);
    }

    if (eventName === 'keyboardDidHide') {
        hideListeners.push(callbackFn);
    }

    if (!isKeyboardListenerRunning) {
        startKeboardListeningService();
    }

    return () => {
        if (eventName === 'keyboardDidShow') {
            showListeners.filter((fn) => fn !== callbackFn);
        }

        if (eventName === 'keyboardDidHide') {
            hideListeners.filter((fn) => fn !== callbackFn);
        }

        if (isKeyboardListenerRunning && !showListeners.length && !hideListeners.length) {
            visualViewport.removeEventListener('resize', handleViewportResize);
            isKeyboardListenerRunning = false;
        }
    };
};

export default {
    isVisible,
    dismiss: Keyboard.dismiss,
    addListener,
    scheduleLayoutAnimation: nullFn,
    metrics: nullFn,
};
