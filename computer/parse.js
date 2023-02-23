const fs = require('fs/promises');

(async function () {
    const txt = await fs.readFile('./computer/1.json', 'utf-8');
    const json = JSON.parse(txt);
    const list = json.wordDocument.body.sect['sub-section']['sub-section'].p;
    const res = [];
    const sel = [];
    let now = 0;
    list.forEach((v, i) => {
        if (
            v.pPr &&
            v.pPr.listPr &&
            v.pPr.listPr.t &&
            /^\d+、$/.test(v.pPr.listPr.t['_wx:val'])
        ) {
            now = parseInt(v.pPr.listPr.t['_wx:val']) - 1;
        }
        if (v.r && v.r instanceof Array) {
            v.r.forEach(vv => {
                if (vv.rPr && vv.rPr.highlight) {
                    if (vv.rPr.highlight['_w:val'] === 'yellow') {
                        if (/^[ABCD]、?$/.test(vv.t.__text)) {
                            res[now] = vv.t.__text[0];
                            sel[now] ??= '';
                            sel[now] += vv.t.__text;
                        }
                    }
                }
                if (vv.rPr && vv.t && vv.t.__text) {
                    if (
                        vv.rPr.highlight &&
                        vv.rPr.highlight['_w:val'] === 'yellow' &&
                        /^[ABCD]、?$/.test(vv.t.__text)
                    ) {
                    } else {
                        sel[now] ??= '';
                        sel[now] += vv.t.__text;
                    }
                }
            });
            sel[now] ??= '';
            sel[now] += '<br>';
        }
    });
    const data = {
        question: sel,
        answer: res
    };
    await fs.writeFile('./computer/2.json', JSON.stringify(data), 'utf-8');
})();
