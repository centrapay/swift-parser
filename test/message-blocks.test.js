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

const tags   = require('../lib/tags');
const tf     = new tags.TagFactory();

describe('Message blocks', () => {
  describe('high level parsing', () => {
    it('should detect starting message', () => {
      const text = '{1:F01NDEASESSAXXX0833510237}{2:O9400325050701NDEANOKKBXXX12706189060507010325N}{3:108:34}{4:';
      const tag = tf.createTag('MB', null, text);
      expect(tag.fields).toEqual({
        '1': 'F01NDEASESSAXXX0833510237',
        '2': 'O9400325050701NDEANOKKBXXX12706189060507010325N',
        '3': '108:34',
        '4': '',
      });
    });
    it('should skip empty ending message', () => {
      const text = '-}';
      const tag = tf.createTag('MB', null, text);
      // console.log(tag.fields);
      expect(tag.fields).toEqual({
        'EOB': '',
      });
    });
    it('should detect ending message', () => {
      const text = '-}{5:{MAC:12345678}{CHK:123456789ABC}}';
      const tag = tf.createTag('MB', null, text);
      expect(tag.fields).toEqual({
        'EOB': '',
        '5': '{MAC:12345678}{CHK:123456789ABC}',
      });
    });
  });
});
