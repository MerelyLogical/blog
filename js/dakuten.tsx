'use client'

import { useState } from 'react';
import { Button } from '@/js/ui/Button';

function dakuten(input: string): string {
    // ﾞ \uFF9E  ﾟ \uFF9F
    // split this into different levels of muriyari?
    var lut = { // English (maybe make this follow latin?)
            'g': 'kﾞ',
            'z': 'sﾞ',
            'd': 'tﾞ',
            'b': 'hﾞ',
            'p': 'hﾟ',
            'v': 'fﾞ',
            'j': 'cﾞ',
            'ng': 'kﾟ',
            // Greek (modern greek)
            'μπ': 'πﾞ',
            'ντ': 'τﾞ',
            'γκ': 'κﾞ',
            'β': 'φﾞ',
            'δ': 'θﾞ',
            'ζ': 'σﾞ',
            'γ': 'χﾞ',
            // Cyrillic
            'б': 'пﾞ',
            'в': 'фﾞ',
            'г': 'кﾞ',
            'д': 'тﾞ',
            'ж': 'шﾞ',
            'з': 'сﾞ',
            // Armenian (b(daku)-p(handaku)-ph, h exists but unused)
            'բ': 'փﾞ',
            'պ': 'փﾟ',
            'դ': 'թﾞ',
            'տ': 'թﾟ',
            'գ': 'քﾞ',
            'կ': 'քﾟ',
            'ձ': 'ցﾞ',
            'ծ': 'ցﾟ',
            'ջ': 'չﾞ',
            'ճ': 'չﾟ',
            'վ': 'ֆﾞ',
            'զ': 'սﾞ',
            'ժ': 'շﾞ',
            'ղ': 'խﾞ',
        },
        reg = Object.keys(lut).join('|'),
        matcher = new RegExp(reg, 'gi');

    let output = input.replace(matcher, function (m) {
        let k = m.toLowerCase();
        if (k == m) {
            return lut[k];
        } else {
            return lut[k].toUpperCase();
        };
    });
    return output;
}

const placeholder = "The quick brown fox jumps over the lazy dog.\n\n"
        +"Διαφυλάξτε γενικά τη ζωή σας από βαθειά ψυχικά τραύματα.\n\n"
        +"В чащах юга жил бы цитрус? Да, но фальшивый экземпляр!\n\n"
        +"Բել դղյակի ձախ ժամն օֆ ազգությանը ցպահանջ չճշտած վնաս էր եւ փառք։"

export function DakutenBox() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  function tsukeru() {
    const t = input.trim() === "" ? placeholder : input;
    setOutput(dakuten(t));
  }

  return (
    <div className="app-dakuten">
      <textarea
        className="app-textarea"
        rows={10}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
      />
      <div className="app-form-actions">
        <Button onClick={tsukeru}>つける！</Button>
      </div>
      <textarea
        className="app-textarea"
        rows={10}
        value={output}
        readOnly
      />
    </div>
  );
}
