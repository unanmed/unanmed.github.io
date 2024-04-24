var input = document.getElementById('input');
var output = document.getElementById('output');
var parseBtn = document.getElementById('parse');
var charInput = document.getElementById('encrypt-char');
var parsing = false;
var encryptStr = [];
var num = 0;
// 键 to 值
var nameValueMap = new Map();
// 值 to 键
var valueNameMap = new Map();
// 代码原本的 define
var initDefineMap = new Map();

function listen() {
    input.addEventListener('change', function () {
        parseBtn.innerText = '开始转换';
    });
    parseBtn.addEventListener('click', function () {
        encryptStr = charInput.value.split('').reverse();
        parse(input.value);
    });
}
function parse(str) {
    if (parsing) return;
    num = 0;
    nameValueMap.clear();
    valueNameMap.clear();
    initDefineMap.clear();
    parseBtn.innerText = '正在转换';
    var len = str.length;
    var res = '';
    var pointer = -1;
    var inSharpType = false;
    var inSharpContent = false;
    var sharpType = '';
    var sharpContent = '';
    var inToken = false;
    var token = '';
    var inName = false;
    var inOperator = false;
    var inNum = false;
    while (++pointer < len) {
        var char = str[pointer];
        if (char === ' ' && !inSharpContent) {
            if (inSharpType) {
                inSharpType = false;
                inSharpContent = true;
            }
            if (inToken) {
                inToken = false;
                res += addDefine(token) + ' ';
                token = '';
            }
            if (!inSharpContent) res += ' ';

            continue;
        }
        if (char === '\r') continue;
        if (char === '\n') {
            var crlf = false;
            if (str[pointer - 1] === '\r') crlf = true;
            if (inToken) {
                inToken = false;
                res += addDefine(token);
                token = '';
            }
            if (inSharpContent) {
                parseSharp(sharpType, sharpContent);
                res += '#' + sharpType + ' ' + sharpContent;
                sharpType = '';
                sharpContent = '';
                inSharpContent = false;
                inSharpType = false;
            }
            res += crlf ? '\r\n' : '\n';
            continue;
        }
        if (char === '#') {
            inSharpType = true;
            continue;
        }
        if (inSharpType) {
            sharpType += char;
            continue;
        }
        if (inSharpContent) {
            sharpContent += char;
            continue;
        }
        if (inName && inToken) {
            if (/\w/.test(char)) {
                token += char;
                continue;
            } else {
                inToken = false;
                inName = false;
                res += addDefine(token) + ' ';
                token = '';
            }
        }
        if (inOperator && inToken) {
            if (!/\w/.test(char)) {
                token += char;
                continue;
            } else {
                inToken = false;
                inOperator = false;
                res += addDefine(token) + ' ';
                token = '';
            }
        }
        if (inNum && inToken) {
            if (/[\dxbo]/.test(char)) {
                token += char;
                continue;
            } else {
                inToken = false;
                inNum = false;
                res += addDefine(token) + ' ';
                token = '';
            }
        }
        if (/\w/.test(char)) {
            if (!inToken) {
                if (/\d/.test(char)) {
                    inNum = true;
                    inToken = true;
                    token += char;
                } else {
                    inName = true;
                    inToken = true;
                    token += char;
                }
            }
        } else {
            inOperator = true;
            inToken = true;
            token += char;
        }
    }
    if (inToken) {
        inToken = false;
        res += addDefine(token);
        token = '';
    }
    if (inSharpContent) {
        parseSharp(sharpType, sharpContent);
        res += sharpContent;
        sharpType = '';
        sharpContent = '';
    }
    var defines = '';
    nameValueMap.forEach(function (value, key) {
        defines += '#define '.concat(key, ' ').concat(value, '\n');
    });
    output.value = defines + '\n' + res;
    parsing = false;
    parseBtn.innerText = '转换完成';
}

function parseSharp(type, content) {
    if (type === 'define') {
        var pointer = -1;
        var name_1 = '';
        var replace = '';
        var inReplace = false;
        while (++pointer < content.length) {
            var char = content[pointer];
            if (char === ' ') {
                if (inReplace) {
                    parseBtn.innerText = '转换出错';
                    throw new SyntaxError(
                        "Unexpected space after '".concat(
                            replace,
                            "' in #define"
                        )
                    );
                }
                inReplace = true;
                continue;
            }
            if (inReplace) replace += char;
            else name_1 += char;
        }
        initDefineMap.set(replace, name_1);
    }
}
function downloadFile() {}
function getStrByNum(num) {
    var now = num;
    var str = [];
    var n = encryptStr.length;
    if (n === 0) {
        parseBtn.innerText = '请输入加密字符';
        throw new Error('Please input your encrypt char.');
    } else if (n === 1) {
        return encryptStr[0].repeat(now);
    }
    while (now) {
        var reminder = now % n;
        str.push(encryptStr[reminder]);
        now -= reminder;
        if (now !== 0) {
            now = Math.round(now / n);
        } else {
            break;
        }
    }
    return str.reverse().join('');
}
function addDefine(replace) {
    var str = valueNameMap.get(replace);
    if (!str) {
        while (1) {
            str = getStrByNum(++num);
            if (nameValueMap.has(str)) continue;
            nameValueMap.set(str, replace);
            valueNameMap.set(replace, str);
            break;
        }
    }
    return str;
}
listen();
