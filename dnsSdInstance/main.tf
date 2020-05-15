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

/**
 * Define a service instance in the given hosted zone for the given domain
 * according to DNS-SD RFC 6763 <https://www.ietf.org/rfc/rfc6763.txt>
 *
 * This defines
 * - 1 SRV record that defines at which domain name and port the service instance operates, and
 *   with which priority and weight
 * - 1 TXT record that lists specfics about the service instance
 *
 * A key-value pair "at=NOW" is automatically added to the TXT record
 *
 * The user should add a reference to this instance as a PTR record for the
 * service type or one of its subtypes.
 */

data "null_data_source" "extra_details" {
  inputs = {
    at = timestamp()
  }
}

locals {
  main_type   = "_${trimspace(var.type)}._${trimspace(var.protocol)}.${trimspace(var.domain-name)}"
  instance    = "${trimspace(var.instance)}.${local.main_type}"
  fullDetails = merge(var.details, data.null_data_source.extra_details.inputs)
}

resource "aws_route53_record" "srv" {
  zone_id = var.domain-zone_id
  name    = local.instance
  type    = "SRV"
  ttl     = var.ttl

  records = [
    // "0 +" coerces to number
    format("%d %d %d %s", 0 + var.priority, 0 + var.weight, 0 + var.port, var.host),
  ]
}

/**
 * This follows https://tools.ietf.org/html/rfc1464.
 * See HowtoDefineMultiStringTXTRecords.md
 */
resource "aws_route53_record" "txt" {
  zone_id = var.domain-zone_id
  name    = local.instance
  type    = "TXT"
  ttl     = var.ttl

  records = [join("\"\"", formatlist("%s=%s", keys(local.fullDetails), values(local.fullDetails)))]
}
