/*
*  Copyright 2016 Alexander Tsybulsky and other contributors
*  Copyright 2020 Centrapay and other contributors
*
*  Licensed under the Apache License, Version 2.0 (the "License");
*  you may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*  http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License.
*/

const Field86Parser = require('../lib/field86structure');

function run(details) {
  return Field86Parser.parse(details);
}

describe('Field86Structure', () => {
  it('Detects no structure', () => {
    expect(run('some arbitrary text')).not.toBeDefined();
    expect(run('>some arbitrary text')).not.toBeDefined();
    expect(run('?some arbitrary text')).not.toBeDefined();
    expect(run('so?20me arbitrary text')).not.toBeDefined();
    expect(run('/some arbitrary text')).not.toBeDefined();
    expect(run('/some/ arbitrary text')).not.toBeDefined(); // lower case
    expect(run('some /ATTR/ arbitrary text')).not.toBeDefined();
    expect(run('')).not.toBeDefined(); // empty string
  });

  it('Detects > structure', () => {
    expect(run('>20Details 123>30123232421>31')).toEqual({
      '20': 'Details 123',
      '30': '123232421',
      '31': ''
    });
    expect(run('>20Details 123\n>30123232421>31')).toEqual({
      '20': 'Details 123',
      '30': '123232421',
      '31': ''
    });
  });

  it('Detects structure, with beginning spaces', () => {
    expect(run(' >20Details 123>30123232421>31')).toEqual({
      '20': 'Details 123',
      '30': '123232421',
      '31': ''
    });
  });

  it('Detects ? structure', () => {
    expect(run('?20Details 123?30123232421?31')).toEqual({
      '20': 'Details 123',
      '30': '123232421',
      '31': ''
    });
    expect(run('?20Details? 123?30123232421?31')).toEqual({
      '20': 'Details? 123',
      '30': '123232421',
      '31': ''
    });
  });

  it('Detects /XXX/ structure', () => {
    expect(run('/ATR/Details 123/ATR2/123232421/ATR3/')).toEqual({
      'ATR': 'Details 123',
      'ATR2': '123232421',
      'ATR3': ''
    });
  });

  it('complex detect', () => {
    const tag = [
      ' /XXXX//100924006010 XXXXXXXXXXXXX XXXXXXXX XXXXXX AB (PUBL)',
      ' /ORDP/XX XXXXXX XXXXX XXXX N.A.25 XXXX XXXXX, CANARY WHARF',
      ' /REMI/UBERWEISUNG OUR REF: 03MT181024144353',
      'YOUR REF: P6363103 240 1   M CA O/XXXXGB2L',
      '/ACC/INST/XXXXGB2L         /6231400604',
      'BIC:XXXXGB2L',
    ].join('');

    const parsed = run(tag);

    expect(parsed).toEqual({
      'XXXX': '/100924006010 XXXXXXXXXXXXX XXXXXXXX XXXXXX AB (PUBL) ',
      'ORDP': 'XX XXXXXX XXXXX XXXX N.A.25 XXXX XXXXX, CANARY WHARF ',
      'REMI': 'UBERWEISUNG OUR REF: 03MT181024144353YOUR REF: P6363103 240 1   M CA O/XXXXGB2L',
      'ACC': 'INST/XXXXGB2L         /6231400604BIC:XXXXGB2L'
    });
  });
});
