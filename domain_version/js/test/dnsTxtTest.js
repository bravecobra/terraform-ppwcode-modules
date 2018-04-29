/**
 *    Copyright 2017 PeopleWare n.v.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* eslint-env mocha */

const dnsTxt = require('../dnsTxt')

const someFqdns = ['google.com', 'does.not.exist', 'www.toryt.org', 'peopleware.be']

describe('dnsTxt', function () {
  describe('dnsTxt', function () {
    someFqdns.forEach(function (fqdn) {
      it('gets a sensible result for fqdn "' + fqdn + '"', function () {
        return dnsTxt(fqdn)
          .then(
            result => {
              console.log('%j', result)
              return result
            },
            err => {
              console.log(err)
              return true
            }
          )
      })
    })
  })
})
