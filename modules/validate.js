
export default function validate(node) {
    return node.checkValidity ? node.checkValidity() : true ;
}
