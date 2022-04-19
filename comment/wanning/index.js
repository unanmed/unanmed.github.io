const isWifi = navigator.connection.type === 'wifi' || navigator.connection.downlink <= 10;
const bgms = [
    'Collapsing World.mp3',
    'Grasswalk.mp3',
    'Horizon.mp3',
    'Illusionary Daytime.mp3',
    'Lumina.mp3',
    'My Sunset.mp3',
    'Rags To Rings.mp3',
    'Starset.mp3',
    'theme of SSS.mp3',
    'Wings of Piano.mp3',
    '夏恋.mp3',
    '苍穹.mp3'
];
const tower = 'wanning';

console.log(isWifi);

if (isWifi) {
    const length = bgms.length;
    const target = bgms[~~(Math.random() * length)];
    const src = `https://unanmed.github.io/comment/${tower}/bgms/${target}`;

    const music = new Audio(src);
    music.onload = () => {
        music.play();
    }
}