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

const Tags = require('./tags');
const mt940MsgType = require('./mt940');
const mt942MsgType = require('./mt942');

const typeMapping = {
  mt940: mt940MsgType,
  mt942: mt942MsgType
};

const validTypes = ['mt940', 'mt942'];

function isValidType(type){
  return validTypes.includes(type);
}
class Parser {
  parse({ data, type, validate = false }) {
    if(!isValidType(type)){
      throw new Error(`"${type}" is not a valid file type`);
    }
    const factory    = new Tags.TagFactory();
    const dataLines  = this._splitAndNormalize(data);
    const tagLines   = [...this._parseLines(dataLines)];
    const tags       = tagLines.map(i => factory.createTag(i.id, i.subId, i.data.join('\n')));
    const tagGroups  = this._groupTags(tags);
    const msgType = typeMapping[type];
    const statements = tagGroups.map((group, idx) => {
      if(validate){
        msgType.validateGroup({ group, groupNumber: idx + 1 });
      }
      return msgType.buildStatement({ group });
    });
    return statements;
  }

  /**
  * Split text into lines, replace clutter, remove empty lines ...
  * @private
  */
  _splitAndNormalize(data) {
    return data
      .split(/\r?\n/)
      .filter(line => !!line && line !== '-');
  }

  /**
  * Convert lines into separate tags
  * @private
  */
  // eslint-disable-next-line complexity
  *_parseLines(lines) {
    const reTag = /^:([0-9]{2}|NS)([A-Z])?:/;
    let tag = null;

    for (let i of lines) {

      // Detect new tag start
      const match = i.match(reTag);
      if (match || i.startsWith('-}') || i.startsWith('{')) {
        if (tag) {yield tag;} // Yield previous
        tag = match // Start new tag
          ? {
            id: match[1],
            subId: match[2] || '',
            data: [i.substr(match[0].length)]
          }
          : {
            id: 'MB',
            subId: '',
            data: [i.trim()],
          };
      } else { // Add a line to previous tag
        tag.data.push(i);
      }
    }

    if (tag) { yield tag; } // Yield last
  }

  /**
  * Group tags into statements
  * @private
  */
  // eslint-disable-next-line complexity
  _groupTags(tags) {
    if (tags.length === 0) {
      return [];
    }
    const hasMessageBlocks = (tags[0] instanceof Tags.TagMessageBlock);
    const groups = [];
    let curGroup;

    for (let i of tags) {
      if (hasMessageBlocks && i instanceof Tags.TagMessageBlock && i.isStarting ||
        !hasMessageBlocks && i instanceof Tags.TagTransactionReferenceNumber) {
        groups.push(curGroup = []); // Statement starting tag -> start new group
      }
      curGroup.push(i);
    }
    return groups;
  }

}

module.exports = Parser;
