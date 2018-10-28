#!/usr/local/bin/node

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

const Q = require('q')
const dns = require('dns')
const Contract = require('@toryt/contracts-iv')

/**
 * Promise for the key / value pairs in DNS TXT records for {@code fqdn}.
 * Gets all TXT records for {@code fqdn} via DNS, and parses them according to
 * <a href="https://tools.ietf.org/html/rfc1464">RFC 1464</a> and
 * <a href="https://tools.ietf.org/html/rfc6763#section-6">RFC 6763 section 6</a>.
 * The resolution is a flat object with all found key /value pairs as properties.
 * DNS errors are propagated.
 *
 * @param {string} fqdn - FQDN to get the TXT information of
 * @return {Promise<object>} Promise for an object containing all key value pairs found in the meta DNS record
 */
const dnsTxt = new Contract({
  pre: [
    (fqdn) => typeof fqdn === 'string',
    (fqdn) => !!fqdn
  ],
  post: [
    (fqdn, result) => Q.isPromiseAlike(result)
  ],
  exception: [
    (fqdn, err) => err instanceof Error
  ]
}).implementation(function (fqdn) {
  return Q.denodeify(dns.resolveTxt)(fqdn)
    .then((allTxtRecords) => allTxtRecords.reduce(
      (acc, oneTxtRecord) => oneTxtRecord.reduce(
        (acc, str) => {
          const keyValue = dnsTxt.keyValuePattern.exec(str)
          acc[keyValue[1]] = keyValue[2]
          return acc
        },
        acc
      ),
      {}
    ))
    .then(
      new Contract({
        pre: [txtMap => txtMap instanceof Object],
        post: [(txtMap, result) => result === txtMap],
        exception: [() => false]
      }).implementation(txtMap => txtMap),
      new Contract({
        pre: [
          () => true
          /* domain does not exist, or there is no TXT record, or there is no internet connection, or
           no DNS server can be contacted, … */
        ],
        post: [() => false],
        exception: [
          (err1, err2) => err1 === err2
        ]
      }).implementation(err => { throw err })
    )
})

/* Note: it is unclear to this author what the difference is between key / value pairs in 1 TXT record, or in different
         TXT records for the same FQDN */

dnsTxt.keyValuePattern = /([^=]+)=(.*)/

module.exports = dnsTxt
