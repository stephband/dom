
const A      = Array.prototype;

/*
update(list, tokens)
The missing update function for TokenLists. Compares existing tokens with
a new list of tokens, removes those that are not in the new list, and adds
those that do not exist.
*/

export default function updateTokenList(list, tokens) {
    const removes = list.tokens.slice();
    const adds    = A.slice.apply(tokens);

    let n = removes.length;
    while (n--) {
        if (adds.includes(removes[n])) {
            removes.splice(n, 1);
        }
    }

    list.remove.apply(list, removes);
    list.add.apply(list, adds);
}
