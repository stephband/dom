
/**
isPrimaryButton(e)
Returns `true` if event is from the primary (normally the left or only)
button of an input device. Use this to filter out right-clicks.
*/

export function isPrimaryButton(e) {
    // Ignore mousedowns on any button other than the left (or primary)
    // mouse button, or when a modifier key is pressed.
    return (e.which === 1 && !e.ctrlKey && !e.altKey && !e.shiftKey);
}
