export function isPrimaryButton(e) {
	// Ignore mousedowns on any button other than the left (or primary)
	// mouse button, or when a modifier key is pressed.
	return (e.which === 1 && !e.ctrlKey && !e.altKey && !e.shiftKey);
};

export function preventDefault(e) {
	e.preventDefault();
};

export function isTargetEvent(e) {
	return e.target === e.currentTarget;
};
