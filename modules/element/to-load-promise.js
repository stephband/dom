
/**
toLoadPromise(element)
**/

const onceEvent = { once: true };

export default function toLoadPromise(element) {
    return new Promise((resolve, reject) => {
        element.addEventListener('load', resolve, onceEvent);
        element.addEventListener('error', reject, onceEvent);
    });
}
