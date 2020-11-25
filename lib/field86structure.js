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

class Field86StructureParser {
  static buildTagRe(details) {
    const prefix  = details.charAt();

    // check first symbol is known separator
    let tagRe;
    if (!prefix) {
      return;
    } else if (prefix === '/') {                // assume /XXX/ fields
      tagRe = '\\/[0-9A-Z]{2,4}\\/';
    } else if ('>?'.includes(prefix)) {  // assume >DD fields
      tagRe = `\\${prefix}\\d{2}`;
    } else {
      return; // known separator not found
    }

    return {
      detect: new RegExp(`^${tagRe}`),    // line must begin with a tag
      match: new RegExp(`(${tagRe})(.*?)(?=(${tagRe})|$)`, 'g'), // matcher
      // item:   new RegExp(`^(${tagRe})(.*)`),
      strip: new RegExp(`\\${prefix}`, 'g'),
    };
  }

  /**
   * Detects if field 86 is structured and attempts to parse it
   */
  static parse(details) {
    details = details.replace(/\n/g, '').trim();

    const parsedStruc = {};

    if (details.match(/^\d\d\d[?>]/)) {
      parsedStruc.gvc = details.substr(0,3);
      details = details.substr(3);
    }

    const rule = Field86StructureParser.buildTagRe(details);
    if (!rule) {
      return;
    }
    if (!rule.detect.test(details)) {
      return; // string must start with tag
    }
    let match = rule.match.exec(details);
    while (match) {
      const subTag = match[1].replace(rule.strip, '');
      parsedStruc[subTag] = match[2];
      match = rule.match.exec(details);
    }

    return parsedStruc;
  }
}

module.exports = Field86StructureParser;
