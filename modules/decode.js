
const textarea = document.createElement('textarea');

export default function decode(html) {
    // Converts &amp;, &lt; and &gt; to &, < and >
    textarea.innerHTML = html;
    return textarea.value;
}
