const functions = require('./functions.js')
function __mg_callN(func, N) {
    for (let i = 0; i < N; i++) {
        func();
    }
}
const __mg__callNGlobalCount = 20;
const callN = __mg_callN;
function __mg_randomString(N){
        return  Array.from({ length: N }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('');
}
function __mg__generateRandomArray(length, max) {
    const array = [];
    for (let i = 0; i < length; i++) {
        array.push(Math.floor(Math.random() * (max + 1)));
    }
    return array;
}
function __mg__getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}