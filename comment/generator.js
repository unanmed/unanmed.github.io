const fs = require('fs/promises');

const target = process.argv[2];

let res = '';

// 获取所有的音乐文件
fs.readdir(`${target}/bgms`).then(v => {
    const stringified = `[\n\t\'${v.join('\', \n\t\'')}\'\n]`;
    const tower = target.slice(2);
    res = `
const isWifi = navigator.connection.type === 'wifi';
const bgms = ${stringified};
const tower = '${tower}';

if (isWifi) {
    const length = bgms.length;
    const target = bgms[~~(Math.random() * length)];
    const src = \`https://unanmed.github.io/comment/\${tower}/bgms/\${target}\`;

    const music = new Audio(src);
    music.onload = () => {
        music.play();
    }
}`
    fs.writeFile(`${target}/index.js`, res);
});