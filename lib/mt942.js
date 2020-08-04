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

const StatementVisitor = require('./statementVisitor');

function buildStatement({ group }) {
  const visitor = new StatementVisitor();
  group.forEach(tag => tag.accept(visitor));
  return visitor.toStatement();
}

function validateGroup(){
  return true;
}

module.exports = {
  buildStatement,
  validateGroup
};
