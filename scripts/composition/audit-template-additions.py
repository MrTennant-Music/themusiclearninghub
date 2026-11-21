"""Independently compare the five additions with their cached ABC source bars."""
import json,re
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
PC={'C':0,'D':2,'E':4,'F':5,'G':7,'A':9,'B':11}

def read_abc(bar,base,key,transpose,stretch):
    out=[];pending=F(1);at=0
    while at<len(bar):
        if bar[at].isspace() or bar[at] in '[]':at+=1;continue
        if bar[at]=='>':
            out[-1][1]*=F(3,2);pending=F(1,2);at+=1;continue
        match=re.match(r'([_^=]*)([A-Ga-gz])([,\x27]*)(\d*(?:/\d*)?)(-?)',bar[at:])
        assert match,('unsupported ABC token',bar[at:])
        accidental,note,octaves,length,tie=match.groups();at+=len(match[0])
        if '/' in length:
            numerator,denominator=length.split('/');multiplier=F(int(numerator or 1),int(denominator or 2))
        else:multiplier=F(int(length or 1))
        midi=None
        if note!='z':
            alter=accidental.count('^')-accidental.count('_') if accidental else (1 if key=='G' and note.upper()=='F' else 0)
            midi=PC[note.upper()]+(72 if note.islower() else 60)+12*(octaves.count("'")-octaves.count(','))+alter+transpose
        out.append([midi,base*multiplier*pending*stretch,bool(tie)]);pending=F(1)
    return out

for item in json.loads((ROOT/'scripts/composition/template-additions.json').read_text()):
    raw=(ROOT/'data/composition-templates/sources'/f"{item['id']}.abc").read_text()
    key=re.search(r'^K:\s*(\S+)',raw,re.M)[1]
    base=F(re.search(r'^L:\s*(\S+)',raw,re.M)[1])*4
    music=raw.split('\nK:',1)[1].split('\n',1)[1]
    if item['id']=='drunken-sailor':music=music.split('"^Chorus"')[0]
    elif item['id'] in ['jingle-bells','au-clair-de-la-lune']:music=music.split('|:',1)[1].split(':|',1)[0]
    music=' '.join(line for line in music.splitlines() if not re.match(r'^\s*(?:[A-Za-z]:|%)',line))
    music=re.sub(r'"[^\"]*"','',music).replace('\\','')
    bars=[]
    for segment in re.split(r'[:|]+',music):
        segment=re.sub(r'^\s*\[?[12]\s*','',segment).strip().strip('[]').strip()
        if segment:bars.append(segment)
    if item['id']=='au-clair-de-la-lune':bars=bars[:4]*2
    else:bars=bars[:8]
    assert len(bars)==8,item['id']
    transpose={'jingle-bells':-12,'au-clair-de-la-lune':-19}.get(item['id'],0)
    stretch=2 if item['id'] in ['jingle-bells','au-clair-de-la-lune'] else 1
    for index,(source,inventory) in enumerate(zip(bars,item['bars'])):
        actual=read_abc(source,base,key,transpose,stretch);expected=[]
        for token in inventory.split():
            name,duration=token.split(':');midi=None
            if name!='-':
                note,acc,octave=re.fullmatch(r'([A-G])([#b]?)(\d)',name).groups()
                midi=(int(octave)+1)*12+PC[note]+(1 if acc=='#' else -1 if acc=='b' else 0)
            expected.append([midi,F(duration.rstrip('~')),duration.endswith('~')])
        assert actual==expected,(item['id'],index+1,actual,expected)
    print(f"{item['id']}: all eight source pitch/rhythm/rest/tie inventories match")
